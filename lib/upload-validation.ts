import { randomUUID } from "crypto";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

type FileKind = "pdf" | "doc" | "docx" | "jpeg" | "png" | "webp";

// Detected from the file's first bytes, never from the client's MIME type or name.
const KINDS: Record<FileKind, { mime: string; ext: string; matches: (b: Buffer) => boolean }> = {
    pdf: { mime: "application/pdf", ext: "pdf", matches: (b) => b.subarray(0, 5).toString("latin1") === "%PDF-" },
    doc: { mime: "application/msword", ext: "doc", matches: (b) => b.subarray(0, 8).equals(Buffer.from("d0cf11e0a1b11ae1", "hex")) },
    docx: {
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ext: "docx",
        matches: (b) => b.subarray(0, 4).equals(Buffer.from("504b0304", "hex")) && b.includes("word/"),
    },
    jpeg: { mime: "image/jpeg", ext: "jpg", matches: (b) => b.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex")) },
    png: { mime: "image/png", ext: "png", matches: (b) => b.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) },
    webp: { mime: "image/webp", ext: "webp", matches: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
};

/** What each kind of upload may contain. */
export const UPLOAD_RULES = {
    resume: { kinds: ["pdf", "doc", "docx"], label: "PDF or Word document" },
    resumePdf: { kinds: ["pdf"], label: "PDF" },
    idDocument: { kinds: ["pdf", "jpeg", "png", "webp"], label: "PDF, JPG, PNG or WebP" },
} satisfies Record<string, { kinds: FileKind[]; label: string }>;

export type UploadRule = keyof typeof UPLOAD_RULES;

export type ValidatedUpload =
    | { ok: true; buffer: Buffer; contentType: string; fileName: string }
    | { ok: false; error: string };

/**
 * Check an uploaded file's size and real type. On success returns its bytes,
 * the detected content type, and a fresh unguessable file name.
 */
export async function validateUpload(file: File, rule: UploadRule, namePrefix: string): Promise<ValidatedUpload> {
    const { kinds, label } = UPLOAD_RULES[rule];

    if (file.size === 0) {
        return { ok: false, error: "The file is empty" };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
        return { ok: false, error: `Files must be ${MAX_UPLOAD_BYTES / 1024 / 1024} MB or smaller` };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = (kinds as FileKind[]).find((k) => KINDS[k].matches(buffer));

    if (!kind) {
        return { ok: false, error: `Please upload a ${label}` };
    }

    return {
        ok: true,
        buffer,
        contentType: KINDS[kind].mime,
        fileName: `${namePrefix}_${randomUUID()}.${KINDS[kind].ext}`,
    };
}
