import { test } from "node:test";
import assert from "node:assert/strict";
import { GROUP_SIZE, PREP_SIZE, cosine, parsePrepSuggestion, pickPrepSet, type Candidate } from "./prep.ts";

// Unit vectors on separate axes are unrelated; a slight tilt makes a near-duplicate
const axis = (i: number, tilt = 0) => Array.from({ length: 40 }, (_, j) => (j === i ? 1 : j === i + 1 ? tilt : 0));
const c = (key: string, group: Candidate["group"], vector: number[], text = key): Candidate => ({ key, text, group, vector });

test("near-duplicates are measured by cosine", () => {
    assert.equal(cosine(axis(0), axis(0)), 1);
    assert.ok(cosine(axis(0), axis(0, 0.2)) > 0.92);
    assert.equal(cosine(axis(0), axis(2)), 0);
});

test("AC2: no two questions in the set are near-duplicates", () => {
    const set = pickPrepSet([c("a", "JOB", axis(0)), c("b", "JOB", axis(0, 0.2)), c("x", "WEAK", axis(2))], []);
    assert.deepEqual(set.map((s) => s.key), ["a", "x"]);
});

test("AC3: the employer's own questions never get in, by wording or by meaning", () => {
    const employer = [{ text: "Explain React hooks.", vector: axis(10) }];
    const set = pickPrepSet([c("same-words", "JOB", axis(4), "explain react HOOKS"), c("same-meaning", "COMPANY", axis(10, 0.1)), c("fine", "WEAK", axis(6))], employer);
    assert.deepEqual(set.map((s) => s.key), ["fine"]);
});

test("each group takes its share, AI suggestions fill what's left, and the set stops at 15", () => {
    const own = Array.from({ length: 8 }, (_, i) => c(`job${i}`, "JOB", axis(i * 2)));
    const company = Array.from({ length: 2 }, (_, i) => c(`co${i}`, "COMPANY", axis(20 + i * 2)));
    const weak = Array.from({ length: 6 }, (_, i) => c(`weak${i}`, "WEAK", axis(25 + i * 2)));
    const ai = Array.from({ length: 12 }, (_, i) => c(`ai:${i}`, "JOB", Array.from({ length: 40 }, (_, j) => (j === 39 ? 1 : j === i ? 0.9 : 0))));
    const set = pickPrepSet([...own, ...company, ...weak, ...ai], []);
    assert.equal(set.filter((s) => s.group === "JOB" && !s.key.startsWith("ai:")).length, GROUP_SIZE.JOB);
    assert.equal(set.filter((s) => s.group === "COMPANY").length, 2);
    assert.equal(set.filter((s) => s.group === "WEAK").length, GROUP_SIZE.WEAK);
    // 6 + 2 + 5 = 13: two AI suggestions make it 15, shown with the job's questions
    assert.equal(set.length, PREP_SIZE);
    assert.equal(set.filter((s) => s.key.startsWith("ai:")).length, 2);
    assert.deepEqual([...new Set(set.map((s) => s.group))], ["JOB", "COMPANY", "WEAK"]);
});

test("Gemini's suggestion is checked, not trusted", () => {
    const parsed = parsePrepSuggestion('```json\n{"skills":["React","TypeScript",4],"questions":[{"question":"How does useEffect cleanup work?","type":"TECHNICAL"},{"question":"short"},{"question":"Reverse a linked list in place.","type":"BOGUS"}]}\n```');
    assert.deepEqual(parsed.skills, ["React", "TypeScript"]);
    assert.deepEqual(parsed.questions, [
        { question: "How does useEffect cleanup work?", type: "TECHNICAL" },
        { question: "Reverse a linked list in place.", type: "TECHNICAL" },
    ]);
    assert.deepEqual(parsePrepSuggestion("not json"), { skills: [], questions: [] });
});
