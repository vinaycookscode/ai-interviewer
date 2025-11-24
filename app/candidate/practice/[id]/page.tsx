import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PracticeSession } from "@/components/practice/practice-session";
import { redirect } from "next/navigation";
import { checkApiStatus } from "@/actions/mock-interview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PracticeSessionPage({ params }: { params: Promise<{ id: string }> }) {
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
    });

    if (!mockInterview) {
        redirect("/candidate/practice");
    }

    if (mockInterview.score) {
        // Already completed
        redirect(`/candidate/practice/${id}/result`);
    }

    // Check API availability
    const apiStatus = await checkApiStatus();

    if (!apiStatus.available) {
        return (
            <div className="container max-w-3xl py-10">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">Mock Interview: {mockInterview.role}</h1>
                    <p className="text-muted-foreground">Difficulty: {mockInterview.difficulty}</p>
                </div>

                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Service Unavailable</AlertTitle>
                    <AlertDescription className="space-y-4">
                        <p>{apiStatus.reason || "AI service is currently unavailable."}</p>
                        <p className="text-sm">This practice session cannot continue without AI service. Please try again later.</p>
                    </AlertDescription>
                </Alert>

                <Button asChild variant="outline">
                    <Link href="/candidate/practice">Back to Practice Home</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container max-w-3xl py-10">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Mock Interview: {mockInterview.role}</h1>
                <p className="text-muted-foreground">Difficulty: {mockInterview.difficulty}</p>
            </div>

            <PracticeSession
                mockInterviewId={mockInterview.id}
                role={mockInterview.role}
                difficulty={mockInterview.difficulty}
            />
        </div>
    );
}
