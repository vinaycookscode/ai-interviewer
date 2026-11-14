// Email addresses as people type them. Plain module.

/** A plausible email address, lower-cased, or null. */
export function cleanEmail(v: unknown): string | null {
    if (typeof v !== "string") return null;
    const e = v.trim().toLowerCase();
    return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}
