import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const resumeEntry = formData.get("resume");

        const resumeFile = resumeEntry instanceof File ? resumeEntry : null;

        if (!resumeFile) {
            return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
        }

        // Create uploads directory if it doesn't exist
        // Store in public/uploads/profiles/[userId]
        const uploadsDir = join(process.cwd(), "public", "uploads", "profiles", userId);
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        const bytes = await resumeFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        // Sanitize filename
        const safeName = resumeFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `resume_${Date.now()}_${safeName}`;
        const filePath = join(uploadsDir, fileName);

        await writeFile(filePath, buffer);

        const resumeUrl = `/uploads/profiles/${userId}/${fileName}`;

        return NextResponse.json({
            success: true,
            resumeUrl,
            resumeName: resumeFile.name,
        });
    } catch (error: any) {
        console.error("Profile upload error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload resume" },
            { status: 500 }
        );
    }
}
