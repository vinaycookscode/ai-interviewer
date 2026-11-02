"use server";

import { auth, signOut } from "@/auth";
import { deleteAccount } from "@/lib/account-deletion";

/**
 * A candidate deletes their own account (AIIN-58). They type their email to confirm; it must match the signed-in
 * account. Only candidates: an employer's jobs and interviews belong to their company, so employers write to us.
 */
export async function deleteMyAccount(typedEmail: string): Promise<{ error: "mismatch" | "notAllowed" | "failed" } | void> {
    const session = await auth();
    const user = session?.user;
    if (!user?.id || !user.email || user.role !== "CANDIDATE") return { error: "notAllowed" };
    if (typeof typedEmail !== "string" || typedEmail.trim().toLowerCase() !== user.email.toLowerCase()) return { error: "mismatch" };

    try {
        await deleteAccount(user.id);
    } catch (error) {
        console.error("Account deletion failed:", error);
        return { error: "failed" };
    }
    // Ends the session cookie and lands on the confirmation page
    await signOut({ redirectTo: "/account-deleted" });
}
