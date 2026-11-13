import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSummaries, summaryPending, summaryPrompt } from "./interview-summary.ts";

test("the prompt carries every answer, its score and the language", () => {
    const p = summaryPrompt({
        job: "Frontend Engineer",
        language: "hi",
        answers: [
            { question: "Make a page faster", transcript: "I measured first", score: 9, feedback: "Good" },
            { question: "A disagreement", transcript: "It was fine", score: null, feedback: null },
        ],
    });
    assert.match(p, /Frontend Engineer/);
    assert.match(p, /Question 2: A disagreement/);
    assert.match(p, /Score: 9\/10/);
    assert.match(p, /not scored/);
    assert.match(p, /in Hindi/);
});

test("summaries are read from fenced or bare JSON, and refused when incomplete", () => {
    const r = parseSummaries('```json\n{"candidate": " You  measured first. ", "employer": "They measured first."}\n```');
    assert.deepEqual(r, { candidate: "You measured first.", employer: "They measured first." });
    assert.equal(parseSummaries('{"candidate": "Only one"}'), null);
    assert.equal(parseSummaries("not json"), null);
    assert.equal(parseSummaries(`{"candidate": "${"x".repeat(900)}", "employer": "y"}`)?.candidate.length, 600);
});

test("a summary counts as on its way for 15 minutes after scoring", () => {
    const now = new Date("2026-11-13T10:00:00Z");
    assert.equal(summaryPending(null, true, new Date("2026-11-13T09:50:00Z"), now), true);
    assert.equal(summaryPending(null, true, new Date("2026-11-13T09:40:00Z"), now), false);
    assert.equal(summaryPending("done", true, new Date("2026-11-13T09:55:00Z"), now), false);
    assert.equal(summaryPending(null, false, new Date("2026-11-13T09:55:00Z"), now), false);
});
