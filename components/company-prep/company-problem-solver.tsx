"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2, Loader2, MinusCircle, Play, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { saveUserSolution, getUserSolution, analyzeSolution, type CodeAnalysis } from "@/actions/company-prep";
import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { Mascot } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { field, glassButton, inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { canRunTests } from "@/lib/code-languages";
import { runProblemTests } from "@/actions/code-execution";
import { asError, callSource, judge, parseInput, type TestCase, type TestRun } from "@/lib/problems/run-js";
import { cn } from "@/lib/utils";

const Editor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => <div aria-hidden="true" className="sg-skeleton h-[400px] rounded-[18px]" />,
});

export interface SolverQuestion {
    id: string;
    question: string;
    /** Detailed problem statement */
    description: string | null;
    type: string;
    difficulty: string;
    frequency: number;
    answer: string | null;
    tips: string | null;
    tags: string[];
    starterCode: string | null;
    solutionCode: string | null;
    testCases: unknown[];
    language: string | null;
    /** Up to 3, written in the admin console (AIIN-107). */
    hints: string[];
    /** Starter code per language, matching what the tests call (AIIN-105). */
    starters: Partial<Record<string, string>>;
    /** Hidden tests run on the server only: the page gets their number, never their content. */
    hiddenCount: number;
}

interface CompanyProblemSolverProps {
    question: SolverQuestion;
    companyName: string;
    onClose: () => void;
    featureFlags?: { languageSelector: boolean; codePersistence: boolean; aiCodeAnalysis: boolean; serverJudge?: boolean };
}

interface TestResult {
    status: "passed" | "failed" | "error" | "timeLimit" | "notRun";
    /** A hidden test says whether it passed, not what it is (AIIN-107). */
    hidden: boolean;
    input: string;
    expected: string;
    output: string;
}

const LANGUAGES = [
    { id: "javascript", name: "JavaScript" },
    { id: "python", name: "Python" },
    { id: "java", name: "Java" },
    { id: "cpp", name: "C++" },
] as const;

const LEVELS = ["EASY", "MEDIUM", "HARD"] as const;
const TYPES = ["CODING", "APTITUDE", "HR", "GD"] as const;
// Same threshold as the company page's "Asked often".
const OFTEN = 8;

const chip = "inline-flex h-7 items-center rounded-full bg-sg-chip px-2.5 text-sm font-semibold";
const asText = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v));

function starterCode(q: SolverQuestion, lang: string): string {
    if (q.starters[lang]) return q.starters[lang];
    if (lang === "javascript" && q.starterCode) return q.starterCode;
    const header = (c: string) => `${c} ${q.question}\n`;
    switch (lang) {
        case "typescript":
            return `${header("//")}\nfunction solution(input: any): any {\n    // Your code here\n}\n`;
        case "python":
            return `${header("#")}\ndef solution(input):\n    # Your code here\n    pass\n`;
        case "java":
            return `${header("//")}\nclass Solution {\n    public Object solution(Object input) {\n        // Your code here\n        return null;\n    }\n}\n`;
        case "cpp":
            return `${header("//")}\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    // Your code here\n};\n`;
        default:
            return `${header("//")}\nfunction solution(input) {\n    // Your code here\n}\n`;
    }
}

// Fallback statement for questions saved without a description.
function getProblemDescription(q: SolverQuestion): string {
    const qLower = q.question.toLowerCase();

    if (qLower.includes("two sum") || qLower.includes("add up")) {
        return `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.`;
    }
    if (qLower.includes("reverse") && qLower.includes("link")) {
        return `Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nYou should reverse the links between nodes to reverse the list in-place.`;
    }
    if (qLower.includes("substring") && !qLower.includes("repeat")) {
        return `Given a string s, find the length of the longest substring without repeating characters.\n\nA substring is a contiguous sequence of characters within a string.`;
    }
    if (qLower.includes("longest substring")) {
        return `Given a string s, find the length of the longest substring without repeating characters.\n\nA substring is a contiguous non-empty sequence of characters within a string.`;
    }
    if (qLower.includes("palindrome")) {
        return `Given a string s, return true if it is a palindrome, or false otherwise.\n\nA palindrome is a string that reads the same forward and backward.`;
    }
    if (qLower.includes("binary search")) {
        return `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.`;
    }
    if (qLower.includes("valid parentheses") || qLower.includes("balanced")) {
        return `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.`;
    }
    if (qLower.includes("lru cache")) {
        return `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- LRUCache(int capacity): Initialize the LRU cache with positive size capacity.\n- int get(int key): Return the value of the key if it exists, otherwise return -1.\n- void put(int key, int value): Update the value if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity, evict the least recently used key.`;
    }
    if (qLower.includes("maximum subarray") || qLower.includes("kadane")) {
        return `Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.`;
    }
    if (qLower.includes("merge") && qLower.includes("sorted")) {
        return `You are given the heads of two sorted linked lists list1 and list2.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.`;
    }
    if (qLower.includes("cycle") && qLower.includes("link")) {
        return `Given head, the head of a linked list, determine if the linked list has a cycle in it.\n\nThere is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the next pointer.`;
    }

    // Default description
    return `Solve the following problem efficiently. Consider the time and space complexity of your solution. Make sure to handle edge cases appropriately.`;
}

