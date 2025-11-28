import * as z from "zod";

export const LoginSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
    password: z.string().min(1, {
        message: "Password is required",
    }),
});

export const RegisterSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
    password: z.string().min(8, {
        message: "Minimum 8 characters required",
    })
        .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "Must contain at least one number" })
        .regex(/[^a-zA-Z0-9]/, { message: "Must contain at least one special character" }),
    name: z.string().min(1, {
        message: "Name is required",
    }),
    role: z.enum(["CANDIDATE", "EMPLOYER"]),
});
