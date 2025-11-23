"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateGeminiApiKey(apiKey: string) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        await db.user.update({
            where: { id: session.user.id },
            data: { geminiApiKey: apiKey },
        })

        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Error updating API key:", error)
        return { success: false, error: "Failed to update API key" }
    }
}
