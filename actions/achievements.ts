"use server";

import { auth } from "@/auth";
import { takeUnseenBadges } from "@/lib/achievements/server";

/** Badges the signed-in candidate earned since the last page, for the "New badge" toast (AIIN-102). Shown once. */
export async function takeNewBadges() {
    const session = await auth();
    if (!session?.user?.id) return [];
    return takeUnseenBadges(session.user.id);
}
