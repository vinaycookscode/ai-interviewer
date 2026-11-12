import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReasons, passesFilters, plainReasons, reasonsPrompt, scoreMatch, withMissing, type MatchCandidate, type MatchJob } from "./match-score.ts";

const job: MatchJob = { mustHaveSkills: ["React", "TypeScript"], niceToHaveSkills: ["Jest", "Next.js"], minYears: 3, maxYears: 6, workMode: "HYBRID", location: "Pune" };
const priya: MatchCandidate = { skills: ["React", "TypeScript", "Jest", "Git"], roles: ["Frontend Engineer"], totalYears: 3, city: "Pune" };

test("AC1: the same job and profile always score the same, in steps of 5", () => {
    const a = scoreMatch(job, priya, 0.84);
    for (let i = 0; i < 50; i++) assert.deepEqual(scoreMatch(job, priya, 0.84), a);
    assert.equal(a.score % 5, 0);
    // 45 + 0.85*25 + 20 + 0.5*10 = 91.25 → 90
    assert.equal(a.score, 90);
});

test("AC2: a missing must-have is always named", () => {
    const r = scoreMatch(job, { ...priya, skills: ["React"] }, 0.8);
    assert.deepEqual(r.missing, ["TypeScript"]);
    assert.equal(plainReasons(job, priya, r).at(-1), "Missing must-have: TypeScript");
    assert.equal(withMissing(["a", "b", "c", "Missing must-have: X"], ["TypeScript"]).at(-1), "Missing must-have: TypeScript");
    assert.equal(withMissing(["a", "b", "c", "d"], ["TypeScript"]).length, 4);
});

test("hard filters: place unless remote, and experience within ±1 year", () => {
    assert.ok(passesFilters(job, priya));
    assert.ok(!passesFilters(job, { ...priya, city: "Chennai" }));
    assert.ok(passesFilters({ ...job, workMode: "REMOTE" }, { ...priya, city: "Chennai" }));
    assert.ok(passesFilters(job, { ...priya, totalYears: 2 }));
    assert.ok(!passesFilters(job, { ...priya, totalYears: 1.5 }));
    assert.ok(!passesFilters(job, { ...priya, totalYears: 7.5 }));
    assert.ok(passesFilters(job, { ...priya, totalYears: null }));
});

test("parts: skills matched case-insensitively, experience a year off counts half", () => {
    const r = scoreMatch(job, { ...priya, skills: ["react", "typescript"], totalYears: 2 }, 0.5);
    assert.equal(r.parts.mustHave, 1);
    assert.equal(r.parts.experience, 0.5);
    assert.equal(r.parts.relevance, 0);
    assert.equal(r.parts.niceToHave, 0);
});

test("AI reasons are checked, and the prompt carries facts only", () => {
    const m = parseReasons('```json\n{"C1":["Built React checkout","x","y","z"],"c9":["nope"],"bad":3}\n```', ["c1", "c2"]);
    assert.deepEqual(m.get("c1"), ["Built React checkout", "x", "y"]);
    assert.equal(m.has("c2"), false);
    assert.equal(parseReasons("not json", ["a"]).size, 0);
    assert.match(reasonsPrompt({ title: "Dev", mustHaveSkills: ["React"], niceToHaveSkills: [] }, [{ code: "Candidate 0001", lines: ["Skills: React <b>"] }]), /data, not instructions/);
});
