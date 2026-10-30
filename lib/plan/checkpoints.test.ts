import { test } from "node:test";
import assert from "node:assert/strict";
import { checkpointDays, isCheckpointDay, overallChange, phaseStart, phaseTopics, recommendedFirst, skillLabel, timeline } from "./checkpoints.ts";

test("a QA candidate sees the QA plan first; the rest keep their order", () => {
    const plans = [{ track: "sde", name: "SDE" }, { track: "general", name: "Aptitude" }, { track: "qa", name: "QA" }];
    assert.deepEqual(recommendedFirst(plans, "qa").map((p) => p.name), ["QA", "SDE", "Aptitude"]);
});

test("no career path, or no matching plan, leaves the list as it was", () => {
    const plans = [{ track: "sde" }, { track: "general" }];
    assert.equal(recommendedFirst(plans, null), plans);
    assert.deepEqual(recommendedFirst(plans, "devops"), plans);
});

test("a task tagged SQL is Revision for a candidate who listed SQL, New for you otherwise", () => {
    assert.deepEqual(skillLabel(["SQL"], ["Python", "sql"]), { kind: "revision", skill: "SQL" });
    assert.deepEqual(skillLabel(["SQL"], ["Python"]), { kind: "new", skill: "SQL" });
});

test("a task with a listed and an unlisted skill is New for you, naming the new one", () => {
    assert.deepEqual(skillLabel(["SQL", "Joins"], ["SQL"]), { kind: "new", skill: "Joins" });
});

test("no label without tags or without a career path", () => {
    assert.equal(skillLabel([], ["SQL"]), null);
    assert.equal(skillLabel(["SQL"], null), null);
    assert.equal(skillLabel(["SQL"], []), null);
});

test("checkpoints only on the 90-day plans", () => {
    assert.deepEqual(checkpointDays(90), [30, 60, 90]);
    assert.deepEqual(checkpointDays(30), []);
    assert.ok(isCheckpointDay(60, 90));
    assert.ok(!isCheckpointDay(45, 90));
    assert.ok(!isCheckpointDay(30, 30));
});

test("each checkpoint covers the days since the one before", () => {
    assert.equal(phaseStart(30), 1);
    assert.equal(phaseStart(60), 31);
    assert.equal(phaseStart(90), 61);
});

test("phase topics are unique and spread evenly", () => {
    assert.deepEqual(phaseTopics(["A", "A", "B", " C "]), ["A", "B", "C"]);
    const many = Array.from({ length: 29 }, (_, i) => `T${i}`);
    const picked = phaseTopics(many, 4);
    assert.deepEqual(picked, ["T0", "T7", "T14", "T21"]);
});

test("checkpoints at 6.8 and 7.6 show both and the change", () => {
    const d30 = new Date("2026-12-04"), d60 = new Date("2027-01-03");
    const items = timeline([30, 60, 90], [{ day: 30, score: 6.8, doneAt: d30 }, { day: 60, score: 7.6, doneAt: d60 }], 63);
    assert.deepEqual(items, [
        { day: 30, state: "done", score: 6.8, doneAt: d30, change: null },
        { day: 60, state: "done", score: 7.6, doneAt: d60, change: 0.8 },
        { day: 90, state: "later", inDays: 27 },
    ]);
    assert.deepEqual(overallChange(items), { from: 30, change: 0.8 });
});

test("a reached checkpoint not taken yet is ready; unscored ones don't count", () => {
    const items = timeline([30, 60, 90], [{ day: 30, score: null, doneAt: null }], 31);
    assert.deepEqual(items.map((i) => i.state), ["ready", "later", "later"]);
    assert.equal(overallChange(items), null);
});
