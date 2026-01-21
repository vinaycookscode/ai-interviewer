"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { OnChange } from "@monaco-editor/react";
import { Loader2, Code, CheckCircle, Lightbulb, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";

// Lazy load Monaco Editor for better performance
const Editor = dynamic(() => import("@monaco-editor/react"), {
    loading: () => (
        <div className="flex items-center justify-center h-full min-h-[400px] bg-muted/30 rounded-lg border border-border/50">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Initializing editor...</p>
            </div>
        </div>
    ),
    ssr: false // Disable SSR for Monaco Editor
});

export const DEFAULT_STARTER_CODES: Record<string, string> = {
    javascript: `function solution(input) {\n    // Write your code here\n    \n}`,
    typescript: `function solution(input: any): any {\n    // Write your code here\n    \n}`,
    python: `def solution(input):\n    # Write your code here\n    pass`,
    java: `class Solution {\n    public Object solution(Object input) {\n        // Write your code here\n        return null;\n    }\n}`,
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    // Your code here\n    \n};`,
    csharp: `public class Solution {\n    public object Solve(object input) {\n        // Your code here\n        return null;\n    }\n}`
};

export const SUPPORTED_LANGUAGES = [
    { id: "javascript", name: "JavaScript", icon: "js" },
    { id: "typescript", name: "TypeScript", icon: "ts" },
    { id: "python", name: "Python", icon: "py" },
    { id: "java", name: "Java", icon: "java" },
    { id: "cpp", name: "C++", icon: "cpp" },
    { id: "csharp", name: "C#", icon: "cs" },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]["id"];

interface CodeEditorProps {
    value?: string;
    onChange?: (value: string | undefined) => void;
    language?: string;
    height?: string;
    theme?: string;
    readOnly?: boolean;
    options?: any;
    className?: string;

    // Enhanced properties
    showLanguageSelector?: boolean;
    starterCodes?: Record<string, string>;
    solutions?: Record<string, string>;
    storageKey?: string;
    onLanguageChange?: (lang: string) => void;
}

export function CodeEditor({
    value = "",
    onChange,
    language: initialLanguage = "javascript",
    height = "400px",
    theme = "vs-dark",
    readOnly = false,
    options = {},
    className,
    showLanguageSelector = false,
    starterCodes,
    solutions,
    storageKey,
    onLanguageChange
}: CodeEditorProps) {
    const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
    const [showSolution, setShowSolution] = useState(false);
    const [editorValue, setEditorValue] = useState(value);

    // Sync internal value with prop value
    useEffect(() => {
        if (value !== undefined) {
            setEditorValue(value);
        }
    }, [value]);

    // Handle language change
    const handleLanguageChange = (newLang: string) => {
        setSelectedLanguage(newLang);
        onLanguageChange?.(newLang);

        // Populate starter code if available and current editor is mostly empty or just previous starter
        const currentStarter = starterCodes?.[selectedLanguage] || DEFAULT_STARTER_CODES[selectedLanguage];
        const newStarter = starterCodes?.[newLang] || DEFAULT_STARTER_CODES[newLang];

        if (newStarter && (!editorValue.trim() || editorValue === currentStarter)) {
            setEditorValue(newStarter);
            onChange?.(newStarter);
        }

        // Hide solution when changing language
        setShowSolution(false);
    };

    const handleEditorChange: OnChange = (val) => {
        setEditorValue(val || "");
        onChange?.(val);
    };

    const defaultOptions = {
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        readOnly,
        wordWrap: "on",
        ...options,
    };

    return (
        <div className={cn("flex flex-col border rounded-xl overflow-hidden bg-card shadow-sm", className)}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
                <div className="flex items-center gap-4">
                    {showLanguageSelector ? (
                        <div className="flex items-center gap-2">
                            <Code className="h-4 w-4 text-primary" />
                            <select
                                value={selectedLanguage}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none text-foreground hover:text-primary transition-colors"
                            >
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <option key={lang.id} value={lang.id} className="bg-card">
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Code className="h-4 w-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                                {selectedLanguage}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {solutions && solutions[selectedLanguage] && (
                        <button
                            onClick={() => setShowSolution(!showSolution)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm",
                                showSolution
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "bg-background hover:bg-muted border border-border/50"
                            )}
                        >
                            <Lightbulb className={cn("h-3.5 w-3.5", showSolution ? "fill-primary" : "")} />
                            {showSolution ? "Hide Solution" : "View Solution"}
                        </button>
                    )}
                </div>
            </div>

            <div className="relative flex-1 min-h-0">
                {/* Solution Overlay */}
                {showSolution && solutions && solutions[selectedLanguage] && (
                    <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm overflow-auto p-6 transition-all animate-in fade-in zoom-in-95">
                        <div className="max-w-4xl mx-auto space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="flex items-center gap-2 font-semibold text-primary">
                                    <CheckCircle className="h-5 w-5" />
                                    {SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage)?.name} Solution
                                </h4>
                                <button
                                    onClick={() => setShowSolution(false)}
                                    className="p-1.5 hover:bg-muted rounded-full transition-colors"
                                >
                                    <Zap className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>
                            <pre className="p-4 rounded-xl bg-muted/50 border font-mono text-sm leading-relaxed overflow-x-auto selection:bg-primary/20">
                                {solutions[selectedLanguage]}
                            </pre>
                        </div>
                    </div>
                )}

                <Editor
                    height={height}
                    language={selectedLanguage}
                    value={editorValue}
                    onChange={handleEditorChange}
                    theme={theme}
                    options={defaultOptions}
                />
            </div>
        </div>
    );
}
