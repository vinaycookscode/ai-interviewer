"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getVisitorLocationStats() {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    // Get visitor location data aggregated by country
    const locationStats = await db.visitorLocation.findMany({
        orderBy: {
            visits: "desc",
        },
    });

    return locationStats.map((stat) => ({
        countryCode: stat.countryCode,
        country: stat.country,
        count: stat.visits,
    }));
}

export async function getTotalVisitors() {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const totalVisits = await db.visitorLocation.aggregate({
        _sum: {
            visits: true,
        },
    });

    const uniqueCountries = await db.visitorLocation.count();

    return {
        totalVisits: totalVisits._sum.visits || 0,
        uniqueCountries,
    };
}
