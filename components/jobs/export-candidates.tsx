"use client";

import { useTranslations } from "next-intl";
import { Download, ShieldAlert } from "lucide-react";
import { CSV_HEADER } from "@/lib/candidate-csv";
import { inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { Dialog, DialogClose, DialogPanel, DialogTrigger } from "@/components/interviews/sg-dialog";
import { cn } from "@/lib/utils";

/** "Export" and its dialog (AIIN-162), from the approved Export artboards. Downloads what the list's filters show, every page. */
export function ExportCandidates({ href, count, filters, order }: { href: string; count: number; filters: string; order: string }) {
    const t = useTranslations("Shortlist.export");
    return (
        <Dialog>
            <DialogTrigger className={cn(outlineButton, "h-10 text-sm")}>
                <Download className="size-4" aria-hidden="true" />
                {t("open")}
            </DialogTrigger>
            <DialogPanel
                title={t("title", { count })}
                closeLabel={t("close")}
                className="max-w-[560px]"
                // Straight to the download
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    document.getElementById("export-download")?.focus();
                }}
            >
                <p className="text-sg-muted">{t.rich("uses", { filters, order, b: (chunks) => <strong className="text-sg-ink">{chunks}</strong> })}</p>
                <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-bold text-sg-muted">{t("columns")}</span>
                    <ul className="flex flex-wrap gap-1.5">
                        {CSV_HEADER.map((c) => (
                            <li key={c} className="rounded-full bg-sg-chip px-3 py-1 text-[13px] font-semibold">
                                {c}
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="flex items-start gap-2.5 rounded-[16px] bg-sg-row px-3.5 py-3 text-sm">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{t("warning")}</span>
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                    <DialogClose className={cn(outlineButton, "h-12 text-base")}>{t("cancel")}</DialogClose>
                    <a id="export-download" href={href} download className={cn(inkButton, "h-12 text-base")}>
                        <Download className="size-[18px]" aria-hidden="true" />
                        {t("download")}
                    </a>
                </div>
            </DialogPanel>
        </Dialog>
    );
}
