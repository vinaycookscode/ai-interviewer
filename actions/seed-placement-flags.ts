"use server";

import { db } from "@/lib/db";
import { FEATURES } from "@/lib/features";

const PLACEMENT_FEATURE_FLAGS = [
    {
        key: FEATURES.PLACEMENT_PROGRAM,
        enabled: true,
        description: "90-Day Placement Program with structured curriculum",
        category: "CANDIDATE",
    },
    {
        key: FEATURES.COMPANY_PREP,
        enabled: true,
        description: "Company-specific preparation kits (TCS, Amazon, etc.)",
        category: "CANDIDATE",
    },
    {
        key: FEATURES.STUDY_SQUAD,
        enabled: true,
        description: "Peer study groups with accountability features",
        category: "CANDIDATE",
    },
    {
        key: FEATURES.MENTOR_MATCHING,
        enabled: true,
        description: "Connect with placed seniors for mentorship",
        category: "CANDIDATE",
    },
    {
        key: FEATURES.APTITUDE_TRAINING,
        enabled: true,
        description: "Aptitude and HR interview preparation",
        category: "CANDIDATE",
    },
    {
        key: FEATURES.OFFER_COMPARATOR,
        enabled: true,
        description: "Compare and evaluate job offers",
        category: "CANDIDATE",
    },
];

export async function seedPlacementFeatureFlags() {
    for (const flag of PLACEMENT_FEATURE_FLAGS) {
        await db.featureFlag.upsert({
            where: { key: flag.key },
            update: {},
            create: flag,
        });
    }

    return { success: true, count: PLACEMENT_FEATURE_FLAGS.length };
}
