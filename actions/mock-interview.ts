"use server";

import { auth } from "@/auth";
import { cleanPracticeSettings } from "@/lib/practice-levels";
import { bankIdFor, gradingPrompt, mergeBankQuestion, type BankQuestion } from "@/lib/mock/questions";
import { db } from "@/lib/db";
import { awardAchievements } from "@/lib/achievements/server";
import { checkpointMetric } from "@/lib/achievements/rules";
import { markPlanActive } from "@/lib/plan/server";
import { addAnswerToBank } from "@/lib/bank/server";
import { revalidatePath } from "next/cache";
import { getGeminiModelInstance, MAX_RATE_LIMIT_RETRIES } from "@/lib/gemini";
// import { GoogleGenerativeAI } from "@google/generative-ai"; // Removed
import { getGeminiModel } from "@/actions/gemini-config";
import { getAIStatus } from "@/actions/ai-status";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); // Removed

// Check if AI is available
// Unavailable (the status check fails) blocks practice; degraded (every model rate-limited) runs with fallback questions and a banner (AIIN-48)
export async function checkApiStatus(): Promise<{ available: boolean; usingFallback?: boolean; reason?: string }> {
    try {
        const status = await getAIStatus();

        if (status.allModelsExhausted) {
            return {
                available: true,
                usingFallback: true,
                reason: "All AI models are currently rate-limited. Running in offline practice mode with fallback questions."
            };
        }

        return { available: true };
    } catch (error) {
        console.error("AI status check failed:", error);
        return { available: false, reason: "U couldn't reach the AI service." };
    }
}

export async function createMockInterview(role: string, difficulty: string) {
    const session = await auth();

    // Only the levels the screen offers, and a one-line role (AIIN-49)
    const settings = cleanPracticeSettings(role, difficulty);
    if (!settings) return { error: "Choose a role and a level." };

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    // A verified email comes first (AIIN-55)
    const { needsVerification } = await import("@/lib/email-verification");
    if (await needsVerification(session.user.id)) {
        const { getTranslations } = await import("next-intl/server");
        return { error: (await getTranslations("VerifyEmail"))("practiceBlocked"), verifyRequired: true };
    }

    // Check usage limit
    const { checkUsageLimit, incrementUsage } = await import("@/lib/usage");
    const usageCheck = await checkUsageLimit("mock_interview");

    if (!usageCheck.allowed) {
        return {
            error: usageCheck.message,
            upgradeRequired: true,
            usage: {
                current: usageCheck.currentUsage,
                limit: usageCheck.limit,
                remaining: usageCheck.remaining,
            }
        };
    }

    try {
        const mockInterview = await db.mockInterview.create({
            data: {
                userId: session.user.id,
                role: settings.role,
                difficulty: settings.difficulty,
            },
        });

        // Increment usage after successful creation
        await incrementUsage("mock_interview");

        return { success: "Mock interview created", mockInterviewId: mockInterview.id };
    } catch (error) {
        console.error("Error creating mock interview:", error);
        return { error: "Failed to create mock interview" };
    }
}


interface MockQuestionsResult {
    questions?: string[];
    isFallback?: boolean;
    allModelsExhausted?: boolean;
    retryIn?: number;
    error?: string;
    _switchInfo?: {
        switched: boolean;
        from: string;
        to: string;
    };
}

export interface MockSessionState {
    questions?: string[];
    /** Answers already given, by question index, so a refresh resumes where the candidate left off. */
    answers?: { index: number; score: number | null; feedback: string | null }[];
    isFallback?: boolean;
    allModelsExhausted?: boolean;
    error?: string;
}

/**
 * The practice's questions: written on the first visit, then stored, so a refresh or a return visit
 * shows the same five (AIIN-47). Scoped to the signed-in candidate.
 */
export async function getMockQuestions(mockInterviewId: string): Promise<MockSessionState> {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const where = { id: mockInterviewId, userId: session.user.id };
    const mockInterview = await db.mockInterview.findFirst({
        where,
        select: { role: true, difficulty: true, questions: true, topics: true },
    });
    if (!mockInterview) return { error: "Mock interview not found" };

    let questions = mockInterview.questions;
    let generated: MockQuestionsResult | null = null;
    if (questions.length === 0) {
        generated = await generateMockQuestionsWithRetry(mockInterview.role, mockInterview.difficulty, mockInterview.topics, 0);
        if (!generated.questions?.length) return { error: generated.error || "Failed to generate questions" };
        // One behavioural question from the bank, so it's graded against a model answer (AIIN-208). A plan
        // checkpoint keeps to its topics.
        const bank = mockInterview.topics.length ? null : await pickBankQuestion(session.user.id);
        const merged = mergeBankQuestion(generated.questions, bank);
        // Only the first writer wins; a second tab that raced us reads back the stored set.
        await db.mockInterview.updateMany({ where: { ...where, questions: { isEmpty: true } }, data: merged });
        questions = (await db.mockInterview.findFirst({ where, select: { questions: true } }))?.questions ?? merged.questions;
    }

    const answered = await db.mockAnswer.findMany({
        where: { mockInterviewId },
        orderBy: { createdAt: "asc" },
        select: { question: true, score: true, feedback: true },
    });
    const answers = answered.flatMap((a) => {
        const index = questions.indexOf(a.question);
        return index === -1 ? [] : [{ index, score: a.score, feedback: a.feedback }];
    });

    return {
        questions,
        answers,
        isFallback: generated?.isFallback,
        allModelsExhausted: generated?.allModelsExhausted,
        error: generated?.isFallback ? generated.error : undefined,
    };
}

