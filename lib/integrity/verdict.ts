// The integrity verdict: how an interview's proctoring events read, for the employer (AIIN-177).
//
// Pure functions only (no database, no "@/" imports), so `npm test` can run them with Node directly.
//
// 1. Clean up the raw events: a window blur and a tab switch within 2 seconds of each other are one
//    "left the interview"; each leave ends at the next return, which gives the time away.
// 2. Attribute each event to the question on screen at the time.
// 3. Apply the rules below. Each verdict lists only the reasons that produced it.
//
//    Strong concerns: more than 5 times away, or more than 2 minutes away in total, or developer tools,
//                     or more than 2 paste attempts.
//    Worth a look:    3 to 5 times away, or more than 30 seconds away in total, or a full-screen exit
//                     of more than 10 seconds, or 1 to 2 paste attempts.
//    No concerns:     anything else (at most 2 times away, 30 seconds or less in all, no paste, no dev tools).
//
// Change a rule? Bump RULES_VERSION: stored verdicts from older rules are recomputed when next shown.

export const RULES_VERSION = 1;

/** Every event type the interview page may send. Camera signals are logged but not used here yet. */
export const PROCTORING_EVENT_TYPES = [
    "TAB_SWITCH",
    "WINDOW_BLUR",
    "TAB_RETURN",
    "WINDOW_FOCUS",
    "FULLSCREEN_EXIT",
    "FULLSCREEN_ENTER",
    "PASTE",
    "COPY_PASTE",
    "KEYBOARD_SHORTCUT",
    "DEV_TOOLS",
    "MULTI_SCREEN",
    "FACE_MISSING",
    "GAZE_DETECTED",
] as const;

export const MERGE_WINDOW_MS = 2000;

export const LIMITS = {
    awayWorth: 3, // times away: 3 to 5 is worth a look
    awayStrong: 6, // more than 5 is strong
    awaySecondsWorth: 30, // more than 30 s in total
    awaySecondsStrong: 120, // more than 2 min in total
    fullscreenSecondsWorth: 10, // one exit of more than 10 s
    pastesWorth: 1, // 1 to 2
    pastesStrong: 3, // more than 2
};

export type Verdict = "NO_CONCERNS" | "WORTH_A_LOOK" | "STRONG_CONCERNS";

export type EventKind = "away" | "fullscreen" | "paste" | "copy" | "shortcut" | "devTools" | "multiScreen";

export interface RawEvent {
    type: string;
    at: Date;
}

export interface QuestionWindow {
    /** 1-based position in the interview. */
    n: number;
    text: string;
    /** When this question came on screen. */
    shownAt: Date;
}

export interface IntegrityEvent {
    kind: EventKind;
    /** Seconds since the interview started, never negative. */
    offset: number;
    /** How long it lasted (away or out of full screen), when a return was recorded. */
    seconds: number | null;
    /** The question on screen, or null before the first one. */
    question: number | null;
}

export interface IntegritySummary {
    timesAway: number;
    /** Time away from the leaves that have a recorded return. */
    awaySeconds: number;
    /** Leaves with no recorded return (older interviews), so awaySeconds is a minimum. */
    untimedAway: number;
    pastes: number;
    fullscreenExits: number;
    longestFullscreenSeconds: number;
    devTools: boolean;
}

export type Reason =
    | { code: "timesAway"; count: number; seconds: number | null }
    | { code: "awayTotal"; seconds: number }
    | { code: "fullscreen"; seconds: number }
    | { code: "pastes"; count: number }
    | { code: "devTools" };

export interface IntegrityResult {
    events: IntegrityEvent[];
    summary: IntegritySummary;
    verdict: Verdict;
    reasons: Reason[];
}

const LEAVES = new Set(["TAB_SWITCH", "WINDOW_BLUR"]);
const RETURNS = new Set(["TAB_RETURN", "WINDOW_FOCUS"]);
const SINGLE: Record<string, EventKind> = {
    PASTE: "paste",
    COPY_PASTE: "copy",
    KEYBOARD_SHORTCUT: "shortcut",
    DEV_TOOLS: "devTools",
    MULTI_SCREEN: "multiScreen",
};

const seconds = (ms: number) => Math.round(ms / 1000);

