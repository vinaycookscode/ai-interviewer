import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AlertTriangle, Lock } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { readiness } from "@/lib/aptitude";
import { PageHeading } from "@/components/jobs/employer-ui";
import { TestEditor } from "@/components/aptitude/test-editor";
import { CopyTestButton } from "@/components/aptitude/test-buttons";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("AptitudeTests");
    return { title: t("title") };
}

/** Edit one of the employer's own tests (AIIN-226). Anyone else's is not found (AC6); a test in use is read-only (AC4). */
export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("AptitudeTests");
    const test = await db.aptitudeTest.findFirst({
        where: { id, ownerId: userId, archivedAt: null },
        select: {
            id: true,
            name: true,
            durationMinutes: true,
            shuffle: true,
            sections: { orderBy: { order: "asc" }, select: { id: true, name: true, askCount: true } },
            questions: {
                where: { retiredAt: null },
                orderBy: { createdAt: "asc" },
                select: { id: true, sectionId: true, text: true, options: true, correctIndex: true, explanation: true, checked: true },
            },
        },
    });
    if (!test) notFound();
    const locked = (await db.drive.count({ where: { aptitudeTestId: test.id, draft: false, closedAt: null, closesAt: { gt: new Date() } } })) > 0;
    const checked = new Map<string, number>();
    for (const q of test.questions) if (q.checked) checked.set(q.sectionId, (checked.get(q.sectionId) ?? 0) + 1);
    const r = readiness(test.sections, checked);
    const sections = test.sections.map((s) => ({ ...s, checked: checked.get(s.id) ?? 0 }));

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading
                back={{ href: "/dashboard/drives/tests", label: t("back") }}
                title={test.name}
                subtitle={r.ready ? t("readyState") : t("draftState")}
                actions={<CopyTestButton id={test.id} />}
            />
            {locked ? (
                <div className="sg-glass flex flex-col items-start gap-2 rounded-[24px] p-6">
                    <Lock className="size-6" aria-hidden="true" />
                    <strong className="text-lg">{t("lockedTitle")}</strong>
                    <p className="text-sg-muted">{t("lockedBody")}</p>
                </div>
            ) : (
                <>
                    {!r.ready && r.missing.length > 0 && (
                        <p className="flex items-start gap-2.5 rounded-2xl bg-sg-lavender-soft px-4 py-3 text-sm text-sg-lavender-ink">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {t("notReady", { details: r.missing.map((m) => t("missingOne", m)).join("; ") })}
                        </p>
                    )}
                    <TestEditor
                        testId={test.id}
                        initial={{ name: test.name, minutes: test.durationMinutes, shuffle: test.shuffle }}
                        sections={sections}
                        questions={test.questions.map((q) => ({ ...q, explanation: q.explanation ?? "" }))}
                    />
                </>
            )}
        </div>
    );
}
