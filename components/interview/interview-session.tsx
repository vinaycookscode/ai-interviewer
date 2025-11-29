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
import { useScreenDetection } from "@/hooks/use-screen-detection";
import { GazeTracker } from "./gaze-tracker";

interface Question {
    id: string;
    text: string;
}

import { useCopyPastePrevention } from "@/hooks/use-copy-paste-prevention";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

interface InterviewSessionProps {
    interviewId: string;
    questions: Question[];
    stream: MediaStream;
}

export function InterviewSession({ interviewId, questions, stream }: InterviewSessionProps) {
    const router = useRouter();
    // const { interviewId, questions, stream } = interview; // Removed incorrect destructuring
    const { warningCount, warnings, isFullScreen, enterFullScreen, addWarning } = useProctoring(interviewId);
    const { screenCount, isMultiScreen } = useScreenDetection(true);
    const [screenViolationCount, setScreenViolationCount] = useState(0);
    const [terminationReason, setTerminationReason] = useState<string | null>(null);
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
    // Initialize Video Preview using callback ref to handle strict mode/remounts correctly
    const setVideoRef = (element: HTMLVideoElement | null) => {
        videoRef.current = element;
        if (element && stream) {
            element.srcObject = stream;
            element.onloadedmetadata = () => {
                element.play().catch(e => console.error("InterviewSession: Play error", e));
            };
        }
    };

    // Update srcObject if stream changes while element is already mounted
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("InterviewSession: Play error (update)", e));
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

    // Enable copy/paste prevention
    // Enable copy/paste prevention with warning logging
    useCopyPastePrevention(true, (message, type) => {
        addWarning(message, type);
    });

    // Auto-termination check (Warnings)
    useEffect(() => {
        if (warningCount >= 11 && !isCompleted && !terminationReason) {
            const terminate = async () => {
                setTerminationReason("Multiple proctoring violations detected.");
                await stopRecording(); // This will also submit the current answer and complete the interview
                // We might want to explicitly force completion if stopRecording doesn't do it immediately enough
                // But stopRecording calls handleNext which calls completeInterview if it's the last question.
                // If it's NOT the last question, we need to force completion.

                // Let's force completion to be safe
                await completeInterview(interviewId);
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                setIsCompleted(true);
            };
            terminate();
        }
    }, [warningCount, isCompleted, terminationReason, interviewId, stream]);

    // Screen Detection Logic
    useEffect(() => {
        if (screenCount > 1) {
            // First offense: Warning (handled by UI below)
            // Second offense: Terminate? 
            // The requirement was: "If we found 2 time after this again we will terminate"
            // This implies state tracking for screen violations.
            // Let's add a specific warning for screens first.
            addWarning("Multiple screens detected", "MULTI_SCREEN", `Count: ${screenCount}`);
            setScreenViolationCount(prev => prev + 1);
        }
    }, [screenCount, addWarning]);

    // Track screen violations for termination
    useEffect(() => {
        if (screenViolationCount >= 2 && !isCompleted && !terminationReason) {
            const terminate = async () => {
                setTerminationReason("Multiple screens detected repeatedly.");
                await stopRecording();
                await completeInterview(interviewId);
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                setIsCompleted(true);
            };
            terminate();
        }
    }, [screenViolationCount, isCompleted, terminationReason, interviewId, stream]);


    if (isCompleted) {
        if (terminationReason) {
            return (
                <div className="max-w-2xl mx-auto text-center space-y-6 pt-20">
                    <div className="flex justify-center">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                            <Square className="h-12 w-12 text-red-600" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-red-600">Interview Terminated</h1>
                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-xl text-red-200 font-medium">
                            {terminationReason}
                        </p>
                        <p className="mt-2 text-white/60">
                            Our proctoring system detected suspicious activity exceeding the allowed limit.
                            The interview has been automatically submitted for review.
                        </p>
                    </div>
                    <Button onClick={() => router.push("/candidate/dashboard")} variant="outline" size="lg" className="border-red-500/20 hover:bg-red-500/10 hover:text-red-200">
                        Return to Dashboard
                    </Button>
                </div>
            );
        }

        if (screenCount > 1) {
            return (
                <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 select-none">
                    <div className="max-w-md w-full bg-card border border-red-500/50 shadow-lg rounded-xl p-8 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <Square className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-red-500">Multiple Screens Detected</h2>
                        <p className="text-muted-foreground">
                            Please disconnect additional monitors to continue.
                            <br />
                            <span className="font-bold text-red-400">Warning {screenViolationCount}/2</span>
                        </p>
                        <p className="text-xs text-white/40">
                            The interview will be terminated if multiple screens are detected again.
                        </p>
                    </div>
                </div>
            );
        }

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
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black text-slate-50 select-none overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto h-screen p-4 md:p-8 flex flex-col gap-6 justify-center">
                {/* Main Content Area */}
                <div className="grid md:grid-cols-2 gap-6 w-full max-h-[80vh]">
                    {/* Left: Question Card */}
                    <div className="flex flex-col justify-center">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <Card className="relative bg-black/40 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
                                <CardContent className="p-8 space-y-8">
                                    {/* Question Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                            <span className="text-xs font-medium text-blue-100">
                                                Question {currentIndex + 1} <span className="text-white/40">/</span> {questionsState.length}
                                            </span>
                                        </div>
                                        {isSpeaking && (
                                            <div className="flex items-center gap-2 text-blue-400">
                                                <Volume2 className="h-4 w-4 animate-pulse" />
                                                <span className="text-xs font-medium">Speaking...</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4 min-h-[120px]">
                                        <h2 className="text-2xl md:text-3xl font-bold leading-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                                            {currentQuestion.text}
                                        </h2>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        {!isRecording ? (
                                            <Button
                                                onClick={startRecording}
                                                size="lg"
                                                className="w-full h-14 text-lg bg-white text-black hover:bg-white/90 shadow-[0_0_30px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-[1.02]"
                                                disabled={isSpeaking || isProcessing}
                                            >
                                                <Mic className="mr-2 h-5 w-5" />
                                                Start Answering
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={stopRecording}
                                                variant="destructive"
                                                size="lg"
                                                className="w-full h-14 text-lg bg-red-500 hover:bg-red-600 shadow-[0_0_30px_-10px_rgba(239,68,68,0.5)] transition-all hover:scale-[1.02]"
                                            >
                                                <Square className="mr-2 h-5 w-5 fill-current" />
                                                Stop & Submit
                                            </Button>
                                        )}

                                        {isProcessing && (
                                            <p className="text-center text-sm text-white/50 animate-pulse">
                                                Processing your answer...
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Transcript Preview (Floating) */}
                        {(transcript || interimTranscript) && (
                            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md max-h-[150px] overflow-y-auto custom-scrollbar">
                                <p className="text-sm text-white/80 italic leading-relaxed">
                                    "{transcript} <span className="text-white/40">{interimTranscript}</span>"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right: Video Feed */}
                    <div className="flex flex-col justify-center h-full">
                        <div className="relative w-full aspect-[4/3] md:aspect-auto md:h-full rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl ring-1 ring-white/5">
                            <video
                                ref={setVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />

                            {/* Overlays */}
                            <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                                {isRecording && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 backdrop-blur-md text-red-200 animate-pulse shadow-lg">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-xs font-medium">Recording</span>
                                    </div>
                                )}
                            </div>

                            {warningCount > 0 && (
                                <div className="absolute top-6 left-6">
                                    <HoverCard>
                                        <HoverCardTrigger asChild>
                                            <div className={`
                                                px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md flex items-center gap-2 shadow-lg cursor-help transition-colors
                                                ${warningCount >= 10
                                                    ? "bg-red-500/20 border border-red-500/50 text-red-200 hover:bg-red-500/30"
                                                    : "bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 hover:bg-yellow-500/30"}
                                            `}>
                                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${warningCount >= 10 ? "bg-red-500" : "bg-yellow-500"}`} />
                                                Warnings: {warningCount}
                                            </div>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-80 bg-black/90 border-white/10 text-white backdrop-blur-xl">
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-yellow-500 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                                    Proctoring Warnings
                                                </h4>
                                                <div className="text-xs space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                                    {warnings.map((w, i) => (
                                                        <div key={i} className="flex flex-col gap-1 p-2 rounded bg-white/5 border border-white/5">
                                                            <span className="font-medium text-yellow-200">{w.message}</span>
                                                            <span className="text-[10px] text-white/40">
                                                                {new Date(w.timestamp).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                </div>
                            )}

                            {/* Audio Visualizer Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 to-transparent p-6 flex items-end justify-center">
                                <div className="w-full max-w-xs opacity-80">
                                    <AudioVisualizer stream={stream} />
                                </div>
                            </div>

                            {/* Gaze Tracker (Invisible/Background) */}
                            <GazeTracker
                                videoElement={videoRef.current}
                                isActive={!isCompleted && !terminationReason}
                                onWarning={(msg, type) => addWarning(msg, type)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
