// Run with `npm test` (Node's built-in test runner).
import { test } from "node:test";
import assert from "node:assert/strict";
import { assess, decide, type IntegritySummary, type QuestionWindow, type RawEvent } from "./verdict.ts";

const start = new Date("2026-10-21T10:00:00Z");
const at = (s: number) => new Date(start.getTime() + s * 1000);
const ev = (type: string, s: number): RawEvent => ({ type, at: at(s) });
const questions: QuestionWindow[] = [1, 2, 3, 4, 5].map((n) => ({ n, text: `Q${n}`, shownAt: at((n - 1) * 120) }));

/** n leaves of `each` seconds, a minute apart. */
const leaves = (n: number, each: number) => Array.from({ length: n }, (_, i) => [ev("TAB_SWITCH", i * 60), ev("TAB_RETURN", i * 60 + each)]).flat();

const base: IntegritySummary = { timesAway: 0, awaySeconds: 0, untimedAway: 0, pastes: 0, fullscreenExits: 0, longestFullscreenSeconds: 0, devTools: false };
const verdictOf = (s: Partial<IntegritySummary>) => decide({ ...base, ...s }).verdict;

test("AC1: one tab switch of 8 seconds is no concerns, and says so", () => {
    const r = assess([ev("TAB_SWITCH", 100), ev("TAB_RETURN", 108)], start, questions);
    assert.equal(r.verdict, "NO_CONCERNS");
    assert.deepEqual(r.reasons, [{ code: "timesAway", count: 1, seconds: 8 }]);
});

test("AC2: four tab switches are worth a look", () => {
    const r = assess(leaves(4, 2), start, questions);
    assert.equal(r.verdict, "WORTH_A_LOOK");
    assert.deepEqual(r.reasons, [{ code: "timesAway", count: 4, seconds: null }]);
});

test("AC3: developer tools are strong concerns", () => {
    const r = assess([ev("DEV_TOOLS", 30)], start, questions);
    assert.equal(r.verdict, "STRONG_CONCERNS");
    assert.deepEqual(r.reasons, [{ code: "devTools" }]);
});

test("AC4: a window blur and a tab switch a second apart are one time away", () => {
    const r = assess([ev("WINDOW_BLUR", 50), ev("TAB_SWITCH", 51), ev("TAB_RETURN", 60), ev("WINDOW_FOCUS", 60)], start, questions);
    assert.equal(r.summary.timesAway, 1);
    assert.equal(r.summary.awaySeconds, 10);
});

test("AC4: older interviews with no returns still merge, and their time away is unknown", () => {
    const r = assess([ev("WINDOW_BLUR", 50), ev("TAB_SWITCH", 51), ev("WINDOW_BLUR", 90)], start, questions);
    assert.equal(r.summary.timesAway, 2);
    assert.equal(r.summary.untimedAway, 2);
    assert.deepEqual(r.reasons, [{ code: "timesAway", count: 2, seconds: null }]);
});

test("leaves more than 2 seconds apart are separate", () => {
    assert.equal(assess([ev("WINDOW_BLUR", 50), ev("TAB_SWITCH", 53)], start, questions).summary.timesAway, 2);
});

test("AC5: events are attributed to the question on screen, with seconds from the start", () => {
    const r = assess([ev("PASTE", 250), ev("TAB_SWITCH", 300), ev("TAB_RETURN", 305)], start, questions);
    assert.deepEqual(r.events.map((e) => [e.question, e.offset, e.kind]), [[3, 250, "paste"], [3, 300, "away"]]);
});

test("events before the first question have no question", () => {
    const later = questions.map((q) => ({ ...q, shownAt: at(q.n * 60) }));
    assert.equal(assess([ev("TAB_SWITCH", 10)], start, later).events[0].question, null);
});

test("AC6: no events is no concerns with nothing to list", () => {
    const r = assess([], start, questions);
    assert.equal(r.verdict, "NO_CONCERNS");
    assert.deepEqual(r.reasons, []);
    assert.equal(r.events.length, 0);
});

test("returns, camera signals and unknown types aren't events", () => {
    const r = assess([ev("TAB_RETURN", 5), ev("WINDOW_FOCUS", 6), ev("FULLSCREEN_ENTER", 7), ev("FACE_MISSING", 8), ev("SOMETHING", 9)], start, questions);
    assert.equal(r.events.length, 0);
});

test("AC10: times away boundaries 2/3 and 5/6", () => {
    assert.equal(verdictOf({ timesAway: 2 }), "NO_CONCERNS");
    assert.equal(verdictOf({ timesAway: 3 }), "WORTH_A_LOOK");
    assert.equal(verdictOf({ timesAway: 5 }), "WORTH_A_LOOK");
    assert.equal(verdictOf({ timesAway: 6 }), "STRONG_CONCERNS");
});

test("AC10: total time away boundaries 30 s and 2 min", () => {
    assert.equal(verdictOf({ timesAway: 1, awaySeconds: 30 }), "NO_CONCERNS");
    assert.equal(verdictOf({ timesAway: 1, awaySeconds: 31 }), "WORTH_A_LOOK");
    assert.equal(verdictOf({ timesAway: 1, awaySeconds: 120 }), "WORTH_A_LOOK");
    assert.equal(verdictOf({ timesAway: 1, awaySeconds: 121 }), "STRONG_CONCERNS");
});

test("AC10: full-screen exit boundary 10 s", () => {
    assert.equal(assess([ev("FULLSCREEN_EXIT", 10), ev("FULLSCREEN_ENTER", 20)], start, questions).verdict, "NO_CONCERNS");
    const r = assess([ev("FULLSCREEN_EXIT", 10), ev("FULLSCREEN_ENTER", 21)], start, questions);
    assert.equal(r.verdict, "WORTH_A_LOOK");
    assert.deepEqual(r.reasons, [{ code: "fullscreen", seconds: 11 }]);
});

test("AC10: paste boundaries 0/1 and 2/3", () => {
    assert.equal(verdictOf({ pastes: 0 }), "NO_CONCERNS");
    assert.equal(verdictOf({ pastes: 1 }), "WORTH_A_LOOK");
    assert.equal(verdictOf({ pastes: 2 }), "WORTH_A_LOOK");
    assert.equal(verdictOf({ pastes: 3 }), "STRONG_CONCERNS");
});

test("a blocked copy or right-click isn't a paste attempt", () => {
    assert.equal(assess([ev("COPY_PASTE", 10), ev("KEYBOARD_SHORTCUT", 20)], start, questions).verdict, "NO_CONCERNS");
});

test("strong concerns list only the strong reasons", () => {
    const { verdict, reasons } = decide({ ...base, devTools: true, timesAway: 7, awaySeconds: 220, pastes: 1 });
    assert.equal(verdict, "STRONG_CONCERNS");
    assert.deepEqual(reasons, [{ code: "devTools" }, { code: "timesAway", count: 7, seconds: null }, { code: "awayTotal", seconds: 220 }]);
});
