import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        DATABASE_URL: z.string().url(),
        GEMINI_API_KEY: z.string().min(1),
        NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
        AUTH_SECRET: z.string().min(1).optional(),
    },
    client: {
        // NEXT_PUBLIC_CLIENT_VAR: z.string(),
    },
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        NODE_ENV: process.env.NODE_ENV,
        AUTH_SECRET: process.env.AUTH_SECRET,
    },
});
