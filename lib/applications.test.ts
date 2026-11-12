import { test } from "node:test";
import assert from "node:assert/strict";
import { canMove, candidateStage, cleanNote, nextStage, stageFromDecision } from "./applications.ts";

test("forward steps for the coral button", () => {
    assert.equal(nextStage("APPLIED"), "SCREENING");
    assert.equal(nextStage("INTERVIEW"), "OFFER");
    assert.equal(nextStage("HIRED"), null);
    assert.equal(nextStage("REJECTED"), null);
});

test("employers move applications, but never invited, withdrawn or declined ones, and never to those", () => {
    assert.ok(canMove("APPLIED", "REJECTED"));
    assert.ok(canMove("REJECTED", "SCREENING")); // reopen
    assert.ok(!canMove("INVITED", "SCREENING"));
    assert.ok(!canMove("WITHDRAWN", "APPLIED"));
    assert.ok(!canMove("APPLIED", "WITHDRAWN"));
    assert.ok(!canMove("OFFER", "OFFER"));
});

test("the interview decision moves the application, which holds the outcome", () => {
    assert.equal(stageFromDecision("SHORTLISTED", "APPLIED"), "SCREENING");
    assert.equal(stageFromDecision("SHORTLISTED", "INTERVIEW"), null); // already further on
    assert.equal(stageFromDecision("REJECTED", "INTERVIEW"), "REJECTED");
    assert.equal(stageFromDecision("ON_HOLD", "APPLIED"), null);
    assert.equal(stageFromDecision("REJECTED", "HIRED"), null); // closed stays closed
});

test("AC2: the candidate sees 'Not selected', and notes are bounded", () => {
    assert.equal(candidateStage("REJECTED"), "Not selected");
    assert.equal(cleanNote("  called, 30 days notice  "), "called, 30 days notice");
    assert.equal(cleanNote(""), null);
    assert.equal(cleanNote("x".repeat(1001)), undefined);
    assert.equal(cleanNote(42), undefined);
});