/** Turns raw events into what happened: leaves with their time away, full-screen exits, pastes and so on. */
export function cleanEvents(raw: RawEvent[], startedAt: Date, questions: QuestionWindow[]): IntegrityEvent[] {
    const sorted = [...raw].sort((a, b) => a.at.getTime() - b.at.getTime());
    const shown = [...questions].sort((a, b) => a.shownAt.getTime() - b.shownAt.getTime());
    const questionAt = (t: number) => {
        let n: number | null = null;
        for (const q of shown) if (q.shownAt.getTime() <= t) n = q.n;
        return n;
    };
    const start = startedAt.getTime();
    const event = (kind: EventKind, t: number, secs: number | null = null): IntegrityEvent => ({
        kind,
        offset: Math.max(0, seconds(t - start)),
        seconds: secs,
        question: questionAt(t),
    });

    const out: IntegrityEvent[] = [];
    let away: { event: IntegrityEvent; since: number; last: number } | null = null;
    let fullscreen: { event: IntegrityEvent; since: number } | null = null;

    for (const e of sorted) {
        const t = e.at.getTime();
        if (LEAVES.has(e.type)) {
            // Another leave signal for the same exit: blur and tab switch fire together
            if (away && away.event.seconds === null && t - away.last <= MERGE_WINDOW_MS) {
                away.last = t;
                continue;
            }
            away = { event: event("away", t), since: t, last: t };
            out.push(away.event);
        } else if (RETURNS.has(e.type)) {
            // The first return ends the time away; a second return signal is the same return
            if (away && away.event.seconds === null) away.event.seconds = seconds(t - away.since);
        } else if (e.type === "FULLSCREEN_EXIT") {
            fullscreen = { event: event("fullscreen", t), since: t };
            out.push(fullscreen.event);
        } else if (e.type === "FULLSCREEN_ENTER") {
            if (fullscreen && fullscreen.event.seconds === null) fullscreen.event.seconds = seconds(t - fullscreen.since);
        } else if (SINGLE[e.type]) {
            out.push(event(SINGLE[e.type], t));
        }
    }
    return out;
}

export function summarise(events: IntegrityEvent[]): IntegritySummary {
    const away = events.filter((e) => e.kind === "away");
    const fullscreen = events.filter((e) => e.kind === "fullscreen");
    return {
        timesAway: away.length,
        awaySeconds: away.reduce((sum, e) => sum + (e.seconds ?? 0), 0),
        untimedAway: away.filter((e) => e.seconds === null).length,
        pastes: events.filter((e) => e.kind === "paste").length,
        fullscreenExits: fullscreen.length,
        longestFullscreenSeconds: Math.max(0, ...fullscreen.map((e) => e.seconds ?? 0)),
        devTools: events.some((e) => e.kind === "devTools"),
    };
}

export function decide(s: IntegritySummary): { verdict: Verdict; reasons: Reason[] } {
    const strong: Reason[] = [];
    const worth: Reason[] = [];

    if (s.devTools) strong.push({ code: "devTools" });
    if (s.timesAway >= LIMITS.awayStrong) strong.push({ code: "timesAway", count: s.timesAway, seconds: null });
    else if (s.timesAway >= LIMITS.awayWorth) worth.push({ code: "timesAway", count: s.timesAway, seconds: null });
    if (s.awaySeconds > LIMITS.awaySecondsStrong) strong.push({ code: "awayTotal", seconds: s.awaySeconds });
    else if (s.awaySeconds > LIMITS.awaySecondsWorth) worth.push({ code: "awayTotal", seconds: s.awaySeconds });
    if (s.pastes >= LIMITS.pastesStrong) strong.push({ code: "pastes", count: s.pastes });
    else if (s.pastes >= LIMITS.pastesWorth) worth.push({ code: "pastes", count: s.pastes });
    if (s.longestFullscreenSeconds > LIMITS.fullscreenSecondsWorth) worth.push({ code: "fullscreen", seconds: s.longestFullscreenSeconds });

    if (strong.length) return { verdict: "STRONG_CONCERNS", reasons: strong };
    if (worth.length) return { verdict: "WORTH_A_LOOK", reasons: worth };
    // No concerns: say what did happen, if anything
    const reasons: Reason[] = s.timesAway
        ? [{ code: "timesAway", count: s.timesAway, seconds: s.untimedAway ? null : s.awaySeconds }]
        : [];
    return { verdict: "NO_CONCERNS", reasons };
}

export function assess(raw: RawEvent[], startedAt: Date, questions: QuestionWindow[]): IntegrityResult {
    const events = cleanEvents(raw, startedAt, questions);
    const summary = summarise(events);
    return { events, summary, ...decide(summary) };
}
