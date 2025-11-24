"use client";

import { useState, useEffect, useCallback } from "react";

interface UseTextToSpeechReturn {
    isSpeaking: boolean;
    speak: (text: string) => void;
    stop: () => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            setSynthesis(window.speechSynthesis);
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (synthesis) {
            // Cancel any ongoing speech
            synthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            synthesis.speak(utterance);
        }
    }, [synthesis]);

    const stop = useCallback(() => {
        if (synthesis) {
            synthesis.cancel();
            setIsSpeaking(false);
        }
    }, [synthesis]);

    return {
        isSpeaking,
        speak,
        stop,
    };
}
