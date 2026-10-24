import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";
import { validateUpload, type UploadRule } from "@/lib/upload-validation";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const interviewId = formData.get("interviewId") as string;

        const resumeEntry = formData.get("resume");
        const aadharEntry = formData.get("aadhar");
        const panEntry = formData.get("pan");

        const resumeFile = resumeEntry instanceof File ? resumeEntry : null;
        const aadharFile = aadharEntry instanceof File ? aadharEntry : null;
        const panFile = panEntry instanceof File ? panEntry : null;

        if (!interviewId) {
            return NextResponse.json({ error: "Interview ID is required" }, { status: 400 });
        }

        // Verify interview exists and user is the candidate
        const interview = await db.interview.findUnique({
            where: { id: interviewId },
            include: { candidate: true },
        });

        if (!interview || interview.candidateId !== userId) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        // Validate every file before uploading any, so a bad file can't leave a partial upload.
        const documents: { file: File | null; rule: UploadRule; prefix: string; field: "resumeUrl" | "aadhaarUrl" | "panUrl" }[] = [
            { file: resumeFile, rule: "resume", prefix: "resume", field: "resumeUrl" },
            { file: aadharFile, rule: "idDocument", prefix: "aadhaar", field: "aadhaarUrl" },
            { file: panFile, rule: "idDocument", prefix: "pan", field: "panUrl" },
        ];

        const validated = [];
        for (const doc of documents) {
            if (!doc.file) continue;
            const result = await validateUpload(doc.file, doc.rule, doc.prefix);
            if (!result.ok) {
                return NextResponse.json({ error: `${doc.prefix}: ${result.error}` }, { status: 400 });
            }
            validated.push({ ...result, field: doc.field });
        }

        const updateData: {
            resumeUrl?: string;
            aadhaarUrl?: string;
            panUrl?: string;
            documentsVerified?: boolean;
        } = {};

        for (const doc of validated) {
            updateData[doc.field] = await uploadToR2(doc.buffer, doc.fileName, `documents/${interviewId}`, doc.contentType);
        }

        // Update interview with document URLs
        const updatedInterview = await db.interview.update({
            where: { id: interviewId },
            data: updateData,
            include: { job: true },
        });

        // Check if all required documents are uploaded
        const allDocsUploaded =
            (!updatedInterview.job.requireResume || updatedInterview.resumeUrl) &&
            (!updatedInterview.job.requireAadhar || updatedInterview.aadhaarUrl) &&
            (!updatedInterview.job.requirePAN || updatedInterview.panUrl);

        if (allDocsUploaded) {
            await db.interview.update({
                where: { id: interviewId },
                data: { documentsVerified: true },
            });
        }

        return NextResponse.json({
            success: true,
            message: "Documents uploaded successfully",
            interview: updatedInterview,
        });
    } catch (error: any) {
        console.error("Document upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload documents" },
            { status: 500 }
        );
    }
}
