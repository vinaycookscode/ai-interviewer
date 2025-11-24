"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function trackVisit() {
    const cookieStore = await cookies();
    const visitorId = cookieStore.get("visitor_id");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        // Capture visitor location (best effort)
        let locationData = null;
        try {
            const { headers } = await import("next/headers");
            const { getClientIP, getLocationFromIP } = await import("@/lib/geolocation");
            const headersList = await headers();
            const clientIP = getClientIP(headersList);

            if (clientIP && clientIP !== "0.0.0.0") {
                locationData = await getLocationFromIP(clientIP);
            }
        } catch (error) {
            console.error("Failed to capture visitor location:", error);
        }

        // Store visitor location data (aggregated by country)
        if (locationData) {
            await db.visitorLocation.upsert({
                where: { countryCode: locationData.countryCode },
                update: {
                    visits: { increment: 1 },
                    lastVisit: new Date(),
                },
                create: {
                    country: locationData.country,
                    countryCode: locationData.countryCode,
                    city: locationData.city,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    visits: 1,
                },
            });
        }

        if (!visitorId) {
            // New visitor
            await db.dailyStat.upsert({
                where: { date: today },
                update: {
                    visitors: { increment: 1 },
                    views: { increment: 1 },
                },
                create: {
                    date: today,
                    visitors: 1,
                    views: 1,
                },
            });

            // Set cookie for 24 hours
            cookieStore.set("visitor_id", "true", {
                maxAge: 60 * 60 * 24,
                httpOnly: true,
            });
        } else {
            // Returning visitor (just a page view)
            await db.dailyStat.upsert({
                where: { date: today },
                update: {
                    views: { increment: 1 },
                },
                create: {
                    date: today,
                    visitors: 0, // Already counted or will be counted if cookie expired
                    views: 1,
                },
            });
        }
    } catch (error) {
        console.error("Failed to track visit:", error);
    }
}
