import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BankPractice } from "@/components/question-bank/bank-practice";

interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("QuestionBank");
    return { title: t("detail.practise") };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const whole = (v: string, fallback: number) => (/^\d{1,3}$/.test(v) ? Number(v) : fallback);

/**
 * Practise from the Question Bank (AIIN-212), from the approved "Practise a question" artboards: one question
 * (`?id=`), or what's due today, oldest first (`?id=&step=&of=`, so "2 of 4" stays steady as answered ones drop off).
 */
export default async function BankPracticePage({ searchParams }: PageProps) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");

    const params = await searchParams;
    const id = one(params.id);
    const due = await db.bankItem.findMany({ where: { userId, nextReview: { lte: new Date() } }, orderBy: { nextReview: "asc" }, select: { id: true } });

    // Starting today's list: pin its first question in the URL, so scoring (which refreshes the page) keeps it here
    if (!id) {
        if (!due.length) redirect("/candidate/question-bank");
        redirect(`/candidate/question-bank/practise?id=${due[0].id}&step=1&of=${due.length}`);
    }

    // Only the candidate's own question (AC3 of AIIN-210 applies here too)
    const item = await db.bankItem.findFirst({
        where: { id, userId },
        select: {
            id: true,
            questionText: true,
            status: true,
            type: true,
            companyName: true,
            aiAnswer: true,
            companyQuestion: { select: { answer: true } },
        },
    });
    if (!item) notFound();

    // Part of today's list when it came with a position; otherwise one question on its own
    const step = whole(one(params.step), 0);
    const total = step ? Math.max(whole(one(params.of), step), step) : 0;
    const nextDue = due.find((d) => d.id !== item.id)?.id ?? null;
    const nextHref = nextDue ? `/candidate/question-bank/practise?id=${nextDue}&step=${step ? step + 1 : 1}&of=${step ? total : due.length}` : null;

    return (
        <BankPractice
            // A fresh start for each question: no score carried over from the last one
            key={item.id}
            item={{ id: item.id, question: item.questionText, status: item.status, type: item.type, company: item.companyName }}
            strongAnswer={item.companyQuestion?.answer ?? item.aiAnswer}
            progress={total ? { step, total } : null}
            nextHref={nextHref}
        />
    );
}
