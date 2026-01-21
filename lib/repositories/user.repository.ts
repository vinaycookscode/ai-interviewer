import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Repository for User and CandidateProfile data access.
 * Centralizes all user-related Prisma queries.
 */
export class UserRepository {
    /**
     * Find a user by ID with their candidate profile
     */
    async findById(id: string) {
        return db.user.findUnique({
            where: { id },
            include: {
                candidateProfile: true,
            },
        });
    }

    /**
     * Update basic user information
     */
    async update(id: string, data: Prisma.UserUpdateInput) {
        return db.user.update({
            where: { id },
            data,
        });
    }

    /**
     * Update or create a candidate profile for a user
     */
    async upsertCandidateProfile(userId: string, data: Partial<Prisma.CandidateProfileCreateInput>) {
        return db.candidateProfile.upsert({
            where: { userId },
            create: {
                userId,
                primaryRole: data.primaryRole,
                experienceLevel: data.experienceLevel,
                skills: data.skills as string[],
                targetCompanies: data.targetCompanies as string[],
                careerGoals: data.careerGoals,
                onboardingComplete: data.onboardingComplete,
            },
            update: {
                primaryRole: data.primaryRole,
                experienceLevel: data.experienceLevel,
                skills: data.skills as string[],
                targetCompanies: data.targetCompanies as string[],
                careerGoals: data.careerGoals,
                onboardingComplete: data.onboardingComplete,
            } as Prisma.CandidateProfileUpdateInput,
        });
    }

    /**
     * Get user with specific profile fields for dashboard
     */
    async getProfileForDashboard(userId: string) {
        return db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                resumeUrl: true,
                resumeName: true,
                candidateProfile: true,
            },
        });
    }
}

// Export a singleton instance
export const userRepository = new UserRepository();
