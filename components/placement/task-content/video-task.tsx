"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, CheckCircle, ExternalLink } from "lucide-react";

interface VideoTaskProps {
    content: {
        url?: string;
        youtubeId?: string;
        description?: string;
    };
    onComplete: () => void;
    isPending?: boolean;
}

function getYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

export function VideoTask({ content, onComplete, isPending }: VideoTaskProps) {
    const [watchedPercent, setWatchedPercent] = useState(0);
    const [canComplete, setCanComplete] = useState(false);
    const [notes, setNotes] = useState("");

    // Extract YouTube ID
    const videoId = content.youtubeId || (content.url ? getYouTubeId(content.url) : null);

    // Simulate watch progress (in real app, use YouTube API)
    useEffect(() => {
        if (watchedPercent >= 80) {
            setCanComplete(true);
        }
    }, [watchedPercent]);

    // Demo: Increment watch progress over time
    useEffect(() => {
        const interval = setInterval(() => {
            setWatchedPercent(prev => Math.min(prev + 5, 100));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
                {videoId ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                        title="Video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                        <div className="text-center">
                            <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground">Video content not available</p>
                            {content.url && (
                                <a
                                    href={content.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-4 text-blue-400 hover:text-blue-300"
                                >
                                    Open External Link
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Watch Progress</span>
                    <span className="font-medium">{watchedPercent}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${watchedPercent}%` }}
                    />
                </div>
                {!canComplete && (
                    <p className="text-xs text-muted-foreground">
                        Watch at least 80% to complete this task
                    </p>
                )}
            </div>

            {/* Description */}
            {content.description && (
                <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">About This Video</h3>
                    <p className="text-sm text-muted-foreground">{content.description}</p>
                </div>
            )}

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium mb-2">Your Notes (Optional)</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Take notes while watching..."
                    className="w-full h-24 px-4 py-2 bg-muted border-0 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Complete Button */}
            <button
                onClick={() => onComplete()}
                disabled={!canComplete || isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
                <CheckCircle className="h-5 w-5" />
                {isPending ? "Completing..." : "Mark as Complete"}
            </button>
        </div>
    );
}
