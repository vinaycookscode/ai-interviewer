"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { saveBankNotes } from "@/actions/bank";
import { focusRing } from "@/components/soft-glass/classes";
import { panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** The candidate's notes on a bank question, saved when they leave the box (AIIN-210). */
export function BankNotes({ itemId, initial }: { itemId: string; initial: string }) {
    const t = useTranslations("QuestionBank.detail");
    const [notes, setNotes] = useState(initial);
    const [saved, setSaved] = useState(false);
    const last = useRef(initial);

    const save = async () => {
        if (notes === last.current) return;
        const result = await saveBankNotes(itemId, notes).catch(() => ({ ok: false }));
        if (result.ok) {
            last.current = notes;
            setSaved(true);
        } else toast.error(t("notesFailed"));
    };

    return (
        <section aria-labelledby="qb-notes" className={panel}>
            <div className="flex items-baseline justify-between gap-2">
                <h2 id="qb-notes" className={panelTitle}>
                    {t("notes")}
                </h2>
                {saved && (
                    <span role="status" className="inline-flex items-center gap-1 text-[13px] font-bold text-sg-success">
                        <Check className="size-3.5" aria-hidden="true" />
                        {t("notesSaved")}
                    </span>
                )}
            </div>
            <textarea
                aria-labelledby="qb-notes"
                value={notes}
                maxLength={2000}
                rows={4}
                onChange={(e) => {
                    setNotes(e.target.value);
                    setSaved(false);
                }}
                onBlur={save}
                placeholder={t("notesPlaceholder")}
                className={cn("w-full resize-y rounded-[16px] border border-sg-field-border bg-sg-row px-3.5 py-3", focusRing)}
            />
        </section>
    );
}
