import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";

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

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        const updateData: {
            resumeUrl?: string;
            aadharUrl?: string;
            panUrl?: string;
            documentsVerified?: boolean;
        } = {};

        // Handle resume upload
        if (resumeFile) {
            const buffer = Buffer.from(await resumeFile.arrayBuffer());
            const fileName = `resume_${Date.now()}_${resumeFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            updateData.resumeUrl = await uploadToR2(buffer, fileName, `documents/${interviewId}`, resumeFile.type);
        }

        // Handle Aadhar upload
        if (aadharFile) {
            const buffer = Buffer.from(await aadharFile.arrayBuffer());
            const fileName = `aadhar_${Date.now()}_${aadharFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            updateData.aadharUrl = await uploadToR2(buffer, fileName, `documents/${interviewId}`, aadharFile.type);
        }

        // Handle PAN upload
        if (panFile) {
            const buffer = Buffer.from(await panFile.arrayBuffer());
            const fileName = `pan_${Date.now()}_${panFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            updateData.panUrl = await uploadToR2(buffer, fileName, `documents/${interviewId}`, panFile.type);
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
            (!updatedInterview.job.requireAadhar || updatedInterview.aadharUrl) &&
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
            { error: error.message || "Failed to upload documents" },
            { status: 500 }
        );
    }
}
