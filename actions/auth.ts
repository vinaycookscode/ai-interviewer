"use server";
// Force rebuild


import * as z from "zod";
import { LoginSchema, RegisterSchema } from "@/schemas";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { getClientIP } from "@/lib/geolocation";

export const login = async (values: z.infer<typeof LoginSchema>) => {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { email, password } = validatedFields.data;

    // Rate Limiting
    const headersList = await headers();
    const ip = getClientIP(headersList);

    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit.success) {
        return { error: "Too many login attempts. Please try again later." };
    }

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: DEFAULT_LOGIN_REDIRECT,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials!" };
                default:
                    return { error: "Something went wrong!" };
            }
        }
        throw error;
    }
};

export const register = async (
    values: z.infer<typeof RegisterSchema>,
    callbackUrl?: string
) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { email, password, name, role } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await db.user.findUnique({
        where: {
            email,
        },
    });

    if (existingUser) {
        // If user was invited (NULL password), allow them to claim the account
        if (existingUser.password === null) {
            await db.user.update({
                where: { email },
                data: {
                    name,
                    password: hashedPassword,
                    role,
                },
            });

            // Auto-login after claiming account
            try {
                await signIn("credentials", {
                    email,
                    password,
                    redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT,
                });
            } catch (error) {
                if (error instanceof AuthError) {
                    switch (error.type) {
                        case "CredentialsSignin":
                            return { error: "Invalid credentials!" };
                        default:
                            return { error: "Something went wrong!" };
                    }
                }
                throw error;
            }
            return { success: "Account claimed successfully!" };
        }

        // User already has a password - cannot register again
        return { error: "Email already in use!" };
    }

    // Capture user location from IP (best effort, don't block on errors)
    let locationData = null;
    try {
        const { headers } = await import("next/headers");
        const { getClientIP, getLocationFromIP } = await import("@/lib/geolocation");
        const headersList = await headers();
        const clientIP = getClientIP(headersList);

        if (clientIP && clientIP !== "0.0.0.0") {
            locationData = await getLocationFromIP(clientIP);
        }
    } catch (error) {
        console.error("Failed to capture location:", error);
        // Continue with registration even if geolocation fails
    }

    await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
            // Add location data if available
            ...(locationData && {
                country: locationData.country,
                countryCode: locationData.countryCode,
                city: locationData.city,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                ipAddress: locationData.ip,
            }),
        },
    });

    // Auto-login after registration
    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials!" };
                default:
                    return { error: "Something went wrong!" };
            }
        }
        throw error;
    }

    return { success: "User created!" };
};

// =============================================================================
// PASSWORD RESET
// =============================================================================

import { v4 as uuidv4 } from "uuid";
import { sendPasswordResetEmail } from "@/lib/email";

const ForgotPasswordSchema = z.object({
    email: z.string().email(),
});

const ResetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPassword = async (values: z.infer<typeof ForgotPasswordSchema>) => {
    const validatedFields = ForgotPasswordSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid email address" };
    }

    const { email } = validatedFields.data;

    // Check if user exists
    const user = await db.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
        return { success: "If this email exists, you will receive a password reset link." };
    }

    // Delete any existing tokens for this email
    await db.passwordResetToken.deleteMany({
        where: { email }
    });

    // Generate new token
    const token = uuidv4();
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

    await db.passwordResetToken.create({
        data: {
            email,
            token,
            expires,
        }
    });

    // Send email
    const emailResult = await sendPasswordResetEmail(email, token);

    if (!emailResult.success) {
        return { error: "Failed to send reset email. Please try again." };
    }

    return { success: "If this email exists, you will receive a password reset link." };
};

export const resetPassword = async (values: z.infer<typeof ResetPasswordSchema>) => {
    const validatedFields = ResetPasswordSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid input" };
    }

    const { token, password } = validatedFields.data;

    // Find the token
    const resetToken = await db.passwordResetToken.findUnique({
        where: { token }
    });

    if (!resetToken) {
        return { error: "Invalid or expired reset link" };
    }

    // Check if token has expired
    if (new Date() > resetToken.expires) {
        // Clean up expired token
        await db.passwordResetToken.delete({
            where: { id: resetToken.id }
        });
        return { error: "Reset link has expired. Please request a new one." };
    }

    // Find the user
    const user = await db.user.findUnique({
        where: { email: resetToken.email }
    });

    if (!user) {
        return { error: "User not found" };
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
    });

    // Delete the used token
    await db.passwordResetToken.delete({
        where: { id: resetToken.id }
    });

    return { success: "Password updated successfully! You can now log in." };
};
