"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateGeminiApiKey } from "@/actions/user"

export default function SettingsPage() {
    const { data: session, update } = useSession()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [apiKey, setApiKey] = useState("")

    const handleSave = async () => {
        if (!apiKey.trim()) {
            toast.error("Please enter a valid API key")
            return
        }

        setIsLoading(true)
        try {
            const result = await updateGeminiApiKey(apiKey)
            if (result.success) {
                toast.success("API Key saved successfully")
                setApiKey("") // Clear input for security
                update() // Update session if needed
                router.refresh()
            } else {
                toast.error(result.error || "Failed to save API key")
            }
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container max-w-4xl py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Gemini API Key</CardTitle>
                    <CardDescription>
                        Provide your own Google Gemini API key to generate interview questions.
                        This key will be stored securely and used only for your requests.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                            id="apiKey"
                            type="password"
                            placeholder="AIzaSy..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                            You can get a free API key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {!isLoading && <Save className="mr-2 h-4 w-4" />}
                        Save API Key
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
