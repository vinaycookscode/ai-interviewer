import { test } from "node:test";
import assert from "node:assert/strict";
import { canReopen, cleanDrive, driveStatus, fromIstInput, linkExpiry, toIstInput, type DriveInput } from "./drives.ts";

const now = new Date("2026-11-13T06:00:00Z"); // 11:30 am IST
const base: DriveInput = {
    jobId: "job1",
    name: "Campus 2026 · Pune",
    opensAt: "2026-11-18T09:00",
    closesAt: "2026-11-22T18:00",
    colleges: [{ name: "Deccan Institute of Technology", city: "Pune", placementOfficerEmail: "Placement@DIT.edu.in" }, { name: "Sahyadri College" }],
    autoShortlist: false,
    interviewCutoff: "",
    draft: false,
};

test("India-time inputs round-trip", () => {
    const d = fromIstInput("2026-11-18T09:00")!;
    assert.equal(d.toISOString(), "2026-11-18T03:30:00.000Z");
    assert.equal(toIstInput(d), "2026-11-18T09:00");
    assert.equal(fromIstInput("18/11/2026"), undefined);
    assert.equal(toIstInput(null), "");
});

test("AC5: status follows the dates", () => {
    const d = { draft: false, opensAt: fromIstInput("2026-11-18T09:00")!, closesAt: fromIstInput("2026-11-22T18:00")!, closedAt: null };
    assert.equal(driveStatus(d, now), "SCHEDULED");
    assert.equal(driveStatus(d, new Date("2026-11-19T00:00:00Z")), "LIVE");
    assert.equal(driveStatus(d, new Date("2026-11-23T00:00:00Z")), "CLOSED");
    assert.equal(driveStatus({ ...d, closedAt: new Date("2026-11-19T00:00:00Z") }, new Date("2026-11-19T01:00:00Z")), "CLOSED");
    assert.equal(driveStatus({ ...d, draft: true }, now), "DRAFT");
    assert.equal(driveStatus({ ...d, opensAt: null }, now), "DRAFT");
});

test("AC6/AC7: links expire when the drive closes; reopening is allowed for a week", () => {
    const closesAt = fromIstInput("2026-11-22T18:00")!;
    assert.equal(linkExpiry({ closesAt, closedAt: null }), closesAt);
    const early = new Date("2026-11-19T00:00:00Z");
    assert.equal(linkExpiry({ closesAt, closedAt: early }), early);
    assert.ok(canReopen({ closesAt, closedAt: early }, new Date("2026-11-20T00:00:00Z")));
    assert.ok(!canReopen({ closesAt, closedAt: early }, new Date("2026-11-23T00:00:00Z")), "closing time passed");
    assert.ok(!canReopen({ closesAt: new Date("2026-12-30T00:00:00Z"), closedAt: early }, new Date("2026-11-27T00:00:00Z")), "over a week");
});

test("AC1: a valid drive is cleaned", () => {
    const r = cleanDrive(base, { now });
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.equal(r.value.colleges.length, 2);
    assert.equal(r.value.colleges[0].placementOfficerEmail, "placement@dit.edu.in");
    assert.equal(r.value.colleges[1].city, null);
    assert.equal(r.value.opensAt?.toISOString(), "2026-11-18T03:30:00.000Z");
});

test("AC3: closing before opening, or opening in the past, is refused", () => {
    const a = cleanDrive({ ...base, closesAt: "2026-11-16T18:00" }, { now });
    assert.deepEqual(!a.ok && a.errors, { closesAt: "beforeOpen" });
    const b = cleanDrive({ ...base, opensAt: "2026-11-10T09:00" }, { now });
    assert.deepEqual(!b.ok && b.errors, { opensAt: "inPast" });
    // An existing drive that has already opened keeps its opening time
    const c = cleanDrive({ ...base, opensAt: "2026-11-10T09:00" }, { now, existingOpensAt: fromIstInput("2026-11-10T09:00") });
    assert.ok(c.ok);
});

test("drafts need only a job and a name; saving needs dates", () => {
    assert.ok(cleanDrive({ ...base, opensAt: "", closesAt: "", draft: true }, { now }).ok);
    const r = cleanDrive({ ...base, opensAt: "", closesAt: "" }, { now });
    assert.deepEqual(!r.ok && r.errors, { opensAt: "required", closesAt: "required" });
    const n = cleanDrive({ ...base, name: "  " }, { now });
    assert.deepEqual(!n.ok && n.errors, { name: "required" });
});

test("AC4: auto-shortlist needs a cutoff between 0 and 10", () => {
    assert.deepEqual(cleanDrive({ ...base, autoShortlist: true }, { now }).ok, false);
    const r = cleanDrive({ ...base, autoShortlist: true, interviewCutoff: "11" }, { now });
    assert.deepEqual(!r.ok && r.errors, { interviewCutoff: "range" });
    const ok = cleanDrive({ ...base, autoShortlist: true, interviewCutoff: "7.04" }, { now });
    assert.equal(ok.ok && ok.value.interviewCutoff, 7);
});

test("colleges: a name is required and emails are checked", () => {
    const r = cleanDrive({ ...base, colleges: [{ name: "X", placementOfficerEmail: "not an email" }] }, { now });
    assert.deepEqual(!r.ok && r.errors, { colleges: "invalid" });
    const e = cleanDrive({ ...base, colleges: [{ name: " " }] }, { now });
    assert.deepEqual(!e.ok && e.errors, { colleges: "required" });
});
