/**
 * Link to a stored document through the authorized /api/files route instead
 * of the raw bucket URL, so documents stay private.
 *
 * Stored values are bucket URLs like `${R2_PUBLIC_URL}/documents/<id>/<file>`;
 * the object key is the URL path.
 */
export function documentHref(storedUrl: string | null | undefined): string | undefined {
    if (!storedUrl) return undefined;
    if (storedUrl.startsWith("/api/files/")) return storedUrl;

    try {
        const key = new URL(storedUrl).pathname.replace(/^\/+/, "");
        return key ? `/api/files/${key}` : undefined;
    } catch {
        return undefined;
    }
}
