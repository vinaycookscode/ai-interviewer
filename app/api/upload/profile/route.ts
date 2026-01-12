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
        const fileEntry = formData.get("file");
        const type = formData.get("type"); // resume, pan, aadhaar

        const file = fileEntry instanceof File ? fileEntry : null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${type || 'doc'}_${Date.now()}_${safeName}`;

        // Upload to R2: profiles/[userId]/[fileName]
        const fileUrl = await uploadToR2(buffer, fileName, `profiles/${userId}`, file.type);

        return NextResponse.json({
            success: true,
            url: fileUrl,
            name: file.name,
        });
    } catch (error: any) {
        console.error("Profile upload error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload file" },
            { status: 500 }
        );
    }
}
