"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function useCopyPastePrevention(isActive: boolean = true) {
    useEffect(() => {
        if (!isActive) return;

        const handlePreventDefault = (e: Event) => {
            e.preventDefault();
            toast.warning("Copying, pasting, and right-click are disabled during the interview.", {
                id: "copy-paste-warning", // Prevent duplicate toasts
                duration: 2000,
            });
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Cmd+C, Cmd+V, Cmd+X, Cmd+A
            if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "a")
            ) {
                e.preventDefault();
                toast.warning("Keyboard shortcuts are disabled.", {
                    id: "shortcut-warning",
                    duration: 2000,
                });
            }

            // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (View Source)
            if (
                e.key === "F12" ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "J")) ||
                ((e.ctrlKey || e.metaKey) && e.key === "u")
            ) {
                e.preventDefault();
                toast.warning("Developer tools are disabled.", {
                    id: "devtools-warning",
                    duration: 2000,
                });
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
    }, [isActive]);
}
