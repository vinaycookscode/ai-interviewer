import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/jobs/employer-ui";
import { DraftFlow } from "@/components/aptitude/draft-flow";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("AptitudeTests");
    return { title: t("draftTitle") };
}

/** Draft questions with AI for one of the employer's own tests (AIIN-226). */
export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("AptitudeTests");
    const test = await db.aptitudeTest.findFirst({
        where: { id, ownerId: userId, archivedAt: null },
        select: { id: true, name: true, sections: { orderBy: { order: "asc" }, select: { id: true, name: true } } },
    });
    if (!test) notFound();
    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading back={{ href: `/dashboard/drives/tests/${test.id}`, label: test.name }} title={t("draftTitle")} subtitle={t("draftSubtitle")} />
            <DraftFlow testId={test.id} sections={test.sections} />
        </div>
    );
}
