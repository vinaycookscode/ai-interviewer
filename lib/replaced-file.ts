// Removing a document the user has replaced or deleted (AIIN-224). Server only.
import { db } from "@/lib/db";
import { deleteFromR2 } from "@/lib/r2";
import { ownFileKey } from "@/lib/storage-key";

/**
 * Delete the file at `oldUrl` once nothing points to it any more: only the user's own `profiles/<id>/` file, never one
 * still on their profile, an offer or an interview. Never throws: a file left behind is better than a failed save.
 */
export async function deleteReplacedFile(oldUrl: string | null | undefined, newUrl: string | null | undefined, userId: string): Promise<void> {
    if (!oldUrl || oldUrl === newUrl) return;
    const key = ownFileKey(oldUrl, process.env.R2_PUBLIC_URL, userId);
    if (!key) return;
    try {
        const [users, offers, interviews] = await Promise.all([
            db.user.count({ where: { OR: [{ resumeUrl: oldUrl }, { panUrl: oldUrl }, { aadhaarUrl: oldUrl }] } }),
            db.jobOffer.count({ where: { offerLetterUrl: oldUrl } }),
            db.interview.count({ where: { OR: [{ resumeUrl: oldUrl }, { panUrl: oldUrl }, { aadhaarUrl: oldUrl }] } }),
        ]);
        if (users + offers + interviews === 0) await deleteFromR2(key);
    } catch (error) {
        console.error("Couldn't delete a replaced file:", error);
    }
}
