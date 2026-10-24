import { NextResponse } from 'next/server';
import { seedFeatureFlags } from '@/actions/feature-flags';
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        await seedFeatureFlags();
        return NextResponse.json({ success: true, message: 'Feature flags seeded successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
