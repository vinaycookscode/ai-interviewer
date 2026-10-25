"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    FileText,
    Loader2,
    Maximize2,
    Mic,
    OctagonX,
    Play,
    ShieldAlert,
    ShieldCheck,
    Square,
    Video,
    Volume2,
    X,
} from "lucide-react";
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
import { useLimit } from "@/components/providers/limit-provider";
import { documentHref } from "@/lib/document-url";
import { CoachBubble } from "@/components/soft-glass/coach-bubble";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { FocusCard, FocusRoot, SessionHeader, eyebrow, inkButton, outlineButton } from "./session-shell";

// Define strict types for questions
interface Question {
    id: string;
    text: string;
    type?: "TEXT" | "CODE"; // Optional for backward compatibility, defaults to TEXT
}

// The Web Speech API isn't in the DOM typings yet; only what this component uses.
interface SpeechRecognitionResultEvent {
    resultIndex: number;
    results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

interface SpeechRecognitionLike {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface InterviewSessionProps {
    interviewId: string;
    questions: Question[];
    stream: MediaStream;
    language?: string;
    onLanguageChange?: (lang: string) => void;
    /** Shown in the session header. */
    jobTitle?: string;
    userDocuments?: {
        resumeUrl?: string | null;
        panUrl?: string | null;
        aadhaarUrl?: string | null;
    };
}

export function InterviewSession({
    interviewId,
    questions,
    stream,
    language = "en",
    onLanguageChange,
    jobTitle,
    userDocuments
}: InterviewSessionProps) {
    const router = useRouter();
    const { warningCount, isFullScreen, enterFullScreen, addWarning } = useProctoring(interviewId);
    const { screenCount } = useScreenDetection(true);
    const [screenViolationCount, setScreenViolationCount] = useState(0);
    const [terminationReason, setTerminationReason] = useState<string | null>(null);
    // The setter returns with follow-up questions (commented out in handleNext).
    const [questionsState] = useState<Question[]>(questions);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const isRecordingRef = useRef(isRecording);
    const [translatedQuestionText, setTranslatedQuestionText] = useState<string | null>(null);

    // Presentation only: the "Listening · 00:42" timer.
    const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
    const [clock, setClock] = useState(0);

    // Code Editor State
    const [codeAnswer, setCodeAnswer] = useState("// Write your solution here...\n");
    const [isRunning, setIsRunning] = useState(false);
    const [editorLanguage, setEditorLanguage] = useState("javascript");
    const [codeOutput, setCodeOutput] = useState<{ stdout?: string; stderr?: string; error?: string }>({});
    const { setRateLimited } = useLimit();

    // Sync ref
    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    useEffect(() => {
        if (!isRecording) return;
        const timer = setInterval(() => setClock(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [isRecording]);

    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const currentQuestion = questionsState[currentIndex] || questionsState[questionsState.length - 1];
    const isCodingQuestion = currentQuestion?.type === "CODE";

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
            const speechWindow = window as unknown as {
                SpeechRecognition?: SpeechRecognitionConstructor;
                webkitSpeechRecognition?: SpeechRecognitionConstructor;
            };
            const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

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


                recognition.lang = langCode;

                recognition.onresult = (event) => {
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

                            recognition.start();
                        } catch (e) {
                            console.error("[STT] Restart error:", e);
                        }
                    }
                };

                recognition.onerror = (event) => {
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
                } catch {
                    // Already stopped.
                }
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
        // Runs once on entering full screen; handleNewQuestion is recreated every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // We handle new question trigger mostly here now; handleNewQuestion is recreated every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFullScreen, currentIndex, questionsState]);

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
        const startedAt = Date.now();
        setRecordingStartedAt(startedAt);
        setClock(startedAt);
        setIsRecording(true);
        // Don't clear transcript - preserve existing content when resuming
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
        // Terminates once; the handlers it calls are recreated every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [terminationReason, isCompleted]);

    // Safety guard for empty questions. Must stay below every hook (Rules of Hooks).
    if (!currentQuestion) {
        return (
            <FocusRoot>
                <FocusCard>
                    <p role="alert" className="flex items-start gap-3 font-semibold text-sg-danger">
                        <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                        This interview has no questions yet. Please contact the hiring team.
                    </p>
                </FocusCard>
            </FocusRoot>
        );
    }

    if (isCompleted) {
        if (terminationReason) {
            return (
                <FocusRoot>
                    <FocusCard>
                        <span className="flex size-12 items-center justify-center rounded-full bg-sg-danger/10 text-sg-danger">
                            <OctagonX className="size-6" aria-hidden="true" />
                        </span>
                        <div className="flex flex-col gap-3">
                            <h1 className="font-display sg-soft text-[30px] font-semibold leading-9 sm:text-[34px] sm:leading-10">
                                Interview ended
                            </h1>
                            <p role="alert" className="rounded-2xl bg-sg-danger/10 px-4 py-3 font-semibold text-sg-danger">
                                {terminationReason}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/candidate/dashboard")}
                            className={cn(inkButton, "h-12 w-full")}
                        >
                            Return to dashboard
                        </button>
                    </FocusCard>
                </FocusRoot>
            );
        }
        return (
            <FocusRoot>
                <FocusCard>
                    <span className="flex size-12 items-center justify-center rounded-full bg-sg-success/10 text-sg-success">
                        <CheckCircle2 className="size-6" aria-hidden="true" />
                    </span>
                    <div className="flex flex-col gap-2">
                        <h1 className="font-display sg-soft text-[30px] font-semibold leading-9 sm:text-[34px] sm:leading-10">
                            Interview complete
                        </h1>
                        <p className="text-sg-muted">Thank you. Your answers are in, and your feedback is ready to read.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => router.push(`/candidate/interview/${interviewId}/feedback`)}
                            className={cn(coralButton, "h-12 px-6 sm:flex-1")}
                        >
                            View feedback
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/candidate/dashboard")}
                            className={cn(outlineButton, "h-12 px-6 text-base sm:flex-1")}
                        >
                            Back to dashboard
                        </button>
                    </div>
                </FocusCard>
            </FocusRoot>
        );
    }

    if (!isFullScreen) {
        return (
            <FocusRoot>
                <FocusCard>
                    <span className="flex size-12 items-center justify-center rounded-full bg-sg-lavender-soft text-sg-lavender-ink">
                        <Maximize2 className="size-6" aria-hidden="true" />
                    </span>
                    <div className="flex flex-col gap-2">
                        <h1 className="font-display sg-soft text-[30px] font-semibold leading-9 sm:text-[34px] sm:leading-10">
                            Full screen, please
                        </h1>
                        <p className="text-sg-muted">
                            The interview runs in full screen. Leaving it, or switching tabs, is recorded for the hiring team.
                        </p>
                    </div>
                    <div className="grid gap-3 rounded-[18px] bg-sg-row p-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <span className={eyebrow}>Do</span>
                            <ul className="flex flex-col gap-1.5 font-medium">
                                {["Speak clearly", "Stay in frame", "Sit in good light"].map((item) => (
                                    <li key={item} className="flex items-center gap-2">
                                        <Check className="size-4 shrink-0 text-sg-success" aria-hidden="true" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className={eyebrow}>Don&apos;t</span>
                            <ul className="flex flex-col gap-1.5 font-medium">
                                {["Switch tabs", "Use notes", "Use your phone"].map((item) => (
                                    <li key={item} className="flex items-center gap-2">
                                        <X className="size-4 shrink-0 text-sg-danger" aria-hidden="true" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <button type="button" onClick={enterFullScreen} className={cn(coralButton, "h-14 w-full text-[17px]")}>
                        Go full screen and start
                    </button>
                </FocusCard>
            </FocusRoot>
        );
    }

    const hasDocuments = !!(userDocuments?.resumeUrl || userDocuments?.panUrl || userDocuments?.aadhaarUrl);
    const documents = [
        { label: "Resume", url: userDocuments?.resumeUrl },
        { label: "PAN card", url: userDocuments?.panUrl },
        { label: "Aadhaar card", url: userDocuments?.aadhaarUrl },
    ].filter((doc): doc is { label: string; url: string } => !!doc.url);

    return (
        <FocusRoot className="select-none">
            <SessionHeader title={jobTitle || "Interview"} current={currentIndex} total={questionsState.length}>
                <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sg-chip px-3 text-[13px] font-semibold">
                    {warningCount === 0 ? (
                        <ShieldCheck className="size-4 text-sg-success" aria-hidden="true" />
                    ) : (
                        <ShieldAlert className="size-4 text-sg-danger" aria-hidden="true" />
                    )}
                    {warningCount === 0
                        ? "Proctoring: all clear"
                        : `Proctoring: ${warningCount} ${warningCount === 1 ? "warning" : "warnings"}`}
                </span>
                {onLanguageChange && (
                    <>
                        <label htmlFor="interview-language" className="sr-only">
                            Answer language
                        </label>
                        <select
                            id="interview-language"
                            value={normalizedLanguageCode}
                            onChange={(e) => onLanguageChange(e.target.value)}
                            className={cn(
                                "h-10 rounded-full border border-sg-field-border bg-sg-row px-3 text-sm font-semibold text-sg-text",
                                focusRing
                            )}
                        >
                            {Object.keys(LANGUAGE_CODES).map((langName) => (
                                <option key={langName} value={LANGUAGE_CODES[langName as InterviewLanguage]}>
                                    {langName}
                                </option>
                            ))}
                        </select>
                    </>
                )}
            </SessionHeader>

            <div className="flex flex-1 flex-wrap items-stretch gap-5">
                <main className="sg-glass sg-shadow-lg flex min-w-0 flex-[999_1_560px] flex-col gap-5 rounded-[24px] p-5 sm:rounded-[28px] sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex h-[30px] items-center rounded-full bg-sg-lavender-soft px-3 text-[13px] font-bold text-sg-lavender-ink">
                            {isCodingQuestion ? "Coding challenge" : "Spoken answer"}
                        </span>
                        <button
                            type="button"
                            onClick={() => speakQuestion(translatedQuestionText || currentQuestion.text)}
                            disabled={isSpeaking}
                            className={cn(
                                "inline-flex h-10 items-center gap-2 rounded-full bg-sg-chip px-3.5 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-70",
                                focusRing
                            )}
                        >
                            <Volume2 className={cn("size-4", isSpeaking && "animate-pulse")} aria-hidden="true" />
                            {isSpeaking ? "Speaking…" : "Hear it again"}
                        </button>
                    </div>

                    <h1 className="font-display sg-soft max-w-[760px] text-[26px] font-semibold leading-[1.22] tracking-[-0.02em] text-pretty sm:text-[34px]">
                        {currentQuestion.text}
                    </h1>
                    {translatedQuestionText && (
                        <p className="rounded-[18px] bg-sg-lavender-soft px-4 py-3 text-lg text-sg-lavender-ink">{translatedQuestionText}</p>
                    )}

                    <section
                        aria-label="Your answer"
                        className={cn(
                            "flex min-h-[180px] flex-col gap-2.5 rounded-[18px] bg-sg-row p-5",
                            !isCodingQuestion && "flex-1"
                        )}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className={eyebrow}>Live transcript</span>
                            {isRecording && (
                                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold">
                                    <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-sg-coral" />
                                    Listening · {formatElapsed(recordingStartedAt, clock)}
                                </span>
                            )}
                        </div>
                        <div className="max-h-[40vh] overflow-y-auto">
                            {transcript || interimTranscript ? (
                                <p className="text-[17px] leading-7">
                                    {transcript}{" "}
                                    <span className="italic text-sg-muted">{interimTranscript}</span>
                                </p>
                            ) : (
                                <p className="text-sg-muted">
                                    Your words appear here as you speak. Take a breath first; there&apos;s no rush.
                                </p>
                            )}
                        </div>
                    </section>

                    {isCodingQuestion && (
                        <section aria-label="Code editor" className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className={eyebrow}>Your code</span>
                                <button
                                    type="button"
                                    onClick={handleRunCode}
                                    disabled={isRunning}
                                    className={cn(inkButton, "h-10 px-4 text-sm")}
                                >
                                    {isRunning ? (
                                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                    ) : (
                                        <Play className="size-4" aria-hidden="true" />
                                    )}
                                    {isRunning ? "Running…" : "Run code"}
                                </button>
                            </div>
                            <div className="h-[420px] overflow-hidden rounded-[18px] border border-sg-glass-border">
                                <CodeEditor
                                    value={codeAnswer}
                                    onChange={handleCodeChange}
                                    language={editorLanguage}
                                    onLanguageChange={setEditorLanguage}
                                    height="100%"
                                    theme="vs-dark"
                                    showLanguageSelector={true}
                                    className="h-full border-0"
                                />
                            </div>
                            <div className="flex max-h-[180px] min-h-[120px] flex-col gap-2 overflow-auto rounded-[18px] bg-sg-row p-4 font-mono text-[13px]">
                                <span className={cn(eyebrow, "font-sans")}>Output</span>
                                {codeOutput.error ? (
                                    <pre role="alert" className="whitespace-pre-wrap text-sg-danger">
                                        {codeOutput.error}
                                    </pre>
                                ) : codeOutput.stderr ? (
                                    <pre className="whitespace-pre-wrap text-sg-danger">{codeOutput.stderr}</pre>
                                ) : (
                                    <pre className="whitespace-pre-wrap">{codeOutput.stdout || "Run your code to see its output here."}</pre>
                                )}
                            </div>
                        </section>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                        {!isRecording ? (
                            <button
                                type="button"
                                onClick={startRecording}
                                disabled={isProcessing}
                                className={cn(coralButton, "h-14 w-full px-7 text-base sm:w-auto")}
                            >
                                {isProcessing ? (
                                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Mic className="size-5" aria-hidden="true" />
                                )}
                                {isProcessing ? "Saving your answer…" : "Start answering"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={stopRecording}
                                className={cn(inkButton, "h-14 w-full px-7 text-base sm:w-auto")}
                            >
                                <Square className="size-5" aria-hidden="true" />
                                Stop and submit
                            </button>
                        )}
                        <span className="text-sm text-sg-muted">
                            {isRecording
                                ? "Your answer is scored after you submit."
                                : "Answers are captured by voice. Chrome or Edge works best."}
                        </span>
                    </div>
                </main>

                <aside
                    aria-label="You and your coach"
                    className="flex min-w-[min(260px,100%)] max-w-full flex-[1_1_300px] flex-col gap-4 lg:max-w-[380px]"
                >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-sg-glass-border bg-sg-lavender-soft shadow-[var(--sg-shadow)]">
                        <video
                            ref={setVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="size-full -scale-x-100 object-cover"
                        />
                        <span className="absolute left-3 top-3 inline-flex h-7 items-center gap-1.5 rounded-full bg-sg-ink px-2.5 text-[13px] font-bold text-sg-ink-foreground">
                            {isRecording ? (
                                <>
                                    <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-sg-coral" />
                                    Recording
                                </>
                            ) : (
                                <>
                                    <Video className="size-3.5" aria-hidden="true" />
                                    Mic on · Camera on
                                </>
                            )}
                        </span>
                        <div className="pointer-events-none absolute inset-x-3 bottom-2 h-12">
                            <AudioVisualizer stream={stream} className="h-12 text-sg-lavender" />
                        </div>

                        {/* Gaze tracking only runs on spoken questions, as before. */}
                        {!isCodingQuestion && (
                            <GazeTracker videoElement={videoElement} isActive={isRecording} onWarning={handleWarningWrapper} />
                        )}
                    </div>

                    <CoachBubble>
                        <span className="block font-bold">A tip from U</span>
                        <span className="text-sg-muted">
                            Lead with the result, then how you got there. A real number lands better than a list of tools.
                        </span>
                    </CoachBubble>

                    <div className="sg-glass mt-auto flex flex-col gap-2.5 rounded-[20px] p-4">
                        <span className={eyebrow}>Your documents</span>
                        {hasDocuments ? (
                            <ul className="flex flex-col">
                                {documents.map((doc) => (
                                    <li key={doc.label}>
                                        <a
                                            href={documentHref(doc.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                                "flex min-h-10 items-center justify-between gap-2 rounded-xl font-semibold",
                                                focusRing
                                            )}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <FileText className="size-4" aria-hidden="true" />
                                                {doc.label}
                                            </span>
                                            <span className="font-medium text-sg-muted">
                                                View<span className="sr-only"> (opens in a new tab)</span>
                                            </span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sg-muted">No documents uploaded.</p>
                        )}
                        <p className="text-[13px] leading-[18px] text-sg-muted">The hiring team can see these to verify you.</p>
                    </div>
                </aside>
            </div>
        </FocusRoot>
    );
}

function formatElapsed(startedAt: number | null, now: number) {
    const seconds = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
