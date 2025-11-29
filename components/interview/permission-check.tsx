"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera, Mic, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AudioVisualizer } from "./audio-visualizer";

interface PermissionCheckProps {
    onPermissionsGranted: (stream: MediaStream) => void;
}

export function PermissionCheck({ onPermissionsGranted }: PermissionCheckProps) {
    const [hasCamera, setHasCamera] = useState(false);
    const [hasMic, setHasMic] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
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
        } catch (err: any) {
            console.error("Error accessing media devices:", err);
            if (err.name === "NotAllowedError") {
                setError("Permission denied. Please allow access to your camera and microphone to proceed.");
            } else if (err.name === "NotFoundError") {
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

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <div className="flex justify-start mb-4">
                    <Button variant="ghost" onClick={() => window.location.href = "/dashboard"}>
                        ← Back to Dashboard
                    </Button>
                </div>
                <h1 className="text-3xl font-bold">System Check</h1>
                <p className="text-gray-500">
                    Let's make sure your camera and microphone are working properly before we start.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Media Permissions</CardTitle>
                    <CardDescription>
                        We need access to your camera and microphone for the interview.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Video Preview */}
                        <div className="space-y-2">
                            <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative flex items-center justify-center">
                                {stream ? (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover transform scale-x-[-1]"
                                    />
                                ) : (
                                    <Camera className="h-12 w-12 text-slate-600" />
                                )}

                                {hasCamera && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Camera OK
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-center text-gray-500">Video Preview</p>
                        </div>

                        {/* Audio Preview */}
                        <div className="space-y-4 flex flex-col justify-center">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        <Mic className="h-4 w-4" /> Microphone
                                    </span>
                                    {hasMic && (
                                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Working
                                        </span>
                                    )}
                                </div>
                                <AudioVisualizer stream={stream} />
                            </div>

                            {!stream ? (
                                <Button onClick={requestPermissions} className="w-full">
                                    Check Devices
                                </Button>
                            ) : (
                                <Button onClick={handleContinue} className="w-full">
                                    Start Interview
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
