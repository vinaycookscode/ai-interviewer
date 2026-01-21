import { db } from "@/lib/db";
import { Prisma, InterviewStatus } from "@prisma/client";

/**
 * Repository for Interview data access.
 * Centralizes all interview-related Prisma queries.
 */
export class InterviewRepository {
    /**
     * Create a new interview record
     */
    async create(data: Prisma.InterviewCreateInput) {
        return db.interview.create({
            data,
        });
    }

    /**
   * Find an interview by ID with related job and answers
   */
    async findById(id: string) {
        return db.interview.findUnique({
            where: { id },
            include: {
                job: true,
                answers: true,
            },
        });
    }

    /**
     * Update interview status and metadata
     */
    async update(id: string, data: Prisma.InterviewUpdateInput) {
        return db.interview.update({
            where: { id },
            data,
        });
    }

    /**
     * Get all interviews for a specific candidate
     */
    async findByCandidateId(candidateId: string, status?: InterviewStatus) {
        return db.interview.findMany({
            where: {
                candidateId,
                ...(status ? { status } : {}),
            },
            include: {
                job: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    /**
     * Update overall AI feedback for an interview
     */
    async updateFeedback(interviewId: string, feedback: string, score?: number) {
        return db.interview.update({
            where: { id: interviewId },
            data: {
                feedback,
                score,
            },
        });
    }
}

// Export a singleton instance
export const interviewRepository = new InterviewRepository();
