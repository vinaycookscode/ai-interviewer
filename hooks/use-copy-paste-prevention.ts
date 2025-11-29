"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function useCopyPastePrevention(
    isActive: boolean = true,
    onWarning?: (message: string, type: string) => void
) {
    useEffect(() => {
        if (!isActive) return;

        const handlePreventDefault = (e: Event) => {
            e.preventDefault();
            const message = "Copying, pasting, and right-click are disabled during the interview.";
            toast.warning(message, {
                id: "copy-paste-warning", // Prevent duplicate toasts
                duration: 2000,
            });
            if (onWarning) onWarning(message, "COPY_PASTE");
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Cmd+C, Cmd+V, Cmd+X, Cmd+A
            if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "a")
            ) {
                e.preventDefault();
                const message = "Keyboard shortcuts are disabled.";
                toast.warning(message, {
                    id: "shortcut-warning",
                    duration: 2000,
                });
                if (onWarning) onWarning(message, "KEYBOARD_SHORTCUT");
            }

            // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (View Source)
            if (
                e.key === "F12" ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "J")) ||
                ((e.ctrlKey || e.metaKey) && e.key === "u")
            ) {
                e.preventDefault();
                const message = "Developer tools are disabled.";
                toast.warning(message, {
                    id: "devtools-warning",
                    duration: 2000,
                });
                if (onWarning) onWarning(message, "DEV_TOOLS");
            }
        };

        // Add event listeners to window to catch everything
        window.addEventListener("contextmenu", handlePreventDefault);
        window.addEventListener("copy", handlePreventDefault);
        window.addEventListener("paste", handlePreventDefault);
        window.addEventListener("cut", handlePreventDefault);
        window.addEventListener("keydown", handleKeyDown);

        // Cleanup
        return () => {
            window.removeEventListener("contextmenu", handlePreventDefault);
            window.removeEventListener("copy", handlePreventDefault);
            window.removeEventListener("paste", handlePreventDefault);
            window.removeEventListener("cut", handlePreventDefault);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isActive, onWarning]);
}
