export interface ProfileData {
    name?: string | null;
    email?: string | null;
    resumeUrl?: string | null;
    panUrl?: string | null;
    aadhaarUrl?: string | null;
    candidateProfile?: {
        primaryRole?: string | null;
        experienceLevel?: string | null;
        skills?: string[] | null;
        targetCompanies?: string[] | null;
        careerGoals?: string | null;
    } | null;
}

export function calculateProfileCompletion(user: ProfileData): number {
    let completedPoints = 0;

    // Distribution:
    // 1. Identity & Core (40%)
    if (user.name) completedPoints += 10;
    if (user.email) completedPoints += 10;
    if (user.panUrl) completedPoints += 10;
    if (user.aadhaarUrl) completedPoints += 10;

    // 2. Career Essentials (35%)
    if (user.resumeUrl) completedPoints += 20;
    if (user.candidateProfile?.primaryRole) completedPoints += 15;

    // 3. Ambition & Expertise (25%)
    const cp = user.candidateProfile;
    if (cp?.skills && cp.skills.length > 0) completedPoints += 15;
    if (cp?.careerGoals && cp.careerGoals.trim().length > 20) completedPoints += 10;

    return Math.min(completedPoints, 100);
}
