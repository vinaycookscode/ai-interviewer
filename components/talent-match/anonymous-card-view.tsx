import { EyeOff } from "lucide-react";
import type { AnonymousCard } from "@/lib/anonymous-card";

export interface CardLabels {
    anonymous: string;
    years: (n: number) => string;
    practice: string;
    location: string;
    notice: string;
    noticeDays: (n: number) => string;
    education: string;
    none: string;
}

/** The anonymous card as employers see it (AIIN-198), shared with the match list (AIIN-200). Server-safe. */
export function AnonymousCardView({ card, labels }: { card: AnonymousCard; labels: CardLabels }) {
    const tile = (k: string, v: string | null) => (
        <div className="min-w-0 rounded-[14px] bg-sg-row px-3 py-2.5">
            <span className="text-xs font-bold text-sg-muted">{k}</span>
            <div className="font-bold break-words">{v ?? labels.none}</div>
        </div>
    );
    return (
        <div className="sg-glass-strong flex flex-col gap-3 rounded-[22px] border border-sg-glass-border p-[18px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex min-w-0 flex-col">
                    <strong className="text-lg break-words">
                        {card.role ?? card.code}
                        {card.years !== null ? ` · ${labels.years(card.years)}` : ""}
                    </strong>
                    <span className="text-[13px] text-sg-muted">{card.code}</span>
                </span>
                <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-sg-lavender-soft px-3 text-[13px] font-bold text-sg-lavender-ink">
                    <EyeOff className="size-3.5" aria-hidden="true" />
                    {labels.anonymous}
                </span>
            </div>
            {card.skills.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                    {card.skills.map((s) => (
                        <li key={s} className="inline-flex h-[30px] items-center rounded-full bg-sg-chip px-3 text-[13px] font-bold">
                            {s}
                        </li>
                    ))}
                </ul>
            )}
            <div className="grid grid-cols-2 gap-2">
                {tile(labels.practice, card.practiceScore !== null ? `${card.practiceScore} / 10` : null)}
                {tile(labels.location, card.city)}
                {tile(labels.notice, card.noticeDays !== null ? labels.noticeDays(card.noticeDays) : null)}
                {tile(labels.education, card.degree)}
            </div>
        </div>
    );
}
