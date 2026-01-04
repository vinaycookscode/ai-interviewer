"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { generateMockQuestions, saveMockAnswer, completeMockInterview } from "@/actions/mock-interview";
import { Loader2, Mic, Square, Volume2, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";

interface PracticeSessionProps {
    mockInterviewId: string;
    role: string;
    difficulty: string;
}

export function PracticeSession({ mockInterviewId, role, difficulty }: PracticeSessionProps) {
    const router = useRouter();
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [isGenerating, setIsGenerating] = useState(true);
    const [isSubmitting, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ score: number; feedback: string } | null>(null);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Hooks for audio
    const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechToText();
    const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();

    // Load questions on mount
    useEffect(() => {
        const loadQuestions = async () => {
            const result: any = await generateMockQuestions(role, difficulty);

            // Check if model was switched
            if (result._switchInfo?.switched) {
                toast.success(`Switched to ${result._switchInfo.to}`, {
                    description: "Your interview will continue automatically"
                });
            }

            if (result.questions && result.questions.length > 0) {
                setQuestions(result.questions);
                setIsGenerating(false);
                // Speak first question
                speak(result.questions[0]);

                // Show info if using fallback but not all exhausted
                if (result.isFallback && !result.allModelsExhausted) {
                    toast.info("Using practice mode questions", {
                        description: "AI-generated questions will be available soon"
                    });
                }
            } else {
                let error = result.error || "Failed to generate questions";

                // Friendly message for rate limits
                if (result.allModelsExhausted) {
                    const minutes = result.retryIn ? Math.ceil(result.retryIn / 60) : 60;
                    error = `All AI models are temporarily busy. Available in ~${minutes} minutes. Using practice mode questions.`;

                    // Still set questions to fallback
                    if (result.questions) {
                        setQuestions(result.questions);
                        setIsGenerating(false);
                        speak(result.questions[0]);
                        toast.warning("Using Practice Mode", {
                            description: `AI models available in ~${minutes} minutes`,
                            duration: 10000
                        });
                        return;
                    }
                }

                setErrorMessage(error);
                setHasError(true);
                setIsGenerating(false);
                toast.error(error);
            }
        };
        loadQuestions();
    }, [role, difficulty, speak]);

    // Update answer from transcript
    useEffect(() => {
        if (transcript) {
            setAnswer(prev => {
                if (prev !== transcript) return transcript;
                return prev;
            });
        }
    }, [transcript]);

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            setAnswer("");
            setFeedback(null);
            resetTranscript();
            // Speak next question
            speak(questions[currentQuestionIndex + 1]);
        } else {
            handleComplete();
        }
    };

    const handleSubmitAnswer = () => {
        if (!answer.trim()) {
            toast.error("Please provide an answer");
            return;
        }

        startTransition(async () => {
            const result = await saveMockAnswer(
                mockInterviewId,
                questions[currentQuestionIndex],
                answer
            );

            if (result.success && result.evaluation) {
                setFeedback(result.evaluation);
                toast.success("Answer saved!");
            } else {
                toast.error(result.error || "Failed to save answer");
            }
        });
    };

    const handleComplete = async () => {
        startTransition(async () => {
            const result = await completeMockInterview(mockInterviewId);
            if (result.success) {
                toast.success("Interview completed!");
                router.push(`/candidate/practice/${mockInterviewId}/result`);
            } else {
                toast.error(result.error || "Failed to complete interview");
            }
        });
    };

    if (isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating interview questions for {role}...</p>
            </div>
        );
    }

    if (hasError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to Start Interview</AlertTitle>
                <AlertDescription className="space-y-4">
                    <p>{errorMessage}</p>
                    <p className="text-sm">
                        The AI could not generate interview questions. This may be due to:
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                        <li>API service temporarily unavailable</li>
                        <li>Rate limit exceeded</li>
                        <li>Network connectivity issues</li>
                    </ul>
                    <Button
                        onClick={() => router.push('/candidate/practice')}
                        variant="outline"
                        className="mt-4"
                    >
                        Back to Practice Home
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    // Track answered questions (completed count)
    const answeredCount = feedback ? currentQuestionIndex + 1 : currentQuestionIndex;
    const progress = questions.length > 0
        ? (answeredCount / questions.length) * 100
        : 0;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <span>{Math.round(progress)}% Completed ({answeredCount}/{questions.length})</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            <Card className="border-2 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-start justify-between gap-4">
                        <span className="text-xl leading-relaxed">{currentQuestion}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => isSpeaking ? stopSpeaking() : speak(currentQuestion)}
                        >
                            <Volume2 className={`h-5 w-5 ${isSpeaking ? "text-primary animate-pulse" : ""}`} />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!feedback ? (
                        <>
                            <Textarea
                                placeholder="Type your answer here or use the microphone..."
                                className="min-h-[150px] text-lg p-4"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                disabled={isSubmitting}
                            />

                            <div className="flex justify-center">
                                <Button
                                    variant={isListening ? "destructive" : "secondary"}
                                    size="lg"
                                    className="rounded-full h-16 w-16 shadow-lg"
                                    onClick={isListening ? stopListening : startListening}
                                    disabled={isSubmitting}
                                >
                                    {isListening ? (
                                        <Square className="h-6 w-6" />
                                    ) : (
                                        <Mic className="h-6 w-6" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-center text-sm text-muted-foreground">
                                {isListening ? "Listening... Click to stop" : "Click microphone to speak"}
                            </p>
                        </>
                    ) : (
                        <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">AI Feedback</h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${feedback.score >= 8 ? "bg-green-100 text-green-700" :
                                    feedback.score >= 5 ? "bg-yellow-100 text-yellow-700" :
                                        "bg-red-100 text-red-700"
                                    }`}>
                                    Score: {feedback.score}/10
                                </span>
                            </div>
                            <p className="text-muted-foreground">{feedback.feedback}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end pt-6">
                    {!feedback ? (
                        <Button
                            onClick={handleSubmitAnswer}
                            disabled={!answer.trim() || isSubmitting}
                            size="lg"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    Submit Answer
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button onClick={handleNextQuestion} size="lg">
                            {currentQuestionIndex < questions.length - 1 ? (
                                <>
                                    Next Question
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    Complete Interview
                                    <CheckCircle className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
