import Link from "next/link";
import { useTranslations } from "next-intl";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

interface DeckCardProps {
    id: string;
    name: string;
    description: string | null;
    category: string;
    cardCount: number;
    dueCount: number;
    masteryPercent: number;
}

const chip = "inline-flex h-7 items-center rounded-full bg-sg-chip px-2.5 text-sm font-semibold";

/** A deck in the list: category, due count, name and mastery. */
export function DeckCard({ id, name, description, category, cardCount, dueCount, masteryPercent }: DeckCardProps) {
    const t = useTranslations("Flashcards");
    return (
        <Link
            href={`/candidate/flashcards/${id}`}
            className={cn("sg-glass flex w-full min-w-0 flex-col gap-3.5 rounded-[24px] p-5 transition-transform hover:-translate-y-0.5 sm:p-6", focusRing)}
        >
            <span className="flex flex-wrap gap-1.5">
                <span className={chip}>{category}</span>
                {dueCount > 0 && <span className={cn(chip, "bg-sg-lavender-soft text-sg-lavender-ink")}>{t("dueChip", { count: dueCount })}</span>}
            </span>
            <span className="flex flex-col gap-1">
                <span className="text-xl leading-7 font-bold">{name}</span>
                {description && <span className="line-clamp-2 text-sg-muted">{description}</span>}
            </span>
            <span className="mt-auto flex flex-col gap-2">
                <span className="flex justify-between gap-3 text-sm">
                    <span className="text-sg-muted">{t("mastery", { count: cardCount })}</span>
                    <span className="font-bold">{t("stats.percent", { value: masteryPercent })}</span>
                </span>
                <span
                    role="progressbar"
                    aria-label={t("masteryLabel", { value: masteryPercent })}
                    aria-valuenow={masteryPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 overflow-hidden rounded-full bg-sg-track"
                >
                    <span className="block h-full rounded-full bg-sg-lavender-ink" style={{ width: `${masteryPercent}%` }} />
                </span>
            </span>
        </Link>
    );
}
