"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { addToBank } from "@/actions/bank";
import { BANK_TYPES, COMPANY_MAX, NOTES_MAX, QUESTION_MAX, type BankType } from "@/lib/bank/items";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { field, inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { Dialog, DialogClose, DialogPanel, DialogTrigger } from "@/components/interviews/sg-dialog";
import { cn } from "@/lib/utils";

type Field = "question" | "company" | "type" | "notes";
const area = cn(field, "resize-y py-3");
const fieldLabel = "text-sm font-semibold";

/** "Add a question" and its dialog (AIIN-211), from the approved Question Bank artboard. The page's one coral action. */
export function AddQuestion() {
    const t = useTranslations("QuestionBank");
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [company, setCompany] = useState("");
    const [type, setType] = useState<BankType>("HR");
    const [notes, setNotes] = useState("");
    const [writeAnswer, setWriteAnswer] = useState(true);
    const [error, setError] = useState<{ field: Field | "form"; message: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    const reset = () => {
        setQuestion("");
        setCompany("");
        setType("HR");
        setNotes("");
        setWriteAnswer(true);
        setError(null);
    };

    const submit = () =>
        startTransition(async () => {
            const result = await addToBank({ question, company, type, notes, writeAnswer }).catch(() => ({ error: "failed" as const }));
            if ("ok" in result) {
                setOpen(false);
                reset();
                toast.success(writeAnswer ? t("add.addedWriting") : t("add.added"));
                router.refresh();
            } else {
                const fieldName = result.error === "unauthorized" || result.error === "failed" ? "form" : result.error;
                setError({ field: fieldName, message: t(`add.errors.${result.error}`) });
            }
        });

    const describedBy = (name: Field) => (error?.field === name ? "qa-error" : undefined);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (isPending) return;
                setOpen(next);
                if (!next) setError(null);
            }}
        >
            {/* The dialog's own trigger, so closing it puts focus back here */}
            <DialogTrigger className={cn(coralButton, "h-12 px-5")}>
                <Plus className="size-[18px]" aria-hidden="true" />
                {t("add.open")}
            </DialogTrigger>
            <DialogPanel
                title={t("add.title")}
                description={t("add.body")}
                closeLabel={t("add.close")}
                className="max-w-[520px]"
                // Straight to the question, not the close button
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    document.getElementById("qa-q")?.focus();
                }}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        submit();
                    }}
                    className="flex flex-col gap-4"
                >
                    <div className="flex flex-col gap-2">
                        <label htmlFor="qa-q" className={fieldLabel}>
                            {t("add.question")}
                        </label>
                        <textarea
                            id="qa-q"
                            rows={3}
                            required
                            maxLength={QUESTION_MAX}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            aria-invalid={error?.field === "question"}
                            aria-describedby={describedBy("question")}
                            className={area}
                        />
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-3">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="qa-co" className={fieldLabel}>
                                {t("add.company")} <span className="font-medium text-sg-muted">{t("add.optional")}</span>
                            </label>
                            <input
                                id="qa-co"
                                type="text"
                                maxLength={COMPANY_MAX}
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                aria-invalid={error?.field === "company"}
                                aria-describedby={describedBy("company")}
                                className={cn(field, "h-12")}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="qa-type" className={fieldLabel}>
                                {t("add.type")}
                            </label>
                            <select id="qa-type" value={type} onChange={(e) => setType(e.target.value as BankType)} className={cn(field, "h-12")}>
                                {BANK_TYPES.map((value) => (
                                    <option key={value} value={value}>
                                        {t(`types.${value}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="qa-notes" className={fieldLabel}>
                            {t("add.notes")} <span className="font-medium text-sg-muted">{t("add.notesHint")}</span>
                        </label>
                        <textarea
                            id="qa-notes"
                            rows={2}
                            maxLength={NOTES_MAX}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            aria-invalid={error?.field === "notes"}
                            aria-describedby={describedBy("notes")}
                            className={area}
                        />
                    </div>
                    <label className="flex items-start gap-2.5 text-[15px]">
                        <input type="checkbox" checked={writeAnswer} onChange={(e) => setWriteAnswer(e.target.checked)} className={cn("mt-0.5 size-5 shrink-0 accent-sg-ink", focusRing)} />
                        <span>
                            {t("add.writeAnswer")} <span className="text-sg-muted">{t("add.aiMarked")}</span>
                        </span>
                    </label>
                    {error && (
                        <p id="qa-error" role="alert" className="text-sm font-bold text-sg-danger">
                            {error.message}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2.5">
                        <button type="submit" disabled={isPending} className={cn(inkButton, "h-12 text-base")}>
                            {isPending && <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />}
                            {isPending ? t("add.adding") : t("add.submit")}
                        </button>
                        <DialogClose disabled={isPending} className={cn(outlineButton, "h-12 px-5 text-base")}>
                            {t("add.cancel")}
                        </DialogClose>
                    </div>
                </form>
            </DialogPanel>
        </Dialog>
    );
}
