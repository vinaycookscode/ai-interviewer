// A PDF resume's text (AIIN-193). Server only. pdf-parse needs Promise.withResolvers, built into Node 22 (AIIN-65).

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse.js");

/** The PDF's text, tidied. "" when it has none (a scan) or can't be read. */
export async function pdfText(bytes: Uint8Array): Promise<string> {
    try {
        const { text } = (await pdf(Buffer.from(bytes))) as { text?: string };
        return (text ?? "")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    } catch {
        return "";
    }
}
