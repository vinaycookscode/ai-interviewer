import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToR2 } from "@/lib/r2";
import { validateUpload } from "@/lib/upload-validation";

// "offer" is an offer letter, stored with the user's own documents (AIIN-135).
const PROFILE_DOCUMENT_TYPES = ["resume", "pan", "aadhaar", "offer"] as const;

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const fileEntry = formData.get("file");
        const type = formData.get("type"); // resume, pan, aadhaar, offer

        const file = fileEntry instanceof File ? fileEntry : null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const docType = PROFILE_DOCUMENT_TYPES.find((t) => t === type);
        if (!docType) {
            return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
        }

        const upload = await validateUpload(
            file,
            // Profile resumes feed the resume screener, which only parses PDF; offer letters are PDFs too.
            docType === "resume" || docType === "offer" ? "resumePdf" : "idDocument",
            docType,
        );
        if (!upload.ok) {
            return NextResponse.json({ error: upload.error }, { status: 400 });
        }

        // Upload to R2: profiles/[userId]/[fileName]
        const fileUrl = await uploadToR2(upload.buffer, upload.fileName, `profiles/${userId}`, upload.contentType);

        return NextResponse.json({
            success: true,
            url: fileUrl,
            name: file.name,
        });
    } catch (error: any) {
        console.error("Profile upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}
