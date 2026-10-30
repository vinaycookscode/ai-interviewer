/**
 * Gives existing candidates the badges they've already earned, and the certificate for a 90-day plan they've
 * already finished (AIIN-102). Stored as already seen, so nobody gets a pile of "New badge" toasts.
 * Safe to run more than once: a badge or certificate is only ever stored once.
 *
 * Usage: npx tsx scripts/award-achievements.ts
 */

import "dotenv/config";
import { db } from "../lib/db";
import { awardAchievements, issueCertificate } from "../lib/achievements/server";

async function main() {
    const candidates = await db.user.findMany({ where: { role: "CANDIDATE" }, select: { id: true } });
    console.log(`${candidates.length} candidates to check`);
    for (const { id } of candidates) await awardAchievements(id, undefined, { seen: true });

    const finished = await db.programEnrollment.findMany({ where: { status: "COMPLETED", certificate: null }, select: { id: true } });
    let issued = 0;
    for (const { id } of finished) if (await issueCertificate(id)) issued++;

    const badges = await db.userAchievement.groupBy({ by: ["key"], _count: { _all: true } });
    console.log(Object.fromEntries(badges.map((b) => [b.key, b._count._all])), `${issued} certificates issued`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
