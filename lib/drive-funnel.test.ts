import { test } from "node:test";
import assert from "node:assert/strict";
import { funnelStages, totals } from "./drive-funnel.ts";

test("AC1: counts and percents of invited", () => {
    const c = { invited: 500, opened: 410, aptitudePassed: 0, started: 300, finished: 280, scored: 270, aboveCutoff: 90, shortlisted: 60 };
    const s = funnelStages(c, { aptitude: false, cutoff: true });
    assert.deepEqual(s.map((x) => x.key), ["invited", "opened", "started", "finished", "scored", "aboveCutoff", "shortlisted"]);
    assert.deepEqual(s.map((x) => x.percent), [100, 82, 60, 56, 54, 18, 12]);
    assert.equal(funnelStages(c, { aptitude: true, cutoff: false }).some((x) => x.key === "aboveCutoff"), false);
    assert.equal(funnelStages({ ...c, invited: 0 }, { aptitude: false, cutoff: false })[0].percent, 0);
});

test("AC2: colleges add up to the drive", () => {
    const a = { invited: 300, opened: 250, aptitudePassed: 0, started: 186, finished: 174, scored: 168, aboveCutoff: 58, shortlisted: 40 };
    const b = { invited: 200, opened: 160, aptitudePassed: 0, started: 114, finished: 106, scored: 102, aboveCutoff: 32, shortlisted: 20 };
    assert.deepEqual(totals([a, b]), { invited: 500, opened: 410, aptitudePassed: 0, started: 300, finished: 280, scored: 270, aboveCutoff: 90, shortlisted: 60 });
});
