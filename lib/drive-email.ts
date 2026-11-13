// Hiring drive emails (AIIN-167): the invitation and the reminder. Pure, so the outbox renders them at send time and
// tests can check them. Every value from a person or a CSV is escaped (AC8).

export type DriveTemplate = "DRIVE_INVITE" | "DRIVE_REMINDER";
export const DRIVE_TEMPLATES: DriveTemplate[] = ["DRIVE_INVITE", "DRIVE_REMINDER"];

export interface DriveEmailPayload {
    name: string | null;
    job: string;
    company: string;
    drive: string;
    closesAt: string; // ISO
    link: string;
    questions: number;
    aptitude: boolean;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const when = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata", timeZoneName: "short" });

/** A payload read back from the database: anything missing or of the wrong type makes it unusable. */
export function readPayload(v: unknown): DriveEmailPayload | null {
    if (!v || typeof v !== "object") return null;
    const p = v as Record<string, unknown>;
    const str = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : null);
    const job = str("job"), company = str("company"), drive = str("drive"), closesAt = str("closesAt"), link = str("link");
    if (!job || !company || !drive || !closesAt || !link || Number.isNaN(Date.parse(closesAt))) return null;
    return { name: str("name"), job, company, drive, closesAt, link, questions: typeof p.questions === "number" ? p.questions : 0, aptitude: p.aptitude === true };
}

export function driveEmail(template: DriveTemplate, p: DriveEmailPayload): { subject: string; html: string; text: string } {
    const hello = p.name?.trim() ? `Hi ${p.name.trim().split(/\s+/)[0]},` : "Hi,";
    const closes = when.format(new Date(p.closesAt));
    const minutes = Math.max(10, Math.ceil(p.questions * 2.5));
    const steps = p.aptitude
        ? `It starts with a timed aptitude round. If you pass, an AI interview follows straight away (about ${minutes} minutes, spoken answers on camera).`
        : `It's an AI interview: about ${minutes} minutes, spoken answers on camera. Chrome or Edge works best.`;
    const lead =
        template === "DRIVE_REMINDER"
            ? `A reminder: the hiring drive for ${p.job} at ${p.company} closes on ${closes}, and you haven't started yet.`
            : `${p.company} has invited you to its hiring drive for ${p.job} (${p.drive}). It's open until ${closes}.`;
    const subject = template === "DRIVE_REMINDER" ? `Closing soon: ${p.job} at ${p.company}` : `You're invited: ${p.job} at ${p.company}`;
    const cta = template === "DRIVE_REMINDER" ? "Start now" : "Start";
    return {
        subject,
        text: [hello, lead, steps, `${cta}: ${p.link}`, "This link is just for you. Don't share it."].join("\n\n"),
        html:
            `<p>${esc(hello)}</p><p>${esc(lead)}</p><p>${esc(steps)}</p>` +
            `<p><a href="${esc(p.link)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#f28c6b;color:#2a1612;font-weight:700;text-decoration:none">${cta}</a></p>` +
            `<p style="color:#666;font-size:13px">This link is just for you. Don't share it.</p>`,
    };
}

/** The placement officer's link to their college's students (AIIN-173). */
export const OFFICER_TEMPLATE = "COLLEGE_SHARE";

export interface OfficerEmailPayload {
    company: string;
    drive: string;
    job: string;
    college: string;
    expiresAt: string; // ISO
    link: string;
}

const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

export function readOfficerPayload(v: unknown): OfficerEmailPayload | null {
    if (!v || typeof v !== "object") return null;
    const p = v as Record<string, unknown>;
    const keys = ["company", "drive", "job", "college", "expiresAt", "link"] as const;
    if (keys.some((k) => typeof p[k] !== "string" || !p[k]) || Number.isNaN(Date.parse(p.expiresAt as string))) return null;
    return Object.fromEntries(keys.map((k) => [k, p[k]])) as unknown as OfficerEmailPayload;
}

export function officerEmail(p: OfficerEmailPayload): { subject: string; html: string; text: string } {
    const lead = `${p.company} has shared how ${p.college}'s students are doing in its hiring drive for ${p.job} (${p.drive}).`;
    const what = "You'll see each student's name, roll number and how far they got, so you can remind those who haven't started. Scores, answers and feedback are never shown.";
    const until = `The link works until ${day.format(new Date(p.expiresAt))}. Please don't forward it outside your placement office.`;
    return {
        subject: `${p.college} students: ${p.job} at ${p.company}`,
        text: ["Hello,", lead, what, `Open: ${p.link}`, until].join("\n\n"),
        html:
            `<p>Hello,</p><p>${esc(lead)}</p><p>${esc(what)}</p>` +
            `<p><a href="${esc(p.link)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#f28c6b;color:#2a1612;font-weight:700;text-decoration:none">See your students</a></p>` +
            `<p style="color:#666;font-size:13px">${esc(until)}</p>`,
    };
}

/** Any queued email, rendered at send time, or null when its template or payload is unusable. */
export function renderQueued(template: string, payload: unknown): { subject: string; html: string; text: string } | null {
    if (template === OFFICER_TEMPLATE) {
        const p = readOfficerPayload(payload);
        return p ? officerEmail(p) : null;
    }
    const p = readPayload(payload);
    return p && (DRIVE_TEMPLATES as string[]).includes(template) ? driveEmail(template as DriveTemplate, p) : null;
}

/** Wait before the next try: 1, 2, 4, 8 minutes, so a short outage passes without losing anyone (AC2). */
export function retryDelayMs(attempts: number): number {
    return 60_000 * 2 ** Math.max(0, attempts - 1);
}
export const MAX_ATTEMPTS = 5;
