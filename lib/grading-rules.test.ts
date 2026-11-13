import { test } from "node:test";
import assert from "node:assert/strict";
import { averageScore, gradingBackoffMs, scoringState } from "./grading-rules.ts";

test("AC7: the score is the average of the scored answers", () => {
    assert.equal(averageScore([8, 6, null, 7]), 7);
    assert.equal(averageScore([null, null]), null);
});

test("AC3: retries back off", () => {
    assert.deepEqual([1, 2, 3, 4].map(gradingBackoffMs), [30_000, 60_000, 120_000, 240_000]);
});

test("AC2/AC4: a pending or failed answer means no number is shown", () => {
    assert.equal(scoringState({ score: null, pending: 1, failed: 0 }), "SCORING");
    assert.equal(scoringState({ score: 7, pending: 0, failed: 1 }), "FAILED");
    assert.equal(scoringState({ score: 7, pending: 0, failed: 0 }), "SCORED");
    assert.equal(scoringState({ score: null, pending: 0, failed: 0 }), "UNSCORED");
});
