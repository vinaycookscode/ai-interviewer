import { NextResponse } from 'next/server';
import { seedFeatureFlags } from '@/actions/feature-flags';

export async function GET() {
    try {
        await seedFeatureFlags();
        return NextResponse.json({ success: true, message: 'Feature flags seeded successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
