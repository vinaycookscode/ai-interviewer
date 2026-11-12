// Storage keys and stored file URLs we're willing to trust (AIIN-216). No database, no "@/" imports: tested on its own.

/**
 * One key segment as it arrives in a URL, already decoded. Refuses anything a path normalizer could turn into a
 * different folder: "", ".", "..", or a segment hiding a slash ("..%2Fu1" arrives as "../u1").
 */
function safeSegment(part: string): boolean {
    return part !== "" && part !== "." && part !== ".." && !/[/\\\u0000-\u001f]/.test(part);
}

/** The object key for `/api/files/<parts>`, or null if any part could point somewhere else. */
export function objectKey(parts: string[]): string | null {
    return parts.length >= 3 && parts.every(safeSegment) ? parts.join("/") : null;
}

/**
 * A stored file URL is trusted only if it is in our bucket, under `profiles/<userId>/`, and reads the same once
 * normalized, so "…/profiles/u1/../u2/x.pdf" and encoded tricks are refused. Returns the URL, or undefined.
 */
export function ownFileUrl(url: string | null | undefined, bucketUrl: string | undefined, userId: string): string | undefined {
    if (!url || !bucketUrl || !userId || url.includes("\\")) return undefined;
    let parsed: URL, bucket: URL;
    try {
        parsed = new URL(url);
        bucket = new URL(bucketUrl);
    } catch {
        return undefined;
    }
    if (parsed.href !== url || parsed.origin !== bucket.origin || parsed.search || parsed.hash) return undefined;

    const base = bucket.pathname.replace(/\/+$/, "");
    if (!parsed.pathname.startsWith(`${base}/`)) return undefined;
    let parts: string[];
    try {
        parts = parsed.pathname
            .slice(base.length + 1)
            .split("/")
            .map(decodeURIComponent);
    } catch {
        return undefined;
    }
    return parts.length >= 3 && parts[0] === "profiles" && parts[1] === userId && parts.every(safeSegment) ? url : undefined;
}

/** The object key ("profiles/<userId>/<file>") of a stored URL that passes `ownFileUrl`, or undefined (AIIN-224). */
export function ownFileKey(url: string | null | undefined, bucketUrl: string | undefined, userId: string): string | undefined {
    const own = ownFileUrl(url, bucketUrl, userId);
    if (!own || !bucketUrl) return undefined;
    const base = new URL(bucketUrl).pathname.replace(/\/+$/, "");
    const key = new URL(own).pathname
        .slice(base.length + 1)
        .split("/")
        .map(decodeURIComponent);
    return objectKey(key) ?? undefined;
}
