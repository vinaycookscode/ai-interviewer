"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, Brain, Rocket, Code2, Users, Trophy } from "lucide-react";

const features = [
    {
        icon: Brain,
        title: "AI Mock Interviews",
        description: "Practice with our advanced AI interviewer that adapts to your responses and provides instant feedback.",
        color: "bg-purple-500",
    },
    {
        icon: Rocket,
        title: "90-Day Placement Program",
        description: "Follow our structured day-by-day roadmap designed to take you from zero to placement ready.",
        color: "bg-blue-500",
    },
    {
        icon: Code2,
        title: "Smart Code Editor",
        description: "Write code in our intelligent editor with built-in complexity analysis and optimization hints.",
        color: "bg-indigo-500",
    },
    {
        icon: Trophy,
        title: "Company-Specific Prep",
        description: "Target your dream companies with curated problem sets and interview patterns.",
        color: "bg-pink-500",
    },
];

export function AuthFeatures() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % features.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const CurrentIcon = features[currentIndex].icon;

    return (
        <div className="relative h-full w-full flex flex-col items-center justify-center p-12 text-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-transparent opacity-10" style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "32px 32px",
            }} />

            {/* Content Container */}
            <div className="relative z-10 max-w-lg w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-start gap-6"
                    >
                        {/* Icon Badge */}
                        <div className={`p-4 rounded-2xl ${features[currentIndex].color} bg-opacity-20 backdrop-blur-xl border border-white/10 shadow-xl`}>
                            <CurrentIcon size={40} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                        </div>

                        {/* Text */}
                        <div className="space-y-4">
                            <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                                {features[currentIndex].title}
                            </h2>
                            <p className="text-lg text-white/80 leading-relaxed font-light">
                                {features[currentIndex].description}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Progress Indicators */}
                <div className="flex gap-3 mt-12">
                    {features.map((_, index) => (
                        <div
                            key={index}
                            className="h-1.5 rounded-full bg-white/20 overflow-hidden cursor-pointer transition-all duration-300 hover:h-2"
                            style={{ width: index === currentIndex ? "48px" : "16px" }}
                            onClick={() => setCurrentIndex(index)}
                        >
                            {index === currentIndex && (
                                <motion.div
                                    layoutId="progress"
                                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 5, ease: "linear" }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
