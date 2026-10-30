import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Check, Clock } from "lucide-react";
import { overallChange, type TimelineItem } from "@/lib/plan/checkpoints";
import { label, outlineButton, panel, sectionTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** Days 30, 60 and 90: the score of each one done and the change since the one before (AIIN-101). */
export async function CheckpointTimeline({ items, dayHref }: { items: TimelineItem[]; dayHref: (day: number) => string }) {
    const t = await getTranslations("Placement.checkpoints");
    const overall = overallChange(items);
    const done = items.filter((i) => i.state === "done").length;
    const summary = overall
        ? overall.change > 0
            ? t("summaryUp", { change: overall.change.toFixed(1), day: overall.from })
            : overall.change < 0
              ? t("summaryDown", { change: Math.abs(overall.change).toFixed(1), day: overall.from })
              : t("summarySame", { day: overall.from })
        : t("summaryCount", { done, total: items.length });

    return (
        <section aria-labelledby="cp-title" className={panel}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="cp-title" className={sectionTitle}>
                    {t("title")}
                </h2>
                <span className={label}>{summary}</span>
            </div>
            <p className="text-sg-muted">{t("body")}</p>
            <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-2.5">
                {items.map((item) => (
                    <li
                        key={item.day}
                        className={cn(
                            "flex flex-col gap-1.5 rounded-[18px] px-4 py-3.5",
                            item.state === "done" && "bg-sg-row",
                            item.state === "ready" && "sg-glass-strong border-2 border-sg-text",
                            item.state === "later" && "border border-dashed border-sg-field-border"
                        )}
                    >
                        <span className={label}>{t("label", { day: item.day })}</span>
                        {item.state === "done" && (
                            <>
                                <span className="flex items-baseline gap-1.5">
                                    <span className="font-display sg-soft text-[30px] leading-9 font-semibold">{item.score.toFixed(1)}</span>
                                    <span className="font-bold">{t("outOf")}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 text-sm">
                                    <Check className="size-3.5 shrink-0" aria-hidden="true" />
                                    {item.change === null
                                        ? t("done", { date: shortDate.format(item.doneAt) })
                                        : item.change > 0
                                          ? t("up", { change: item.change.toFixed(1), date: shortDate.format(item.doneAt) })
                                          : item.change < 0
                                            ? t("down", { change: Math.abs(item.change).toFixed(1), date: shortDate.format(item.doneAt) })
                                            : t("same", { date: shortDate.format(item.doneAt) })}
                                </span>
                            </>
                        )}
                        {item.state === "ready" && (
                            <>
                                <span className="font-bold">{t("ready")}</span>
                                <Link href={dayHref(item.day)} className={cn(outlineButton, "h-10 self-start text-sm")}>
                                    {t("open", { day: item.day })}
                                </Link>
                            </>
                        )}
                        {item.state === "later" && (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-sg-muted">
                                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                                {t("later", { days: item.inDays })}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </section>
    );
}
