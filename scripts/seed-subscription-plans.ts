/**
 * Seed Subscription Plans
 * Run with: npx tsx scripts/seed-subscription-plans.ts
 */

import { PlanTier } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function toPaise(amount: number): number {
    return Math.round(amount * 100);
}

async function seedSubscriptionPlans() {
    console.log("🌱 Seeding subscription plans...\n");

    const plans = [
        {
            name: "Free",
            tier: PlanTier.FREE,
            monthlyPrice: 0,
            yearlyPrice: 0,
            mockInterviewLimit: 2,
            resumeAnalysisLimit: 1,
            questionGenerationLimit: 5,
            coverLetterLimit: 0,
            resumeRewriteLimit: 0,
            aiEvaluationEnabled: false,
            coachMessagesPerDay: 10,
            prioritySupport: false,
        },
        {
            name: "Pro",
            tier: PlanTier.PRO,
            monthlyPrice: toPaise(249), // ₹249
            yearlyPrice: toPaise(2490), // ₹2490
            mockInterviewLimit: 15,
            resumeAnalysisLimit: 10,
            questionGenerationLimit: 50,
            coverLetterLimit: 5,
            resumeRewriteLimit: 3,
            aiEvaluationEnabled: true,
            coachMessagesPerDay: 100,
            prioritySupport: false,
        },
        {
            name: "Premium",
            tier: PlanTier.PREMIUM,
            monthlyPrice: toPaise(499), // ₹499
            yearlyPrice: toPaise(4990), // ₹4990
            mockInterviewLimit: -1, // Unlimited
            resumeAnalysisLimit: -1,
            questionGenerationLimit: -1,
            coverLetterLimit: -1,
            resumeRewriteLimit: -1,
            aiEvaluationEnabled: true,
            coachMessagesPerDay: 100,
            prioritySupport: true,
        },
    ];

    for (const plan of plans) {
        const result = await prisma.subscriptionPlan.upsert({
            where: { tier: plan.tier },
            update: plan,
            create: plan,
        });
        console.log(`✅ ${result.name} plan created/updated`);
    }

    console.log("\n✨ Subscription plans seeded successfully!");
}

seedSubscriptionPlans()
    .catch((error) => {
        console.error("❌ Error seeding subscription plans:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
