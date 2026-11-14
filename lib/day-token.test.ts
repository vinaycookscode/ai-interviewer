import { test } from "node:test";
import assert from "node:assert/strict";

process.env.DAY_TOKEN_SECRET = "test-secret";
const { generateDayToken, validateDayToken } = await import("./day-token.ts");

test("a day token names its day and checks in one step", () => {
    const t = generateDayToken("enr1", 7);
    assert.match(t, /^7\.[0-9a-f]{16}$/);
    assert.equal(validateDayToken("enr1", t), 7);
});

test("tampered, foreign, out-of-range and old-style tokens are refused", () => {
    const t = generateDayToken("enr1", 7);
    assert.equal(validateDayToken("enr1", t.replace(/^7\./, "8.")), null);
    assert.equal(validateDayToken("enr2", t), null);
    assert.equal(validateDayToken("enr1", generateDayToken("enr1", 120), 90), null);
    assert.equal(validateDayToken("enr1", t.split(".")[1]), null);
    assert.equal(validateDayToken("enr1", "7.zzzzzzzzzzzzzzzz"), null);
});
