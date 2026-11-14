import { test } from "node:test";
import assert from "node:assert/strict";
import { readStoredAnalysis, reviewLabel } from "./resume-reviews.ts";

test("a review is labelled by its job description's first line", () => {
    assert.equal(reviewLabel("\n\n  Frontend Engineer   at Northwind Labs \nWe build…"), "Frontend Engineer at Northwind Labs");
    assert.equal(reviewLabel("   "), null);
    assert.equal(reviewLabel(undefined), null);
    assert.equal(reviewLabel("x".repeat(100))?.length, 80);
});

test("stored reviews are read back safely", () => {
    const a = readStoredAnalysis({ summary: "Good", strengths: ["React", 3], atsCompatibility: 80 }, 75);
    assert.deepEqual(a.strengths, ["React"]);
    assert.equal(a.score, 75);
    assert.deepEqual(readStoredAnalysis(null, 50).suggestions, []);
    assert.equal("formattingIssues" in readStoredAnalysis({}, 1), false);
});
