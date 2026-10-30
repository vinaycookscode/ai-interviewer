"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { unsubscribeQuery, verifyUnsubscribe } from "@/lib/weekly-report/unsubscribe-token";

/** From the unsubscribe page: the signed link stands in for signing in (AIIN-103). */
export async function setWeeklyEmailsFromLink(formData: FormData) {
    const userId = formData.get("u")?.toString();
    const on = formData.get("on") === "1";
    if (!verifyUnsubscribe(userId, formData.get("t")?.toString())) redirect("/unsubscribe");
    await db.user.updateMany({ where: { id: userId }, data: { weeklyReportEmails: on } });
    redirect(`/unsubscribe?${unsubscribeQuery(userId)}${on ? "&state=on" : ""}`);
}

/** From the profile, for the signed-in user. */
export async function setWeeklyEmails(on: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    await db.user.update({ where: { id: session.user.id }, data: { weeklyReportEmails: on } });
    revalidatePath("/candidate/profile");
    return { success: true };
}
