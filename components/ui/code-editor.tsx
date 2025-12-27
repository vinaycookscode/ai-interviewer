"use client";

import React from "react";
import Editor, { OnChange } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";

interface CodeEditorProps {
    value: string;
    onChange: (value: string | undefined) => void;
    language?: string;
    height?: string;
    readOnly?: boolean;
}

const CodeEditor = React.memo(({
    value,
    onChange,
    language = "javascript",
    height = "300px",
    readOnly = false
}: CodeEditorProps) => {
    const { theme } = useTheme();
    const editorTheme = theme === "dark" ? "vs-dark" : "light";

    const handleEditorChange: OnChange = (value, event) => {
        onChange(value);
    };

    return (
        <div className="h-full border rounded-md overflow-hidden bg-background">
            <Editor
                height={height}
                language={language}
                value={value}
                theme={editorTheme}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    readOnly: readOnly,
                    padding: { top: 16, bottom: 16 },
                }}
                loading={<Skeleton className="h-full w-full" />}
            />
        </div>
    );
});

CodeEditor.displayName = "CodeEditor";

export { CodeEditor };
