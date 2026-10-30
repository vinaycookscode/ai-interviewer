import { test } from "node:test";
import assert from "node:assert/strict";
import { checkedContent, describeChanges, draftErrors, normalizeDraft, publishBlocks, testCounts, type ProblemDraft } from "./rules.ts";
import { callSource, judge, parseInput } from "./run-js.ts";

const draft: ProblemDraft = normalizeDraft({
    title: "Longest substring without repeats",
    statement: "Given a string `s`…",
    kitId: "kit-flipkart",
    type: "CODING",
    difficulty: "MEDIUM",
    tags: ["strings", " strings ", "sliding window"],
    roles: [],
    starterCode: "function lengthOfLongestSubstring(s) {}",
    solutionCode: "function lengthOfLongestSubstring(s) { let best = 0, start = 0; const seen = new Map(); for (let i = 0; i < s.length; i++) { if (seen.has(s[i]) && seen.get(s[i]) >= start) start = seen.get(s[i]) + 1; seen.set(s[i], i); best = Math.max(best, i - start + 1); } return best; }",
    answer: "",
    tests: [
        { input: '"abcabcbb"', expected: "3", hidden: false },
        { input: '"bbbbb"', expected: "1", hidden: false },
        { input: '"pwwkew"', expected: "3", hidden: true },
        { input: '""', expected: "0", hidden: true },
    ],
    hints: ["Keep a window with no repeats."],
});

test("normalizing trims, de-duplicates tags and drops empty tests", () => {
    const d = normalizeDraft({ ...draft, title: "  Two sum  ", tests: [...draft.tests, { input: "", expected: "", hidden: false }] });
    assert.equal(d.title, "Two sum");
    assert.deepEqual(draft.tags, ["strings", "sliding window"]);
    assert.equal(d.tests.length, 4);
});

test("a draft needs a title, a kit, a known type and difficulty, and complete tests", () => {
    assert.deepEqual(draftErrors(draft), []);
    const bad = normalizeDraft({ ...draft, title: "", kitId: "", type: "QUIZ", difficulty: "SPICY", tests: [{ input: "1", expected: "", hidden: false }], hints: ["a", "b", "c", "d"] });
    assert.deepEqual(draftErrors(bad), ["title", "kit", "type", "difficulty", "testIncomplete", "tooManyHints"]);
});

test("a coding problem publishes only after its current solution and tests passed a check", () => {
    const hash = checkedContent(draft);
    assert.deepEqual(publishBlocks(draft, null, hash), ["unchecked"]);
    assert.deepEqual(publishBlocks(draft, hash, hash), []);
    // Changing a test after the check means checking again
    const changed = { ...draft, tests: [...draft.tests.slice(0, 3), { input: '""', expected: "1", hidden: true }] };
    assert.deepEqual(publishBlocks(changed, hash, checkedContent(changed)), ["unchecked"]);
    assert.deepEqual(publishBlocks({ ...draft, solutionCode: "", tests: [] }, null, ""), ["noSolution", "noTests"]);
});

test("aptitude and HR problems need no check", () => {
    assert.deepEqual(publishBlocks({ ...draft, type: "HR", solutionCode: "", tests: [] }, null, ""), []);
});

test("the statement and hints aren't part of the check", () => {
    const reworded: ProblemDraft = { ...draft, statement: "New words", hints: [] };
    assert.equal(checkedContent(draft), checkedContent(reworded));
});

test("the history says what changed", () => {
    const after = { ...draft, tests: [...draft.tests, { input: '"dvdf"', expected: "3", hidden: true }, { input: '" "', expected: "1", hidden: true }], hints: [...draft.hints, "Move the left edge past the repeat."] };
    assert.equal(describeChanges(draft, after), "added 2 hidden tests and added hint 2");
    assert.equal(describeChanges(draft, { ...draft, title: "New", statement: "x", difficulty: "HARD" }), "renamed it, edited the statement and set the difficulty to hard");
    assert.equal(describeChanges(draft, { ...draft, tests: [...draft.tests].reverse() }), "reordered the tests");
    assert.equal(describeChanges(draft, draft), null);
});

test("test counts", () => {
    assert.deepEqual(testCounts(draft.tests), { visible: 2, hidden: 2 });
});

test("the shared runner calls and judges a solution", () => {
    const run = (input: string, expected: string) => judge(new Function("input", callSource(draft.solutionCode))(parseInput(input)), expected);
    assert.ok(run('"abcabcbb"', "3").passed);
    const fail = run('"bbbbb"', "2");
    assert.equal(fail.passed, false);
    assert.equal(fail.error, "Expected 2, got 1");
    assert.deepEqual(parseInput("[2,7,11,15], 9"), { nums: [2, 7, 11, 15], target: 9 });
});

const runs = (code: string, input: string, expected: string) => judge(new Function("input", callSource(code))(parseInput(input)), expected);

test("a linked list arrives as nodes and comes back as values", () => {
    const reverse = "function reverseList(head) { let prev = null, cur = head; while (cur) { const next = cur.next; cur.next = prev; prev = cur; cur = next; } return prev; }";
    assert.ok(runs(reverse, '{"list":[1,2,3,4,5]}', "[5,4,3,2,1]").passed);
    assert.ok(runs(reverse, '{"list":[]}', "[]").passed);
    const merge = "function mergeTwoLists(a, b) { const d = { next: null }; let c = d; while (a && b) { if (a.val <= b.val) { c.next = a; a = a.next; } else { c.next = b; b = b.next; } c = c.next; } c.next = a || b; return d.next; }";
    assert.ok(runs(merge, '[{"list":[1,2,4]},{"list":[1,3,4]}]', "[1,1,2,3,4,4]").passed);
});

test("a wrapped array is one argument; the old two-argument form still works", () => {
    assert.ok(runs("function maxSubArray(nums) { let m = nums[0], c = nums[0]; for (let i = 1; i < nums.length; i++) { c = Math.max(nums[i], c + nums[i]); m = Math.max(m, c); } return m; }", "[[-2,1,-3,4,-1,2,1,-5,4]]", "6").passed);
    assert.ok(runs("function twoSum(nums, target) { return [nums.indexOf(2), nums.indexOf(target - 2)]; }", "[2,7,11,15], 9", "[0,1]").passed);
});

