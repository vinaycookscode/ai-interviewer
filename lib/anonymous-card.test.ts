import { test } from "node:test";
import assert from "node:assert/strict";
import { anonymousCard, candidateCode, practiceScore } from "./anonymous-card.ts";

const facts = {
    skills: [{ name: "React", years: 2.5 }, { name: "TypeScript", years: 2 }, { name: "Accessibility", years: null }, { name: "Jest", years: null }, { name: "Git", years: null }, { name: "Redux", years: null }],
    experience: [{ title: "Frontend Engineer", company: "Razorpay", from: "Jun 2022", to: "Present" }],
    education: [{ degree: "B.E. Computer Engineering", institution: "COEP", year: 2022 }],
    totalYears: 2.5,
    city: "Pune",
};

test("the card carries no name, contact, employer or college", () => {
    const c = anonymousCard({ userId: "u-123", facts, primaryRole: "Frontend Developer", noticeDays: 30, practiceScores: [8, 8.4, null] });
    assert.deepEqual(c, { code: candidateCode("u-123"), role: "Frontend Engineer", years: 2.5, skills: ["React", "TypeScript", "Accessibility", "Jest", "Git"], city: "Pune", noticeDays: 30, practiceScore: 8.2, degree: "B.E. Computer Engineering · 2022" });
    assert.ok(!JSON.stringify(c).includes("Razorpay") && !JSON.stringify(c).includes("COEP"));
});

test("codes are stable and short, and practice scores average the latest five", () => {
    assert.equal(candidateCode("abc"), candidateCode("abc"));
    assert.match(candidateCode("abc"), /^Candidate [0-9A-F]{4}$/);
    assert.notEqual(candidateCode("abc"), candidateCode("abd"));
    assert.equal(practiceScore([]), null);
    assert.equal(practiceScore([10, 0, 5, 5, 5, 1]), 5);
});
