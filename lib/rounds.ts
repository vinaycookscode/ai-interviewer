// Human interview rounds (AIIN-196): the calendar file and the checks. Plain module, tested on its own.

export const ROUND_NAME_MAX = 60;
export const DURATIONS = [30, 45, 60, 90] as const;

/** A meeting link must be https, so a candidate never gets a strange scheme in their calendar. */
export function cleanMeetingLink(v: unknown): string | undefined {
    if (typeof v !== "string") return undefined;
    const s = v.trim();
    if (s.length > 500) return undefined;
    try {
        const u = new URL(s);
        return u.protocol === "https:" ? u.toString() : undefined;
    } catch {
        return undefined;
    }
}

export function cleanText(v: unknown, max: number): string | null | undefined {
    if (v === undefined || v === null) return null;
    if (typeof v !== "string") return undefined;
    const s = v.replace(/\s+/g, " ").trim();
    return s.length > max ? undefined : s || null;
}

/** A start time in the future (with a minute's grace) and within a year. */
export function validStart(v: unknown, now: Date): Date | undefined {
    if (typeof v !== "string" && !(v instanceof Date)) return undefined;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return undefined;
    if (d.getTime() < now.getTime() - 60_000 || d.getTime() > now.getTime() + 366 * 86_400_000) return undefined;
    return d;
}

// ---- iCalendar (RFC 5545) ----

const stamp = (d: Date) =>
    d
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** Lines over 75 octets are folded with CRLF and a space. */
function fold(line: string): string {
    const bytes = new TextEncoder().encode(line);
    if (bytes.length <= 75) return line;
    const out: string[] = [];
    let cur = "";
    for (const ch of line) {
        if (new TextEncoder().encode(cur + ch).length > (out.length ? 74 : 75)) {
            out.push(cur);
            cur = "";
        }
        cur += ch;
    }
    out.push(cur);
    return out.join("\r\n ");
}

export interface RoundEvent {
    uid: string;
    sequence: number;
    title: string;
    description: string;
    start: Date;
    minutes: number;
    link: string;
    cancelled?: boolean;
    now: Date;
    organizer: string;
    attendee: string;
}

/** A calendar invite (METHOD:REQUEST), or its cancellation (METHOD:CANCEL), that replaces earlier versions by UID. */
export function roundIcs(e: RoundEvent): string {
    const end = new Date(e.start.getTime() + e.minutes * 60_000);
    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Get Back To U//Interview rounds//EN",
        "CALSCALE:GREGORIAN",
        `METHOD:${e.cancelled ? "CANCEL" : "REQUEST"}`,
        "BEGIN:VEVENT",
        `UID:${e.uid}@getbacktou.com`,
        `SEQUENCE:${e.sequence}`,
        `DTSTAMP:${stamp(e.now)}`,
        `ORGANIZER;CN=Get Back To U:mailto:${e.organizer}`,
        `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=FALSE:mailto:${e.attendee}`,
        `DTSTART:${stamp(e.start)}`,
        `DTEND:${stamp(end)}`,
        `SUMMARY:${esc(e.title)}`,
        `DESCRIPTION:${esc(`${e.description}\nJoin: ${e.link}`)}`,
        `LOCATION:${esc(e.link)}`,
        `URL:${e.link}`,
        `STATUS:${e.cancelled ? "CANCELLED" : "CONFIRMED"}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ];
    return lines.map(fold).join("\r\n") + "\r\n";
}

// ---- The candidate's email ----

const html = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const whenIST = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
});

export type RoundEmailKind = "scheduled" | "moved" | "cancelled";

/** Subject and body for a scheduled, moved or cancelled round. Never carries the employer's notes or outcomes. */
export function roundEmail(input: {
    kind: RoundEmailKind;
    name: string | null;
    round: string;
    job: string;
    company: string;
    start: Date;
    minutes: number;
    interviewer: string | null;
    link: string;
    appUrl: string;
}): { subject: string; html: string; text: string } {
    const when = whenIST.format(input.start);
    const what = `${input.round} for ${input.job} at ${input.company}`;
    const subject =
        input.kind === "cancelled"
            ? `Cancelled: ${what}`
            : input.kind === "moved"
              ? `New time: ${what}`
              : `${input.round} scheduled: ${input.job} at ${input.company}`;
    const hello = input.name ? `Hi ${input.name.split(" ")[0]},` : "Hi,";
    const lead =
        input.kind === "cancelled"
            ? `Your ${what} on ${when} has been cancelled. The calendar invite is attached so your calendar can remove it.`
            : input.kind === "moved"
              ? `Your ${what} has a new time: ${when}, ${input.minutes} minutes.`
              : `Your ${what} is on ${when}, ${input.minutes} minutes.`;
    const lines = input.kind === "cancelled" ? [] : [input.interviewer ? `With ${input.interviewer}.` : "", `Join: ${input.link}`].filter(Boolean);
    const mine = `See all your applications: ${input.appUrl}/candidate/applications`;
    return {
        subject,
        text: [hello, lead, ...lines, "The calendar invite is attached.", mine].join("\n\n"),
        html: [
            `<p>${html(hello)}</p>`,
            `<p>${html(lead)}</p>`,
            input.kind === "cancelled" ? "" : input.interviewer ? `<p>With ${html(input.interviewer)}.</p>` : "",
            input.kind === "cancelled" ? "" : `<p><a href="${html(input.link)}">Join the call</a></p>`,
            `<p><a href="${html(`${input.appUrl}/candidate/applications`)}">See all your applications</a></p>`,
        ].join(""),
    };
}
