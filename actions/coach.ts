"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** Deletes one of the signed-in candidate's chats with Ask U, and its messages (AIIN-100). */
export async function deleteCoachConversation(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "unauthorized" as const };
    const { count } = await db.coachConversation.deleteMany({ where: { id, userId: session.user.id } });
    if (!count) return { error: "notFound" as const };
    revalidatePath("/candidate/coach");
    return { success: true as const };
}
