// One icon per badge (AIIN-102). A plain module, so server and client components can both use it.
import { Award, Code, Flame, Layers, Mic, Sparkles, Star, Target, type LucideIcon } from "lucide-react";
import type { AchievementKey } from "@/lib/achievements/rules";

const ICONS: Record<AchievementKey, LucideIcon> = {
    streak7: Flame,
    streak14: Flame,
    streak30: Flame,
    firstPractice: Mic,
    fivePractice: Mic,
    firstEight: Star,
    challenges7: Sparkles,
    checkpoint30: Target,
    checkpoint60: Target,
    checkpoint90: Target,
    problems25: Code,
    flashcards100: Layers,
};

export function BadgeIcon({ badge, className }: { badge: AchievementKey | null; className?: string }) {
    const Icon = badge ? ICONS[badge] : Award;
    return <Icon className={className} aria-hidden="true" />;
}
