import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanPhone, parseSearch, searchWhere } from "./job-search.ts";

test("AC1, AC3: React in Pune means open jobs with React, in Pune or remote", () => {
    const w = JSON.stringify(searchWhere(parseSearch({ q: "react", loc: "Pune" }), null));
    assert.match(w, /"status":"OPEN"/);
    assert.match(w, /"archivedAt":null/);
    assert.match(w, /"mustHaveSkills":\{"has":"React"\}/);
    assert.match(w, /"workMode":"REMOTE"/);
});

test("filters are read safely from the URL", () => {
    assert.deepEqual(parseSearch({ q: "  js ", mode: "MARS", pay: "-3", fits: "1" }), { q: "js", location: "", mode: null, minPay: null, fitsYears: true });
    assert.equal(parseSearch({ pay: "12" }).minPay, 12);
});

test("phone numbers to apply with", () => {
    assert.equal(cleanPhone("+91 98765 43210"), "+919876543210");
    assert.equal(cleanPhone(""), undefined); // required (AIIN-204)
    assert.equal(cleanPhone(undefined), undefined);
    assert.equal(cleanPhone("call me"), undefined);
    assert.equal(cleanPhone(42), undefined);
});
