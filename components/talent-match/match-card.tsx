import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnonymousCard } from "@/lib/anonymous-card";
import type { MatchParts } from "@/lib/match-score";

export interface MatchCardLabels {
    anonymous: string;
    match: string;
    years: (n: number) => string;
    parts: Record<keyof MatchParts, string>;
    city: string;
    notice: string;
    noticeDays: (n: number) => string;
    practice: string;
    none: string;
}

const PART_ORDER: (keyof MatchParts)[] = ["mustHave", "relevance", "experience", "niceToHave"];

/** One anonymous match (AIIN-200), from the approved "Matched candidates" artboards. Server-safe. Never a name or contact. */
export function MatchCard({ card, score, parts, reasons, labels, action }: { card: AnonymousCard; score: number; parts: MatchParts; reasons: string[]; labels: MatchCardLabels; action?: React.ReactNode }) {
    const pct = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 100);
    return (
        <article aria-label={`${card.code}, ${score}% ${labels.match}`} className="sg-glass flex min-w-0 flex-col gap-3.5 rounded-[24px] p-5 sm:rounded-[28px] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="flex min-w-0 flex-[1_1_180px] flex-col">
                    <strong className="text-lg break-words">
                        {card.role ?? card.code}
                        {card.years !== null ? ` · ${labels.years(card.years)}` : ""}
                    </strong>
                    <span className="text-[13px] text-sg-muted">
                        {card.code} · {labels.anonymous}
                    </span>
                </span>
                <span className="flex items-baseline gap-1">
                    <span className="font-display sg-soft text-[34px] leading-none font-semibold">{score}</span>
                    <span className="font-bold text-sg-muted">% {labels.match}</span>
                </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-2.5">
                {PART_ORDER.map((k) => (
                    <div key={k} className="flex min-w-0 flex-col gap-1">
                        <span className="flex justify-between gap-2 text-[13px]">
                            <span className="truncate font-semibold text-sg-muted">{labels.parts[k]}</span>
                            <strong>{pct(parts[k])}%</strong>
                        </span>
                        <span role="img" aria-label={`${labels.parts[k]} ${pct(parts[k])}%`} className="h-1.5 overflow-hidden rounded-full bg-sg-chip">
                            <span className="block h-full rounded-full bg-sg-ink" style={{ width: `${pct(parts[k])}%` }} />
                        </span>
                    </div>
                ))}
            </div>
            <ul className="flex flex-col gap-1.5">
                {reasons.map((r) => {
                    const missing = r.startsWith("Missing must-have");
                    return (
                        <li key={r} className={cn("flex items-start gap-2 text-sm", missing && "font-semibold")}>
                            {missing ? <XCircle className="mt-0.5 size-4 shrink-0 text-sg-danger" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sg-success" aria-hidden="true" />}
                            <span className="min-w-0 break-words">{r}</span>
                        </li>
                    );
                })}
            </ul>
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-sg-muted">
                <div className="flex gap-1">
                    <dt>{labels.city}:</dt>
                    <dd className="font-semibold text-sg-text">{card.city ?? labels.none}</dd>
                </div>
                <div className="flex gap-1">
                    <dt>{labels.notice}:</dt>
                    <dd className="font-semibold text-sg-text">{card.noticeDays !== null ? labels.noticeDays(card.noticeDays) : labels.none}</dd>
                </div>
                <div className="flex gap-1">
                    <dt>{labels.practice}:</dt>
                    <dd className="font-semibold text-sg-text">{card.practiceScore !== null ? `${card.practiceScore} / 10` : labels.none}</dd>
                </div>
            </dl>
            {action && <div className="flex justify-end">{action}</div>}
        </article>
    );
}
