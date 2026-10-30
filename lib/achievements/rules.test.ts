import { test } from "node:test";
import assert from "node:assert/strict";
import { ACHIEVEMENTS, CERTIFICATE_CODE, certificateCode, checkpointMetric, earnedKeys, isAchievementKey, longestRun, progressOf, type Stats } from "./rules.ts";

const none: Stats = { streak: 0, practice: 0, bestScore: 0, challenges: 0, checkpoint30: 0, checkpoint60: 0, checkpoint90: 0, problems: 0, flashcards: 0 };

test("a first practice interview scored 8.2 earns both first badges", () => {
    assert.deepEqual(earnedKeys({ practice: 1, bestScore: 8.2 }), ["firstPractice", "firstEight"]);
});

test("a score just under 8 doesn't earn First 8+", () => {
    assert.deepEqual(earnedKeys({ bestScore: 7.99 }), []);
});

test("only the metrics given are judged", () => {
    assert.deepEqual(earnedKeys({ flashcards: 100 }), ["flashcards100"]);
});

test("each checkpoint badge is earned by its own checkpoint only", () => {
    assert.deepEqual(earnedKeys({ checkpoint30: 0, checkpoint60: 1 }), ["checkpoint60"]);
    assert.equal(checkpointMetric(60), "checkpoint60");
    assert.equal(checkpointMetric(45), null);
});

test("streak badges come from the longest run, not today's streak", () => {
    // 7 days in a row, a missed day, then 2 more
    const days = [1, 2, 3, 4, 5, 6, 7, 9, 10];
    assert.equal(longestRun(days), 7);
    assert.deepEqual(earnedKeys({ streak: longestRun(days) }), ["streak7"]);
});

test("longestRun ignores order and repeats", () => {
    assert.equal(longestRun([5, 3, 4, 4, 10]), 3);
    assert.equal(longestRun([]), 0);
});

test("progress shows for counts that have started, never for streaks or scores", () => {
    const stats = { ...none, problems: 9, streak: 5, bestScore: 6 };
    const find = (key: string) => ACHIEVEMENTS.find((a) => a.key === key)!;
    assert.equal(progressOf(find("problems25"), stats), 9);
    assert.equal(progressOf(find("flashcards100"), stats), null);
    assert.equal(progressOf(find("streak14"), stats), null);
    assert.equal(progressOf(find("firstEight"), stats), null);
});

test("keys are unique and recognised", () => {
    assert.equal(new Set(ACHIEVEMENTS.map((a) => a.key)).size, ACHIEVEMENTS.length);
    assert.ok(isAchievementKey("streak7"));
    assert.ok(!isAchievementKey("streak8"));
});

test("certificate codes have the GBTU shape and no look-alike letters", () => {
    const code = certificateCode(new Uint8Array([0, 1, 2, 3, 30, 31, 200, 255]));
    assert.match(code, CERTIFICATE_CODE);
    assert.doesNotMatch(code, /[01OIL]/);
    assert.doesNotMatch("GBTU-0000-AAAA", CERTIFICATE_CODE);
});
