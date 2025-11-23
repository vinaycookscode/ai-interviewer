import type { NextAuthConfig } from "next-auth";

export const runtime = 'nodejs';

export const authConfig = {
    pages: {
        signIn: "/auth/login",
    },
    callbacks: {
        // No authorized callback - using middleware instead
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
