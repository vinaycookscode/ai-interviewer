/**
 * Core type definitions for the AI Interviewer application.
 * These types are derived from Prisma models but provide cleaner interfaces
 * for use in components and actions.
 */

import { TaskType } from "@prisma/client";

// ============================================
// TASK & PLACEMENT TYPES
// ============================================

/**
 * Content structure for different task types.
 * Replaces `any` usage in task-modal.tsx and related components.
 */
export interface VideoTaskContent {
    videoUrl: string;
    transcript?: string;
    description?: string;
}

export interface ProblemTaskContent {
    title: string;
    description: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    starterCode?: Record<string, string>; // language -> code
    testCases?: TestCase[];
    hints?: string[];
    solution?: string;
    explanation?: string;
}

export interface TestCase {
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
}

export interface AptitudeTaskContent {
    questions: AptitudeQuestion[];
    timeLimit?: number; // in seconds
}

export interface AptitudeQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

export interface QuizTaskContent {
    questions: QuizQuestion[];
    passingScore?: number;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

export interface ReadingTaskContent {
    title: string;
    content: string; // Markdown content
    estimatedReadTime?: number;
}

export interface HRPrepTaskContent {
    questions: HRQuestion[];
}

export interface HRQuestion {
    id: string;
    question: string;
    category: string;
    tips?: string[];
    sampleAnswer?: string;
}

/**
 * Union type for all task content types
 */
export type TaskContent =
    | VideoTaskContent
    | ProblemTaskContent
    | AptitudeTaskContent
    | QuizTaskContent
    | ReadingTaskContent
    | HRPrepTaskContent;

/**
 * Task metadata for tracking user progress
 */
export interface TaskMetadata {
    code?: string;
    language?: string;
    lastAnswers?: Record<string, number>;
    attempts?: number;
    bestScore?: number;
}

/**
 * Complete task definition used in modals
 */
export interface Task {
    id: string;
    title: string;
    type: TaskType;
    duration: number;
    content: TaskContent;
    metadata?: TaskMetadata;
}

// ============================================
// INTERVIEW TYPES
// ============================================

export interface InterviewFeedback {
    score: number;
    strengths: string[];
    improvements: string[];
    detailedFeedback: string;
}

export interface PersonalityProfile {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    emotionalStability: number;
    summary?: string;
}

// ============================================
// RESUME ANALYSIS TYPES
// ============================================

export interface ResumeAnalysis {
    score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    keywords: string[];
    atsCompatibility: number;
}

export interface CoverLetterResult {
    content: string;
    generatedAt: string;
}

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export interface SubscriptionInfo {
    planName: string;
    tier: "FREE" | "PRO" | "PREMIUM";
    status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE" | "TRIALING";
    currentPeriodEnd?: Date;
    features: string[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ActionResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
