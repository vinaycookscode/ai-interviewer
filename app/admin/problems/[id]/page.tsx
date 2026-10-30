import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PROBLEM_SELECT, contentHash, toDraft } from "@/lib/problems/server";
import { AdminGlass } from "@/components/admin/admin-glass";
import { ProblemEditor } from "@/components/admin/problem-editor";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("AdminProblems");
    return { title: t("metaTitle") };
}

const when = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** One problem in the admin console: statement, tests, hints, the solution check and the history (AIIN-107). */
export default async function AdminProblemPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") redirect("/dashboard");
    const { id } = await params;

    const [problem, kits] = await Promise.all([
        db.companyQuestion.findUnique({
            where: { id },
            select: {
                ...PROBLEM_SELECT,
                status: true,
                checkedHash: true,
                changes: { orderBy: { createdAt: "desc" }, take: 30, select: { id: true, authorName: true, summary: true, createdAt: true } },
            },
        }),
        db.companyPrepKit.findMany({ orderBy: { company: "asc" }, select: { id: true, company: true } }),
    ]);
    if (!problem) notFound();
    const draft = toDraft(problem);

    return (
        <AdminGlass>
            <ProblemEditor
                key={id}
                id={id}
                initial={draft}
                status={problem.status}
                checked={problem.checkedHash === contentHash(draft)}
                kits={kits}
                history={problem.changes.map((c) => ({ id: c.id, who: c.authorName, what: c.summary, when: `${when.format(c.createdAt)} IST` }))}
            />
        </AdminGlass>
    );
}
