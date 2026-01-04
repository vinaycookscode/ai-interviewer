"use client";

import dynamic from 'next/dynamic';
import { OnChange } from "@monaco-editor/react";
import { Loader2 } from 'lucide-react';

// Lazy load Monaco Editor for better performance
const Editor = dynamic(() => import("@monaco-editor/react"), {
    loading: () => (
        <div className="flex items-center justify-center h-full min-h-[400px] bg-muted/30 rounded-lg">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading code editor...</p>
            </div>
        </div>
    ),
    ssr: false // Disable SSR for Monaco Editor
});

interface CodeEditorProps {
    value?: string;
    onChange?: OnChange;
    language?: string;
    height?: string;
    theme?: string;
    readOnly?: boolean;
    options?: any;
}

export function CodeEditor({
    value = "",
    onChange,
    language = "javascript",
    height = "400px",
    theme = "vs-dark",
    readOnly = false,
    options = {},
}: CodeEditorProps) {
    const defaultOptions = {
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        readOnly,
        ...options,
    };

    return (
        <Editor
            height={height}
            language={language}
            value={value}
            onChange={onChange}
            theme={theme}
            options={defaultOptions}
        />
    );
}
