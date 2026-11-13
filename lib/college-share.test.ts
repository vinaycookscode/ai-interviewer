import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanEmail, defaultExpiry, inFilter, istDay, officerStage, pickedExpiry } from "./college-share.ts";

test("stages map to what an officer may see", () => {
    assert.equal(officerStage("INVITED"), "NOT_STARTED");
    assert.equal(officerStage("OPENED"), "NOT_STARTED");
    assert.equal(officerStage("APTITUDE_STARTED"), "STARTED");
    assert.equal(officerStage("APTITUDE_PASSED"), "STARTED");
    assert.equal(officerStage("INTERVIEW_STARTED"), "STARTED");
    assert.equal(officerStage("APTITUDE_FAILED"), "APTITUDE_FAILED");
    assert.equal(officerStage("INTERVIEW_FINISHED"), "FINISHED");
    assert.ok(inFilter("APTITUDE_FAILED", "STARTED"));
    assert.ok(!inFilter("FINISHED", "STARTED"));
    assert.ok(inFilter("FINISHED", null));
});

test("links last two weeks past the close by default, and at most 60 days", () => {
    const now = new Date("2026-11-13T06:00:00Z");
    const closes = new Date("2026-11-22T12:30:00Z");
    assert.equal(istDay(defaultExpiry(closes, now)), "2026-12-06");
    assert.equal(istDay(defaultExpiry(null, now)), "2026-11-27");
    assert.equal(istDay(defaultExpiry(new Date("2026-11-01T00:00:00Z"), now)), "2026-11-27");
    assert.equal(pickedExpiry("2026-12-06", closes, now)?.toISOString(), "2026-12-06T18:29:59.000Z");
    assert.equal(pickedExpiry("2026-11-12", closes, now), null);
    assert.equal(pickedExpiry("2027-02-01", closes, now), null);
    assert.equal(pickedExpiry("6 Dec", closes, now), null);
});

test("emails are checked and lower-cased", () => {
    assert.equal(cleanEmail(" Placement@DIT.edu.in "), "placement@dit.edu.in");
    assert.equal(cleanEmail("nope"), null);
    assert.equal(cleanEmail(42), null);
});

test("the officer email escapes and carries the link", async () => {
    const { officerEmail, renderQueued } = await import("./drive-email.ts");
    const p = { company: "A & B", drive: "Campus", job: "SDE", college: "<DIT>", expiresAt: "2026-12-06T18:29:59Z", link: "https://x.test/share/college/t" };
    const m = officerEmail(p);
    assert.equal(m.subject, "<DIT> students: SDE at A & B");
    assert.ok(m.html.includes("&lt;DIT&gt;") && !m.html.includes("<DIT>"));
    assert.ok(m.text.includes(p.link) && m.text.includes("6 December 2026"));
    assert.equal(renderQueued("COLLEGE_SHARE", {}), null);
    assert.ok(renderQueued("COLLEGE_SHARE", p));
});
