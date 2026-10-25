"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const MAX_BARS = 48;

/**
 * Live microphone level as rounded bars. Bars take the element's text colour,
 * so set it with a token class (e.g. `text-sg-lavender`).
 */
export function AudioVisualizer({ stream, className }: { stream: MediaStream | null; className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!stream || !canvasRef.current) return;

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        // Resume context if suspended (browser policy)
        if (audioContext.state === "suspended") {
            audioContext.resume().catch((e) => console.error("Audio resume failed", e));
        }

        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const bars = Math.min(MAX_BARS, dataArray.length);

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext("2d");
        if (!canvasCtx) return;

        let animationId: number;

        const draw = () => {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            // Read each frame, so a theme switch recolours the bars.
            canvasCtx.fillStyle = getComputedStyle(canvas).color;

            const gap = 3;
            const barWidth = (canvas.width - gap * (bars - 1)) / bars;

            for (let i = 0; i < bars; i++) {
                const barHeight = Math.max(3, (dataArray[i] / 255) * canvas.height);
                canvasCtx.beginPath();
                canvasCtx.roundRect(i * (barWidth + gap), canvas.height - barHeight, barWidth, barHeight, 3);
                canvasCtx.fill();
            }
        };

        draw();

        return () => {
            cancelAnimationFrame(animationId);
            audioContext.close();
        };
    }, [stream]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={100}
            aria-hidden="true"
            className={cn("h-24 w-full bg-transparent text-sg-lavender", className)}
        />
    );
}
