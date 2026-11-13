// Server-only loaders for the aptitude test pages (AIIN-226).
import { db } from "@/lib/db";
import { readiness } from "@/lib/aptitude";

/** Tests the employer can see: ready-made ones and their own, with readiness, size and whether a live drive uses each. */
export async function listTests(employerId: string) {
    const tests = await db.aptitudeTest.findMany({
        where: { archivedAt: null, OR: [{ ownerId: null }, { ownerId: employerId }] },
        orderBy: [{ updatedAt: "desc" }],
        select: { id: true, name: true, durationMinutes: true, ownerId: true, sections: { orderBy: { order: "asc" }, select: { id: true, name: true, askCount: true } } },
    });
    if (!tests.length) return [];
    const ids = tests.map((t) => t.id);
    const now = new Date();
    const [checked, all, drives] = await Promise.all([
        db.aptitudeQuestion.groupBy({ by: ["sectionId"], where: { testId: { in: ids }, checked: true, retiredAt: null }, _count: { _all: true } }),
        db.aptitudeQuestion.groupBy({ by: ["testId"], where: { testId: { in: ids }, retiredAt: null }, _count: { _all: true } }),
        db.drive.findMany({ where: { aptitudeTestId: { in: ids }, employerId }, select: { aptitudeTestId: true, draft: true, closedAt: true, closesAt: true } }),
    ]);
    const bySection = new Map(checked.map((c) => [c.sectionId, c._count._all]));
    return tests.map((t) => {
        const r = readiness(t.sections, bySection);
        const used = drives.filter((d) => d.aptitudeTestId === t.id);
        return {
            id: t.id,
            name: t.name,
            minutes: t.durationMinutes,
            readyMade: t.ownerId === null,
            sections: t.sections.map((s) => s.name),
            questions: all.find((a) => a.testId === t.id)?._count._all ?? 0,
            asks: r.total,
            ready: r.ready,
            missing: r.missing.reduce((n, m) => n + Math.max(0, m.ask - m.have), 0),
            usedIn: used.length,
            locked: used.some((d) => !d.draft && !d.closedAt && !!d.closesAt && d.closesAt > now),
        };
    });
}
