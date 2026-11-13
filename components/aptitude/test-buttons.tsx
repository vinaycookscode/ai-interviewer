"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Loader2, Plus } from "lucide-react";
import { copyTest, createTest } from "@/actions/aptitude-tests";
import { coralButton } from "@/components/soft-glass/classes";
import { outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** New test: creates one to fill in and opens it. */
export function NewTestButton() {
    const t = useTranslations("AptitudeTests");
    const router = useRouter();
    const [isPending, start] = useTransition();
    return (
        <button
            type="button"
            disabled={isPending}
            onClick={() =>
                start(async () => {
                    const r = await createTest().catch(() => ({ error: "failed" as const }));
                    if ("ok" in r) router.push(`/dashboard/drives/tests/${r.id}`);
                    else toast.error(t("failed"));
                })
            }
            className={cn(coralButton, "h-12 px-6 text-base")}
        >
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            {t("new")}
        </button>
    );
}

/** Make a copy of a ready-made test or one of yours, and open it. */
export function CopyTestButton({ id }: { id: string }) {
    const t = useTranslations("AptitudeTests");
    const router = useRouter();
    const [isPending, start] = useTransition();
    return (
        <button
            type="button"
            disabled={isPending}
            onClick={() =>
                start(async () => {
                    const r = await copyTest(id).catch(() => ({ error: "failed" as const }));
                    if ("ok" in r) router.push(`/dashboard/drives/tests/${r.id}`);
                    else toast.error(t("failed"));
                })
            }
            className={cn(outlineButton, "h-10 text-sm")}
        >
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {t("copy")}
        </button>
    );
}
