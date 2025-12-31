
export const FEATURES = {
    MULTILINGUAL_SUPPORT: 'multilingual_support',
    MOBILE_ACCESS: 'mobile_access',
    // Global Features
    RESUME_SCREENER: 'resume_screener',
    PRACTICE_INTERVIEWS: 'practice_interviews',
    JOB_MANAGEMENT: 'job_management',
    CANDIDATE_SEARCH: 'candidate_search',
    ANALYTICS: 'analytics',
    MODEL_SELECTION: 'model_selection',
} as const;

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];

export interface FeatureFlags {
    [FEATURES.MULTILINGUAL_SUPPORT]?: boolean;
    [FEATURES.MOBILE_ACCESS]?: boolean;
    [key: string]: boolean | undefined;
}

export function hasFeature(user: { features?: any }, feature: FeatureKey): boolean {
    if (!user || !user.features) return false;

    // Handle both JSON object and potential stringified JSON
    let features = user.features;

    if (typeof features === 'string') {
        try {
            features = JSON.parse(features);
        } catch (e) {
            return false;
        }
    }

    return !!features[feature];
}
