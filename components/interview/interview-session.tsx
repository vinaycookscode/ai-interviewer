"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Volume2, ArrowRight, CheckCircle2, Globe, Code, Maximize2, Minimize2, Play, Loader2, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { LANGUAGE_CODES, InterviewLanguage } from "@/lib/constants";
import { useCopyPastePrevention } from "@/hooks/use-copy-paste-prevention";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useLimit } from "@/components/providers/limit-provider";

// Define strict types for questions
interface Question {
    id: string;
    text: string;
    type?: "TEXT" | "CODE"; // Optional for backward compatibility, defaults to TEXT
}

interface InterviewSessionProps {
    interviewId: string;
    questions: Question[];
    stream: MediaStream;
    language?: string;
    onLanguageChange?: (lang: string) => void;
}

export function InterviewSession({ interviewId, questions, stream, language = "en", onLanguageChange }: InterviewSessionProps) {
    const router = useRouter();
    const { warningCount, warnings, isFullScreen, enterFullScreen, addWarning } = useProctoring(interviewId);
    const { screenCount } = useScreenDetection(true);
    const [screenViolationCount, setScreenViolationCount] = useState(0);
    const [terminationReason, setTerminationReason] = useState<string | null>(null);
    const [questionsState, setQuestionsState] = useState<Question[]>(questions);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const isRecordingRef = useRef(isRecording);
    const [translatedQuestionText, setTranslatedQuestionText] = useState<string | null>(null);

    // Code Editor State
    const [codeAnswer, setCodeAnswer] = useState("// Write your solution here...\n");
    const [editorExpanded, setEditorExpanded] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [editorLanguage, setEditorLanguage] = useState("javascript");
    const [codeOutput, setCodeOutput] = useState<{ stdout?: string; stderr?: string; error?: string }>({});
    const { setRateLimited } = useLimit();

    // Sync ref
    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    const recognitionRef = useRef<any>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const currentQuestion = questionsState[currentIndex] || questionsState[questionsState.length - 1];
    const isCodingQuestion = currentQuestion?.type === "CODE";

    // Safety guard for empty questions
    if (!currentQuestion) {
        return (
            <div className="flex items-center justify-center min-h-screen text-red-500">
                <p>Error: No questions available for this interview.</p>
            </div>
        );
    }

    // Normalize language for Select component
    const normalizedLanguageCode = Object.values(LANGUAGE_CODES).includes(language)
        ? language
        : (LANGUAGE_CODES[Object.keys(LANGUAGE_CODES).find(k => k.toLowerCase() === language.toLowerCase()) as InterviewLanguage] || 'en-US');

    // Initialize Video Preview using callback ref to handle strict mode/remounts correctly
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

            // Cleanup previous instance
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    console.warn("Error aborting previous recognition:", e);
                }
            }

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;

                // Robust Language Mapping
                let langCode = "en-US"; // Default
                if (language) {
                    const normalizedInput = language.trim().toLowerCase();

                    // Direct code match (e.g., if "mr-IN" is passed)
                    if (Object.values(LANGUAGE_CODES).includes(language)) {
                        langCode = language;
                    }
                    // Name match (e.g., "Marathi" -> "mr-IN")
                    else {
                        const foundKey = Object.keys(LANGUAGE_CODES).find(
                            key => key.toLowerCase() === normalizedInput
                        ) as InterviewLanguage | undefined;

                        if (foundKey) {
                            langCode = LANGUAGE_CODES[foundKey];
                        } else {
                            // Only fallback if absolutely no match
                            // Fallback mapping for common manual codes if not in enum
                            if (normalizedInput === 'mr' || normalizedInput === 'marathi') langCode = 'mr-IN';
                            else if (normalizedInput === 'hi' || normalizedInput === 'hindi') langCode = 'hi-IN';
                        }
                    }
                }

                console.log(`[STT] Initializing SpeechRecognition. Language: ${language} -> Code: ${langCode}`);
                recognition.lang = langCode;

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

                recognition.onend = () => {
                    // Auto-restart if we are supposed to be recording
                    // We use a ref to check the latest state without triggering re-effects
                    if (isRecordingRef.current) {
                        try {
                            console.log("[STT] Restarting recognition...");
                            recognition.start();
                        } catch (e) {
                            console.error("[STT] Restart error:", e);
                        }
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error("[STT] Recognition error:", event.error);
                    if (event.error === 'not-allowed') {
                        setIsRecording(false);
                    }
                };

                recognitionRef.current = recognition;
            }
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) { }
            }
        };
    }, [language]);

    // Start Interview logic (Session Init Only)
    const hasStartedRef = useRef(false);
    const lastSpokenIndex = useRef<number>(-1);

    useEffect(() => {
        if (isFullScreen && !hasStartedRef.current) {
            hasStartedRef.current = true;
            startInterview(interviewId);
            if (questionsState.length > 0) {
                handleNewQuestion(questionsState[0].text);
            }
        }
    }, [isFullScreen, interviewId, questionsState]);

    // Centralized Audio Playback Logic
    useEffect(() => {
        if (!isFullScreen) {
            return;
        }

        // If we haven't spoken this question index yet, speak it
        if (lastSpokenIndex.current !== currentIndex) {
            lastSpokenIndex.current = currentIndex;
            // Small delay to ensure browser doesn't block "auto-play" immediately upon layout shift
            const timer = setTimeout(() => {
                const textToSpeak = questionsState[currentIndex]?.text;
                if (textToSpeak) {
                    handleNewQuestion(textToSpeak);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isFullScreen, currentIndex, questionsState]); // We handle new question trigger mostly here now

    // cleanup speech on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== "undefined") {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Question Change Logic - Reset Code Editor
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
            const result = await runCode(editorLanguage, codeAnswer);

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

    const handleNewQuestion = async (text: string) => {
        let textToSpeak = text;

        // Translate if necessary
        if (language !== 'en' && language !== 'english') {
            try {
                const { translateText } = await import("@/actions/translation");
                const result = await translateText(text, language);
                if (result.success && result.translatedText) {
                    textToSpeak = result.translatedText;
                    setTranslatedQuestionText(result.translatedText);
                }
            } catch (e) {
                console.error("Translation failed", e);
            }
        } else {
            setTranslatedQuestionText(null);
        }

        speakQuestion(textToSpeak);
    };

    const speakQuestion = (text: string) => {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(true);
            const utterance = new SpeechSynthesisUtterance(text);

            if (normalizedLanguageCode) {
                utterance.lang = normalizedLanguageCode;
            }

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

            // Follow-up logic if enabled later
            /* 
            if (result.followUp) {
                const newQuestions = [...questionsState];
                const followUpWithType = { ...result.followUp, type: result.followUp.type || "TEXT" };
                newQuestions.splice(currentIndex + 1, 0, followUpWithType as Question);
                setQuestionsState(newQuestions);
            }
            */
        }

        if (currentIndex < questionsState.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setTranscript("");
            // Logic handled by useEffect (lastSpokenIndex check) now triggers handleNewQuestion
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
                                            <span className="text-xs font-medium text-blue-100">
                                                {isCodingQuestion ? "(Coding Challenge)" : "(Behavioral)"}
                                            </span>
                                        </div>

                                        {/* Language Selector (Visible only if onLanguageChange provided) */}
                                        {onLanguageChange && (
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-muted-foreground" />
                                                <Select value={normalizedLanguageCode} onValueChange={onLanguageChange}>
                                                    <SelectTrigger className="w-[140px] h-8 bg-white/5 border-white/10 text-xs">
                                                        <SelectValue placeholder="Language" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.keys(LANGUAGE_CODES).map((langName) => (
                                                            <SelectItem key={langName} value={LANGUAGE_CODES[langName as InterviewLanguage]}>
                                                                {langName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h2 className="text-2xl md:text-3xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 via-white to-purple-100">
                                            {currentQuestion.text}
                                        </h2>
                                        {translatedQuestionText && (
                                            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-100 text-lg">
                                                {translatedQuestionText}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Area */}
                                    <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
                                        <div className="flex gap-4">
                                            {!isRecording ? (
                                                <Button
                                                    onClick={startRecording}
                                                    disabled={isProcessing}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0 py-6 text-lg font-semibold shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                                >
                                                    <Mic className="mr-2 h-5 w-5" /> Start Answering
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={stopRecording}
                                                    variant="destructive"
                                                    className="flex-1 bg-red-500 hover:bg-red-600 border-0 py-6 text-lg font-semibold shadow-lg shadow-red-500/20 animate-pulse"
                                                >
                                                    <Square className="mr-2 h-5 w-5" /> Stop Recording
                                                </Button>
                                            )}
                                        </div>

                                        <Button
                                            variant="ghost"
                                            onClick={() => speakQuestion(translatedQuestionText || currentQuestion.text)}
                                            disabled={isSpeaking}
                                            className="w-full text-white/50 hover:text-white hover:bg-white/5"
                                        >
                                            {isSpeaking ? <Volume2 className="mr-2 h-4 w-4 animate-pulse text-blue-400" /> : <Volume2 className="mr-2 h-4 w-4" />}
                                            {isSpeaking ? "Speaking..." : "Read Question Again"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Transcript (Compact) */}
                        <div className="h-[200px] shrink-0">
                            <Card className="h-full bg-black/40 border-white/10 backdrop-blur-xl">
                                <CardContent className="p-4 h-full overflow-y-auto font-mono text-sm text-white/70">
                                    {transcript || interimTranscript ? (
                                        <>
                                            <span className="text-white/90">{transcript}</span>
                                            <span className="text-white/50 italic">{interimTranscript}</span>
                                        </>
                                    ) : (
                                        <span className="text-white/30 italic">Detailed transcript will appear here...</span>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="flex flex-col gap-6 h-full min-h-0">

                        {/* Code Editor or Video */}
                        {isCodingQuestion ? (
                            <div className="flex-1 flex flex-col gap-4 min-h-0">
                                {/* Editor */}
                                <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#1e1e1e]">
                                    <CodeEditor
                                        value={codeAnswer}
                                        onChange={handleCodeChange}
                                        language={editorLanguage}
                                        height="100%"
                                        theme="vs-dark"
                                    />
                                    {/* Editor Controls Overlay */}
                                    <div className="absolute top-4 right-8 flex gap-2">
                                        <Select value={editorLanguage} onValueChange={setEditorLanguage}>
                                            <SelectTrigger className="w-[120px] h-8 bg-[#1e1e1e] border-white/20 text-xs">
                                                <SelectValue placeholder="Language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="javascript">JavaScript</SelectItem>
                                                <SelectItem value="python">Python</SelectItem>
                                                <SelectItem value="java">Java</SelectItem>
                                                <SelectItem value="cpp">C++</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            size="sm"
                                            onClick={handleRunCode}
                                            disabled={isRunning}
                                            className="h-8 bg-green-600 hover:bg-green-500 text-white"
                                        >
                                            {isRunning ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                                            Run Code
                                        </Button>
                                    </div>
                                </div>

                                {/* Terminal Output */}
                                <div className="h-[150px] shrink-0 rounded-xl bg-black border border-white/10 p-4 font-mono text-xs overflow-auto">
                                    <div className="text-white/50 mb-2 border-b border-white/10 pb-1">Tagline Terminal</div>
                                    {codeOutput.error ? (
                                        <pre className="text-red-400 whitespace-pre-wrap">{codeOutput.error}</pre>
                                    ) : codeOutput.stderr ? (
                                        <pre className="text-yellow-400 whitespace-pre-wrap">{codeOutput.stderr}</pre>
                                    ) : (
                                        <pre className="text-green-400 whitespace-pre-wrap">{codeOutput.stdout || "Ready to execute..."}</pre>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Use the standard large video view + visualizer for Non-Coding Questions
                            <div className="flex-1 relative rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl group">
                                <video
                                    ref={setVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                />

                                {/* Audio Visualizer Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
                                    <div className="absolute bottom-4 left-4 right-4 h-16 flex items-end justify-center gap-1">
                                        <AudioVisualizer stream={stream} />
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 backdrop-blur-md flex items-center gap-2 animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-xs font-semibold text-red-100 tracking-wide uppercase">Live Rec</span>
                                </div>

                                {/* Gaze Tracker */}
                                <GazeTracker
                                    videoElement={videoElement}
                                    isActive={isRecording}
                                    onWarning={handleWarningWrapper}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
