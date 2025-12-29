"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateInterviewLanguage } from "@/actions/interview";
import { Loader2, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LanguageSelectorProps {
    interviewId: string;
    onLanguageSelected: (language: string) => void;
}

export function LanguageSelector({ interviewId, onLanguageSelected }: LanguageSelectorProps) {
    const [language, setLanguage] = useState("en");
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async () => {
        setIsLoading(true);
        try {
            if (language !== 'en') {
                await updateInterviewLanguage(interviewId, language);
            }
            onLanguageSelected(language);
        } catch (error) {
            console.error(error);
            // Even if server update fails, we can continue locally
            onLanguageSelected(language);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <Globe className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Select Interview Language</CardTitle>
                    <CardDescription>
                        Choose your comfortable language for the interview.
                        Questions and feedback will be adapted to this language.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Language</label>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English (Default)</SelectItem>
                                <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                                <SelectItem value="mr">Marathi (मराठी)</SelectItem>
                                <SelectItem value="kn">Kannada (कन्नड़)</SelectItem>
                                <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={handleContinue} className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
