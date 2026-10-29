"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createDeck } from "@/actions/flashcards";
import { Dialog, DialogPanel, DialogTrigger } from "@/components/interviews/sg-dialog";
import { coralButton } from "@/components/soft-glass/classes";
import { field, fieldLabel, inkButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export function CreateDeckDialog() {
    const t = useTranslations("Flashcards.create");
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const deck = await createDeck(name.trim(), description.trim() || undefined);
            setOpen(false);
            setName("");
            setDescription("");
            router.push(`/candidate/flashcards/${deck.id}`);
        } catch {
            toast.error(t("failed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className={cn(inkButton, "h-11 text-[15px]")}>
                <Plus className="size-4" aria-hidden="true" />
                {t("open")}
            </DialogTrigger>
            <DialogPanel title={t("title")} closeLabel={t("close")}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="nd-name" className={fieldLabel}>
                            {t("name")}
                        </label>
                        <input
                            id="nd-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("namePlaceholder")}
                            maxLength={80}
                            required
                            className={cn(field, "h-12")}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="nd-desc" className={fieldLabel}>
                            {t("desc")} <span className="font-medium text-sg-muted">{t("descHint")}</span>
                        </label>
                        <input
                            id="nd-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t("descPlaceholder")}
                            maxLength={200}
                            className={cn(field, "h-12")}
                        />
                    </div>
                    <button type="submit" disabled={loading || !name.trim()} className={cn(coralButton, "h-12 w-full")}>
                        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {loading ? t("creating") : t("submit")}
                    </button>
                </form>
            </DialogPanel>
        </Dialog>
    );
}
