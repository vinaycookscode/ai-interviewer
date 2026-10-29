"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDeck } from "@/actions/flashcards";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogPanel, AlertDialogTrigger } from "@/components/interviews/sg-dialog";
import { focusRing } from "@/components/soft-glass/classes";
import { dangerButton, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export function DeleteDeckButton({ deckId }: { deckId: string }) {
    const t = useTranslations("Flashcards.remove");
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await deleteDeck(deckId);
            router.push("/candidate/flashcards");
            router.refresh();
        } catch {
            toast.error(t("failed"));
            setLoading(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger
                disabled={loading}
                className={cn("inline-flex min-h-10 items-center gap-2 self-start rounded-full px-3 font-semibold text-sg-danger hover:bg-sg-danger/10", focusRing)}
            >
                {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                {t("open")}
            </AlertDialogTrigger>
            <AlertDialogPanel title={t("title")} description={t("body")}>
                <AlertDialogCancel className={cn(outlineButton, "h-12 px-5 text-base")}>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={dangerButton}>
                    {t("confirm")}
                </AlertDialogAction>
            </AlertDialogPanel>
        </AlertDialog>
    );
}
