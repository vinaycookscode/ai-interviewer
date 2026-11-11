import { test } from "node:test";
import assert from "node:assert/strict";
import { bankIdFor, gradingPrompt, mergeBankQuestion } from "./questions.ts";

const written = ["Q1", "Q2", "Q3", "Q4", "Q5"];

test("the bank question comes last, with its id; Gemini's fill the rest", () => {
    const m = mergeBankQuestion(written, { id: "cq1", question: "Tell me about yourself" });
    assert.deepEqual(m.questions, ["Q1", "Q2", "Q3", "Q4", "Tell me about yourself"]);
    assert.deepEqual(m.bankQuestionIds, ["", "", "", "", "cq1"]);
});

test("without a bank question, five of Gemini's", () => {
    assert.deepEqual(mergeBankQuestion(written, null), { questions: written, bankQuestionIds: ["", "", "", "", ""] });
});

test("a Gemini question that repeats the bank's isn't asked twice", () => {
    const m = mergeBankQuestion(["Tell me about yourself", "Q2"], { id: "cq1", question: "Tell me about yourself" });
    assert.deepEqual(m.questions, ["Q2", "Tell me about yourself"]);
});

test("an answer finds its bank question by position", () => {
    const { questions, bankQuestionIds } = mergeBankQuestion(written, { id: "cq1", question: "Why us?" });
    assert.equal(bankIdFor(questions, bankQuestionIds, "Why us?"), "cq1");
    assert.equal(bankIdFor(questions, bankQuestionIds, "Q1"), null);
    // Practices from before AIIN-208 have no ids
    assert.equal(bankIdFor(questions, [], "Why us?"), null);
});

test("the grading prompt carries the reference only when there is one", () => {
    const linked = gradingPrompt("Why us?", "Because…", "Frontend", { answer: "Name the product and a reason.", tips: "Be specific" });
    assert.match(linked, /A strong answer, for reference.*Name the product/);
    assert.match(linked, /What interviewers look for: Be specific/);
    assert.match(linked, /judging it against the reference/);
    const plain = gradingPrompt("Q", "A", "Frontend", null);
    assert.doesNotMatch(plain, /reference/);
    // The type sorts the answer into the Question Bank (AIIN-209)
    assert.match(plain, /type .*"HR", "TECHNICAL", "CODING" or "APTITUDE"/);
});
