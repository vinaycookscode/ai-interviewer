import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        DATABASE_URL: z.string().url(),
        GEMINI_API_KEY: z.string().min(1),
        NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
        AUTH_SECRET: z.string().min(1).optional(),
        RESEND_API_KEY: z.string().min(1).optional(),
        // Signs Resend's bounce and complaint webhooks (AIIN-167); without it, the webhook refuses every call
        RESEND_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
        APP_URL: z.string().url().default("http://localhost:3000"),
        // Vercel Cron sends it as a bearer token; the cron routes refuse requests without it (AIIN-103)
        CRON_SECRET: z.string().min(16).optional(),
        // The code runner (AIIN-105): our Piston server and its token. Without it, code runs only in the browser, in JavaScript
        RUNNER_URL: z.string().url().optional(),
        RUNNER_TOKEN: z.string().min(16).optional(),
    },
    client: {
        // NEXT_PUBLIC_CLIENT_VAR: z.string(),
    },
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        NODE_ENV: process.env.NODE_ENV,
        AUTH_SECRET: process.env.AUTH_SECRET,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
        APP_URL: process.env.APP_URL,
        CRON_SECRET: process.env.CRON_SECRET,
        RUNNER_URL: process.env.RUNNER_URL,
        RUNNER_TOKEN: process.env.RUNNER_TOKEN,
    },
});
