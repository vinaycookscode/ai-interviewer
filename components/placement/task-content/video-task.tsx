"use client";

import { Play, Clock, CheckCircle } from "lucide-react";

interface VideoTaskProps {
    content: {
        url?: string;
        youtubeId?: string;
        description?: string;
    };
    onComplete: () => void;
    isPending?: boolean;
}

export function VideoTask({ content, onComplete, isPending }: VideoTaskProps) {
    return (
        <div className="space-y-6">
            {/* Coming Soon Banner */}
            <div className="aspect-video bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-dashed border-red-500/30 rounded-xl overflow-hidden flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Play className="h-10 w-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Video Content Coming Soon!</h3>
                    <p className="text-muted-foreground max-w-md">
                        We're preparing high-quality video tutorials for this section.
                        Check back soon for expert-led content!
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-red-500">
                        <Clock className="h-4 w-4" />
                        <span>Expected: Within a few days</span>
                    </div>
                </div>
            </div>

            {/* Description if available */}
            {content.description && (
                <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">About This Video</h3>
                    <p className="text-sm text-muted-foreground">{content.description}</p>
                </div>
            )}

            {/* Coming Soon Info */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                    💡 <strong>Tip:</strong> You can skip this task for now and complete other tasks.
                    The video will be available soon!
                </p>
            </div>

            {/* Skip Button */}
            <button
                onClick={() => onComplete()}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 disabled:opacity-50 font-medium border"
            >
                <CheckCircle className="h-5 w-5" />
                {isPending ? "Skipping..." : "Skip for Now"}
            </button>
        </div>
    );
}
