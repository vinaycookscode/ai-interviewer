"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createCard } from "@/actions/flashcards";
import { Dialog, DialogPanel, DialogTrigger } from "@/components/interviews/sg-dialog";
import { coralButton } from "@/components/soft-glass/classes";
import { field, fieldLabel } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export function AddCardDialog({ deckId, triggerClassName }: { deckId: string; triggerClassName: string }) {
    const t = useTranslations("Flashcards");
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [front, setFront] = useState("");
    const [back, setBack] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!front.trim() || !back.trim()) return;

        setLoading(true);
        try {
            await createCard(deckId, front, back);
            setFront("");
            setBack("");
            setOpen(false);
            router.refresh();
        } catch {
            toast.error(t("add.failed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className={triggerClassName}>
                <Plus className="size-4" aria-hidden="true" />
                {t("add.open")}
            </DialogTrigger>
            <DialogPanel title={t("add.title")} closeLabel={t("create.close")} className="max-w-[520px]">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="card-front" className={fieldLabel}>
                            {t("add.front")} <span className="font-medium text-sg-muted">{t("add.frontHint")}</span>
                        </label>
                        <textarea
                            id="card-front"
                            rows={3}
                            value={front}
                            onChange={(e) => setFront(e.target.value)}
                            placeholder={t("add.frontPlaceholder")}
                            required
                            className={cn(field, "resize-y py-3")}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="card-back" className={fieldLabel}>
                            {t("add.back")} <span className="font-medium text-sg-muted">{t("add.backHint")}</span>
                        </label>
                        <textarea
                            id="card-back"
                            rows={4}
                            value={back}
                            onChange={(e) => setBack(e.target.value)}
                            placeholder={t("add.backPlaceholder")}
                            required
                            className={cn(field, "resize-y py-3")}
                        />
                    </div>
                    <button type="submit" disabled={loading || !front.trim() || !back.trim()} className={cn(coralButton, "h-12 w-full")}>
                        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {loading ? t("add.adding") : t("add.submit")}
                    </button>
                </form>
            </DialogPanel>
        </Dialog>
    );
}
