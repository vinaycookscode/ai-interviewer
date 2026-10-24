import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Guard for admin-only API routes. Returns an error response to send back,
 * or null when the caller is a signed-in admin.
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return null;
}
