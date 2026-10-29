// Formatting shared by the company prep pages (AIIN-132).

/** "₹3.4–7 LPA" from a kit's salary range in rupees, or null if it has none. */
export function formatSalaryRange(value: unknown): string | null {
    if (!value || typeof value !== "object") return null;
    const { min, max } = value as { min?: unknown; max?: unknown };
    if (typeof min !== "number" || typeof max !== "number") return null;
    const lakh = (n: number) => String(Math.round((n / 100000) * 10) / 10);
    return `₹${lakh(min)}–${lakh(max)} LPA`;
}

/** The single letter shown in a company's tile. */
export function companyInitial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || "?";
}
