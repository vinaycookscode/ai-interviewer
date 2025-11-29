"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Volume2, ArrowRight, CheckCircle2 } from "lucide-react";
import { startInterview, submitAnswer, completeInterview } from "@/actions/interview-session";
import { gradeAnswer } from "@/actions/scoring";
import { AudioVisualizer } from "./audio-visualizer";
import { useRouter } from "next/navigation";
import { useProctoring } from "@/hooks/use-proctoring";

interface Question {
    id: string;
    text: string;
}

import { useCopyPastePrevention } from "@/hooks/use-copy-paste-prevention";

interface InterviewSessionProps {
    interviewId: string;
    questions: Question[];
    stream: MediaStream;
}

export function InterviewSession({ interviewId, questions, stream }: InterviewSessionProps) {
    const router = useRouter();
    // const { interviewId, questions, stream } = interview; // Removed incorrect destructuring
    const { warningCount, isFullScreen, enterFullScreen } = useProctoring(interviewId);
    const [questionsState, setQuestionsState] = useState<Question[]>(questions);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const [interimTranscript, setInterimTranscript] = useState("");

    const recognitionRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const currentQuestion = questionsState[currentIndex];

    // Initialize Video Preview
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = "en-US";

                recognition.onresult = (event: any) => {
                    let final = "";
                    let interim = "";

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            final += event.results[i][0].transcript;
                        } else {
                            interim += event.results[i][0].transcript;
                        }
                    }

                    if (final) {
                        setTranscript((prev) => prev + " " + final);
                    }
                    setInterimTranscript(interim);
                };

                recognitionRef.current = recognition;
            }
        }
    }, []);

    // Start Interview on Mount
    useEffect(() => {
        startInterview(interviewId);
        speakQuestion(questionsState[0].text);
    }, []);

    const speakQuestion = (text: string) => {
        if ("speechSynthesis" in window) {
            setIsSpeaking(true);
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    const startRecording = () => {
        setIsRecording(true);
        // Don't clear transcript here if we want to allow pausing/resuming, 
        // but for this app, we probably want to clear it for a new answer attempt.
        // However, if they accidentally stopped, clearing it might be bad. 
        // Let's clear it only if it's a fresh start for a question.
        // For now, keeping existing behavior but ensuring interim is cleared.
        if (!transcript) setTranscript("");
        setInterimTranscript("");

        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Error starting recognition:", e);
            }
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        // Wait a moment for any final recognition results to process
        setIsProcessing(true);
        setTimeout(async () => {
            // Submit Answer
            await handleNext();
        }, 1000);
    };

    const handleNext = async () => {
        setIsProcessing(true);

        // Submit current answer
        // Combine final and interim transcript to ensure we capture everything
        const fullTranscript = (transcript + " " + interimTranscript).trim();

        const result = await submitAnswer({
            interviewId,
            questionId: currentQuestion.id,
            transcript: fullTranscript || "(No answer provided)",
        });

        if (result.success && result.answerId) {
            // Trigger AI scoring in background (fire and forget)
            gradeAnswer(result.answerId);

            // Check for follow-up question
            if (result.followUp) {
                // Insert follow-up question after current question
                const newQuestions = [...questionsState];
                newQuestions.splice(currentIndex + 1, 0, result.followUp);
                setQuestionsState(newQuestions);
            }
        }

        if (currentIndex < questionsState.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setTranscript("");
            // We need to wait for state update to speak next question? 
            // Actually, we can just speak the next question from the new array if we had it, 
            // but since setQuestionsState is async, we might need a useEffect or just speak it here carefully.
            // If we added a follow-up, it's at currentIndex + 1.
            // If we didn't, the next original question is at currentIndex + 1.

            // Let's use a timeout to allow state to settle or just speak the target text directly
            const nextQuestionText = result.followUp ? result.followUp.text : questionsState[currentIndex + 1].text;
            speakQuestion(nextQuestionText);
        } else {
            await completeInterview(interviewId);

            // Stop all media tracks
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            setIsCompleted(true);
        }

        setIsProcessing(false);
    };

    if (isCompleted) {
        return (
            <div className="max-w-2xl mx-auto text-center space-y-6 pt-20">
                <div className="flex justify-center">
                    <CheckCircle2 className="h-24 w-24 text-green-500" />
                </div>
                <h1 className="text-4xl font-bold">Interview Completed!</h1>
                <p className="text-xl text-gray-500">
                    Thank you for completing the interview. Your responses are being evaluated.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={() => router.push(`/candidate/interview/${interviewId}/feedback`)} size="lg">
                        View Feedback
                    </Button>
                    <Button onClick={() => router.push("/candidate/dashboard")} variant="outline" size="lg">
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    // Enable copy/paste prevention
    useCopyPastePrevention(true);

    if (!isFullScreen) {
        return (
            <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 select-none">
                <div className="max-w-md w-full bg-card border shadow-lg rounded-xl p-8 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Square className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold">Full Screen Required</h2>
                    <p className="text-muted-foreground">
                        To ensure a fair interview process, you must remain in full-screen mode.
                        Please return to full screen to continue.
                    </p>
                    <Button onClick={enterFullScreen} size="lg" className="w-full">
                        Return to Full Screen
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 h-full select-none">
            {/* Left: Question & Controls */}
            <div className="flex flex-col justify-center space-y-8">
                <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Question {currentIndex + 1} of {questionsState.length}
                    </div>
                    <h2 className="text-3xl font-bold leading-tight">
                        {currentQuestion.text}
                    </h2>
                    {isSpeaking && (
                        <div className="flex items-center gap-2 text-blue-600 animate-pulse">
                            <Volume2 className="h-5 w-5" />
                            <span className="text-sm font-medium">AI is speaking...</span>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {!isRecording ? (
                        <Button
                            onClick={startRecording}
                            size="lg"
                            className="w-full h-16 text-lg"
                            disabled={isSpeaking || isProcessing}
                        >
                            <Mic className="mr-2 h-6 w-6" />
                            Start Answering
                        </Button>
                    ) : (
                        <Button
                            onClick={stopRecording}
                            variant="destructive"
                            size="lg"
                            className="w-full h-16 text-lg"
                        >
                            <Square className="mr-2 h-6 w-6 fill-current" />
                            Stop & Submit Answer
                        </Button>
                    )}

                    {isProcessing && (
                        <p className="text-center text-sm text-gray-500 animate-pulse">
                            Saving answer...
                        </p>
                    )}
                </div>

                {/* Transcript Preview */}
                {(transcript || interimTranscript) && (
                    <Card className="bg-slate-50 border-none">
                        <CardContent className="p-4">
                            <p className="text-sm text-gray-600 italic">
                                "{transcript} <span className="text-gray-400">{interimTranscript}</span>"
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Right: Video Preview */}
            <div className="flex flex-col justify-center space-y-4">
                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    <div className="absolute bottom-4 left-4 right-4">
                        <AudioVisualizer stream={stream} />
                    </div>

                    {isRecording && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full" />
                            Recording
                        </div>
                    )}

                    {warningCount > 0 && (
                        <div className="absolute top-4 left-4 bg-yellow-500/90 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                            Warnings: {warningCount}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
