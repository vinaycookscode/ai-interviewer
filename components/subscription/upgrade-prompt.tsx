"use client";

import Link from "next/link";
import { Crown, Sparkles, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UpgradePromptProps {
    feature: string;
    description?: string;
}

const featureDescriptions: Record<string, string> = {
    "AI Practice": "Practice unlimited mock interviews with AI-powered feedback to ace your real interviews.",
    "Resume Screener": "Get AI-powered resume analysis, cover letter generation, and resume optimization.",
    "AI Question Generation": "Generate tailored interview questions from any job description.",
};

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
    const featureDesc = description || featureDescriptions[feature] || `Unlock ${feature} with a Pro subscription.`;

    return (
        <div className="flex h-full items-center justify-center p-6">
            <Card className="max-w-lg text-center">
                <CardHeader className="pb-4">
                    <div className="mx-auto rounded-full p-4 bg-gradient-to-br from-yellow-400 to-orange-500 text-white mb-4 w-fit">
                        <Crown className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl">Upgrade to Pro</CardTitle>
                    <CardDescription className="text-base mt-2">
                        {featureDesc}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Benefits */}
                    <div className="grid gap-3 text-left">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="rounded-full p-2 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                                <Zap className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Pro Plan - ₹249/month</p>
                                <p className="text-xs text-muted-foreground">15 Mock Interviews, 10 Resume Analysis & more</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="rounded-full p-2 bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                                <Crown className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Premium Plan - ₹499/month</p>
                                <p className="text-xs text-muted-foreground">Unlimited access to all AI features</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <Button asChild size="lg" className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                        <Link href="/candidate/pricing">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Upgrade Now
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>

                    <p className="text-xs text-muted-foreground">
                        Cancel anytime. No long-term commitments.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
