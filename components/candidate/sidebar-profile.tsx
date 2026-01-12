"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProfileCompletionCircleProps {
    completionPercentage: number;
    href: string;
    isActive?: boolean;
}

export function ProfileCompletionCircle({
    completionPercentage,
    href,
    isActive
}: ProfileCompletionCircleProps) {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (completionPercentage / 100) * circumference;

    return (
        <div className="relative">
            <Link
                href={href}
                className={cn(
                    "group relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 overflow-hidden",
                    isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-primary/5 border border-transparent hover:border-primary/10"
                )}
            >
                {/* Ambient Background Glow for high completion */}
                {completionPercentage > 50 && (
                    <div className="absolute inset-0 bg-primary/5 blur-xl pointer-events-none" />
                )}

                {/* Background Circle */}
                <svg className="absolute w-full h-full -rotate-90 scale-[0.65]">
                    <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        className="text-white/5"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        fill="transparent"
                        strokeLinecap="round"
                        className={cn(
                            "transition-colors duration-500",
                            completionPercentage > 80 ? "text-emerald-400" : "text-primary"
                        )}
                    />
                </svg>

                {/* Settings Icon */}
                <div className={cn(
                    "relative z-10 p-2.5 rounded-xl transition-all duration-500",
                    isActive ? "bg-primary/10 text-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]" : "text-muted-foreground group-hover:text-primary group-hover:bg-primary/5"
                )}>
                    <Settings
                        size={20}
                        className={cn(
                            "transition-transform duration-700",
                            isActive ? "scale-110" : "group-hover:rotate-90 group-hover:scale-110"
                        )}
                    />
                </div>

                {/* Interactive Tooltip Widget */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-black/80 backdrop-blur-md text-[10px] text-white border border-white/10 rounded-xl shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 whitespace-nowrap pointer-events-none">
                    <div className="flex flex-col gap-1 items-center">
                        <span className="font-black tracking-tighter uppercase text-primary/80">Profile Integrity</span>
                        <span className="text-xl font-black">{completionPercentage}%</span>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 border-b border-r border-white/10 rotate-45 -translate-y-1" />
                </div>
            </Link>
        </div>
    );
}
