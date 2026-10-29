/** A short code from an error's digest that people can quote; the full digest is in the server logs (AIIN-137). */
export function errorReference(digest: string | undefined): string | undefined {
    return digest ? digest.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase() : undefined;
}
