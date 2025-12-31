"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createMockInterview, checkApiStatus } from "@/actions/mock-interview";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function PracticeView() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [role, setRole] = useState("");
    const [difficulty, setDifficulty] = useState("Junior");
    const [apiStatus, setApiStatus] = useState<{ available: boolean; usingFallback?: boolean; reason?: string } | null>(null);
    const [isCheckingApi, setIsCheckingApi] = useState(true);

    // Check API status on mount
    useEffect(() => {
        const checkApi = async () => {
            const status = await checkApiStatus();
            setApiStatus(status);
            setIsCheckingApi(false);
        };
        checkApi();
    }, []);

    const handleStart = () => {
        if (!role) {
            toast.error("Please enter a role");
            return;
        }

        startTransition(async () => {
            const result = await createMockInterview(role, difficulty);
            if (result.success && result.mockInterviewId) {
                toast.success("Interview created!");
                router.push(`/candidate/practice/${result.mockInterviewId}`);
            } else {
                toast.error(result.error || "Something went wrong");
            }
        });
    };

    const isDisabled = !apiStatus?.available || isPending;

    return (
        <div className="container max-w-2xl pt-10 pb-24 px-4 sm:py-20">
            <div className="mb-6 sm:mb-8 text-center">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    AI Mock Interview Playground
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm max-w-lg mx-auto">
                    Practice your interview skills with our AI. Get instant feedback and improve your confidence.
                </p>
            </div>

            {isCheckingApi ? (
                <Card className="border-2 border-primary/10 shadow-lg">
                    <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Checking AI service availability...</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {apiStatus?.usingFallback && (
                        <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Limited AI Availability</AlertTitle>
                            <AlertDescription>
                                {apiStatus?.reason || "AI service is currently unavailable. You can still practice with offline questions."}
                            </AlertDescription>
                        </Alert>
                    )}

                    <Card className="border-2 border-primary/10 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Setup Your Session
                            </CardTitle>
                            <CardDescription>
                                Choose the role and difficulty level you want to practice for.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="role">Target Role</Label>
                                <Input
                                    id="role"
                                    placeholder="e.g. Frontend Developer, Product Manager, Sales Rep"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    disabled={isDisabled}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Difficulty Level</Label>
                                <Select value={difficulty} onValueChange={setDifficulty} disabled={isDisabled}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Junior">Junior (Entry Level)</SelectItem>
                                        <SelectItem value="Mid">Mid-Level</SelectItem>
                                        <SelectItem value="Senior">Senior (Expert)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleStart}
                                disabled={isDisabled}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Session...
                                    </>
                                ) : (
                                    "Start Practice Interview"
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
