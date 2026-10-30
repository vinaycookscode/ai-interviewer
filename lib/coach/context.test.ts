import { test } from "node:test";
import assert from "node:assert/strict";
import { buildContext, chatTitle, starterPrompts, systemPrompt, type CoachFacts } from "./context.ts";

const facts: CoachFacts = {
    firstName: "Priya",
    role: "Software Development Engineer",
    skills: ["React", "SQL"],
    goal: "A product company in Bengaluru",
    practice: [
        {
            role: "Software Development Engineer",
            score: 7.2,
            when: "28 Oct",
            strongest: { question: "Explain React hooks", score: 8.6 },
            weakest: { question: "System design: design a rate limiter", score: 5.4 },
        },
    ],
    interviews: [{ score: 6.5, when: "12 Oct" }],
    plan: { name: "SDE placement bootcamp", day: 24, total: 90, todayTopic: "Queues" },
    streak: 6,
    interviewInProgress: false,
};

test("the context carries role, scores with the weakest answer, plan and streak", () => {
    const context = buildContext(facts);
    for (const part of ["Software Development Engineer", "7.2", "weakest answer 5.4", "System design", "day 24 of 90", "Daily streak: 6 days"]) {
        assert.ok(context.includes(part), part);
    }
});

test("no email, phone, documents or other people's data reach Gemini, even if passed in", () => {
    const leaky = {
        ...facts,
        email: "priya@example.com",
        phone: "+91 98765 43210",
        resumeUrl: "https://files.example/resume.pdf",
        panUrl: "https://files.example/pan.pdf",
        otherUsers: [{ name: "Rahul", email: "rahul@example.com" }],
        employer: { company: "Acme Corp", jobTitle: "SDE-1" },
    } as CoachFacts;
    const prompt = systemPrompt(leaky);
    for (const secret of ["@example.com", "98765", "resume.pdf", "pan.pdf", "Rahul", "Acme", "SDE-1"]) {
        assert.ok(!prompt.includes(secret), secret);
    }
});

test("an interview in progress is stated, and the prompt says U won't answer it", () => {
    const prompt = systemPrompt({ ...facts, interviewInProgress: true });
    assert.ok(prompt.includes("An employer interview is in progress"));
    assert.ok(prompt.includes("Never write answers for an interview that's happening now"));
    assert.ok(!systemPrompt(facts).includes("in progress for them"));
});

test("a candidate with nothing yet still gets a usable context", () => {
    const context = buildContext({ firstName: null, role: null, skills: [], goal: null, practice: [], interviews: [], plan: null, streak: 0, interviewInProgress: false });
    assert.ok(context.includes("Career path: not set up yet") && context.includes("No practice interviews yet") && context.includes("Not on a study plan"));
});

test("long text is clipped", () => {
    const context = buildContext({ ...facts, goal: "x".repeat(1000) });
    assert.ok(context.length < 2000);
});

test("a chat's title is the first message on one line, clipped", () => {
    assert.equal(chatTitle("  What should\nI do?  "), "What should I do?");
    assert.equal(chatTitle("a".repeat(100)).length, 60);
});

test("starters fit the candidate: the weakest answer and the plan day", () => {
    assert.deepEqual(starterPrompts(facts), [
        "What should I work on this week?",
        'How do I answer "System design: design a rate limiter" better?',
        "How do I make the most of day 24 of my plan?",
    ]);
});
