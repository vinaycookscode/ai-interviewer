// Talks to the code runner (AIIN-105, ADR 2026-10-30-code-execution-hosting): Piston on our own server, behind
// HTTPS and a token (docs/CODE_RUNNER_SETUP.md). Server only. Candidate code is untrusted and runs only there,
// never on our app servers.
import { env } from "@/env";
import type { RunLanguage } from "@/lib/judge/drivers";

/** Piston's names for our languages. The server has one version of each installed. */
const PISTON_LANGUAGES: Record<RunLanguage, string> = {
    javascript: "javascript",
    python: "python",
    java: "java",
    cpp: "c++",
    typescript: "typescript",
    csharp: "csharp",
};

/**
 * Every run: 10 s and 10 s of CPU, 256 MB, no network (also capped on the server). Output past 64 KB is cut off.
 * Java compiles inside its run step, on a small server, so a run gets more than the 5 s we'd like.
 */
export const LIMITS = { runMs: 10_000, compileMs: 30_000, memoryBytes: 256 * 1024 * 1024, outputBytes: 64 * 1024 };

export const judgeConfigured = () => !!env.RUNNER_URL;

export type RunStatus = "ok" | "compileError" | "runtimeError" | "timeLimit" | "unavailable";

export interface RunResult {
    status: RunStatus;
    stdout: string;
    /** stderr, or the compiler's output. */
    stderr: string;
    ms: number;
}

interface PistonStage {
    stdout?: string;
    stderr?: string;
    code?: number | null;
    signal?: string | null;
    /** TO time out, RE runtime error, SG killed by a signal, OL/EL output too long, XX Piston's own error. */
    status?: string | null;
    message?: string | null;
    wall_time?: number;
}

const cut = (s: string) => (s.length > LIMITS.outputBytes ? `${s.slice(0, LIMITS.outputBytes)}\n… output cut off at 64 KB` : s);
const unavailable = (started: number): RunResult => ({ status: "unavailable", stdout: "", stderr: "", ms: Date.now() - started });

/** Runs one program and waits for the result. "unavailable" when the runner isn't set up or can't be reached. */
export async function runOnJudge(language: RunLanguage, source: string): Promise<RunResult> {
    const started = Date.now();
    if (!env.RUNNER_URL) return unavailable(started);
    try {
        const response = await fetch(new URL("/api/v2/execute", env.RUNNER_URL), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(env.RUNNER_TOKEN ? { "X-Auth-Token": env.RUNNER_TOKEN } : {}) },
            body: JSON.stringify({
                language: PISTON_LANGUAGES[language],
                version: "*",
                files: [{ content: source }],
                stdin: "",
                run_timeout: LIMITS.runMs,
                run_cpu_time: LIMITS.runMs,
                compile_timeout: LIMITS.compileMs,
                compile_cpu_time: LIMITS.compileMs,
                run_memory_limit: LIMITS.memoryBytes,
            }),
            signal: AbortSignal.timeout(LIMITS.compileMs + LIMITS.runMs + 5_000),
        });
        if (!response.ok) {
            console.error("The code runner refused the run:", response.status);
            return unavailable(started);
        }
        const data = (await response.json()) as { compile?: PistonStage; run?: PistonStage };
        const { compile, run } = data;
        if (compile && (compile.code !== 0 || compile.signal)) {
            const timedOut = compile.status === "TO";
            return { status: timedOut ? "timeLimit" : "compileError", stdout: "", stderr: cut(compile.stderr || compile.stdout || ""), ms: Date.now() - started };
        }
        if (!run || run.status === "XX") return unavailable(started);
        const status: RunStatus = run.status === "TO" ? "timeLimit" : run.code !== 0 || run.signal ? "runtimeError" : "ok";
        return {
            status,
            stdout: cut(run.stdout ?? ""),
            stderr: cut(run.stderr || (status === "ok" ? "" : run.message || run.signal || "")),
            ms: run.wall_time ?? Date.now() - started,
        };
    } catch (error) {
        console.error("The code runner can't be reached:", error);
        return unavailable(started);
    }
}
