import { test } from "node:test";
import assert from "node:assert/strict";
import { canAnswer, drawAttempt, originalOption, readAnswers, readiness, scoreAttempt } from "./aptitude.ts";

const seq = (...xs: number[]) => {
    let i = 0;
    return () => xs[i++ % xs.length];
};

test("AC1/AC2: 18 of 30 passes a 60% cutoff, 17 of 30 doesn't", () => {
    const ids = Array.from({ length: 30 }, (_, i) => `q${i}`);
    const key = new Map(ids.map((id) => [id, 0]));
    const answers = (n: number) => Object.fromEntries(ids.map((id, i) => [id, i < n ? 0 : 1]));
    assert.deepEqual(scoreAttempt(ids, answers(18), key, 60), { score: 18, total: 30, percent: 60, passed: true });
    assert.deepEqual(scoreAttempt(ids, answers(17), key, 60), { score: 17, total: 30, percent: 56.7, passed: false });
    assert.equal(scoreAttempt(ids, {}, key, 60).score, 0, "unanswered scores zero");
});

test("AC5: answers count until the deadline plus 30 seconds", () => {
    const deadline = new Date("2026-11-13T10:30:00Z");
    assert.ok(canAnswer(deadline, new Date("2026-11-13T10:30:29Z")));
    assert.ok(!canAnswer(deadline, new Date("2026-11-13T10:40:00Z")));
});

test("draws askCount from each section, in section order, from the pool only", () => {
    const pool = [
        ...Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, sectionId: "circuits", options: 4 })),
        ...Array.from({ length: 6 }, (_, i) => ({ id: `l${i}`, sectionId: "logical", options: 3 })),
    ];
    const a = drawAttempt([{ id: "logical", askCount: 5, order: 1 }, { id: "circuits", askCount: 10, order: 0 }], pool, true, seq(0.3, 0.7, 0.1, 0.9, 0.5));
    assert.equal(a.questionIds.length, 15);
    assert.ok(a.questionIds.slice(0, 10).every((id) => id.startsWith("c")));
    assert.ok(a.questionIds.slice(10).every((id) => id.startsWith("l")));
    assert.equal(new Set(a.questionIds).size, 15, "no repeats");
    assert.ok(a.optionOrders.every((o, i) => [...o].sort().join() === (i < 10 ? "0,1,2,3" : "0,1,2")), "each order is a permutation");
    const fixed = drawAttempt([{ id: "circuits", askCount: 2, order: 0 }], pool, false);
    assert.deepEqual(fixed.optionOrders, [[0, 1, 2, 3], [0, 1, 2, 3]], "no shuffling when off");
});

test("AIIN-226 AC2: two attempts differ, and shuffled options still score the right answer", () => {
    const pool = Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, sectionId: "s", options: 4 }));
    const one = drawAttempt([{ id: "s", askCount: 10, order: 0 }], pool, true, seq(0.12, 0.83, 0.47, 0.29));
    const two = drawAttempt([{ id: "s", askCount: 10, order: 0 }], pool, true, seq(0.91, 0.05, 0.66, 0.38));
    assert.notDeepEqual(one, two);
    const order = [2, 0, 3, 1]; // shown A is option 2
    assert.equal(originalOption(order, 0), 2);
    assert.equal(originalOption(order, 4), null);
    assert.equal(originalOption(undefined, 0), null);
});

test("readiness: every section needs enough checked questions", () => {
    const sections = [{ id: "a", name: "Circuits", askCount: 10 }, { id: "b", name: "Logical", askCount: 10 }];
    const r = readiness(sections, new Map([["a", 9], ["b", 12]]));
    assert.equal(r.ready, false);
    assert.deepEqual(r.missing, [{ section: "Circuits", have: 9, ask: 10 }]);
    assert.ok(readiness(sections, new Map([["a", 10], ["b", 10]])).ready);
    assert.equal(readiness([], new Map()).ready, false);
});

test("saved answers are read defensively", () => {
    assert.deepEqual(readAnswers({ q1: 2, q2: "x", q3: -1, other: 1 }, ["q1", "q2", "q3"]), { q1: 2 });
    assert.deepEqual(readAnswers(null, ["q1"]), {});
});
