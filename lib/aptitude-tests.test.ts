import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanQuestion, cleanSettings, draftPrompt, parseDrafts, parseQuestionCsv } from "./aptitude-tests.ts";

const ids = new Set(["s1"]);
const q = { sectionId: "s1", text: "Two 6 Ω resistors in parallel?", options: ["12 Ω", "3 Ω", "6 Ω", "1.5 Ω"], correctIndex: 1, explanation: "1/R = 1/6 + 1/6", checked: true };

test("settings: a name, 5–180 minutes and distinct sections asking 1–100", () => {
    const ok = cleanSettings({ name: " Electronics  basics ", minutes: "20", shuffle: true, sections: [{ name: "Circuits", askCount: "10" }, { name: "Logical", askCount: "10" }] });
    assert.ok(ok.ok && ok.value.name === "Electronics basics" && ok.value.sections.length === 2);
    const bad = cleanSettings({ name: "", minutes: "2", shuffle: true, sections: [{ name: "A", askCount: "0" }, { name: "a", askCount: "5" }] });
    assert.deepEqual(!bad.ok && bad.errors, { name: "required", minutes: "range", sections: "invalid" });
    assert.deepEqual(cleanSettings({ name: "X", minutes: "20", shuffle: true, sections: [] }).ok, false);
});

test("questions: 2–6 distinct options, one correct, plain text kept as text (AC8)", () => {
    assert.ok(cleanQuestion(q, ids).ok);
    assert.deepEqual(cleanQuestion({ ...q, sectionId: "other" }, ids), { ok: false, error: "section" });
    assert.deepEqual(cleanQuestion({ ...q, options: ["only"] }, ids), { ok: false, error: "options" });
    assert.deepEqual(cleanQuestion({ ...q, options: ["a", "A"] , correctIndex: 0 }, ids), { ok: false, error: "options" });
    assert.deepEqual(cleanQuestion({ ...q, correctIndex: 7 }, ids), { ok: false, error: "correct" });
    assert.deepEqual(cleanQuestion({ ...q, text: "x".repeat(1001) }, ids), { ok: false, error: "tooLong" });
    const html = cleanQuestion({ ...q, text: "<script>alert(1)</script> What is 2+2?" }, ids);
    assert.ok(html.ok && html.value.text.startsWith("<script>"), "stored as typed; React shows it as text");
    // Empty options are dropped and the correct one is kept by value
    const gaps = cleanQuestion({ ...q, options: ["12 Ω", "", "3 Ω", "6 Ω"], correctIndex: 2 }, ids);
    assert.ok(gaps.ok && gaps.value.options[gaps.value.correctIndex] === "3 Ω");
});

test("AC5: a question CSV names each problem by row, and imports unchecked", () => {
    const csv = [
        "Section,Question,Option 1,Option 2,Option 3,Option 4,Correct,Explanation",
        "Circuits,Two 6 Ω resistors in parallel?,12 Ω,3 Ω,6 Ω,1.5 Ω,B,1/R = 1/6 + 1/6",
        "Circuits,No correct answer marked,a,b,c,d,,",
        "Circuits,Only one option,a,,,,1,",
        `Circuits,${"x".repeat(1001)},a,b,,,1,`,
        "Optics,Unknown section,a,b,,,1,",
    ].join("\n");
    const r = parseQuestionCsv(csv, [{ id: "s1", name: "circuits" }]);
    assert.deepEqual(r.rows.map((x) => x.status), ["READY", "NO_CORRECT", "FEW_OPTIONS", "TOO_LONG", "UNKNOWN_SECTION"]);
    assert.equal(r.ready, 1);
    assert.equal(r.rows[0].question?.correctIndex, 1);
    assert.equal(r.rows[0].question?.checked, false);
    assert.equal(r.rows[1].line, 3);
});

test("AI drafts are parsed defensively and capped", () => {
    const reply = 'Here you go:\n{"questions":[{"question":"P = V × I. 12 V at 2 A?","options":["6 W","24 W","14 W","10 W"],"correct":1,"explanation":"12 × 2 = 24"},{"question":"bad","options":["a"],"correct":0},{"question":"out of range","options":["a","b"],"correct":5}]}';
    const d = parseDrafts(reply, 5);
    assert.equal(d.length, 1);
    assert.equal(d[0].options[d[0].correct], "24 W");
    assert.deepEqual(parseDrafts("not json", 5), []);
    assert.match(draftPrompt({ topic: "Ohm's law", section: "Circuits", level: "FRESHER", count: 5 }), /Write 5 questions/);
});
