import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanMeetingLink, roundIcs, validStart } from "./rounds.ts";

const now = new Date("2026-11-12T10:00:00Z");

test("meeting links are https only", () => {
    assert.equal(cleanMeetingLink(" https://meet.google.com/abc-defg-hij "), "https://meet.google.com/abc-defg-hij");
    assert.equal(cleanMeetingLink("http://meet.example"), undefined);
    assert.equal(cleanMeetingLink("javascript:alert(1)"), undefined);
    assert.equal(cleanMeetingLink("not a link"), undefined);
});

test("start times: future, within a year", () => {
    assert.ok(validStart("2026-11-14T05:30:00Z", now));
    assert.equal(validStart("2026-11-01T05:30:00Z", now), undefined);
    assert.equal(validStart("2028-01-01T00:00:00Z", now), undefined);
    assert.equal(validStart("soon", now), undefined);
});

test("AC2: the calendar invite carries the time and the link, and can be replaced or cancelled", () => {
    const base = {
        uid: "r1",
        sequence: 0,
        title: "Technical round: Senior Frontend Engineer, Infosys",
        description: "With Arjun",
        start: new Date("2026-11-14T05:30:00Z"),
        minutes: 45,
        link: "https://meet.google.com/abc-defg-hij",
        now,
        organizer: "noreply@getbacktou.com",
        attendee: "asha@example.com",
    };
    const ics = roundIcs(base);
    assert.match(ics, /METHOD:REQUEST/);
    assert.match(ics.replace(/\r\n /g, ""), /ATTENDEE;[^\r]*:mailto:asha@example\.com/);
    assert.match(ics, /DTSTART:20261114T053000Z/);
    assert.match(ics, /DTEND:20261114T061500Z/);
    assert.match(ics, /SUMMARY:Technical round: Senior Frontend Engineer\\, Infosys/);
    assert.match(ics.replace(/\r\n /g, ""), /LOCATION:https:\/\/meet\.google\.com\/abc-defg-hij/);
    assert.ok(
        ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75),
        "lines are folded",
    );
    const cancel = roundIcs({ ...base, sequence: 2, cancelled: true });
    assert.match(cancel, /METHOD:CANCEL/);
    assert.match(cancel, /SEQUENCE:2/);
    assert.match(cancel, /STATUS:CANCELLED/);
});

test("the email says when and where, and a cancellation leaves the link out", async () => {
    const { roundEmail } = await import("./rounds.ts");
    const base = {
        name: "Asha Rao",
        round: "Technical round",
        job: "Frontend Engineer",
        company: "Infosys",
        start: new Date("2026-11-14T05:30:00Z"),
        minutes: 45,
        interviewer: "Arjun",
        link: "https://meet.google.com/abc",
        appUrl: "https://getbacktou.com",
    };
    const s = roundEmail({ ...base, kind: "scheduled" });
    assert.equal(s.subject, "Technical round scheduled: Frontend Engineer at Infosys");
    assert.match(s.text, /Saturday, 14 November.*11:00\s?am IST/);
    assert.match(s.text, /Join: https:\/\/meet\.google\.com\/abc/);
    assert.match(s.text, /^Hi Asha,/);
    const c = roundEmail({ ...base, kind: "cancelled" });
    assert.match(c.subject, /^Cancelled: /);
    assert.doesNotMatch(c.text + c.html, /meet\.google/);
    assert.match(roundEmail({ ...base, kind: "moved" }).subject, /^New time: /);
    assert.doesNotMatch(roundEmail({ ...base, name: "<b>x</b>", kind: "scheduled" }).html, /<b>x/);
});
