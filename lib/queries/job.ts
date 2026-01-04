import { cache } from 'react';
import { db } from '@/lib/db';

/**
 * Cached query to get jobs for an employer
 */
export const getJobsByEmployer = cache(async (employerId: string) => {
    return db.job.findMany({
        where: { employerId },
        orderBy: { createdAt: 'desc' },
        include: {
            interviews: {
                include: { answers: true }
            }
        }
    });
});

/**
 * Cached query to get job by ID
 */
export const getJobById = cache(async (jobId: string) => {
    return db.job.findUnique({
        where: { id: jobId },
        include: {
            interviews: {
                include: {
                    candidate: true,
                    answers: true
                }
            }
        }
    });
});

/**
 * Cached query to get jobs with basic info (no interviews)
 */
export const getJobsBasic = cache(async (employerId: string) => {
    return db.job.findMany({
        where: { employerId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            _count: {
                select: { interviews: true }
            }
        }
    });
});
