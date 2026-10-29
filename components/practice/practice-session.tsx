"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMockQuestions, saveMockAnswer, completeMockInterview } from "@/actions/mock-interview";
import { ArrowRight, CheckCircle2, Coffee, Loader2, Mic, RotateCw, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Mascot } from "@/components/soft-glass/mascot";
import { CoachBubble } from "@/components/soft-glass/coach-bubble";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { FocusRoot, SessionHeader, eyebrow, inkButton, outlineButton } from "@/components/interview/session-shell";
import { cn } from "@/lib/utils";
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
    const [generationError, setGenerationError] = useState<string | null>(null);
    // Presentation only: scores of the answers given so far, for the question list.
    const [scores, setScores] = useState<Record<number, number>>({});

    // Ref to track if first question has been spoken (prevents double speech in dev mode)
    const hasSpokenFirstQuestion = useRef(false);

    // Hooks for audio
    const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechToText();
    const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();

    // Load questions on mount
    useEffect(() => {
        // Prevent generating questions twice in React Strict Mode
        if (hasSpokenFirstQuestion.current) return;
        hasSpokenFirstQuestion.current = true;

        const loadQuestions = async () => {
            // The stored questions (written on the first visit), plus any answers already given.
            const result = await getMockQuestions(mockInterviewId);
            if (result.questions && result.questions.length > 0) {
                const answers = result.answers ?? [];
                const answered = new Set(answers.map((a) => a.index));
                const next = result.questions.findIndex((_, i) => !answered.has(i));
                setQuestions(result.questions);
                setScores(Object.fromEntries(answers.map((a) => [a.index, a.score ?? 0])));
                setIsGenerating(false);
                setGenerationError(null);
                if (next === -1) {
                    // Every question answered: show the last one's feedback, ready to finish.
                    const last = answers.find((a) => a.index === result.questions!.length - 1);
                    setCurrentQuestionIndex(result.questions.length - 1);
                    setFeedback({ score: last?.score ?? 0, feedback: last?.feedback ?? "" });
                } else {
                    setCurrentQuestionIndex(next);
                    speak(result.questions[next]);
                }
            } else {
                const errorMsg = result.error || "Failed to generate questions";
                setGenerationError(errorMsg);
                toast.error(errorMsg);
                setIsGenerating(false);
            }
        };
        loadQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps  
    }, [mockInterviewId]);

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
                setScores((prev) => ({ ...prev, [currentQuestionIndex]: result.evaluation.score }));
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


    const header = (
        <SessionHeader
            title="Practice"
            subtitle={`${role} · ${difficulty}`}
            current={currentQuestionIndex}
            total={questions.length}
        >
            <Link href="/candidate/practice" className={outlineButton}>
                End practice
            </Link>
        </SessionHeader>
    );
    const mainCard =
        "sg-glass sg-shadow-lg flex min-w-0 flex-[999_1_560px] flex-col gap-5 rounded-[24px] p-5 sm:rounded-[28px] sm:p-8";
    const questionHeading =
        "font-display sg-soft text-[26px] font-semibold leading-[1.22] tracking-[-0.02em] text-pretty sm:text-[34px]";

    if (isGenerating) {
        return (
            <FocusRoot>
                {header}
                <main className={cn(mainCard, "items-center justify-center py-16 text-center")}>
                    <Loader2 className="size-8 animate-spin text-sg-lavender-ink" aria-hidden="true" />
                    <h1 role="status" className="font-display sg-soft text-[22px] font-semibold leading-7">
                        U is writing questions for {role}…
                    </h1>
                </main>
            </FocusRoot>
        );
    }

    // Questions failed to load: the "busy" state.
    if (generationError || questions.length === 0) {
        const rateLimited = generationError?.includes("rate limit") || generationError?.includes("429");
        return (
            <FocusRoot>
                {header}
                <main className={mainCard}>
                    <h1 className={questionHeading}>U needs a short break</h1>
                    <div role="alert" className="flex flex-col gap-3 rounded-[18px] bg-sg-row p-5">
                        <div className="flex items-center gap-3">
                            <Coffee className="size-5 shrink-0" aria-hidden="true" />
                            <span className="font-bold">{rateLimited ? "A lot of people are practising right now" : "I couldn't write your questions"}</span>
                        </div>
                        <p className="text-sg-muted">
                            {rateLimited
                                ? "So I can't write new questions for a few minutes. Wait a little and try again, or try a different role or level."
                                : "Something went wrong on my side. Wait a few minutes and try again, or try a different role or level."}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsGenerating(true);
                                    setGenerationError(null);
                                    window.location.reload();
                                }}
                                className={cn(inkButton, "h-12 px-[22px]")}
                            >
                                <RotateCw className="size-4" aria-hidden="true" />
                                Try again
                            </button>
                            <Link href="/candidate/company-prep" className={cn("sg-glass inline-flex h-12 items-center justify-center rounded-full px-[22px] font-bold", focusRing)}>
                                Practise company questions instead
                            </Link>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push("/candidate/practice")}
                        className={cn("self-start rounded-full p-2 font-bold", focusRing)}
                    >
                        Choose a different role
                    </button>
                </main>
            </FocusRoot>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isLast = currentQuestionIndex >= questions.length - 1;
    // saveMockAnswer scores 1-10; 0 means Gemini was unavailable and the answer was saved unscored.
    const unscored = feedback?.score === 0;

    return (
        <FocusRoot>
            {header}
            <div className="flex flex-1 flex-wrap items-start gap-5">
                <main className={mainCard}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex h-[30px] items-center rounded-full bg-sg-lavender-soft px-3 text-[13px] font-bold text-sg-lavender-ink">
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                        <button
                            type="button"
                            onClick={() => (isSpeaking ? stopSpeaking() : speak(currentQuestion))}
                            aria-pressed={isSpeaking}
                            className={cn(
                                "inline-flex h-10 items-center gap-2 rounded-full bg-sg-chip px-3.5 text-sm font-semibold transition-opacity hover:opacity-80",
                                focusRing
                            )}
                        >
                            <Volume2 className={cn("size-4", isSpeaking && "animate-pulse")} aria-hidden="true" />
                            {isSpeaking ? "Stop reading" : "Hear it again"}
                        </button>
                    </div>
                    <h1 className={questionHeading}>{currentQuestion}</h1>

                    {!feedback ? (
                        <>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-2">
                                    <label htmlFor="practice-answer" className={eyebrow}>
                                        Your answer
                                    </label>
                                    {isListening && (
                                        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold">
                                            <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-sg-coral" />
                                            Listening
                                        </span>
                                    )}
                                </div>
                                <textarea
                                    id="practice-answer"
                                    rows={6}
                                    placeholder="Speak, or type your answer here"
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    disabled={isSubmitting}
                                    className={cn(
                                        "min-h-[168px] w-full resize-y rounded-[18px] border border-sg-field-border bg-sg-row px-4 py-3.5 text-base leading-[26px] text-sg-text placeholder:text-sg-muted/70 focus-visible:border-sg-lavender disabled:opacity-60",
                                        focusRing
                                    )}
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={isListening ? stopListening : startListening}
                                    disabled={isSubmitting}
                                    aria-pressed={isListening}
                                    className={cn(
                                        "inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full px-[22px] font-bold transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60 sm:w-auto",
                                        isListening
                                            ? "bg-sg-ink text-sg-ink-foreground"
                                            : "border border-sg-field-border bg-sg-row text-sg-text",
                                        focusRing
                                    )}
                                >
                                    {isListening ? <Square className="size-5" aria-hidden="true" /> : <Mic className="size-5" aria-hidden="true" />}
                                    {isListening ? "Stop listening" : "Answer out loud"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitAnswer}
                                    disabled={!answer.trim() || isSubmitting}
                                    className={cn(coralButton, "h-14 w-full px-[26px] sm:w-auto")}
                                >
                                    {isSubmitting && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
                                    {isSubmitting ? "U is scoring…" : "Submit answer"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="rounded-[18px] bg-sg-row px-4 py-3.5 text-sg-muted">{answer}</div>
                            {unscored ? (
                                <section role="status" aria-label="Feedback from U" className="flex flex-col gap-3 rounded-[18px] bg-sg-row p-5">
                                    <div className="flex items-center gap-3">
                                        <Coffee className="size-5 shrink-0" aria-hidden="true" />
                                        <span className="font-bold">U needs a short break</span>
                                    </div>
                                    <p className="text-sg-muted">
                                        A lot of people are practising right now, so I couldn&apos;t score this answer. Your answer
                                        is saved; carry on with the next question.
                                    </p>
                                </section>
                            ) : (
                                <section
                                    role="status"
                                    aria-label="Feedback from U"
                                    className="flex flex-col gap-3.5 rounded-[22px] bg-sg-lavender-soft p-[18px]"
                                >
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-display sg-soft text-[28px] font-semibold leading-[30px]">
                                            {feedback.score.toFixed(1)}
                                        </span>
                                        <span className="text-sm font-semibold text-sg-lavender-ink">/ 10</span>
                                    </div>
                                    <div className="h-px bg-sg-rule" />
                                    <div className="flex items-start gap-3">
                                        <Mascot className="size-9" />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[13px] font-bold leading-[18px] text-sg-lavender-ink">Feedback from U</span>
                                            <span className="text-[15px] font-semibold leading-[23px]">{feedback.feedback}</span>
                                        </div>
                                    </div>
                                </section>
                            )}
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleNextQuestion}
                                    disabled={isSubmitting}
                                    className={cn(coralButton, "h-14 w-full px-[26px] sm:w-auto")}
                                >
                                    {isSubmitting && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
                                    {isLast ? (isSubmitting ? "Finishing…" : "Finish practice") : "Next question"}
                                    {!isSubmitting &&
                                        (isLast ? (
                                            <CheckCircle2 className="size-5" aria-hidden="true" />
                                        ) : (
                                            <ArrowRight className="size-5" aria-hidden="true" />
                                        ))}
                                </button>
                            </div>
                        </>
                    )}
                </main>

                <aside
                    aria-label="This practice"
                    className="flex min-w-[min(260px,100%)] max-w-full flex-[1_1_300px] flex-col gap-4 lg:max-w-[380px]"
                >
                    <CoachBubble>
                        <span className="text-sg-muted">
                            Answer like you would in the room. If you blank, say so and take a breath: I score what you say,
                            not how fast.
                        </span>
                    </CoachBubble>
                    <div className="sg-glass flex flex-col gap-2 rounded-[22px] p-4">
                        <span className={eyebrow}>
                            This practice · {role}, {difficulty}
                        </span>
                        <ol className="flex flex-col gap-1">
                            {questions.map((question, index) => {
                                const isCurrent = index === currentQuestionIndex;
                                const done = index < currentQuestionIndex || (isCurrent && !!feedback);
                                const score = scores[index];
                                return (
                                    <li
                                        key={index}
                                        aria-current={isCurrent ? "step" : undefined}
                                        className={cn(
                                            "flex items-center gap-3 rounded-2xl px-3 py-2.5",
                                            (done || isCurrent) && "bg-sg-row"
                                        )}
                                    >
                                        <span className="flex size-[26px] shrink-0 items-center justify-center rounded-lg bg-sg-chip text-[13px] font-bold">
                                            {index + 1}
                                        </span>
                                        <span
                                            className={cn(
                                                "line-clamp-2 min-w-0 flex-1 text-[15px] leading-[22px]",
                                                done || isCurrent ? "font-semibold" : "text-sg-muted"
                                            )}
                                        >
                                            {question}
                                        </span>
                                        {done && score ? (
                                            <span className="inline-flex h-[30px] min-w-12 shrink-0 items-center justify-center rounded-full bg-sg-lavender-soft px-2.5 text-sm font-bold text-sg-lavender-ink">
                                                {score.toFixed(1)}
                                                <span className="sr-only"> out of 10</span>
                                            </span>
                                        ) : done ? (
                                            <span className="inline-flex h-[30px] shrink-0 items-center rounded-full bg-sg-chip px-2.5 text-[13px] font-bold">
                                                Saved
                                            </span>
                                        ) : isCurrent ? (
                                            <span className="inline-flex h-[30px] shrink-0 items-center rounded-full bg-sg-ink px-2.5 text-[13px] font-bold text-sg-ink-foreground">
                                                Now
                                            </span>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                </aside>
            </div>
        </FocusRoot>
    );
}
