import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function PracticeResultPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    if (!session || !session.user) {
        redirect("/auth/login");
    }

    const mockInterview = await db.mockInterview.findUnique({
        where: {
            id,
            userId: session.user.id,
        },
        include: {
            answers: true,
        },
    });

    if (!mockInterview || !mockInterview.score) {
        redirect("/candidate/practice");
    }

    return (
        <div className="container max-w-3xl py-10">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Interview Completed!</h1>
                <p className="text-muted-foreground">Here's how you performed in your {mockInterview.role} interview.</p>
            </div>

            <div className="grid gap-6 mb-8">
                <Card className="border-2 border-primary/10">
                    <CardHeader>
                        <CardTitle>Overall Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Score</span>
                            <span className="text-2xl font-bold text-primary">{mockInterview.score.toFixed(1)}/10</span>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <h4 className="font-semibold mb-2">Feedback Summary</h4>
                            <p className="text-sm text-muted-foreground">{mockInterview.feedback}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Question Breakdown</h2>
                    {mockInterview.answers.map((answer, index) => (
                        <Card key={answer.id}>
                            <CardHeader>
                                <CardTitle className="text-base">Q{index + 1}: {answer.question}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="p-3 bg-muted/30 rounded-md">
                                    <p className="text-sm italic text-muted-foreground">"{answer.transcript}"</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className={`mt-1 h-2 w-2 rounded-full ${(answer.score || 0) >= 8 ? "bg-green-500" :
                                        (answer.score || 0) >= 5 ? "bg-yellow-500" : "bg-red-500"
                                        }`} />
                                    <div>
                                        <span className="font-semibold text-sm">Score: {answer.score}/10</span>
                                        <p className="text-sm text-muted-foreground">{answer.feedback}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="flex justify-center gap-4">
                <Button variant="outline" asChild>
                    <Link href="/candidate/dashboard">
                        <Home className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <Button asChild>
                    <Link href="/candidate/practice">
                        Start Another Session
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
