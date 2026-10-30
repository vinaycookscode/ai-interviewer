// Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyStreak, dateDay, dayDate, istDay, pickQuestion, trackFor, weekDays, type PoolQuestion } from "./logic.ts";

const pool: PoolQuestion[] = [
    ...Array.from({ length: 6 }, (_, i) => ({ id: `apt${i}`, type: "APTITUDE", question: `Aptitude ${i}`, roles: [] })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `hr${i}`, type: "HR", question: `HR ${i}`, roles: [] })),
    { id: "apt-dup", type: "APTITUDE", question: "Aptitude 0", roles: [] },
    { id: "code", type: "CODING", question: "Reverse a list", roles: [] },
];
const D = istDay(new Date("2026-11-02T06:00:00Z"));

test("AC1: the same question all day for a track, a new one the next day", () => {
    const a = pickQuestion(D, "sde", pool);
    assert.equal(pickQuestion(D, "sde", pool)?.id, a?.id);
    assert.notEqual(pickQuestion(D + 1, "sde", pool)?.type, a?.type);
});

test("the day changes at IST midnight, not UTC", () => {
    assert.equal(istDay(new Date("2026-11-01T18:29:00Z")), istDay(new Date("2026-11-01T10:00:00Z")));
    assert.equal(istDay(new Date("2026-11-01T18:30:00Z")), istDay(new Date("2026-11-01T10:00:00Z")) + 1);
});

test("aptitude and HR alternate; coding isn't used yet", () => {
    const types = Array.from({ length: 10 }, (_, i) => pickQuestion(D + i, "general", pool)?.type);
    assert.ok(types.every((t) => t === "APTITUDE" || t === "HR"));
    assert.ok(types.every((t, i) => i === 0 || t !== types[i - 1]));
});

test("no repeats until the pool of that type is used up; duplicates count once", () => {
    const aptDays = Array.from({ length: 24 }, (_, i) => D + i).filter((d) => pickQuestion(d, "qa", pool)?.type === "APTITUDE");
    const ids = aptDays.slice(0, 6).map((d) => pickQuestion(d, "qa", pool)?.question);
    assert.equal(new Set(ids).size, 6);
});

test("questions tagged for a track are preferred", () => {
    const tagged = [...pool, { id: "apt-qa", type: "APTITUDE", question: "Only for QA", roles: ["qa"] }];
    const aptDay = pickQuestion(D, "qa", pool)?.type === "APTITUDE" ? D : D + 1;
    assert.equal(pickQuestion(aptDay, "qa", tagged)?.id, "apt-qa");
});

test("AC2: no role is the general track", () => {
    assert.equal(trackFor(null), "general");
    assert.equal(trackFor("Something else"), "general");
    assert.equal(trackFor("Automation Tester / QA"), "qa");
});

test("an empty pool gives no question", () => {
    assert.equal(pickQuestion(D, "sde", []), null);
});

test("AC4: Monday and Tuesday make 2; skip Wednesday and Thursday shows 0", () => {
    const mon = D, tue = D + 1;
    assert.equal(dailyStreak([mon, tue], tue), 2);
    assert.equal(dailyStreak([mon, tue], tue + 1), 2, "Wednesday, not done yet: still 2");
    assert.equal(dailyStreak([mon, tue], tue + 2), 0, "Thursday: broken");
});

test("AC5: a plan task and a challenge on the same day count once", () => {
    assert.equal(dailyStreak([D, D], D), 1);
});

test("the week runs Monday to Sunday", () => {
    const days = weekDays(D); // 2 Nov 2026 is a Monday
    assert.equal(days[0], D);
    assert.equal(days.length, 7);
});

test("stored dates round-trip to IST days", () => {
    assert.equal(dateDay(dayDate(D)), D);
});
