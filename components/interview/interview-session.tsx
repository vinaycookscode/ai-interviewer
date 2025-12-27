"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Volume2, CheckCircle2, Code, Maximize2, Minimize2, Play, Loader2, Sparkles } from "lucide-react";
import { startInterview, submitAnswer, completeInterview } from "@/actions/interview-session";
import { runCode } from "@/actions/code-execution";
import { gradeAnswer } from "@/actions/scoring";
import { AudioVisualizer } from "./audio-visualizer";
import { useRouter } from "next/navigation";
import { useProctoring } from "@/hooks/use-proctoring";
import { useScreenDetection } from "@/hooks/use-screen-detection";
import { GazeTracker } from "./gaze-tracker";
import { CodeEditor } from "@/components/ui/code-editor";
import { cn } from "@/lib/utils";
import { useCopyPastePrevention } from "@/hooks/use-copy-paste-prevention";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLimit } from "@/components/providers/limit-provider";

// Define strict types for questions
interface Question {
    id: string;
    text: string;
    type: "TEXT" | "CODE";
}

interface InterviewSessionProps {
    interviewId: string;
    questions: Question[];
    stream: MediaStream;
}

export function InterviewSession({ interviewId, questions, stream }: InterviewSessionProps) {
    const router = useRouter();
    const { warningCount, warnings, isFullScreen, enterFullScreen, addWarning } = useProctoring(interviewId);
    const { screenCount } = useScreenDetection(true);
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

    // Code Editor State
    const [codeAnswer, setCodeAnswer] = useState("// Write your solution here...\n");
    const [editorExpanded, setEditorExpanded] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [language, setLanguage] = useState("javascript");
    const [codeOutput, setCodeOutput] = useState<{ stdout?: string; stderr?: string; error?: string }>({});
    const { setRateLimited } = useLimit();

    const recognitionRef = useRef<any>(null);
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const currentQuestion = questionsState[currentIndex] || questionsState[questionsState.length - 1];
    const isCodingQuestion = currentQuestion?.type === "CODE";

    // Initialize Video Preview
    const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
        videoRef.current = element;
        setVideoElement(element);

        if (element && stream) {
            // Only set srcObject if it's different to prevent interruption
            if (element.srcObject !== stream) {
                element.srcObject = stream;
                element.onloadedmetadata = () => {
                    element.play().catch(e => {
                        if (e.name !== "AbortError") {
                            console.error("InterviewSession: Play error", e);
                        }
                    });
                };
            }
        }
    }, [stream]);



    // Update srcObject if stream changes
    // Update srcObject if stream changes
    useEffect(() => {
        if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
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
                    if (final) setTranscript((prev) => prev + " " + final);
                    setInterimTranscript(interim);
                };
                recognitionRef.current = recognition;
            }
        }
    }, []);

    // Start Interview logic (Session Init Only)
    const hasStartedRef = useRef(false);
    const lastSpokenIndex = useRef<number>(-1);

    useEffect(() => {
        if (isFullScreen && !hasStartedRef.current) {
            hasStartedRef.current = true;
            startInterview(interviewId);
            // Audio is handled by the effect below
        }
    }, [isFullScreen, interviewId]);

    // Centralized Audio Playback Logic
    useEffect(() => {
        if (!isFullScreen) {
            // Optional: reset spoken index if we want to replay when re-entering full screen
            // lastSpokenIndex.current = -1; 
            return;
        }

        // If we haven't spoken this question index yet, speak it
        if (lastSpokenIndex.current !== currentIndex) {
            lastSpokenIndex.current = currentIndex;
            // Small delay to ensure browser doesn't block "auto-play" immediately upon layout shift
            const timer = setTimeout(() => {
                const textToSpeak = questionsState[currentIndex]?.text;
                if (textToSpeak) {
                    speakQuestion(textToSpeak);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isFullScreen, currentIndex, questionsState]);

    // cleanup speech on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== "undefined") {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Question Change Logic
    useEffect(() => {
        if (isCodingQuestion) {
            setCodeAnswer("// Write your solution here...\n");
        } else {
            setCodeAnswer("");
        }
    }, [currentIndex, isCodingQuestion]);

    const handleCodeChange = useCallback((val: string | undefined) => {
        setCodeAnswer(val || "");
    }, []);

    const handleRunCode = async () => {
        setIsRunning(true);
        setCodeOutput({}); // Clear previous output

        try {
            const result = await runCode(language, codeAnswer);

            const hasOutput = result.output && result.output.trim().length > 0;

            setCodeOutput({
                stdout: hasOutput ? result.output : "Program executed successfully (No output captured).",
                stderr: result.stderr,
                error: result.error
            });
        } catch (error) {
            console.error("Execution error:", error);
            setCodeOutput({ error: "An unexpected error occurred while running the code." });
        } finally {
            setIsRunning(false);
        }
    };



    const speakQuestion = (text: string) => {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(true);
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    const startRecording = () => {
        setIsRecording(true);
        if (!transcript) setTranscript("");
        setInterimTranscript("");
        recognitionRef.current?.start();
    };

    const stopRecording = async () => {
        setIsRecording(false);
        recognitionRef.current?.stop();
        setIsProcessing(true);
        setTimeout(handleNext, 1000);
    };

    const handleNext = async () => {
        setIsProcessing(true);
        let fullTranscript = (transcript + " " + interimTranscript).trim();

        if (isCodingQuestion && codeAnswer) {
            fullTranscript += `\n\n[CODE SUBMISSION]\n${codeAnswer}`;
        }

        if (isCodingQuestion && !fullTranscript) {
            fullTranscript = `[CODE SUBMISSION ONLY]\n${codeAnswer}`;
        }

        const result = await submitAnswer({
            interviewId,
            questionId: currentQuestion.id,
            transcript: fullTranscript || "(No answer provided)",
        });

        if (result.success && result.answerId) {
            const gradeResult = await gradeAnswer(result.answerId);
            if (gradeResult.isRateLimit) {
                setRateLimited(true);
            }

            if (result.followUp) {
                const newQuestions = [...questionsState];
                // Ensure followUp has a type, default to TEXT
                // @ts-ignore
                const followUpWithType = { ...result.followUp, type: result.followUp.type || "TEXT" };
                newQuestions.splice(currentIndex + 1, 0, followUpWithType as Question);
                setQuestionsState(newQuestions);
            }
        }

        if (currentIndex < questionsState.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setTranscript("");
            // Logic handled by useEffect now
        } else {
            await completeInterview(interviewId);
            stream?.getTracks().forEach(track => track.stop());
            setIsCompleted(true);
        }
        setIsProcessing(false);
    };

    const handleWarningWrapper = useCallback((message: string, type: string) => {
        if (!isCodingQuestion) {
            addWarning(message, type);
        }
    }, [isCodingQuestion, addWarning]);

    useCopyPastePrevention(true, handleWarningWrapper);

    // Auto-termination and Screen Detection Logic
    useEffect(() => {
        if (warningCount >= 11 && !isCompleted && !terminationReason) {
            setTerminationReason("Multiple proctoring violations detected.");
        }
    }, [warningCount, isCompleted, terminationReason]);

    useEffect(() => {
        if (screenCount > 1) {
            addWarning("Multiple screens detected", "MULTI_SCREEN", `Count: ${screenCount}`);
            setScreenViolationCount(p => p + 1);
        }
    }, [screenCount, addWarning]);

    useEffect(() => {
        if (screenViolationCount >= 5 && !isCompleted && !terminationReason) {
            setTerminationReason("Multiple screens detected repeatedly.");
        }
    }, [screenViolationCount, isCompleted, terminationReason]);

    useEffect(() => {
        if (terminationReason && !isCompleted) {
            const terminate = async () => {
                await stopRecording();
                await completeInterview(interviewId);
                stream?.getTracks().forEach(track => track.stop());
                setIsCompleted(true);
            };
            terminate();
        }
    }, [terminationReason, isCompleted]);


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
                        <p className="text-xl text-red-200 font-medium">{terminationReason}</p>
                    </div>
                    <Button onClick={() => router.push("/candidate/dashboard")} variant="outline" size="lg" className="border-red-500/20 hover:bg-red-500/10 hover:text-red-200">
                        Return to Dashboard
                    </Button>
                </div>
            );
        }
        return (
            <div className="max-w-2xl mx-auto text-center space-y-6 pt-20">
                <div className="flex justify-center"><CheckCircle2 className="h-24 w-24 text-green-500" /></div>
                <h1 className="text-4xl font-bold">Interview Completed!</h1>
                <div className="flex gap-4 justify-center">
                    <Button onClick={() => router.push(`/candidate/interview/${interviewId}/feedback`)} size="lg">View Feedback</Button>
                    <Button onClick={() => router.push("/candidate/dashboard")} variant="outline" size="lg">Back to Dashboard</Button>
                </div>
            </div>
        );
    }

    if (!isFullScreen) {
        return (
            <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-card border shadow-lg rounded-xl p-8 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Square className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold">Full Screen Required</h2>

                    {/* Interview Guidelines */}
                    <div className="text-left bg-white/5 p-4 rounded-lg space-y-3 text-sm">
                        <h3 className="font-semibold text-white/90">Dos & Don'ts</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <ul className="space-y-1 text-green-400">
                                <li>✓ Speak clearly</li>
                                <li>✓ Stay in frame</li>
                                <li>✓ Good lighting</li>
                            </ul>
                            <ul className="space-y-1 text-red-400">
                                <li>✗ No tab switching</li>
                                <li>✗ No cheat sheets</li>
                                <li>✗ No phones</li>
                            </ul>
                        </div>
                    </div>

                    <Button onClick={enterFullScreen} size="lg" className="w-full">
                        Return to Full Screen & Start
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black text-slate-50 select-none overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            <div className={cn(
                "relative z-10 mx-auto h-screen p-4 md:p-8 flex flex-col gap-6 justify-center transition-all duration-500",
                isCodingQuestion ? "max-w-[1800px]" : "max-w-6xl"
            )}>

                {/* SPLIT LAYOUT */}
                <div className={cn(
                    "grid gap-6 w-full max-h-[85vh] transition-all duration-500",
                    isCodingQuestion ? "grid-cols-[450px_1fr]" : "md:grid-cols-2"
                )}>

                    {/* LEFT COLUMN */}
                    <div className="flex flex-col gap-6 h-full">

                        {/* Question Card */}
                        <div className="relative group flex-1 flex flex-col min-h-0">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <Card className="relative bg-black/40 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden h-full flex flex-col">
                                <CardContent className="p-8 space-y-6 flex-1 flex flex-col overflow-y-auto">
                                    <div className="flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                            <span className="text-xs font-medium text-blue-100">
                                                Question {currentIndex + 1} <span className="text-white/40">/</span> {questionsState.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isCodingQuestion && <Code className="w-4 h-4 text-purple-400" />}
                                            {!isCodingQuestion && <Mic className="w-4 h-4 text-blue-400" />}
                                        </div>
                                    </div>

                                    <div className="space-y-4 shrink-0">
                                        <h2 className={cn(
                                            "font-bold leading-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent transition-all",
                                            isCodingQuestion ? "text-xl" : "text-2xl md:text-3xl"
                                        )}>
                                            {currentQuestion.text}
                                        </h2>
                                        {isCodingQuestion && (
                                            <div className="space-y-3">
                                                <div className="text-sm text-white/60 bg-white/5 p-3 rounded-lg border border-white/5 uppercase tracking-wider font-medium">
                                                    Coding Challenge
                                                </div>

                                                {/* Best Practices Card */}
                                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                                    <h4 className="text-xs font-semibold text-blue-200 mb-2 flex items-center">
                                                        <Sparkles className="w-3 h-3 mr-1" />
                                                        Tips for High AI Score
                                                    </h4>
                                                    <ul className="text-xs text-blue-100/70 space-y-1 list-disc pl-4">
                                                        <li>Write clean, self-documenting code</li>
                                                        <li>Handle edge cases (null, empty inputs)</li>
                                                        <li>Add comments to explain complex logic</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons (Voice Mode) */}
                                    {!isCodingQuestion && (
                                        <div className="mt-auto pt-6 space-y-4 shrink-0">
                                            {!isRecording ? (
                                                <Button
                                                    onClick={startRecording}
                                                    size="lg"
                                                    className="w-full h-14 text-lg bg-white text-black hover:bg-white/90 shadow-[0_0_30px_-10px_rgba(255,255,255,0.3)]"
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
                                                    className="w-full h-14 text-lg bg-red-500 hover:bg-red-600 shadow-[0_0_30px_-10px_rgba(239,68,68,0.5)]"
                                                >
                                                    <Square className="mr-2 h-5 w-5 fill-current" />
                                                    Stop & Submit
                                                </Button>
                                            )}

                                            {(transcript || interimTranscript) && (
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md max-h-[150px] overflow-y-auto custom-scrollbar">
                                                    <p className="text-sm text-white/80 italic leading-relaxed">
                                                        "{transcript} <span className="text-white/40">{interimTranscript}</span>"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Buttons (Code Mode) */}
                                    {isCodingQuestion && (
                                        <Button
                                            onClick={handleNext}
                                            size="lg"
                                            className="w-full bg-green-600 hover:bg-green-700 text-white mt-auto shrink-0"
                                            disabled={isProcessing}
                                        >
                                            <CheckCircle2 className="mr-2 h-5 w-5" />
                                            Submit Solution
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Mini Video Feed for Coding Mode */}
                        {isCodingQuestion && (
                            <div className="h-[200px] shrink-0 relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg group">
                                <video
                                    ref={setVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                                <GazeTracker
                                    videoElement={videoElement}
                                    isActive={!isCompleted && !terminationReason}
                                    onWarning={handleWarningWrapper}
                                />
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="flex flex-col h-full min-h-0">

                        {/* VIDEO FEED (Voice Mode Only) */}
                        {!isCodingQuestion && (
                            <div className="relative w-full h-full rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl ring-1 ring-white/5">
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
                                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 to-transparent p-6 flex items-end justify-center">
                                    <div className="w-full max-w-xs opacity-80">
                                        <AudioVisualizer stream={stream} />
                                    </div>
                                </div>
                                <GazeTracker
                                    videoElement={videoElement}
                                    isActive={!isCompleted && !terminationReason}
                                    onWarning={handleWarningWrapper}
                                />

                                {warningCount > 0 && (
                                    <div className="absolute top-6 left-6">
                                        <HoverCard>
                                            <HoverCardTrigger asChild>
                                                <div className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md flex items-center gap-2 shadow-lg cursor-help ${warningCount >= 10 ? "bg-red-500/20 text-red-200" : "bg-yellow-500/20 text-yellow-200"}`}>
                                                    Warnings: {warningCount}
                                                </div>
                                            </HoverCardTrigger>
                                            <HoverCardContent className="w-80 bg-black/90 border-white/10 text-white backdrop-blur-xl">
                                                <div className="space-y-3">
                                                    {warnings.map((w, i) => (
                                                        <div key={i} className="flex flex-col gap-1 p-2 rounded bg-white/5 border border-white/5">
                                                            <span className="font-medium text-yellow-200">{w.message}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </HoverCardContent>
                                        </HoverCard>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CODE EDITOR (Coding Mode Only) */}
                        {isCodingQuestion && (
                            <div className={cn("flex flex-col gap-4 h-full min-h-0 transition-all", editorExpanded && "fixed inset-4 z-50 bg-[#0a0a0a]")}>
                                {/* Editor Container */}
                                <div className="flex-1 border border-white/10 rounded-2xl overflow-hidden bg-[#1e1e1e] shadow-2xl flex flex-col min-h-0">
                                    <div className="h-10 bg-white/5 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
                                        <div className="flex items-center gap-2 text-xs font-medium text-white/40">
                                            <Code className="w-3.5 h-3.5" />
                                            Code Editor
                                        </div>
                                        {/* Language Selector */}
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger className="h-7 w-32 bg-white/5 border-white/10 text-xs text-white">
                                                <SelectValue placeholder="Language" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1e1e1e] border-white/10 text-white">
                                                <SelectItem value="javascript">JavaScript</SelectItem>
                                                <SelectItem value="python">Python</SelectItem>
                                                <SelectItem value="java">Java</SelectItem>
                                                <SelectItem value="cpp">C++</SelectItem>
                                                <SelectItem value="go">Go</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={handleRunCode}
                                                disabled={isRunning}
                                                size="sm"
                                                className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white border-none"
                                            >
                                                {isRunning ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1 fill-current" />}
                                                Run
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditorExpanded(!editorExpanded)}>
                                                {editorExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative min-h-0">
                                        <CodeEditor
                                            key={editorExpanded ? "expanded" : "collapsed"}
                                            value={codeAnswer}
                                            onChange={handleCodeChange}
                                            height="100%"
                                            language={language}
                                        />
                                    </div>
                                </div>

                                {/* Console Output Panel */}
                                <div className="h-48 border border-white/10 rounded-2xl overflow-hidden bg-black/50 shadow-xl flex flex-col shrink-0">
                                    <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 shrink-0">
                                        <span className="text-xs font-medium text-white/40">Console Output</span>
                                    </div>
                                    <div className="flex-1 p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
                                        {codeOutput.error ? (
                                            <div className="text-red-400 whitespace-pre-wrap">{codeOutput.error}</div>
                                        ) : codeOutput.stdout || codeOutput.stderr ? (
                                            <div className="whitespace-pre-wrap">
                                                {codeOutput.stdout && <span className="text-green-300">{codeOutput.stdout}</span>}
                                                {codeOutput.stderr && <span className="text-yellow-400 block mt-2">{codeOutput.stderr}</span>}
                                            </div>
                                        ) : (
                                            <div className="text-white/20 italic">Run your code to see output...</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
