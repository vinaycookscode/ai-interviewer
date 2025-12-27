"use server";

export async function runCode(language: string, source: string) {
    // Piston API supports many languages. Mapping common ones:
    const languageMap: Record<string, string> = {
        javascript: "javascript",
        python: "python3",
        java: "java",
        cpp: "cpp",
        c: "c",
        go: "go",
        typescript: "typescript",
    };

    const runtimeLanguage = languageMap[language.toLowerCase()] || language;

    // For JS/TS, we use Node.js runtime
    const version = runtimeLanguage === "javascript" || runtimeLanguage === "typescript" ? "18.15.0" : "*";

    try {
        const response = await fetch("https://emkc.org/api/v2/piston/execute", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                language: runtimeLanguage,
                version: version,
                files: [
                    {
                        content: source,
                    },
                ],
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                error: data.message || "Failed to execute code",
            };
        }

        return {
            output: data.run.output, // This usually contains both stdout and stderr
            stderr: data.run.stderr,
            stdout: data.run.stdout,
            code: data.run.code,
            signal: data.run.signal,
        };
    } catch (error) {
        console.error("Code execution error:", error);
        return {
            error: "Failed to connect to execution service",
        };
    }
}
