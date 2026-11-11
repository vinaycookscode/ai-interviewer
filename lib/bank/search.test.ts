import { test } from "node:test";
import assert from "node:assert/strict";
import { bankQuery, keywordMatch, meaningMatches, mergeResults, parseBankFilters } from "./search.ts";

test("filters come from the URL, and unknown values are dropped", () => {
    const f = parseBankFilters({ q: " caching ", source: "COMPANY_PREP", type: "HR", company: "Infosys", status: "nope" });
    assert.deepEqual(f, { q: "caching", source: "COMPANY_PREP", type: "HR", company: "Infosys", status: null });
    assert.deepEqual(parseBankFilters({ source: ["MOCK", "X"], type: "SYSTEM" }), { q: "", source: "MOCK", type: null, company: null, status: null });
});

test("filters go back into the URL, empty ones left out", () => {
    const f = parseBankFilters({ q: "react hooks", type: "TECHNICAL" });
    assert.equal(bankQuery(f), "?q=react+hooks&type=TECHNICAL");
    assert.equal(bankQuery(f, { status: "NEW", q: "" }), "?type=TECHNICAL&status=NEW");
    assert.equal(bankQuery(parseBankFilters({})), "");
});

test("a keyword matches the question, company, topic or tags, ignoring case", () => {
    const item = { questionText: "Design a cache for a feed", companyName: "Swiggy", topic: "Backend Developer", tags: ["system-design"] };
    assert.ok(keywordMatch(item, "CACHE"));
    assert.ok(keywordMatch(item, "swiggy"));
    assert.ok(keywordMatch(item, "backend"));
    assert.ok(keywordMatch(item, "system-design"));
    assert.ok(!keywordMatch(item, "redis"));
});

// Similarities from gemini-embedding-001 for the query "caching" (measured 2026-11-11)
const caching = [
    { id: "cache", similarity: 0.697 },
    { id: "memo", similarity: 0.675 },
    { id: "redis", similarity: 0.658 },
    { id: "cdn", similarity: 0.647 },
    { id: "react", similarity: 0.627 },
    { id: "teammate", similarity: 0.547 },
];

test("matches by meaning are the ones close to the best", () => {
    assert.deepEqual(meaningMatches(caching), ["cache", "memo", "redis", "cdn"]);
});

test("nothing matches when even the best is a weak match", () => {
    assert.deepEqual(meaningMatches([{ id: "a", similarity: 0.58 }, { id: "b", similarity: 0.55 }]), []);
    assert.deepEqual(meaningMatches([]), []);
});

test("word matches come first, without repeats", () => {
    assert.deepEqual(mergeResults(["b", "a"], ["a", "c", "b", "d"]), ["b", "a", "c", "d"]);
});