// Runs JavaScript or TypeScript in the browser; other languages never reach here (see canRunTests).
// The calling and judging rules are shared with the admin's "Check solution" (lib/problems/run-js.ts).
const executeCode = (userCode: string, testCase: TestCase): TestRun => {
    try {
        const func = new Function("input", callSource(userCode));
        return judge(func(parseInput(testCase.input)), testCase.expected);
    } catch (err) {
        return asError(err);
    }
};

export function CompanyProblemSolver({
    question,
    companyName,
    onClose,
    featureFlags = { languageSelector: true, codePersistence: true, aiCodeAnalysis: true },
}: CompanyProblemSolverProps) {
    const t = useTranslations("CompanyPrep");
    const { resolvedTheme } = useTheme();
    const backRef = useRef<HTMLButtonElement>(null);

    const [language, setLanguage] = useState<string>("javascript");
    const [code, setCode] = useState(() => starterCode(question, "javascript"));
    const [results, setResults] = useState<TestResult[] | null>(null);
    const [runNote, setRunNote] = useState<string | null>(null);
    const [testedCode, setTestedCode] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
    const [busy, setBusy] = useState<"run" | "review" | "submit" | null>(null);

    const testCases = question.testCases.filter((tc): tc is TestCase => !!tc && typeof tc === "object" && "input" in tc && "expected" in tc);
    // On the judge every language runs, hidden tests included; without it, JavaScript runs the visible tests here
    const serverJudge = featureFlags.serverJudge === true;
    const runnable = serverJudge || canRunTests(language);
    const canRun = runnable && testCases.length + (serverJudge ? question.hiddenCount : 0) > 0;
    const starter = starterCode(question, language);
    const storageKey = `company-prep-code-${question.id}-${language}`;
    const languageName = LANGUAGES.find((l) => l.id === language)?.name ?? language;
    const levelName = (LEVELS as readonly string[]).includes(question.difficulty) ? t(`levels.${question.difficulty as (typeof LEVELS)[number]}`) : question.difficulty;
    const typeName = (TYPES as readonly string[]).includes(question.type) ? t(`types.${question.type as (typeof TYPES)[number]}`) : question.type;
    const hint = question.tips || (question.answer ? `${question.answer.split(".")[0]}.` : null);
    const example = testCases.find((tc) => !tc.hidden);

    // Focus the back button when the solver opens, and let Escape close it.
    useEffect(() => {
        backRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !(e.target instanceof HTMLElement && e.target.closest(".monaco-editor"))) onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    // Load this language's saved code: the submitted solution first, then this device's draft, then the starter.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const result = await getUserSolution(question.id, language).catch(() => null);
            if (cancelled) return;
            const draft = featureFlags.codePersistence ? localStorage.getItem(storageKey) : null;
            setCode(draft ?? result?.solution?.code ?? starterCode(question, language));
        })();
        return () => {
            cancelled = true;
        };
    }, [question, language, storageKey, featureFlags.codePersistence]);

    const changeCode = (value: string) => {
        setCode(value);
        if (!featureFlags.codePersistence) return;
        if (value && value !== starter) localStorage.setItem(storageKey, value);
        else localStorage.removeItem(storageKey);
    };

    const changeLanguage = (lang: string) => {
        setResults(null);
        setAnalysis(null);
        setLanguage(lang);
    };

    const startOver = () => {
        if (featureFlags.codePersistence) localStorage.removeItem(storageKey);
        setCode(starter);
        setResults(null);
        setAnalysis(null);
    };

    const runHere = () =>
        testCases.map((tc): TestResult => {
            const result = executeCode(code, tc);
            return { status: result.passed ? "passed" : "failed", hidden: false, input: asText(tc.input), expected: asText(tc.expected), output: result.output };
        });

    const run = async () => {
        setBusy("run");
        setRunNote(null);
        if (!serverJudge) {
            setResults(runHere());
        } else {
            const result = await runProblemTests(question.id, language, code).catch(() => ({ error: "unavailable" as const }));
            if (result.error || !result.cases) {
                // The judge is down: JavaScript can still run its visible tests here
                if (result.error === "unavailable" && canRunTests(language) && testCases.length) {
                    setResults(runHere());
                    setRunNote(t("solver.ranHere"));
                } else {
                    setResults(null);
                    setRunNote(t(`solver.runErrors.${result.error ?? "unavailable"}`));
                }
            } else {
                const visible = testCases;
                let v = 0;
                setResults(
                    result.cases.map((c) => {
                        if (c.hidden) return { status: c.status, hidden: true, input: "", expected: "", output: "" };
                        const tc = visible[v++];
                        return { status: c.status, hidden: false, input: tc ? asText(tc.input) : "", expected: c.expected ?? "", output: c.output ?? "" };
                    })
                );
                if (result.status === "compileError") setRunNote(t("solver.compileError", { message: result.message.slice(0, 2000) }));
                else if (result.status === "timeLimit") setRunNote(t("solver.timeLimitNote"));
            }
        }
        setTestedCode(code);
        setBusy(null);
    };

    const review = async () => {
        if (!code.trim() || code === starter) {
            toast.error(t("solver.writeFirst"));
            return;
        }
        setBusy("review");
        setAnalysis(null);
        const result = await analyzeSolution(question.id, code, language);
        if (result.success) setAnalysis(result.analysis);
        else toast.error(result.error);
        setBusy(null);
    };

    const submit = async () => {
        if (!code.trim() || code === starter) {
            toast.error(t("solver.writeFirst"));
            return;
        }
        setBusy("submit");
        // Only results from running this exact code count; languages that can't run save no test counts (AIIN-149)
        // On the judge the server runs the tests again and keeps its own counts (AIIN-105)
        const passed = canRun && results && testedCode === code ? results.filter((r) => r.status === "passed").length : 0;
        const total = canRun ? testCases.length : 0;
        const result = await saveUserSolution(question.id, code, language, passed, total).catch(() => null);
        if (result?.success) toast.success(t("solver.submitted"));
        else toast.error(t("solver.submitFailed"));
        setBusy(null);
    };

    const passedCount = results?.filter((r) => r.status === "passed").length ?? 0;
    const statusWord = (r: TestResult) => t(`solver.statuses.${r.status}`);
    const allPassed = results !== null && passedCount === results.length;

    return (
        <div role="dialog" aria-modal="true" aria-label={question.question} className="fixed inset-0 z-[60] overflow-y-auto bg-sg-bg">
            <AmbientLight className="fixed" />
            <div className="relative flex flex-col gap-5 px-3 pt-3 pb-7 sm:px-7 sm:pt-5">
                <header className="sg-glass flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-[22px] py-2.5 pr-3 pl-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            ref={backRef}
                            type="button"
                            onClick={onClose}
                            aria-label={t("solver.back", { company: companyName })}
                            className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-sg-chip", focusRing)}
                        >
                            <ArrowLeft className="size-[18px]" aria-hidden="true" />
                        </button>
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate font-bold">{question.question}</span>
                            <span className="text-[13px] leading-[18px] font-medium text-sg-muted">
                                {t("solver.meta", { company: companyName, type: typeName, level: levelName })}
                            </span>
                        </div>
                    </div>
                    <span className="hidden sm:inline-flex">
                        <ThemeSwitch />
                    </span>
                </header>

                <div className="flex flex-wrap items-start gap-5">
                    <section aria-label={t("solver.problem")} className="sg-glass flex min-w-0 flex-[1_1_360px] flex-col gap-5 rounded-[24px] p-5 sm:rounded-[28px] sm:p-7 lg:max-w-[520px]">
                        <div className="flex flex-col gap-3">
                            <h1 className="font-display sg-soft text-[28px] font-semibold leading-[1.18] tracking-[-0.02em] sm:text-[34px]">{question.question}</h1>
                            <span className="flex flex-wrap gap-1.5">
                                <span className={chip}>{levelName}</span>
                                {question.tags.map((tag) => (
                                    <span key={tag} className={chip}>
                                        {tag}
                                    </span>
                                ))}
                                {question.frequency >= OFTEN && (
                                    <span className={cn(chip, "bg-sg-lavender-soft text-sg-lavender-ink")}>{t("solver.often", { company: companyName })}</span>
                                )}
                            </span>
                        </div>
                        <p className="text-[17px] leading-[27px] whitespace-pre-line">{question.description || getProblemDescription(question)}</p>
                        {example && (
                            <div className="flex flex-col gap-1 rounded-[18px] bg-sg-row px-4 py-3.5 font-mono text-sm [overflow-wrap:anywhere]">
                                <span className="font-sans text-[13px] leading-[18px] font-bold text-sg-muted">{t("solver.example")}</span>
                                <span>{t("solver.input", { value: asText(example.input) })}</span>
                                <span>{t("solver.output", { value: asText(example.expected) })}</span>
                            </div>
                        )}
                        {question.hints.length > 0
                            ? question.hints.map((h, i) => (
                                  <details key={i} className="group rounded-[18px] bg-sg-row px-4 py-3">
                                      <summary className={cn("cursor-pointer rounded-md font-bold", focusRing)}>{t("solver.hintN", { n: i + 1 })}</summary>
                                      <p className="mt-2 text-sg-muted">{h}</p>
                                  </details>
                              ))
                            : hint && (
                                  <details className="group rounded-[18px] bg-sg-row px-4 py-3">
                                      <summary className={cn("cursor-pointer rounded-md font-bold", focusRing)}>{t("solver.hint")}</summary>
                                      <p className="mt-2 text-sg-muted">{hint}</p>
                                  </details>
                              )}
                        {question.solutionCode && (
                            <details className="rounded-[18px] bg-sg-row px-4 py-3">
                                <summary className={cn("cursor-pointer rounded-md font-bold", focusRing)}>{t("solver.solution")}</summary>
                                <pre className="mt-3 overflow-x-auto rounded-xl bg-sg-chip p-3 font-mono text-sm leading-6">{question.solutionCode}</pre>
                            </details>
                        )}
                    </section>

                    <section aria-label={t("solver.yourSolution")} className="sg-glass sg-shadow-lg flex min-w-0 flex-[999_1_520px] flex-col gap-4 rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="flex flex-wrap items-center gap-3">
                                {featureFlags.languageSelector && (
                                    <>
                                        <label htmlFor="lang" className="sr-only">
                                            {t("solver.language")}
                                        </label>
                                        <select id="lang" value={language} onChange={(e) => changeLanguage(e.target.value)} className={cn(field, "h-10 w-auto rounded-full px-4 text-sm font-semibold")}>
                                            {LANGUAGES.map((l) => (
                                                <option key={l.id} value={l.id}>
                                                    {l.name}
                                                </option>
                                            ))}
                                        </select>
                                    </>
                                )}
                                {featureFlags.codePersistence && code !== starter && (
                                    <span className="text-[13px] leading-[18px] font-medium text-sg-muted">{t("solver.saved")}</span>
                                )}
                            </span>
                            <button type="button" onClick={startOver} className={cn(outlineButton, "h-10 text-sm")}>
                                <RotateCcw className="size-4" aria-hidden="true" />
                                {t("solver.startOver")}
                            </button>
                        </div>

                        <div role="group" aria-label={t("solver.code")} className="overflow-hidden rounded-[18px] border border-sg-glass-border">
                            <Editor
                                height="400px"
                                language={language === "cpp" ? "cpp" : language}
                                value={code}
                                onChange={(value) => changeCode(value ?? "")}
                                theme={resolvedTheme === "light" ? "light" : "vs-dark"}
                                options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4, wordWrap: "on" }}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                            {canRun && (
                                <button type="button" onClick={run} disabled={busy !== null} className={cn(inkButton, "h-12")}>
                                    {busy === "run" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
                                    {busy === "run" ? t("solver.running") : t("solver.run")}
                                </button>
                            )}
                            {featureFlags.aiCodeAnalysis && (
                                <button type="button" onClick={review} disabled={busy !== null} className={cn(glassButton, "h-12")}>
                                    {busy === "review" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                                    {busy === "review" ? t("solver.reviewing") : t("solver.review")}
                                </button>
                            )}
                            <button type="button" onClick={submit} disabled={busy !== null} className={cn(coralButton, "h-12 px-6")}>
                                {busy === "submit" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                                {t("solver.submit")}
                            </button>
                        </div>

                        {!runnable ? (
                            <p className="text-sg-muted">{t("solver.noRun", { language: languageName })}</p>
                        ) : !canRun ? (
                            <p className="text-sg-muted">{t("solver.noTests")}</p>
                        ) : (
                            !results && !runNote && <p className="text-sg-muted">{t("solver.runHint", { count: testCases.length + (serverJudge ? question.hiddenCount : 0) })}</p>
                        )}
                        {runNote && (
                            <p role="status" className="rounded-[18px] bg-sg-row px-4 py-3 text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">
                                {runNote}
                            </p>
                        )}

                        {canRun && results && (
                            <div role={allPassed ? "status" : "alert"} className="flex flex-col gap-2.5">
                                <span className="flex items-center gap-2 font-bold">
                                    {allPassed ? (
                                        <CheckCircle2 className="size-5 text-sg-success" aria-hidden="true" />
                                    ) : (
                                        <XCircle className="size-5 text-sg-danger" aria-hidden="true" />
                                    )}
                                    {t("solver.summary", { passed: passedCount, total: results.length })}
                                </span>
                                <ul className="flex flex-col gap-2">
                                    {results.map((r, i) => (
                                        <li key={i} className="flex items-start gap-3 rounded-[18px] bg-sg-row px-4 py-3">
                                            {r.status === "passed" ? (
                                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sg-success" aria-hidden="true" />
                                            ) : r.status === "notRun" ? (
                                                <MinusCircle className="mt-0.5 size-4 shrink-0 text-sg-muted" aria-hidden="true" />
                                            ) : (
                                                <XCircle className="mt-0.5 size-4 shrink-0 text-sg-danger" aria-hidden="true" />
                                            )}
                                            <span className="flex min-w-0 flex-col">
                                                <span className="font-semibold">
                                                    {r.hidden ? t("solver.hiddenTest", { n: i + 1, result: statusWord(r) }) : t("solver.test", { n: i + 1, result: statusWord(r) })}
                                                </span>
                                                {!r.hidden && r.status !== "notRun" && (
                                                    <span className="font-mono text-[13px] leading-[18px] text-sg-muted [overflow-wrap:anywhere]">
                                                        {r.status === "passed" || r.status === "timeLimit"
                                                            ? t("solver.expected", { input: r.input, expected: r.expected })
                                                            : t("solver.got", { input: r.input, expected: r.expected, output: r.output })}
                                                    </span>
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {analysis && (
                            <section role="status" aria-label={t("solver.reviewTitle")} className="flex flex-col gap-3.5 rounded-[22px] bg-sg-lavender-soft p-4 text-sg-text sm:p-5">
                                <div className="flex items-center gap-2.5">
                                    <Mascot className="size-9" />
                                    <span className="font-bold text-sg-lavender-ink">{t("solver.reviewTitle")}</span>
                                </div>
                                <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                                    {[
                                        [t("solver.correct"), t("solver.percent", { value: analysis.correctness })],
                                        [t("solver.quality"), t("solver.percent", { value: analysis.codeQuality })],
                                        [t("solver.time"), analysis.timeComplexity],
                                        [t("solver.space"), analysis.spaceComplexity],
                                    ].map(([label, value]) => (
                                        <div key={label} className="flex flex-col rounded-[14px] bg-sg-row px-3.5 py-2.5">
                                            <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{label}</span>
                                            <span className="font-mono font-bold">{value}</span>
                                        </div>
                                    ))}
                                </div>
                                {analysis.feedback.map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                                {analysis.isOptimal ? (
                                    <p className="flex items-center gap-2 font-semibold">
                                        <CheckCircle2 className="size-4 text-sg-success" aria-hidden="true" />
                                        {t("solver.optimal")}
                                    </p>
                                ) : (
                                    analysis.improvements.length > 0 && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("solver.improve")}</span>
                                            <ul className="flex list-disc flex-col gap-1 pl-5">
                                                {analysis.improvements.map((line, i) => (
                                                    <li key={i}>{line}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )
                                )}
                            </section>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
