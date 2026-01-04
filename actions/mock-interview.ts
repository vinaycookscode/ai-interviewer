"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getGeminiModelInstance } from "@/lib/gemini";
// import { GoogleGenerativeAI } from "@google/generative-ai"; // Removed
import { getGeminiModel } from "@/actions/gemini-config";
import { getAIStatus } from "@/actions/ai-status";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); // Removed

// Check if AI is available
export async function checkApiStatus() {
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
    } catch (error: any) {
        console.error("AI status check failed:", error);

        return {
            available: true,
            usingFallback: true,
            reason: "AI service is currently unavailable. Running in offline practice mode."
        };
    }
}

export async function createMockInterview(role: string, difficulty: string) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        const mockInterview = await db.mockInterview.create({
            data: {
                userId: session.user.id,
                role,
                difficulty,
            },
        });

        return { success: "Mock interview created", mockInterviewId: mockInterview.id };
    } catch (error) {
        console.error("Error creating mock interview:", error);
        return { error: "Failed to create mock interview" };
    }
}

export async function generateMockQuestions(role: string, difficulty: string): Promise<{
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
}> {
    const model = await getGeminiModelInstance();


    const prompt = `Generate 5 interview questions for a ${difficulty} ${role} position. 
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

            if (result.switched) {
                // Retry with new model
                const retryResult = await generateMockQuestions(role, difficulty);
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

    let evaluation = { score: 0, feedback: "" };

    try {
        // Generate immediate feedback for this answer
        const model = await getGeminiModelInstance();

        const prompt = `
      Question: ${question}
      Candidate Answer: ${transcript}
      
      Evaluate this answer for a ${question} role.
      Provide a JSON response with:
      - score (1-10 number)
      - feedback (concise string, max 2 sentences)
      
      Return ONLY valid JSON.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        evaluation = JSON.parse(cleanedText);
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
        await db.mockAnswer.create({
            data: {
                mockInterviewId,
                question,
                transcript,
                audioUrl,
                score: evaluation.score,
                feedback: evaluation.feedback,
            },
        });

        return { success: "Answer saved", evaluation };
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

        return { success: "Interview completed", score: averageScore, feedback };
    } catch (error: any) {
        console.error("Error completing interview:", error);
        return { error: "Failed to complete interview. Please try again." };
    }
}
