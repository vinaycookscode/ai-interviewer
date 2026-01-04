import { cache } from 'react';
import { db } from '@/lib/db';

/**
 * Cached query to get interviews for a candidate
 */
export const getInterviewsByCandidate = cache(async (candidateId: string) => {
    return db.interview.findMany({
        where: { candidateId },
        include: { job: true },
        orderBy: { createdAt: 'desc' }
    });
});

/**
 * Cached query to get interview by ID with full details
 */
export const getInterviewById = cache(async (interviewId: string) => {
    return db.interview.findUnique({
        where: { id: interviewId },
        include: {
            job: true,
            candidate: true,
            answers: true,
        }
    });
});

/**
 * Cached query to get interviews for an employer across all jobs
 */
export const getInterviewsByEmployer = cache(async (employerId: string) => {
    const jobs = await db.job.findMany({
        where: { employerId },
        select: { id: true }
    });

    const jobIds = jobs.map(j => j.id);

    return db.interview.findMany({
        where: { jobId: { in: jobIds } },
        include: {
            candidate: true,
            job: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
});
