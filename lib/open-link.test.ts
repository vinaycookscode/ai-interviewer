import { test } from "node:test";
import assert from "node:assert/strict";
import { SLUG, cleanDomains, emailAllowed, joinState, newSlug } from "./open-link.ts";

const base = { on: true, status: "LIVE" as const, inDrive: false, role: "CANDIDATE", email: "asha@coep.ac.in", domains: ["coep.ac.in"], cap: 300, joined: 10 };

test("slugs look like k7p2-nq9x and differ", () => {
    const a = newSlug(), b = newSlug();
    assert.match(a, SLUG);
    assert.notEqual(a, b);
});

test("domains are cleaned, and emails checked against them (AC2)", () => {
    assert.deepEqual(cleanDomains(" dit.edu.in, @Sahyadri.ac.in ;dit.edu.in"), ["dit.edu.in", "sahyadri.ac.in"]);
    assert.deepEqual(cleanDomains(""), []);
    assert.equal(cleanDomains("not a domain"), undefined);
    assert.ok(emailAllowed("a@coep.ac.in", ["coep.ac.in"]));
    assert.ok(emailAllowed("a@cs.coep.ac.in", ["coep.ac.in"]), "subdomains count");
    assert.ok(!emailAllowed("a@gmail.com", ["coep.ac.in"]));
    assert.ok(!emailAllowed("a@notcoep.ac.in", ["coep.ac.in"]));
    assert.ok(emailAllowed("a@gmail.com", []));
});

test("what the link does", () => {
    assert.equal(joinState(base), "OPEN");
    assert.equal(joinState({ ...base, email: "a@gmail.com" }), "DOMAIN", "AC2");
    assert.equal(joinState({ ...base, joined: 300 }), "FULL", "AC3");
    assert.equal(joinState({ ...base, status: "SCHEDULED" }), "SCHEDULED", "AC4");
    assert.equal(joinState({ ...base, status: "CLOSED" }), "CLOSED", "AC4");
    assert.equal(joinState({ ...base, inDrive: true, joined: 300 }), "CONTINUE", "AC5: already in carries on even when full");
    assert.equal(joinState({ ...base, role: "EMPLOYER" }), "STAFF", "AC7");
    assert.equal(joinState({ ...base, on: false }), "OFF");
    assert.equal(joinState({ ...base, role: null, email: null }), "OPEN", "signed out: shown the landing");
});
