import { test } from "node:test";
import assert from "node:assert/strict";
import { bestOf, firstSentence, mostTelling, parseCompareIds } from "./compare.ts";

test("AC3: two to four distinct candidates, no more, no fewer", () => {
    assert.deepEqual(parseCompareIds("a,b,c"), { ok: true, ids: ["a", "b", "c"] });
    assert.deepEqual(parseCompareIds("a, b ,a"), { ok: true, ids: ["a", "b"] });
    assert.deepEqual(parseCompareIds("a"), { ok: false, reason: "count" });
    assert.deepEqual(parseCompareIds("a,b,c,d,e"), { ok: false, reason: "count" });
    assert.deepEqual(parseCompareIds(undefined), { ok: false, reason: "count" });
    // Anything that isn't an id is dropped, not trusted
    assert.deepEqual(parseCompareIds("a,'; drop,b"), { ok: true, ids: ["a", "b"] });
});

test("the top score per question is marked, ties included", () => {
    assert.deepEqual(bestOf([7.8, 8.9, 5.2]), [false, true, false]);
    assert.deepEqual(bestOf([8, 8, 6]), [true, true, false]);
    // AC2's "Not answered" never wins, and one lone answer isn't "best" of anything
    assert.deepEqual(bestOf([null, 6, null]), [false, false, false]);
    assert.deepEqual(bestOf([null, null]), [false, false]);
});

test("the quote comes from the question where the candidates differ most", () => {
    assert.equal(mostTelling([[7, 7.5], [9, 3], [null, 8]]), 1);
    assert.equal(mostTelling([]), 0);
});

test("one line of feedback", () => {
    assert.equal(firstSentence("Good structure. Add numbers."), "Good structure.");
    assert.equal(firstSentence(null), null);
    assert.equal(firstSentence("x".repeat(200), 20)?.length, 20);
});
