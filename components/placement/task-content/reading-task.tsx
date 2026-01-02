"use client";

import { useState, useEffect } from "react";
import { BookOpen, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface ReadingTaskProps {
    content: {
        text?: string;
        title?: string;
        keyPoints?: string[];
        estimatedMinutes?: number;
    };
    onComplete: () => void;
    isPending?: boolean;
}

const SAMPLE_CONTENT = `
## Understanding Time Complexity

Time complexity is a way to describe how the runtime of an algorithm grows as the input size increases. It helps us compare algorithms and predict performance.

### Big O Notation

Big O notation describes the upper bound of an algorithm's growth rate:

- **O(1)** - Constant time: The operation takes the same time regardless of input size
- **O(log n)** - Logarithmic: Common in binary search algorithms
- **O(n)** - Linear: Time grows proportionally with input
- **O(n log n)** - Linearithmic: Common in efficient sorting algorithms
- **O(n²)** - Quadratic: Nested loops over the input

### Practical Tips

1. Avoid nested loops when possible
2. Use hash maps for O(1) lookups
3. Consider space-time tradeoffs
4. Profile your code before optimizing

### Summary

Understanding time complexity is essential for writing efficient code. Always consider the worst-case scenario when analyzing algorithms.
`;

export function ReadingTask({ content, onComplete, isPending }: ReadingTaskProps) {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [canComplete, setCanComplete] = useState(false);
    const [showKeyPoints, setShowKeyPoints] = useState(false);

    useEffect(() => {
        if (scrollProgress >= 90) {
            setCanComplete(true);
        }
    }, [scrollProgress]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const scrolled = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
        setScrollProgress(Math.min(scrolled, 100));
    };

    const text = content.text || SAMPLE_CONTENT;
    const keyPoints = content.keyPoints || [
        "Time complexity measures algorithm efficiency",
        "Big O notation describes worst-case performance",
        "O(1) is best, O(n²) is often too slow for large inputs"
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">{content.title || "Reading Material"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    ~{content.estimatedMinutes || 10} min read
                </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reading Progress</span>
                    <span className="font-medium">{Math.round(scrollProgress)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${scrollProgress}%` }}
                    />
                </div>
            </div>

            {/* Content */}
            <div
                onScroll={handleScroll}
                className="h-96 overflow-y-auto p-6 bg-card border rounded-xl prose prose-sm dark:prose-invert max-w-none"
            >
                {text.split('\n').map((paragraph, i) => {
                    if (paragraph.startsWith('## ')) {
                        return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{paragraph.replace('## ', '')}</h2>;
                    }
                    if (paragraph.startsWith('### ')) {
                        return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{paragraph.replace('### ', '')}</h3>;
                    }
                    if (paragraph.startsWith('- **')) {
                        const match = paragraph.match(/- \*\*(.+?)\*\* - (.+)/);
                        if (match) {
                            return (
                                <div key={i} className="flex gap-2 my-2">
                                    <span className="font-semibold text-blue-500">{match[1]}</span>
                                    <span className="text-muted-foreground">{match[2]}</span>
                                </div>
                            );
                        }
                    }
                    if (paragraph.match(/^\d\. /)) {
                        return <p key={i} className="my-1 pl-4">{paragraph}</p>;
                    }
                    if (paragraph.trim()) {
                        return <p key={i} className="my-3">{paragraph}</p>;
                    }
                    return null;
                })}
            </div>

            {/* Key Points */}
            <div className="border rounded-lg">
                <button
                    onClick={() => setShowKeyPoints(!showKeyPoints)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
                >
                    <span className="font-medium">Key Takeaways</span>
                    {showKeyPoints ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                {showKeyPoints && (
                    <ul className="p-4 pt-0 space-y-2">
                        {keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Complete Button */}
            <button
                onClick={() => onComplete()}
                disabled={!canComplete || isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
                <CheckCircle className="h-5 w-5" />
                {isPending ? "Completing..." : canComplete ? "Mark as Complete" : "Read to the end to complete"}
            </button>
        </div>
    );
}
