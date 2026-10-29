// Shared by the decision action, its form and the ranked list (AIIN-157). A plain module, so server components can import it.
import { CircleDashed, PauseCircle, Star, XCircle, type LucideIcon } from "lucide-react";
import type { HiringDecision } from "@prisma/client";

export const NOTE_LIMIT = 500;

export const DECISIONS = ["UNDECIDED", "SHORTLISTED", "ON_HOLD", "REJECTED"] as const;

/** Each decision has an icon, always shown with its word. */
export const DECISION_ICONS: Record<HiringDecision, LucideIcon> = {
    UNDECIDED: CircleDashed,
    SHORTLISTED: Star,
    ON_HOLD: PauseCircle,
    REJECTED: XCircle,
};
