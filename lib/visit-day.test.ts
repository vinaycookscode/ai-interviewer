import { test } from "node:test";
import assert from "node:assert/strict";
import { istDate, istDayStart } from "./visit-day.ts";

test("visits count towards the day in India, not UTC", () => {
    // 1 am IST on 14 Nov is still 13 Nov in UTC
    const lateNight = new Date("2026-11-13T19:30:00Z");
    assert.equal(istDate(lateNight), "2026-11-14");
    assert.equal(istDayStart(lateNight).toISOString(), "2026-11-13T18:30:00.000Z");
    // 11 pm IST on 13 Nov
    assert.equal(istDate(new Date("2026-11-13T17:30:00Z")), "2026-11-13");
});
