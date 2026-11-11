import { test } from "node:test";
import assert from "node:assert/strict";
import { bankKey, bankType, guessType, modelAnswerPrompt, parseNewQuestion } from "./items.ts";

test("an added question is its own item", () => {
    assert.equal(bankKey({ selfId: "abc" }), "self:abc");
});

test("an added question is trimmed, with empty extras dropped", () => {
    const r = parseNewQuestion({ question: "  Walk me through a project where requirements changed late. ", company: " ", type: "HR", notes: "", writeAnswer: true });
    assert.deepEqual(r, { ok: true, value: { question: "Walk me through a project where requirements changed late.", company: null, type: "HR", notes: null, writeAnswer: true } });
});

test("an added question is refused field by field", () => {
    assert.deepEqual(parseNewQuestion({ question: "Why?", type: "HR" }), { ok: false, field: "question" });
    assert.deepEqual(parseNewQuestion({ question: "x".repeat(501), type: "HR" }), { ok: false, field: "question" });
    assert.deepEqual(parseNewQuestion({ question: "Tell me about yourself", company: "c".repeat(101), type: "HR" }), { ok: false, field: "company" });
    assert.deepEqual(parseNewQuestion({ question: "Tell me about yourself", type: "SYSTEM_DESIGN" }), { ok: false, field: "type" });
    assert.deepEqual(parseNewQuestion({ question: "Tell me about yourself", type: "HR", notes: "n".repeat(2001) }), { ok: false, field: "notes" });
    assert.deepEqual(parseNewQuestion(null), { ok: false, field: "question" });
    // Only a real true asks for an answer
    const r = parseNewQuestion({ question: "Tell me about yourself", type: "HR", writeAnswer: "yes" });
    assert.ok(r.ok && r.value.writeAnswer === false);
});

test("the model answer prompt fits the type and names the company when known", () => {
    const coding = modelAnswerPrompt({ question: "Reverse a linked list", type: "CODING", company: "TCS" });
    assert.match(coding, /real TCS interview/);
    assert.match(coding, /time and space complexity/);
    assert.doesNotMatch(modelAnswerPrompt({ question: "Why us?", type: "HR", company: null }), /null/);
});

test("a Company prep question has one key however it arrives", () => {
    assert.equal(bankKey({ companyQuestionId: "cq1" }), "cq:cq1");
    // Practised as the bank question of a mock: same item as the saved one
    assert.equal(bankKey({ companyQuestionId: "cq1", mockAnswerId: "ma9" }), "cq:cq1");
});

test("a question Gemini wrote is keyed by its answer", () => {
    assert.equal(bankKey({ mockAnswerId: "ma9" }), "mock:ma9");
    assert.throws(() => bankKey({}));
});

test("Company prep and grader types map onto the bank's four", () => {
    assert.equal(bankType("CODING", "Two Sum"), "CODING");
    assert.equal(bankType("aptitude", "x"), "APTITUDE");
    assert.equal(bankType("GD", "Is AI good for jobs?"), "HR");
    assert.equal(bankType(" technical ", "x"), "TECHNICAL");
});

test("without a usable type, the wording decides", () => {
    assert.equal(bankType(undefined, "Tell me about a time you disagreed with a teammate."), "HR");
    assert.equal(bankType("SOMETHING", "Why do you want to join us?"), "HR");
    assert.equal(guessType("How would you make a slow React page fast?"), "TECHNICAL");
    assert.equal(guessType("  Where do you see yourself in 5 years?"), "HR");
});
