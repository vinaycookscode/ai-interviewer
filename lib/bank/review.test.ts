import { test } from "node:test";
import assert from "node:assert/strict";
import { daysUntil, isDue, review } from "./review.ts";

// 11 Nov 2026, 9 PM IST
const now = new Date("2026-11-11T15:30:00Z");
const midnightIst = (date: string) => new Date(`${date}T00:00:00+05:30`);

test("AC1: a score of 4 sends a question back to box 1, due tomorrow", () => {
    const r = review(3, 4, now);
    assert.equal(r.box, 1);
    assert.equal(r.status, "PRACTISING");
    assert.deepEqual(r.nextReview, midnightIst("2026-11-12"));
    assert.equal(r.inDays, 1);
});

test("a strong first answer moves it to every 3 days, still Practising", () => {
    const r = review(0, 8, now);
    assert.deepEqual([r.box, r.status, r.inDays], [2, "PRACTISING", 3]);
    assert.deepEqual(r.nextReview, midnightIst("2026-11-14"));
});

test("two strong answers in a row make it Confident", () => {
    const first = review(1, 7, now);
    const second = review(first.box, 9, now);
    assert.deepEqual([second.box, second.status, second.inDays], [3, "CONFIDENT", 7]);
});

test("the top box is the limit", () => {
    assert.equal(review(5, 10, now).box, 5);
    assert.equal(review(5, 10, now).inDays, 30);
});

test("a question is due from midnight IST, and never if unscheduled", () => {
    assert.ok(isDue(midnightIst("2026-11-11"), now));
    assert.ok(!isDue(midnightIst("2026-11-12"), now));
    assert.ok(!isDue(null, now));
    assert.equal(daysUntil(midnightIst("2026-11-14"), now), 3);
    assert.equal(daysUntil(midnightIst("2026-11-01"), now), 0);
});
