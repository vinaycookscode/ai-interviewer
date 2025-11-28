import { db } from "@/lib/db";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function checkRateLimit(identifier: string): Promise<{ success: boolean; reset?: Date }> {
    const now = new Date();

    const rateLimit = await db.rateLimit.findUnique({
        where: { identifier }
    });

    // If no record exists, create one
    if (!rateLimit) {
        const expiresAt = new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000);
        await db.rateLimit.create({
            data: {
                identifier,
                count: 1,
                expiresAt
            }
        });
        return { success: true };
    }

    // If expired, reset
    if (now > rateLimit.expiresAt) {
        const expiresAt = new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000);
        await db.rateLimit.update({
            where: { identifier },
            data: {
                count: 1,
                expiresAt
            }
        });
        return { success: true };
    }

    // Check limit
    if (rateLimit.count >= MAX_ATTEMPTS) {
        return { success: false, reset: rateLimit.expiresAt };
    }

    // Increment
    await db.rateLimit.update({
        where: { identifier },
        data: {
            count: rateLimit.count + 1
        }
    });

    return { success: true };
}
