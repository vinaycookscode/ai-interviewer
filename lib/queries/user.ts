import { cache } from 'react';
import { db } from '@/lib/db';

/**
 * Cached query to get user by ID with selective fields
 * Automatically deduplicates requests within the same render
 */
export const getUserById = cache(async (userId: string) => {
    return db.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
        }
    });
});

/**
 * Cached query to get user with interviews
 */
export const getUserWithInterviews = cache(async (userId: string) => {
    return db.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
        }
    });
});
