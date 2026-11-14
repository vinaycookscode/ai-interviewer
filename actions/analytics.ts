"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateGrowthInsights } from "@/lib/ai/analytics";
import { cookies, headers } from "next/headers";
import { istDate, istDayStart } from "@/lib/visit-day";

/**
 * One page view, from AnalyticsTracker on every route change (AIIN-82). A browser counts as a visitor once a day in
 * India: a first-party cookie remembers the day it was last counted. No personal data is stored.
 */
export async function trackVisit() {
    try {
        const now = new Date();
        const today = istDayStart(now);
        const jar = await cookies();
        const day = istDate(now);
        const newVisitor = jar.get("gbtu_seen")?.value !== day;
        if (newVisitor) jar.set("gbtu_seen", day, { maxAge: 2 * 24 * 3600, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" });

        await db.dailyStat.upsert({
            where: { date: today },
            update: {
                views: { increment: 1 },
                ...(newVisitor ? { visitors: { increment: 1 } } : {}),
            },
            create: {
                date: today,
                views: 1,
                visitors: 1,
            },
        });

        // Track Location (if available via headers - Vercel)
        const headersList = await headers();
        const country = headersList.get("x-vercel-ip-country");
        const city = headersList.get("x-vercel-ip-city");
        const countryCode = headersList.get("x-vercel-ip-country-region");
        const lat = headersList.get("x-vercel-ip-latitude");
        const long = headersList.get("x-vercel-ip-longitude");

        if (country && countryCode) {
            await db.visitorLocation.upsert({
                where: { countryCode: countryCode }, // This might be wrong if countryCode is not unique per country, schema says unique([countryCode])? No, schema says @@unique([countryCode]) which means one entry per country code?
                // Schema: @@unique([countryCode]) -> So one record per country code.
                update: {
                    visits: { increment: 1 },
                    lastVisit: new Date()
                },
                create: {
                    country: country,
                    countryCode: countryCode,
                    city: city || undefined,
                    latitude: lat ? parseFloat(lat) : undefined,
                    longitude: long ? parseFloat(long) : undefined,
                    visits: 1
                }
            });
        }

    } catch (error) {
        console.error("Error tracking visit:", error);
    }
}

export async function getGrowthInsights() {
    const result = await getCandidateGrowthData();
    if (!result.success || !result.data) {
        return { success: false, error: "Failed to fetch data for insights" };
    }

    try {
        const insights = await generateGrowthInsights(result.data);
        return { success: true, insights };
    } catch (error) {
        console.error("Error in getGrowthInsights:", error);
        return { success: false, error: "Failed to generate insights" };
    }
}

export type GrowthDataPoint = {
    date: string; // ISO date string
    score: number;
    type: "Real" | "Mock";
    title: string; // Job title or Mock role
    id: string;
};

export async function getCandidateGrowthData() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    try {
        // Fetch Real Interviews
        const interviews = await db.interview.findMany({
            where: {
                candidateId: userId,
                status: "COMPLETED",
                score: { not: null }
            },
            include: {
                job: true
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        // Fetch Mock Interviews
        const mockInterviews = await db.mockInterview.findMany({
            where: {
                userId: userId,
                score: { not: null }
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        // Combine and normalize data
        const data: GrowthDataPoint[] = [];

        interviews.forEach(i => {
            if (i.score !== null) {
                data.push({
                    date: i.createdAt.toISOString(),
                    score: i.score, // Assuming 0-10 scale
                    type: "Real",
                    title: i.job.title,
                    id: i.id
                });
            }
        });

        mockInterviews.forEach(m => {
            if (m.score !== null) {
                data.push({
                    date: m.createdAt.toISOString(),
                    score: m.score, // Assuming 0-10 scale
                    type: "Mock",
                    title: `${m.role} (${m.difficulty})`,
                    id: m.id
                });
            }
        });

        // Sort combined data by date
        data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { success: true, data };

    } catch (error) {
        console.error("Error fetching growth data:", error);
        return { success: false, error: "Failed to fetch growth data" };
    }
}
