// Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReport, lastWeek, practiceLine, type WeekActivity } from "./report.ts";

const base: WeekActivity = { practice: [], previousAverage: null, answers: [], activity: [], flashcardsReviewed: 0, plan: null, activeBefore: false };
const at = (iso: string) => new Date(iso);

test("the week is last Monday to Sunday in IST", () => {
    // Monday 3 Nov 2026, 9:00 IST
    const w = lastWeek(at("2026-11-03T03:30:00Z"));
    assert.equal(w.monday, "2026-10-26");
    assert.equal(w.start.toISOString(), "2026-10-25T18:30:00.000Z"); // Mon 26 Oct 00:00 IST
    assert.equal(w.end.toISOString(), "2026-11-01T18:30:00.000Z"); // Mon 2 Nov 00:00 IST
});

test("just after midnight IST on Monday still reports the week that just ended", () => {
    assert.equal(lastWeek(at("2026-11-01T18:31:00Z")).monday, "2026-10-26");
});

test("AC1: 3 interviews averaging 7.4 against 6.8 last week", () => {
    const r = buildReport({
        ...base,
        practice: [{ score: 7.0, role: "Frontend Developer" }, { score: 7.4, role: "Frontend Developer" }, { score: 7.8, role: "Frontend Developer" }],
        previousAverage: 6.8,
        activity: [at("2026-10-27T05:00:00Z")],
    })!;
    assert.equal(practiceLine(r.practice), "3 practice interviews · average 7.4 (up 0.6)");
});

test("a lower average says down; no previous week says nothing", () => {
    assert.equal(practiceLine({ count: 1, average: 6.0, change: -0.5 }), "1 practice interview · average 6.0 (down 0.5)");
    assert.equal(practiceLine({ count: 2, average: 7.0, change: null }), "2 practice interviews · average 7.0");
    assert.equal(practiceLine({ count: 0, average: null, change: null }), "0 practice interviews");
});

test("AC5: no activity for 4 weeks means no email", () => {
    assert.equal(buildReport(base), null);
});

test("a quiet week after recent activity is the quiet email", () => {
    const r = buildReport({ ...base, activeBefore: true })!;
    assert.equal(r.kind, "quiet");
    assert.deepEqual(r.next, { kind: "practice" });
});

test("days active counts IST days, not events", () => {
    // 23:00 and 23:59 IST on the same day, then 00:10 IST the next day
    const r = buildReport({ ...base, activity: [at("2026-10-27T17:30:00Z"), at("2026-10-27T18:29:00Z"), at("2026-10-27T18:40:00Z")] })!;
    assert.equal(r.daysActive, 2);
});

test("a weak answer makes practising that role the next step", () => {
    const r = buildReport({
        ...base,
        practice: [{ score: 6.5, role: "Data Analyst" }],
        answers: [{ question: "Explain a left join", score: 8.5 }, { question: "Design a metrics pipeline", score: 5.2 }],
        activity: [at("2026-10-28T05:00:00Z")],
        plan: { streak: 3, paused: false },
    })!;
    assert.deepEqual(r.next, { kind: "practiseRole", role: "Data Analyst" });
    assert.equal(r.strongest?.question, "Explain a left join");
    assert.equal(r.weakest?.question, "Design a metrics pipeline");
});

test("without a plan, starting it is the next step; with one, today's task", () => {
    const week = { ...base, activity: [at("2026-10-28T05:00:00Z")] };
    assert.deepEqual(buildReport(week)!.next, { kind: "startPlan" });
    assert.deepEqual(buildReport({ ...week, plan: { streak: 4, paused: false } })!.next, { kind: "planTask" });
    assert.deepEqual(buildReport({ ...week, plan: { streak: 4, paused: true } })!.next, { kind: "practice" });
});

test("a single answer names no strongest or weakest", () => {
    const r = buildReport({ ...base, answers: [{ question: "Only one", score: 9 }], activity: [at("2026-10-28T05:00:00Z")] })!;
    assert.equal(r.strongest, null);
    assert.equal(r.weakest, null);
});
