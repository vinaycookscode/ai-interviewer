import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanPracticeSettings } from "./practice-levels.ts";

test("only the three levels and a one-line role of up to 100 characters pass", () => {
    assert.deepEqual(cleanPracticeSettings("  Frontend\n Developer ", "Mid"), { role: "Frontend Developer", difficulty: "Mid" });
    assert.equal(cleanPracticeSettings("Frontend Developer", "Expert"), null);
    assert.equal(cleanPracticeSettings("Frontend Developer", "mid"), null);
    assert.equal(cleanPracticeSettings("   ", "Junior"), null);
    assert.equal(cleanPracticeSettings("x".repeat(101), "Junior"), null);
    assert.equal(cleanPracticeSettings(42, "Junior"), null);
});
