import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const interviewId = formData.get("interviewId") as string;
        const resumeFile = formData.get("resume") as File | null;
        const aadharFile = formData.get("aadhar") as File | null;
        const panFile = formData.get("pan") as File | null;

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

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), "public", "uploads", "documents", interviewId);
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        const updateData: {
            resumeUrl?: string;
            aadharUrl?: string;
            panUrl?: string;
            documentsVerified?: boolean;
        } = {};

        // Handle resume upload
        if (resumeFile) {
            const bytes = await resumeFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const fileName = `resume_${Date.now()}_${resumeFile.name}`;
            const filePath = join(uploadsDir, fileName);
            await writeFile(filePath, buffer);
            updateData.resumeUrl = `/uploads/documents/${interviewId}/${fileName}`;
        }

        // Handle Aadhar upload
        if (aadharFile) {
            const bytes = await aadharFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const fileName = `aadhar_${Date.now()}_${aadharFile.name}`;
            const filePath = join(uploadsDir, fileName);
            await writeFile(filePath, buffer);
            updateData.aadharUrl = `/uploads/documents/${interviewId}/${fileName}`;
        }

        // Handle PAN upload
        if (panFile) {
            const bytes = await panFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const fileName = `pan_${Date.now()}_${panFile.name}`;
            const filePath = join(uploadsDir, fileName);
            await writeFile(filePath, buffer);
            updateData.panUrl = `/uploads/documents/${interviewId}/${fileName}`;
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
    } catch (error) {
        console.error("Document upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload documents" },
            { status: 500 }
        );
    }
}
