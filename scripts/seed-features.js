require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const FEATURES = {
    RESUME_SCREENER: 'resume_screener',
    PRACTICE_INTERVIEWS: 'practice_interviews',
    JOB_MANAGEMENT: 'job_management',
    CANDIDATE_SEARCH: 'candidate_search',
    ANALYTICS: 'analytics',
    MODEL_SELECTION: 'model_selection',
    MULTILINGUAL_SUPPORT: 'multilingual_support',
    MOBILE_ACCESS: 'mobile_access',
};

async function main() {
    console.log('Seeding feature flags...');

    const defaults = [
        { key: FEATURES.RESUME_SCREENER, category: 'CANDIDATE', description: "Upload and analyze resumes" },
        { key: FEATURES.PRACTICE_INTERVIEWS, category: 'CANDIDATE', description: "Mock interview practice area" },
        { key: FEATURES.JOB_MANAGEMENT, category: 'EMPLOYER', description: "Create and manage job postings" },
        { key: FEATURES.CANDIDATE_SEARCH, category: 'EMPLOYER', description: "Search and view candidate profiles" },
        { key: FEATURES.ANALYTICS, category: 'EMPLOYER', description: "View dashboard analytics" },
        { key: FEATURES.MODEL_SELECTION, category: 'SYSTEM', description: "Allow users to switch AI models" },
        { key: FEATURES.MULTILINGUAL_SUPPORT, category: 'SYSTEM', description: "Support multiple languages" },
        { key: FEATURES.MOBILE_ACCESS, category: 'SYSTEM', description: "Enable mobile-optimized views" },
    ];

    for (const feat of defaults) {
        await prisma.featureFlag.upsert({
            where: { key: feat.key },
            update: {
                category: feat.category,
                description: feat.description
            },
            create: {
                key: feat.key,
                enabled: true,
                category: feat.category,
                description: feat.description
            }
        });
        console.log(`- ${feat.key} ensured.`);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
