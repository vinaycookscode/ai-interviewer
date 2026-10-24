import { NextResponse } from "next/server";
import { seedPlacementProgram } from "@/actions/seed-program";
import { seedCompanyPrepKits } from "@/actions/seed-companies";
import { seedPlacementFeatureFlags } from "@/actions/seed-placement-flags";
import { requireAdmin } from "@/lib/api-auth";

async function runSeed() {
    // Seed feature flags
    const flagsResult = await seedPlacementFeatureFlags();

    // Seed placement program
    const programResult = await seedPlacementProgram();

    // Seed company prep kits
    const companiesResult = await seedCompanyPrepKits();

    return {
        flags: flagsResult,
        program: programResult,
        companies: companiesResult
    };
}

// GET - Dev mode only, for easy testing
export async function GET() {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

    try {
        const results = await runSeed();
        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: error.message || "Seeding failed" }, { status: 500 });
    }
}

// POST - Requires admin auth
export async function POST() {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        const results = await runSeed();
        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: error.message || "Seeding failed" }, { status: 500 });
    }
}
