"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Check if API is available
export async function checkApiStatus() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Simple test to check if API is responsive
        const result = await model.generateContent("Say hello");
        await result.response;
        return { available: true };
    } catch (error: any) {
        console.error("API health check failed:", error);

        if (error?.status === 404 || error?.statusText === 'Not Found') {
            return {
                available: false,
                reason: "API quota limit reached. Please try again later or upgrade your plan."
            };
        }
        if (error?.status === 429) {
            return {
                available: false,
                reason: "Too many requests. Please wait a moment and try again."
            };
        }
        if (error?.status === 401 || error?.status === 403) {
            return {
                available: false,
                reason: "Invalid API key. Please check your configuration."
            };
        }

        return {
            available: false,
            reason: "AI service is currently unavailable. Please try again later."
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

export async function generateMockQuestions(role: string, difficulty: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

        // Check for API quota errors
        if (error?.status === 404 || error?.statusText === 'Not Found') {
            return { error: "API quota limit reached. Please try again later or upgrade your plan." };
        }
        if (error?.status === 429) {
            return { error: "Too many requests. Please wait a moment and try again." };
        }

        return { error: "Failed to generate questions. Please check your API configuration." };
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

    try {
        // Generate immediate feedback for this answer
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
        const evaluation = JSON.parse(cleanedText);

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
    } catch (error: any) {
        console.error("Error saving mock answer:", error);

        // Check for API quota errors
        if (error?.status === 404 || error?.statusText === 'Not Found') {
            return { error: "API quota limit reached. Your answer was saved but AI feedback is unavailable. Please try again later." };
        }
        if (error?.status === 429) {
            return { error: "Too many requests. Please wait a moment and try again." };
        }

        return { error: "Failed to evaluate your answer. Please try again." };
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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
            // Use default feedback if API fails
            if (apiError?.status === 404 || apiError?.statusText === 'Not Found') {
                feedback = "Your practice session is complete! API quota limit reached, so detailed feedback is unavailable. Your score: " + averageScore.toFixed(1) + "/10";
            }
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
