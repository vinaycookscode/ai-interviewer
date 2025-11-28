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
