// Talks to Judge0 (AIIN-105, ADR 2026-10-30-code-execution-hosting): hosted Judge0 now, our own Judge0 CE later,
// with the same API. Server only. Candidate code is untrusted and runs only there, never on our servers.
import { env } from "@/env";
import type { RunLanguage } from "@/lib/judge/drivers";

/** Judge0 CE language ids. */
const LANGUAGE_IDS: Record<RunLanguage, number> = {
    javascript: 93, // Node.js 18.15.0
    python: 92, // Python 3.11.2
    java: 91, // OpenJDK 17.0.6
    cpp: 54, // C++ (GCC 9.2.0)
    typescript: 94, // TypeScript 5.0.3
    csharp: 51, // C# (Mono 6.6.0.161)
};

/** Every run: 5 s of CPU, 256 MB, no network. Output past 64 KB is cut off. */
export const LIMITS = { cpuSeconds: 5, wallSeconds: 10, memoryKb: 256_000, outputBytes: 64 * 1024 };

export const judgeConfigured = () => !!env.JUDGE0_URL;

export type RunStatus = "ok" | "compileError" | "runtimeError" | "timeLimit" | "unavailable";

export interface RunResult {
    status: RunStatus;
    stdout: string;
    /** stderr, or the compiler's output. */
    stderr: string;
    ms: number;
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const unb64 = (s: string | null | undefined) => (s ? Buffer.from(s, "base64").toString("utf8") : "");
const cut = (s: string) => (s.length > LIMITS.outputBytes ? `${s.slice(0, LIMITS.outputBytes)}\n… output cut off at 64 KB` : s);

function headers(url: URL): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (!env.JUDGE0_KEY) return h;
    // RapidAPI's listing takes its own headers; Judge0 Cloud and our own Judge0 CE take an auth token
    if (url.hostname.endsWith("rapidapi.com")) {
        h["X-RapidAPI-Key"] = env.JUDGE0_KEY;
        h["X-RapidAPI-Host"] = url.hostname;
    } else {
        h["X-Auth-Token"] = env.JUDGE0_KEY;
    }
    return h;
}

/** Runs one program and waits for the result. "unavailable" when Judge0 isn't set up or can't be reached. */
export async function runOnJudge(language: RunLanguage, source: string): Promise<RunResult> {
    if (!env.JUDGE0_URL) return { status: "unavailable", stdout: "", stderr: "", ms: 0 };
    const url = new URL("/submissions?base64_encoded=true&wait=true", env.JUDGE0_URL);
    const started = Date.now();
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers(url),
            body: JSON.stringify({
                source_code: b64(source),
                language_id: LANGUAGE_IDS[language],
                stdin: "",
                cpu_time_limit: LIMITS.cpuSeconds,
                wall_time_limit: LIMITS.wallSeconds,
                memory_limit: LIMITS.memoryKb,
                enable_network: false,
            }),
            signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) {
            console.error("Judge0 refused the run:", response.status);
            return { status: "unavailable", stdout: "", stderr: "", ms: Date.now() - started };
        }
        const data = (await response.json()) as {
            stdout?: string | null;
            stderr?: string | null;
            compile_output?: string | null;
            message?: string | null;
            status?: { id: number };
            time?: string | null;
        };
        const id = data.status?.id ?? 13;
        // 3 accepted (and 4, wrong answer, only when expected output is sent, which we don't), 5 time limit,
        // 6 compile error, 7–12 runtime errors, 13–14 Judge0's own errors
        const status: RunStatus = id <= 4 ? "ok" : id === 5 ? "timeLimit" : id === 6 ? "compileError" : id <= 12 ? "runtimeError" : "unavailable";
        return {
            status,
            stdout: cut(unb64(data.stdout)),
            stderr: cut(unb64(data.compile_output) || unb64(data.stderr) || unb64(data.message)),
            ms: data.time ? Math.round(Number(data.time) * 1000) : Date.now() - started,
        };
    } catch (error) {
        console.error("Judge0 can't be reached:", error);
        return { status: "unavailable", stdout: "", stderr: "", ms: Date.now() - started };
    }
}
