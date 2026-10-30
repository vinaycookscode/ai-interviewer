// The 90-day plan fitted to the career path, with checkpoints on days 30, 60 and 90 (AIIN-101).
// Pure functions (no database, no "@/" imports), tested with `npm test`.
import { CAREER_ROLES, type CareerRole } from "../career-path.ts";

export type PlanTrack = CareerRole | "general";
export const PLAN_TRACKS: readonly PlanTrack[] = [...CAREER_ROLES, "general"];

/** Only the 90-day plans (or longer) have checkpoints. */
const CHECKPOINT_DAYS = [30, 60, 90] as const;

export function checkpointDays(durationDays: number): number[] {
    return durationDays >= 90 ? [...CHECKPOINT_DAYS] : [];
}

export const isCheckpointDay = (day: number, durationDays: number) => checkpointDays(durationDays).includes(day);

/** The first day a checkpoint covers: the day after the one before it. */
export function phaseStart(day: number): number {
    const before = CHECKPOINT_DAYS.filter((d) => d < day);
    return before.length ? before[before.length - 1] + 1 : 1;
}

/** Up to `limit` topics spread evenly across the phase, in order, for the checkpoint's questions. */
export function phaseTopics(titles: string[], limit = 8): string[] {
    const unique = [...new Set(titles.map((t) => t.trim()).filter(Boolean))];
    if (unique.length <= limit) return unique;
    return Array.from({ length: limit }, (_, i) => unique[Math.floor((i * unique.length) / limit)]);
}

/** The plan built for the candidate's role first; the rest keep their order. No role, no change. */
export function recommendedFirst<P extends { track: string }>(programs: P[], role: CareerRole | null): P[] {
    if (!role) return programs;
    const match = programs.find((p) => p.track === role);
    return match ? [match, ...programs.filter((p) => p !== match)] : programs;
}

export type SkillLabel = { kind: "new" | "revision"; skill: string } | null;

/**
 * A task's skill label: "New for you" when it's tagged with a skill the candidate didn't list (the first such),
 * otherwise "Revision". Nothing without tags or without a career path.
 */
export function skillLabel(taskSkills: string[], candidateSkills: string[] | null): SkillLabel {
    if (!candidateSkills?.length || !taskSkills.length) return null;
    const listed = new Set(candidateSkills.map((s) => s.trim().toLowerCase()));
    const fresh = taskSkills.find((s) => !listed.has(s.trim().toLowerCase()));
    return fresh ? { kind: "new", skill: fresh } : { kind: "revision", skill: taskSkills[0] };
}

export interface CheckpointResult {
    day: number;
    /** Out of 10, once finished. */
    score: number | null;
    doneAt: Date | null;
}

export type TimelineItem =
    | { day: number; state: "done"; score: number; doneAt: Date; change: number | null }
    | { day: number; state: "ready" }
    | { day: number; state: "later"; inDays: number };

/** One row per checkpoint: done (with the change since the one before), ready to take, or still to come. */
export function timeline(days: number[], results: CheckpointResult[], currentDay: number): TimelineItem[] {
    let previous: number | null = null;
    return days.map((day): TimelineItem => {
        const result = results.find((r) => r.day === day);
        if (result?.score != null && result.doneAt) {
            const score = round1(result.score);
            const change = previous === null ? null : round1(score - previous);
            previous = score;
            return { day, state: "done", score, doneAt: result.doneAt, change };
        }
        return day <= currentDay ? { day, state: "ready" } : { day, state: "later", inDays: day - currentDay };
    });
}

/** The change from the first checkpoint to the latest, once there are two. */
export function overallChange(items: TimelineItem[]): { from: number; change: number } | null {
    const done = items.filter((i) => i.state === "done");
    if (done.length < 2) return null;
    return { from: done[0].day, change: round1(done[done.length - 1].score - done[0].score) };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
