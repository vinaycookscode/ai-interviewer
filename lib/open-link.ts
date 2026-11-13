// A drive's open link (AIIN-168): the slug, allowed email domains, and what someone opening it gets.
// Plain module, tested on its own (lib/open-link.test.ts).
import { randomBytes } from "node:crypto";

/** "k7p2-nq9x": random, short enough for a poster, and rotatable (AC6). */
export function newSlug(): string {
    const a = "abcdefghjkmnpqrstuvwxyz23456789";
    const b = randomBytes(8);
    const s = [...b].map((x) => a[x % a.length]).join("");
    return `${s.slice(0, 4)}-${s.slice(4)}`;
}
export const SLUG = /^[a-z0-9]{4}-[a-z0-9]{4}$/;

/** "dit.edu.in, @Sahyadri.ac.in" → ["dit.edu.in", "sahyadri.ac.in"]; undefined if any isn't a domain. */
export function cleanDomains(text: unknown): string[] | undefined {
    if (typeof text !== "string") return undefined;
    const parts = text.split(/[\s,;]+/).map((d) => d.trim().toLowerCase().replace(/^@/, "")).filter(Boolean);
    if (parts.length > 20 || parts.some((d) => !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) || d.length > 100)) return undefined;
    return [...new Set(parts)];
}

/** An email is allowed when no domains are set, or it ends in one of them (subdomains count) (AC2). */
export function emailAllowed(email: string, domains: string[]): boolean {
    if (!domains.length) return true;
    const host = email.trim().toLowerCase().split("@")[1] ?? "";
    return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

export type JoinState = "OFF" | "SCHEDULED" | "CLOSED" | "CONTINUE" | "STAFF" | "DOMAIN" | "FULL" | "OPEN";
/**
 * What the landing page does for this person (AC1–AC5, AC7). Someone already in the drive always continues (AC5);
 * otherwise the order is: link off, not open yet, closed, staff account, wrong domain, full, open.
 */
export function joinState(i: { on: boolean; status: "DRAFT" | "SCHEDULED" | "LIVE" | "CLOSED"; inDrive: boolean; role: string | null; email: string | null; domains: string[]; cap: number | null; joined: number }): JoinState {
    if (!i.on || i.status === "DRAFT") return "OFF";
    if (i.inDrive) return "CONTINUE";
    if (i.status === "SCHEDULED") return "SCHEDULED";
    if (i.status === "CLOSED") return "CLOSED";
    if (i.role && i.role !== "CANDIDATE") return "STAFF";
    if (i.email && !emailAllowed(i.email, i.domains)) return "DOMAIN";
    if (i.cap !== null && i.joined >= i.cap) return "FULL";
    return "OPEN";
}
