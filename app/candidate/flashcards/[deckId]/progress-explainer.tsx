"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

export function ProgressExplainer() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mb-8 rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 rounded-xl transition-colors"
            >
                <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-blue-400" />
                    <span className="font-medium">How does progress work?</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
            </button>

            {isOpen && (
                <div className="px-4 pb-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Each card moves through 3 stages based on how well you know it:
                    </p>

                    {/* Simple 3-level system */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                            <span className="font-semibold text-red-400">Learning</span>
                            <p className="text-xs text-muted-foreground mt-1">Still working on it</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                            <span className="font-semibold text-amber-400">Reviewing</span>
                            <p className="text-xs text-muted-foreground mt-1">Getting better!</p>
                        </div>
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                            <span className="font-semibold text-emerald-400">Mastered</span>
                            <p className="text-xs text-muted-foreground mt-1">You know it! 🎉</p>
                        </div>
                    </div>

                    {/* How it works */}
                    <div className="text-sm text-muted-foreground space-y-2 pt-2 border-t border-muted/30">
                        <p><span className="text-green-400 font-medium">✓ Got It</span> → Card moves forward, appears less often</p>
                        <p><span className="text-red-400 font-medium">✗ Needs Review</span> → Card goes back to Learning</p>
                    </div>
                </div>
            )}
        </div>
    );
}
