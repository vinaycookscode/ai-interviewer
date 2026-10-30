/**
 * Computes the integrity verdict for finished interviews that don't have one from the current rules (AIIN-177).
 * Safe to run more than once: it only writes the integrity columns.
 *
 * Usage: npx tsx scripts/compute-integrity.ts
 */

import "dotenv/config";
import { db } from "../lib/db";
import { storeIntegrity } from "../lib/integrity/compute";
import { RULES_VERSION } from "../lib/integrity/verdict";

async function main() {
    const stale = await db.interview.findMany({
        where: { status: "COMPLETED", OR: [{ integrityRulesVersion: null }, { integrityRulesVersion: { lt: RULES_VERSION } }] },
        select: { id: true },
    });
    console.log(`${stale.length} finished interviews to compute (rules v${RULES_VERSION})`);

    const counts: Record<string, number> = {};
    for (const { id } of stale) {
        const report = await storeIntegrity(id);
        if (report) counts[report.verdict] = (counts[report.verdict] ?? 0) + 1;
    }
    console.log(counts);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
