// Inviting a drive's candidates from a CSV (AIIN-166): parsing, guessing the columns, and checking every row before
// anything is created. Plain module, tested on its own (lib/drive-csv.test.ts).

export const MAX_BYTES = 2 * 1024 * 1024;
export const MAX_ROWS = 5000;
export const FIELDS = ["name", "email", "college", "roll", "phone"] as const;
export type Field = (typeof FIELDS)[number];
/** Column index → field, or null for "don't import". */
export type Mapping = (Field | null)[];

export type RowStatus = "READY" | "INVALID_EMAIL" | "MISSING_NAME" | "DUPLICATE" | "IN_DRIVE" | "STAFF" | "UNKNOWN_COLLEGE";
export const PROBLEMS: RowStatus[] = ["INVALID_EMAIL", "MISSING_NAME", "DUPLICATE", "IN_DRIVE", "STAFF", "UNKNOWN_COLLEGE"];

/** RFC 4180: quoted fields, doubled quotes, commas and line breaks inside quotes, CRLF or LF, a leading BOM. */
export function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let quoted = false;
    const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (quoted) {
            if (c === '"' && s[i + 1] === '"') {
                cell += '"';
                i++;
            } else if (c === '"') quoted = false;
            else cell += c;
        } else if (c === '"' && cell === "") quoted = true;
        else if (c === ",") {
            row.push(cell);
            cell = "";
        } else if (c === "\n" || c === "\r") {
            if (c === "\r" && s[i + 1] === "\n") i++;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = "";
        } else cell += c;
    }
    if (cell !== "" || row.length) {
        row.push(cell);
        rows.push(row);
    }
    return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

const ALIASES: Record<Field, string[]> = {
    name: ["name", "studentname", "fullname", "candidatename", "candidate", "student"],
    email: ["email", "emailid", "emailaddress", "mail", "mailid", "studentemail"],
    college: ["college", "collegename", "institute", "institution", "university", "campus"],
    roll: ["roll", "rollno", "rollnumber", "prn", "usn", "enrollment", "enrollmentno", "enrolmentno", "registrationno", "regno"],
    phone: ["phone", "phoneno", "phonenumber", "mobile", "mobileno", "mobilenumber", "contact", "contactno"],
};
const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");

/** A first guess at what each column is (AC5). Each field is used once; the rest are "don't import". */
export function guessMapping(headers: string[]): Mapping {
    const used = new Set<Field>();
    return headers.map((h) => {
        const n = norm(h);
        const f = FIELDS.find((f) => !used.has(f) && ALIASES[f].includes(n));
        if (f) used.add(f);
        return f ?? null;
    });
}

/** A mapping from the browser: the right length, known fields, each used once, and name and email present. */
export function validMapping(m: unknown, columns: number): m is Mapping {
    if (!Array.isArray(m) || m.length !== columns) return false;
    const seen = new Set<string>();
    for (const f of m) {
        if (f === null) continue;
        if (!(FIELDS as readonly string[]).includes(f) || seen.has(f)) return false;
        seen.add(f);
    }
    return seen.has("name") && seen.has("email");
}

const EMAIL = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/i;
const clip = (v: string, max: number) => v.replace(/\s+/g, " ").trim().slice(0, max);
const key = (v: string) => v.replace(/\s+/g, " ").trim().toLowerCase();

export interface CheckedRow {
    line: number; // the row's line in the file, counting the header as 1
    name: string;
    email: string;
    college: string;
    collegeId: string | null;
    roll: string;
    phone: string;
    status: RowStatus;
}

/**
 * Check every row (AC1). Emails are trimmed and lowercased; the first row with an email wins and later ones are
 * duplicates. Rows are kept as text: nothing here is evaluated (AC7).
 */
export function checkRows(
    rows: string[][],
    mapping: Mapping,
    ctx: { colleges: { id: string; name: string }[]; inDrive: Set<string>; staff: Set<string> },
): { rows: CheckedRow[]; counts: Record<RowStatus, number> } {
    const col = (f: Field) => mapping.indexOf(f);
    const at = (r: string[], f: Field) => (col(f) >= 0 ? (r[col(f)] ?? "") : "");
    const colleges = new Map(ctx.colleges.map((c) => [key(c.name), c.id]));
    const seen = new Set<string>();
    const counts = Object.fromEntries([...PROBLEMS, "READY"].map((s) => [s, 0])) as Record<RowStatus, number>;
    const out = rows.map((r, i): CheckedRow => {
        const email = clip(at(r, "email"), 254).toLowerCase();
        const name = clip(at(r, "name"), 120);
        const college = clip(at(r, "college"), 120);
        const collegeId = college ? (colleges.get(key(college)) ?? null) : null;
        let status: RowStatus = "READY";
        if (!EMAIL.test(email)) status = "INVALID_EMAIL";
        else if (seen.has(email)) status = "DUPLICATE";
        else if (!name) status = "MISSING_NAME";
        else if (ctx.staff.has(email)) status = "STAFF";
        else if (ctx.inDrive.has(email)) status = "IN_DRIVE";
        else if (college && !collegeId) status = "UNKNOWN_COLLEGE";
        if (EMAIL.test(email)) seen.add(email);
        counts[status]++;
        return { line: i + 2, name, email, college, collegeId, roll: clip(at(r, "roll"), 40), phone: clip(at(r, "phone"), 20), status };
    });
    return { rows: out, counts };
}

/** One CSV cell, safe to open in a spreadsheet: quoted, and a leading = + - @ can't start a formula (AC7). */
export function csvCell(v: string): string {
    const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return `"${safe.replace(/"/g, '""')}"`;
}
