import { test } from "node:test";
import assert from "node:assert/strict";
import { bankKey, bankType, guessType } from "./items.ts";

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
