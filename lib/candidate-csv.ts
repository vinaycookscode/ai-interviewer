// A job's ranked candidates as CSV (AIIN-162). No database, no "@/" imports: tested on its own.

/** Excel reads UTF-8 only with this first, so Hindi and Marathi names show correctly (AC2). */
export const CSV_BOM = "\uFEFF";

export const CSV_HEADER = [
    "Rank",
    "Name",
    "Email",
    "Status",
    "Decision",
    "Decision date",
    "Overall score",
    "Lowest answer score",
    "Highest answer score",
    "Strongest skill",
    "Weakest skill",
    "Interview language",
    "Finished at (IST)",
    "Report",
] as const;

/**
 * One cell. Text that a spreadsheet would run as a formula gets a leading ' (AC3, CSV injection), and anything with a
 * comma, quote or line break is quoted.
 */
export function csvCell(value: string | number | null | undefined): string {
    if (value == null) return "";
    let s = String(value);
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvRow(cells: (string | number | null | undefined)[]): string {
    return `${cells.map(csvCell).join(",")}\r\n`;
}

const ist = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

/** "2026-11-12 07:30", in IST: sorts as text and every spreadsheet reads it. */
export function istDateTime(d: Date | null): string {
    if (!d) return "";
    const p = Object.fromEntries(ist.formatToParts(d).map((x) => [x.type, x.value]));
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/** `{job-title}-candidates-{YYYY-MM-DD}.csv`, the date in IST. Letters in any script survive; the rest becomes "-". */
export function exportFileName(jobTitle: string, now: Date): string {
    const slug =
        jobTitle
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "job";
    return `${slug}-candidates-${istDateTime(now).slice(0, 10)}.csv`;
}

/** Content-Disposition for any file name: an ASCII fallback plus the UTF-8 name (RFC 6266). */
export function attachmentHeader(name: string): string {
    const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
    return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
