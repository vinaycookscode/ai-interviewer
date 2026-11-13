import { test } from "node:test";
import assert from "node:assert/strict";
import { autoDecision } from "./auto-shortlist.ts";

const base = { inDrive: true, enabled: true, cutoff: 7, score: 7, decision: "UNDECIDED" as const, strongConcerns: false };

test("AC1: exactly at the cutoff is shortlisted", () => assert.equal(autoDecision(base)?.to, "SHORTLISTED"));
test("AC2: below the cutoff stays undecided, never rejected", () => assert.equal(autoDecision({ ...base, score: 6.9 }), null));
test("AC3: auto-shortlist off decides nothing", () => assert.equal(autoDecision({ ...base, enabled: false }), null));
test("AC4: a person's decision always wins", () => {
    assert.equal(autoDecision({ ...base, decision: "REJECTED" }), null);
    assert.equal(autoDecision({ ...base, decision: "ON_HOLD" }), null);
});
test("AC6: strong integrity concerns go on hold, with the reason", () => assert.deepEqual(autoDecision({ ...base, score: 9, strongConcerns: true }), { to: "ON_HOLD", note: "Integrity review needed" }));
test("AC7: never for an interview outside a drive", () => assert.equal(autoDecision({ ...base, inDrive: false }), null));
