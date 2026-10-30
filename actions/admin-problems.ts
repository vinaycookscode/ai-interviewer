"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { describeChanges, draftErrors, normalizeDraft, publishBlocks, type ProblemDraft } from "@/lib/problems/rules";
import { PROBLEM_SELECT, checkSolution, contentHash, fromDraft, toDraft } from "@/lib/problems/server";

// Problems in the admin console (AIIN-107). Every action checks for an admin first: Server Actions are public endpoints.

async function admin() {
    const session = await auth();
    if (session?.user?.id && session.user.role === "ADMIN") return { id: session.user.id, name: session.user.name || session.user.email || "Admin" };
    return null;
}

const FORBIDDEN = { error: "forbidden" as const };

async function record(questionId: string, who: { id: string; name: string }, summary: string) {
    await db.problemChange.create({ data: { questionId, authorId: who.id, authorName: who.name, summary } });
}

function refresh(id?: string) {
    revalidatePath("/admin/problems");
    if (id) revalidatePath(`/admin/problems/${id}`);
    revalidatePath("/candidate/company-prep", "layout");
}

async function load(id: string) {
    const row = await db.companyQuestion.findUnique({ where: { id }, select: { ...PROBLEM_SELECT, status: true, checkedHash: true } });
    return row && { draft: toDraft(row), status: row.status, checkedHash: row.checkedHash };
}

/** Starts a new draft in the first company kit, and opens it. A form action: a non-admin is sent away with nothing created. */
export async function createProblem() {
    const who = await admin();
    if (!who) redirect("/dashboard");
    const kit = await db.companyPrepKit.findFirst({ orderBy: { company: "asc" }, select: { id: true } });
    if (!kit) redirect("/admin/problems");
    const created = await db.companyQuestion.create({
        data: { kitId: kit.id, question: "Untitled problem", type: "CODING", difficulty: "EASY", language: "javascript", status: "DRAFT", testCases: [] },
        select: { id: true },
    });
    await record(created.id, who, "created the draft");
    redirect(`/admin/problems/${created.id}`);
}

export type FailedTest = { n: number; hidden: boolean; expected: string; output: string; error?: string };

/**
 * Saves the editor's changes. A draft saves without a check. A published coding problem whose solution or tests
 * changed is checked first and not saved if a test fails, so what candidates see always passes.
 */
export async function saveProblem(id: string, raw: Partial<ProblemDraft>) {
    const who = await admin();
    if (!who) return FORBIDDEN;
    const current = await load(id);
    if (!current) return { error: "notFound" as const };

    const draft = normalizeDraft(raw);
    const errors = draftErrors(draft);
    if (errors.length) return { error: "invalid" as const, errors };
    if (!(await db.companyPrepKit.findUnique({ where: { id: draft.kitId }, select: { id: true } }))) return { error: "invalid" as const, errors: ["kit" as const] };

    const hash = contentHash(draft);
    let checkedHash = current.checkedHash;
    if (current.status === "PUBLISHED" && draft.type === "CODING" && hash !== contentHash(current.draft)) {
        const blocks = publishBlocks(draft, null, hash).filter((b) => b !== "unchecked");
        if (blocks.length) return { error: "unpublishable" as const, blocks };
        const results = await checkSolution(who.id, draft);
        if ("error" in results) return { error: results.error };
        const failed = results.find((r) => !r.passed);
        if (failed) return { error: "failsCheck" as const, failed: failedTest(failed) };
        checkedHash = hash;
    }

    const kits = await db.companyPrepKit.findMany({ where: { id: { in: [current.draft.kitId, draft.kitId] } }, select: { id: true, company: true } });
    const summary = describeChanges(current.draft, draft, { kit: (kitId) => kits.find((k) => k.id === kitId)?.company ?? "another company" });
    await db.companyQuestion.update({ where: { id }, data: { ...fromDraft(draft), checkedHash } });
    if (summary) await record(id, who, summary);
    refresh(id);
    return { success: true as const, checked: checkedHash === hash };
}

const failedTest = (r: FailedTest): FailedTest => ({ n: r.n, hidden: r.hidden, expected: r.expected, output: r.output, error: r.error });

/** Runs the saved reference solution against every saved test. When all pass, the problem can be published. */
export async function checkProblem(id: string) {
    const who = await admin();
    if (!who) return FORBIDDEN;
    const current = await load(id);
    if (!current) return { error: "notFound" as const };
    const { draft } = current;
    if (!draft.solutionCode.trim() || !draft.tests.length) return { error: "unpublishable" as const, blocks: publishBlocks(draft, null, "").filter((b) => b !== "unchecked") };

    const started = performance.now();
    const results = await checkSolution(who.id, draft);
    if ("error" in results) return { error: results.error };
    const ms = Math.round(performance.now() - started);
    const passed = results.every((r) => r.passed);
    await db.companyQuestion.update({ where: { id }, data: { checkedHash: passed ? contentHash(draft) : null } });
    refresh(id);
    return { success: true as const, passed, ms, results: results.map((r) => ({ n: r.n, passed: r.passed })), failed: results.find((r) => !r.passed) ? failedTest(results.find((r) => !r.passed)!) : null };
}

/** Puts a problem in front of candidates: only when it's valid, and for coding, when the current version passed its check. */
export async function publishProblem(id: string) {
    const who = await admin();
    if (!who) return FORBIDDEN;
    const current = await load(id);
    if (!current) return { error: "notFound" as const };
    const errors = draftErrors(current.draft);
    if (errors.length) return { error: "invalid" as const, errors };
    const blocks = publishBlocks(current.draft, current.checkedHash, contentHash(current.draft));
    if (blocks.length) return { error: "unpublishable" as const, blocks };
    await db.companyQuestion.update({ where: { id }, data: { status: "PUBLISHED" } });
    await record(id, who, "published it");
    refresh(id);
    return { success: true as const };
}

/** Takes a problem off the candidate pages. Never deleted: solutions saved for it stay. */
export async function archiveProblem(id: string) {
    const who = await admin();
    if (!who) return FORBIDDEN;
    const { count } = await db.companyQuestion.updateMany({ where: { id, status: { not: "ARCHIVED" } }, data: { status: "ARCHIVED" } });
    if (!count) return { error: "notFound" as const };
    await record(id, who, "archived it");
    refresh(id);
    return { success: true as const };
}

/** Brings an archived problem back as a draft, to check and publish again. */
export async function restoreProblem(id: string) {
    const who = await admin();
    if (!who) return FORBIDDEN;
    const { count } = await db.companyQuestion.updateMany({ where: { id, status: "ARCHIVED" }, data: { status: "DRAFT" } });
    if (!count) return { error: "notFound" as const };
    await record(id, who, "restored it as a draft");
    refresh(id);
    return { success: true as const };
}
