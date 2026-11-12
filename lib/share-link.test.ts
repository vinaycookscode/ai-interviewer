import { test } from "node:test";
import assert from "node:assert/strict";
import { hashShareToken, looksLikeShareToken, newShareToken, shareExpiry, shareState } from "./share-link.ts";

test("AC1: tokens carry 256 random bits and only the hash is kept", () => {
    const a = newShareToken();
    const b = newShareToken();
    assert.notEqual(a, b);
    assert.equal(Buffer.from(a, "base64url").length, 32);
    assert.ok(looksLikeShareToken(a));
    const hash = hashShareToken(a);
    assert.match(hash, /^[0-9a-f]{64}$/);
    assert.notEqual(hash, a);
    assert.equal(hashShareToken(a), hash);
});

test("tampered or malformed tokens are rejected before any lookup", () => {
    const t = newShareToken();
    assert.ok(!looksLikeShareToken(t.slice(1)));
    assert.ok(!looksLikeShareToken(`${t.slice(0, -1)}!`));
    assert.ok(!looksLikeShareToken(""));
});

test("AC4, AC5: turned off and expired links, turned off first", () => {
    const now = new Date("2026-11-12T10:00:00Z");
    assert.equal(shareState({ expiresAt: shareExpiry(7, now), revokedAt: null }, now), "valid");
    assert.equal(shareState({ expiresAt: new Date("2026-11-12T09:59:59Z"), revokedAt: null }, now), "expired");
    assert.equal(shareState({ expiresAt: new Date("2026-11-01T00:00:00Z"), revokedAt: now }, now), "revoked");
    assert.equal(shareExpiry(1, now).toISOString(), "2026-11-13T10:00:00.000Z");
});
