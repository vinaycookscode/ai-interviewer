import { test } from "node:test";
import assert from "node:assert/strict";
import { readTaskContent } from "./placement-task-content.ts";

test("content of the right shape passes, per task type", () => {
    assert.ok(readTaskContent("QUIZ", { topic: "Arrays", items: [{ question: "1+1?", options: ["1", "2"], correct: 1 }] }));
    assert.ok(readTaskContent("READING", { title: "Big O", text: "…", keyPoints: ["n log n"] }));
    assert.ok(readTaskContent("PROBLEM", { problem: "Two sum", testCases: [{ input: "[1,2] 3", expected: "[0,1]" }] }));
    assert.ok(readTaskContent("MOCK_INTERVIEW", null));
    assert.ok(readTaskContent("HR_PREP", {}));
});

test("malformed content, wrong answers and unknown types are refused", () => {
    assert.equal(readTaskContent("QUIZ", { items: [{ question: "1+1?", options: ["1", "2"], correct: 2 }] }), null);
    assert.equal(readTaskContent("QUIZ", { items: "not a list" }), null);
    assert.equal(readTaskContent("VIDEO", { url: "javascript:alert(1)" }), null);
    assert.equal(readTaskContent("READING", { estimatedMinutes: "ten" }), null);
    assert.equal(readTaskContent("DANCE", {}), null);
});

test("fields the views don't declare are kept, not stripped", () => {
    const c = readTaskContent("PROBLEM", { problemStatement: "Two sum", interviewTips: ["Clarify negatives"], difficulty: "EASY" });
    assert.deepEqual(c?.interviewTips, ["Clarify negatives"]);
    assert.equal(c?.problemStatement, "Two sum");
});

test("older quizzes with a question list are translated to items", () => {
    const c = readTaskContent("QUIZ", { questions: [{ question: "Use?", options: ["a", "b", "c", "d"], correctAnswer: 3, explanation: "All" }] }) as { items: { correct: number }[] } | null;
    assert.equal(c?.items[0].correct, 3);
    assert.equal(readTaskContent("QUIZ", { questions: [{ question: "Use?", options: ["a", "b"], correctAnswer: 5 }] }), null);
});

test("starter code per language becomes a default plus every language", () => {
    const c = readTaskContent("PROBLEM", { starterCode: { python: "def solve(): pass", javascript: "function solve() {}" } }) as { starterCode: string; starterCodes: Record<string, string> } | null;
    assert.equal(c?.starterCode, "function solve() {}");
    assert.equal(c?.starterCodes.python, "def solve(): pass");
});
