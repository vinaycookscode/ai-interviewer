"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Camera, CheckCircle2, Mic } from "lucide-react";
import { AudioVisualizer } from "./audio-visualizer";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";
import { FocusRoot, eyebrow } from "./session-shell";

interface PermissionCheckProps {
    onPermissionsGranted: (stream: MediaStream) => void;
}

const noSubscription = () => () => {};
const hasSpeechRecognition = () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

export function PermissionCheck({ onPermissionsGranted }: PermissionCheckProps) {
    const [hasCamera, setHasCamera] = useState(false);
    const [hasMic, setHasMic] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Without speech recognition (e.g. Firefox) answers would silently transcribe
    // as empty, so the interview can't start. null while server rendering.
    const speechSupported = useSyncExternalStore(noSubscription, hasSpeechRecognition, () => null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Removed cleanup here as stream is passed to parent
    // useEffect(() => {
    //     return () => {
    //         if (stream) {
    //             stream.getTracks().forEach((track) => track.stop());
    //         }
    //     };
    // }, []);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const requestPermissions = async () => {
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            setStream(mediaStream);
            setHasCamera(true);
            setHasMic(true);
        } catch (err) {
            console.error("Error accessing media devices:", err);
            const name = (err as { name?: string } | null)?.name ?? "";
            if (name === "NotAllowedError") {
                setError("Permission denied. Please allow access to your camera and microphone to proceed.");
            } else if (name === "NotFoundError") {
                setError("No camera or microphone found. Please ensure your devices are connected.");
            } else {
                setError("Failed to access media devices. Please try again.");
            }
        }
    };

    const handleContinue = () => {
        if (stream) {
            onPermissionsGranted(stream);
        }
    };

    const blocked = speechSupported === false;

    return (
        <FocusRoot>
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 py-6">
                <Link
                    href="/candidate/dashboard"
                    className={cn("inline-flex items-center gap-1.5 self-start rounded-full font-semibold text-sg-muted hover:text-sg-text", focusRing)}
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Dashboard
                </Link>
                <div className="flex flex-col gap-2">
                    <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] sm:text-[44px]">
                        Check your camera and mic
                    </h1>
                    <p className="text-lg text-sg-muted">
                        The interview records your voice and video. Let&apos;s make sure both work before you start.
                    </p>
                </div>

                {blocked && (
                    <div role="alert" className="flex items-start gap-3 rounded-2xl bg-sg-danger/10 px-4 py-3 font-semibold text-sg-danger">
                        <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                        <p>
                            This browser can&apos;t capture voice answers. Please open this link in Google Chrome or
                            Microsoft Edge.
                        </p>
                    </div>
                )}
                {error && (
                    <div role="alert" className="flex items-start gap-3 rounded-2xl bg-sg-danger/10 px-4 py-3 font-semibold text-sg-danger">
                        <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                        <p>{error}</p>
                    </div>
                )}

                <section
                    aria-label="Device check"
                    className="sg-glass sg-shadow-lg grid gap-6 rounded-[24px] p-5 sm:rounded-[28px] sm:p-8 md:grid-cols-2"
                >
                    <div className="flex flex-col gap-2">
                        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[18px] bg-sg-lavender-soft">
                            {stream ? (
                                <video ref={videoRef} autoPlay playsInline muted className="size-full -scale-x-100 object-cover" />
                            ) : (
                                <Camera className="size-10 text-sg-lavender-ink" aria-hidden="true" />
                            )}
                            {hasCamera && (
                                <span className="absolute left-2 top-2 inline-flex h-7 items-center gap-1.5 rounded-full bg-sg-ink px-2.5 text-[13px] font-bold text-sg-ink-foreground">
                                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                    Camera working
                                </span>
                            )}
                        </div>
                        <span className={cn(eyebrow, "text-center")}>Video preview</span>
                    </div>

                    <div className="flex flex-col justify-center gap-5">
                        <div className="flex flex-col gap-2 rounded-[18px] bg-sg-row p-4">
                            <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-2 font-semibold">
                                    <Mic className="size-4" aria-hidden="true" />
                                    Microphone
                                </span>
                                {hasMic && (
                                    <span className="inline-flex items-center gap-1 text-[13px] font-bold text-sg-success">
                                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                        Working
                                    </span>
                                )}
                            </div>
                            <AudioVisualizer stream={stream} className="h-16" />
                        </div>

                        {!stream ? (
                            <button type="button" onClick={requestPermissions} disabled={blocked} className={cn(coralButton, "h-14 w-full text-[17px]")}>
                                Check my devices
                            </button>
                        ) : (
                            <button type="button" onClick={handleContinue} disabled={blocked} className={cn(coralButton, "h-14 w-full text-[17px]")}>
                                Start interview
                            </button>
                        )}
                    </div>
                </section>
            </div>
        </FocusRoot>
    );
}
