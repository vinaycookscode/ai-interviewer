// What Ask U, the coach, knows about the candidate, and how it's told (AIIN-100).
// Pure functions (no database, no "@/" imports), tested with `npm test`. The context is built from these facts
// only: never an email, phone, document, another user or an employer's data.

export interface CoachFacts {
    firstName: string | null;
    role: string | null;
    skills: string[];
    goal: string | null;
    /** The last 3 scored practice interviews, newest first. */
    practice: { role: string; score: number; when: string; strongest: AnswerFact | null; weakest: AnswerFact | null }[];
    /** The last 3 scored employer interviews, newest first: the score and date only. */
    interviews: { score: number; when: string }[];
    plan: { name: string; day: number; total: number; todayTopic: string | null } | null;
    streak: number;
    /** An employer interview is open right now: U won't help answer it. */
    interviewInProgress: boolean;
}

export interface AnswerFact {
    question: string;
    score: number;
}

export const MESSAGE_LIMIT = 2000;
/** How many earlier messages go back to Gemini with each question. */
export const HISTORY_LIMIT = 20;
export const TITLE_LENGTH = 60;

const clip = (text: string, length: number) => (text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text);
const score = (n: number) => n.toFixed(1);

/** The candidate's facts as short plain lines for the system prompt. Only the fields named in CoachFacts. */
export function buildContext(facts: CoachFacts): string {
    const lines: string[] = [];
    if (facts.firstName) lines.push(`First name: ${clip(facts.firstName, 40)}`);
    lines.push(facts.role ? `Preparing for: ${facts.role}` : "Career path: not set up yet");
    if (facts.skills.length) lines.push(`Skills they listed: ${facts.skills.slice(0, 30).map((s) => clip(s, 40)).join(", ")}`);
    if (facts.goal) lines.push(`Their goal: ${clip(facts.goal, 300)}`);

    if (facts.practice.length) {
        lines.push("Recent practice interviews (newest first, scores out of 10):");
        for (const p of facts.practice) {
            const parts = [`- ${p.when}, ${clip(p.role, 60)}: ${score(p.score)}`];
            if (p.strongest) parts.push(`strongest answer ${score(p.strongest.score)} on "${clip(p.strongest.question, 160)}"`);
            if (p.weakest) parts.push(`weakest answer ${score(p.weakest.score)} on "${clip(p.weakest.question, 160)}"`);
            lines.push(parts.join("; "));
        }
    } else {
        lines.push("No practice interviews yet.");
    }
    if (facts.interviews.length) {
        lines.push(`Recent employer interviews (scores out of 10): ${facts.interviews.map((i) => `${i.when} ${score(i.score)}`).join(", ")}`);
    }

    lines.push(
        facts.plan
            ? `90-day plan: ${facts.plan.name}, day ${facts.plan.day} of ${facts.plan.total}${facts.plan.todayTopic ? `, today's topic "${clip(facts.plan.todayTopic, 80)}"` : ""}`
            : "Not on a study plan."
    );
    lines.push(`Daily streak: ${facts.streak} ${facts.streak === 1 ? "day" : "days"}`);
    if (facts.interviewInProgress) lines.push("An employer interview is in progress for them right now.");
    return lines.join("\n");
}

/** The system prompt: who U is, what it helps with, and what it won't do. */
export function systemPrompt(facts: CoachFacts): string {
    return `You are U, the career coach in Get Back To U, an interview preparation app for students and early-career engineers in India.

Help with careers, job interviews, placements, resumes, and what to learn or practise next. Politely decline anything else in one sentence and steer back to their preparation.

Be specific to this candidate: use their role, scores, weakest answers, plan day and streak below. When they ask what to work on, start from their weakest scores. Suggest concrete next steps in the app: a practice interview, a day of their plan, the daily challenge, flashcards or company prep.

Never write answers for an interview that's happening now. If they have an interview in progress, or ask you to answer a question they've been given in a live interview or test, say kindly that you can't help during an interview, and offer to help them prepare once it's over.

Keep replies short: a few sentences or a short list, in plain English, using Markdown for lists and bold. Don't invent scores or facts that aren't below. Never ask for or repeat personal details such as email or phone numbers.

What you know about the candidate:
${buildContext(facts)}`;
}

/** A new chat's title: the first message, on one line and clipped. */
export function chatTitle(message: string): string {
    return clip(message.replace(/\s+/g, " ").trim(), TITLE_LENGTH);
}

/** Up to three starter prompts that fit the candidate. */
export function starterPrompts(facts: CoachFacts): string[] {
    const prompts = ["What should I work on this week?"];
    const weakest = facts.practice.map((p) => p.weakest).find((w): w is AnswerFact => !!w);
    if (weakest) prompts.push(`How do I answer "${clip(weakest.question, 60)}" better?`);
    if (facts.plan) prompts.push(`How do I make the most of day ${facts.plan.day} of my plan?`);
    if (facts.role) prompts.push(`How do I prepare for ${facts.role} interviews?`);
    prompts.push("How do I explain my final-year project in an interview?");
    return prompts.slice(0, 3);
}
