import { test } from "node:test";
import assert from "node:assert/strict";
import { driveEmail, readPayload, retryDelayMs } from "./drive-email.ts";

const p = {
    name: "Asha Rao",
    job: "Graduate Engineer Trainee",
    company: "Northwind Labs",
    drive: "Campus 2026 · Pune",
    closesAt: "2026-11-22T12:30:00.000Z",
    link: "https://getbacktou.com/interview/abc?token=xyz",
    questions: 8,
    aptitude: false,
};

test("the invitation says who, what, until when, and links once", () => {
    const m = driveEmail("DRIVE_INVITE", p);
    assert.equal(m.subject, "You're invited: Graduate Engineer Trainee at Northwind Labs");
    assert.match(m.text, /^Hi Asha,/);
    assert.match(m.text, /open until Sunday, 22 November at 6:00\s?pm IST/);
    assert.match(m.text, /about 20 minutes/);
    assert.equal(m.html.split(p.link.replace("&", "&amp;")).length - 1, 1);
});

test("the reminder and the aptitude wording", () => {
    const r = driveEmail("DRIVE_REMINDER", { ...p, aptitude: true });
    assert.equal(r.subject, "Closing soon: Graduate Engineer Trainee at Northwind Labs");
    assert.match(r.text, /haven't started yet/);
    assert.match(r.text, /timed aptitude round/);
});

test("AC8: names and company from a CSV are escaped", () => {
    const m = driveEmail("DRIVE_INVITE", { ...p, name: "<img src=x onerror=alert(1)>", company: "A & B <Labs>" });
    assert.doesNotMatch(m.html, /<img/);
    assert.match(m.html, /A &amp; B &lt;Labs&gt;/);
});

test("payloads from the database are checked", () => {
    assert.deepEqual(readPayload(JSON.parse(JSON.stringify(p))), p);
    assert.equal(readPayload({ ...p, closesAt: "soon" }), null);
    assert.equal(readPayload(null), null);
});

test("AC2: retries back off", () => {
    assert.deepEqual([1, 2, 3, 4].map(retryDelayMs), [60_000, 120_000, 240_000, 480_000]);
});