/** A published HR question with a model answer that this candidate hasn't practised yet, at random; or null. */
async function pickBankQuestion(userId: string): Promise<BankQuestion | null> {
    const used = await db.mockAnswer.findMany({
        where: { mockInterview: { userId }, companyQuestionId: { not: null } },
        select: { companyQuestionId: true },
    });
    const where = {
        type: "HR",
        status: "PUBLISHED",
        answer: { not: null },
        id: { notIn: used.flatMap((u) => (u.companyQuestionId ? [u.companyQuestionId] : [])) },
    };
    const count = await db.companyQuestion.count({ where });
    if (!count) return null;
    return db.companyQuestion.findFirst({ where, orderBy: { id: "asc" }, skip: Math.floor(Math.random() * count), select: { id: true, question: true } });
}

// Not exported: the retry counter must not be client-controllable.
async function generateMockQuestionsWithRetry(role: string, difficulty: string, topics: string[], attempt: number): Promise<MockQuestionsResult> {
    const model = await getGeminiModelInstance();


    // A plan checkpoint asks about the phase it closes (AIIN-101)
    const covering = topics.length ? ` Cover these topics from the candidate's study plan: ${topics.join("; ")}.` : "";
    const prompt = `Generate 5 interview questions for a ${difficulty} ${role} position.${covering}
  Return ONLY a JSON array of strings, like this: ["Question 1", "Question 2", ...]. 
  Do not include any markdown formatting or explanations.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up the response to ensure it's valid JSON
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const questions = JSON.parse(cleanedText);

        return { questions };
    } catch (error: any) {
        console.error("Error generating questions:", error);

        // Check for rate limit
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
            const modelName = await getGeminiModel();
            const { handleRateLimit } = await import("@/lib/gemini");
            const result = await handleRateLimit(modelName);

            if (result.switched && attempt < MAX_RATE_LIMIT_RETRIES) {
                // Retry with new model
                const retryResult = await generateMockQuestionsWithRetry(role, difficulty, topics, attempt + 1);
                return {
                    ...retryResult,
                    _switchInfo: {
                        switched: true,
                        from: result.fromModel || '',
                        to: result.newModelName || ''
                    }
                };
            }

            // All models exhausted - use fallback
            const fallbackQuestions = [
                `Tell me about a time you faced a challenge in your previous role as a ${role}.`,
                `What are your key strengths and weaknesses relevant to a ${difficulty} level position?`,
                "Describe a project you are particularly proud of.",
                "How do you handle tight deadlines and pressure?",
                "Where do you see yourself in 5 years?"
            ];

            return {
                questions: fallbackQuestions,
                isFallback: true,
                allModelsExhausted: true,
                retryIn: result.retryIn,
                error: result.message
            };
        }

        // Fallback questions if API fails
        const fallbackQuestions = [
            `Tell me about a time you faced a challenge in your previous role as a ${role}.`,
            `What are your key strengths and weaknesses relevant to a ${difficulty} level position?`,
            "Describe a project you are particularly proud of.",
            "How do you handle tight deadlines and pressure?",
            "Where do you see yourself in 5 years?"
        ];

        return {
            questions: fallbackQuestions,
            isFallback: true,
            error: "API unavailable, using fallback questions."
        };
    }
}

export async function saveMockAnswer(
    mockInterviewId: string,
    question: string,
    transcript: string,
    audioUrl?: string
) {
    const session = await auth();

    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    const mockInterview = await db.mockInterview.findFirst({
        where: { id: mockInterviewId, userId: session.user.id },
        select: { role: true, questions: true, bankQuestionIds: true, answers: { select: { question: true } } },
    });

    if (!mockInterview) {
        return { error: "Mock interview not found" };
    }

    // Answers belong to this practice's stored questions, once each.
    if (!mockInterview.questions.includes(question)) {
        return { error: "That question isn't part of this practice" };
    }
    if (mockInterview.answers.some((a) => a.question === question)) {
        return { error: "You've already answered this question" };
    }

    let evaluation: { score: number; feedback: string; type?: unknown } = { score: 0, feedback: "" };
    // Only a real grade moves the question's review schedule in the bank (AIIN-212)
    let graded = false;
    // A bank question is graded against its model answer and tips (AIIN-208)
    const companyQuestionId = bankIdFor(mockInterview.questions, mockInterview.bankQuestionIds, question);
    const reference = companyQuestionId
        ? await db.companyQuestion.findUnique({ where: { id: companyQuestionId }, select: { answer: true, tips: true } })
        : null;

    try {
        // Generate immediate feedback for this answer
        const model = await getGeminiModelInstance();

        const prompt = gradingPrompt(question, transcript, mockInterview.role, reference);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        evaluation = JSON.parse(cleanedText);
        graded = typeof evaluation.score === "number";
    } catch (error: any) {
        console.error("Error generating feedback:", error);

        // Check for rate limit
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
            const { markModelRateLimited } = await import("@/actions/gemini-config");
            const modelName = await getGeminiModel();
            await markModelRateLimited(modelName);
        }

        // Fallback evaluation
        evaluation = {
            score: 0,
            feedback: "AI feedback is currently unavailable. Your answer has been recorded."
        };
    }

    try {
        const saved = await db.mockAnswer.create({
            data: {
                mockInterviewId,
                question,
                transcript,
                audioUrl,
                companyQuestionId,
                score: evaluation.score,
                feedback: evaluation.feedback,
            },
            select: { id: true },
        });

        // Every answered question lands in the candidate's Question Bank (AIIN-209). The answer is saved either way.
        await addAnswerToBank(session.user.id!, { id: saved.id, question, role: mockInterview.role, companyQuestionId, gradedType: evaluation.type, score: graded ? evaluation.score : null }).catch((error) =>
            console.error("Error adding the answer to the bank:", error)
        );

        return { success: "Answer saved", evaluation: { score: evaluation.score, feedback: evaluation.feedback } };
    } catch (dbError) {
        console.error("Error saving answer to DB:", dbError);
        return { error: "Failed to save answer" };
    }
}

export async function completeMockInterview(mockInterviewId: string) {
    const session = await auth();

    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    const mockInterview = await db.mockInterview.findFirst({
        where: { id: mockInterviewId, userId: session.user.id },
        select: { id: true, score: true, enrollmentId: true, checkpointDay: true },
    });

    if (!mockInterview) {
        return { error: "Mock interview not found" };
    }

    try {
        // Calculate average score
        const answers = await db.mockAnswer.findMany({
            where: { mockInterviewId },
        });

        if (answers.length === 0) {
            return { error: "No answers found" };
        }

        const totalScore = answers.reduce((sum, a) => sum + (a.score || 0), 0);
        const averageScore = totalScore / answers.length;

        // Generate overall feedback
        const model = await getGeminiModelInstance();

        const prompt = `
      Based on these ${answers.length} answers, provide a short summary feedback for the candidate.
      Average Score: ${averageScore}/10.
      
      Keep it encouraging but constructive. Max 3 sentences.
    `;

        let feedback = "Great effort! Keep practicing to improve your interview skills.";

        try {
            const result = await model.generateContent(prompt);
            feedback = result.response.text();
        } catch (apiError: any) {
            console.error("Error generating feedback:", apiError);

            // Check for rate limit
            if (apiError.status === 429 || apiError.message?.includes('429') || apiError.message?.includes('Resource has been exhausted')) {
                const { markModelRateLimited } = await import("@/actions/gemini-config");
                const modelName = await getGeminiModel();
                await markModelRateLimited(modelName);
            }

            // Use default feedback if API fails
            feedback = `Your practice session is complete! AI feedback is currently unavailable. Your average score: ${averageScore.toFixed(1)}/10`;
        }

        await db.mockInterview.update({
            where: { id: mockInterviewId },
            data: {
                score: averageScore,
                feedback: feedback,
            },
        });
        // A plan checkpoint counts as the day's task for the streak (AIIN-101), once
        if (mockInterview.enrollmentId && mockInterview.checkpointDay && mockInterview.score === null) {
            await markPlanActive(session.user.id, mockInterview.enrollmentId);
            revalidatePath("/candidate/placement-program");
        }
        const checkpoint = checkpointMetric(mockInterview.checkpointDay ?? 0);
        await awardAchievements(session.user.id, checkpoint ? ["practice", "bestScore", checkpoint] : ["practice", "bestScore"]);

        return { success: "Interview completed", score: averageScore, feedback };
    } catch (error: any) {
        console.error("Error completing interview:", error);
        return { error: "Failed to complete interview. Please try again." };
    }
}
