import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanInviteMessage, inviteExpiry, inviteOpen, invitesLeft, istMonthStart, revealsCandidate } from "./invitations.ts";

test("the allowance resets at the start of the IST month", () => {
    // 1 Dec 00:10 IST is still 30 Nov in UTC
    assert.equal(istMonthStart(new Date("2026-11-30T18:40:00Z")).toISOString(), "2026-11-30T18:30:00.000Z");
    assert.equal(istMonthStart(new Date("2026-11-12T10:00:00Z")).toISOString(), "2026-10-31T18:30:00.000Z");
});

test("AC3: what's left, and unlimited", () => {
    assert.equal(invitesLeft(10, 6), 4);
    assert.equal(invitesLeft(10, 12), 0);
    assert.equal(invitesLeft(-1, 999), null);
});

test("invitations lapse after 14 days", () => {
    const now = new Date("2026-11-12T10:00:00Z");
    const exp = inviteExpiry(now);
    assert.equal(exp.toISOString(), "2026-11-26T10:00:00.000Z");
    assert.ok(inviteOpen({ stage: "INVITED", inviteExpiresAt: exp }, now));
    assert.ok(!inviteOpen({ stage: "INVITED", inviteExpiresAt: exp }, new Date("2026-11-27T00:00:00Z")));
    assert.ok(!inviteOpen({ stage: "APPLIED", inviteExpiresAt: exp }, now));
});

test("AC1, AC2: who's revealed, and messages", () => {
    assert.ok(!revealsCandidate("INVITED") && !revealsCandidate("DECLINED") && revealsCandidate("APPLIED"));
    assert.equal(cleanInviteMessage("  Your accessibility   work stood out. "), "Your accessibility work stood out.");
    assert.equal(cleanInviteMessage("see https://evil.example"), undefined);
    assert.equal(cleanInviteMessage("x".repeat(301)), undefined);
    assert.equal(cleanInviteMessage(""), null);
});
