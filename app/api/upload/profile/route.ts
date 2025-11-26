import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToR2 } from "@/lib/r2";

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

        const buffer = Buffer.from(await resumeFile.arrayBuffer());
        const safeName = resumeFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `resume_${Date.now()}_${safeName}`;

        // Upload to R2: profiles/[userId]/[fileName]
        const resumeUrl = await uploadToR2(buffer, fileName, `profiles/${userId}`, resumeFile.type);

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
