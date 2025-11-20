"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Volume2, ArrowRight, CheckCircle2 } from "lucide-react";
import { startInterview, submitAnswer, completeInterview } from "@/actions/interview-session";
import { gradeAnswer } from "@/actions/scoring";
import { AudioVisualizer } from "./audio-visualizer";
import { useRouter } from "next/navigation";

interface Question {
    id: string;
    text: string;
}

interface InterviewSessionProps {
    interviewId: string;
    questions: Question[];
    stream: MediaStream;
}

export function InterviewSession({ interviewId, questions, stream }: InterviewSessionProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const recognitionRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const currentQuestion = questions[currentIndex];

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
                    let finalTranscript = "";
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript) {
                        setTranscript((prev) => prev + " " + finalTranscript);
                    }
                };

                recognitionRef.current = recognition;
            }
        }
    }, []);

    // Start Interview on Mount
    useEffect(() => {
        startInterview(interviewId);
        speakQuestion(questions[0].text);
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
        setTranscript("");
        if (recognitionRef.current) {
            recognitionRef.current.start();
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        // Submit Answer
        handleNext();
    };

    const handleNext = async () => {
        setIsProcessing(true);

        // Submit current answer
        const result = await submitAnswer({
            interviewId,
            questionId: currentQuestion.id,
            transcript: transcript || "(No answer provided)",
        });

        if (result.success && result.answerId) {
            // Trigger AI scoring in background (fire and forget)
            gradeAnswer(result.answerId);
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setTranscript("");
            speakQuestion(questions[currentIndex + 1].text);
        } else {
            await completeInterview(interviewId);
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
                    <Button onClick={() => router.push(`/interview/${interviewId}/feedback`)} size="lg">
                        View Feedback
                    </Button>
                    <Button onClick={() => router.push("/candidate/dashboard")} variant="outline" size="lg">
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 h-full">
            {/* Left: Question & Controls */}
            <div className="flex flex-col justify-center space-y-8">
                <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Question {currentIndex + 1} of {questions.length}
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
                {transcript && (
                    <Card className="bg-slate-50 border-none">
                        <CardContent className="p-4">
                            <p className="text-sm text-gray-600 italic">
                                "{transcript}"
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
                </div>
            </div>
        </div>
    );
}
