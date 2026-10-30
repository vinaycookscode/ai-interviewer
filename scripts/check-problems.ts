/**
 * Runs every published coding problem's reference solution against its tests, as "Check solution" does in
 * the admin console, and lists the ones that fail (AIIN-107). Read-only.
 *
 * Usage: npx tsx scripts/check-problems.ts
 */

import "dotenv/config";
import { db } from "../lib/db";
import { PROBLEM_SELECT, runTests, toDraft } from "../lib/problems/server";

async function main() {
    const rows = await db.companyQuestion.findMany({
        where: { type: "CODING", status: "PUBLISHED" },
        select: { id: true, kit: { select: { company: true } }, ...PROBLEM_SELECT },
    });
    const failing = new Map<string, { count: number; companies: string[]; failed: string }>();
    let passed = 0;
    for (const row of rows) {
        const draft = toDraft(row);
        const results = draft.solutionCode.trim() && draft.tests.length ? runTests(draft.solutionCode, draft.tests) : [];
        const bad = results.find((r) => !r.passed);
        if (results.length && !bad) {
            passed++;
            continue;
        }
        const entry = failing.get(draft.title) ?? { count: 0, companies: [], failed: bad ? `test ${bad.n}: ${bad.error ?? bad.output}` : "no solution or tests" };
        entry.count++;
        entry.companies.push(row.kit.company);
        failing.set(draft.title, entry);
    }
    console.log(`${rows.length} published coding problems: ${passed} pass, ${rows.length - passed} don't`);
    for (const [title, e] of failing) console.log(`- ${title} (${e.count}): ${e.failed}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
