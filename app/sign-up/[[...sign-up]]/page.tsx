"use client";

import { SignUp } from "@clerk/nextjs";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, User } from "lucide-react";

export default function SignUpPage() {
    const [userType, setUserType] = useState<"CANDIDATE" | "EMPLOYER" | null>(null);

    if (!userType) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold">Welcome to AI Interviewer</CardTitle>
                        <CardDescription className="text-lg mt-2">
                            Choose how you'd like to get started
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6 p-6">
                        <button
                            onClick={() => setUserType("CANDIDATE")}
                            className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all duration-300 p-6 text-left bg-card hover:shadow-lg"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <User className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">I'm a Candidate</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Looking to take AI-powered interviews and showcase my skills
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setUserType("EMPLOYER")}
                            className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-accent transition-all duration-300 p-6 text-left bg-card hover:shadow-lg"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                                    <Briefcase className="h-8 w-8 text-accent" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">I'm an Employer</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Looking to create jobs and conduct AI-powered interviews
                                    </p>
                                </div>
                            </div>
                        </button>
                    </CardContent>
                    <div className="p-6 pt-0 text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <a href="/sign-in" className="text-primary hover:underline font-medium">
                                Sign in
                            </a>
                        </p>
                    </div>
                </Card>
            </div >
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <div className="mb-4">
                <Button
                    variant="ghost"
                    onClick={() => setUserType(null)}
                    className="text-muted-foreground hover:text-foreground"
                >
                    ← Change selection
                </Button>
            </div>
            <SignUp
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-lg",
                    },
                }}
                unsafeMetadata={{
                    userType: userType,
                }}
                redirectUrl={userType === "CANDIDATE" ? "/candidate/dashboard" : "/dashboard"}
            />
        </div>
    );
}
