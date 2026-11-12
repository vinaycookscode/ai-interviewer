// What Talent Match embeds for a job and for a candidate (AIIN-194). Plain module, tested on its own.
// A candidate's text never carries their name, contact details, gender, age, photo, college name or address.
import type { ResumeFacts } from "./resume-facts.ts";

const MODES: Record<string, string> = { ONSITE: "on site", HYBRID: "hybrid", REMOTE: "remote" };

/** A job's confirmed requirements as text. Pay is left out: it isn't about fit. */
export function jobText(job: {
    title: string;
    mustHaveSkills: string[];
    niceToHaveSkills: string[];
    minYears: number | null;
    maxYears: number | null;
    workMode: string | null;
    location: string | null;
}): string {
    const years = job.minYears !== null || job.maxYears !== null ? `Experience: ${job.minYears ?? 0} to ${job.maxYears ?? "any"} years.` : "";
    return [
        `Role: ${job.title}.`,
        job.mustHaveSkills.length ? `Must have: ${job.mustHaveSkills.join(", ")}.` : "",
        job.niceToHaveSkills.length ? `Nice to have: ${job.niceToHaveSkills.join(", ")}.` : "",
        years,
        job.workMode
            ? `Work: ${MODES[job.workMode] ?? job.workMode}${job.location ? `, ${job.location}` : ""}.`
            : job.location
              ? `Location: ${job.location}.`
              : "",
    ]
        .filter(Boolean)
        .join("\n");
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The resume's text with personal details removed (AC3): the candidate's name, emails, phone numbers, links, the
 * lines that state gender, age, date of birth, marital status, nationality, address or a photo, and college names.
 */
export function scrubResume(text: string, known: { name?: string | null; colleges?: string[] }): string {
    // Contact details first, while they're whole
    let s = text
        .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, " ")
        .replace(/(?:\+?\d[\d\s().-]{8,}\d)/g, " ")
        .replace(/\b(?:https?:\/\/|www\.)\S+/gi, " ")
        .replace(/\b(?:linkedin|github)\.com\/\S*/gi, " ");
    const names = [known.name, ...(known.name?.split(/\s+/) ?? [])].filter((n): n is string => !!n && n.length >= 3);
    for (const n of names.sort((a, b) => b.length - a.length)) s = s.replace(new RegExp(`\\b${escape(n)}\\b`, "gi"), " ");
    for (const c of (known.colleges ?? []).filter((c) => c.length >= 3).sort((a, b) => b.length - a.length))
        s = s.replace(new RegExp(escape(c), "gi"), "a college");
    const personal =
        /^\s*(?:gender|sex|age|d\.?o\.?b\.?|date of birth|born|marital status|nationality|religion|father'?s name|mother'?s name|address|permanent address|current address|photo(?:graph)?|pin ?code)\b/i;
    const college = /\b(?:college|university|institute|iit|nit|iiit|bits|vit|polytechnic|vidyalaya|school)\b/i;
    return s
        .split("\n")
        .filter((line) => !personal.test(line))
        .map((line) =>
            college.test(line)
                ? line.replace(/[^,|·–-]*\b(?:college|university|institute|iit|nit|iiit|bits|vit|polytechnic|vidyalaya|school)\b[^,|·–-]*/gi, " a college ")
                : line,
        )
        .map((line) =>
            line
                .replace(/\b(?:male|female|he\/him|she\/her|mr\.?|mrs\.?|ms\.?)\b/gi, " ")
                .replace(/\s{2,}/g, " ")
                .trim(),
        )
        .filter(Boolean)
        .join("\n");
}

/** A candidate's confirmed facts, and their scrubbed resume, as text. Nothing unconfirmed goes in. */
export function profileText(facts: ResumeFacts, resume: string | null, known: { name?: string | null }): string {
    const lines = [
        facts.skills.length ? `Skills: ${facts.skills.map((s) => (s.years !== null ? `${s.name} (${s.years} years)` : s.name)).join(", ")}.` : "",
        facts.totalYears !== null ? `Total experience: ${facts.totalYears} years.` : "",
        ...facts.experience.map((r) => `Worked as ${r.title}${r.company ? ` at ${r.company}` : ""}.`),
        ...facts.education.map((e) => `Studied ${e.degree}${e.year ? ` (${e.year})` : ""}.`),
        facts.city ? `Based in ${facts.city}.` : "",
    ];
    const colleges = facts.education.map((e) => e.institution).filter((c): c is string => !!c);
    const body = resume ? scrubResume(resume, { name: known.name, colleges }).slice(0, 6000) : "";
    return [...lines.filter(Boolean), body ? `Resume:\n${body}` : ""].filter(Boolean).join("\n");
}
