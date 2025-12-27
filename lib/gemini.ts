import { GoogleGenerativeAI } from "@google/generative-ai";

function getGeminiModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-pro" });
}

// Custom Error Class
export class RateLimitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RateLimitError";
    }
}

export async function generateInterviewQuestions(jobDescription: string): Promise<string[]> {


    const prompt = `You are an expert HR interviewer. Based on the following job description, generate 8 relevant interview questions that would help assess a candidate's fit for this role.
    
    Job Description:
${jobDescription}

    Requirements:
    - Generate exactly 8 questions
    - Mix of technical and behavioral questions
    - Questions should be specific to the role
    - Return only the questions, one per line
    - No numbering or bullet points
    - Questions must be independent (no "referring to the previous answer")

    Questions:`;

    try {
        const model = getGeminiModel();
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Split by newlines and filter out empty lines
        const questions = text
            .split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .map(q => q.replace(/^\d+[\.\)]\s*/, '')) // Remove "1." or "1)" at start
            .filter(q => q.length > 0) // Filter again in case line was just a number
            .slice(0, 8); // Ensure we only get 8 questions

        return questions;
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("Resource has been exhausted")) {
            throw new RateLimitError("AI service is currently busy. Please try again later.");
        }
        throw new Error(`Failed to generate questions: ${error.message}`);
    }
}

export interface EvaluationResult {
    score: number;
    feedback: string;
    criteria: {
        accuracy: number;
        communication: number;
        relevance: number;
    };
}

export async function evaluateAnswer(question: string, answer: string): Promise<EvaluationResult> {


    // Check for code submission
    const isCodeSubmission = answer.includes("[CODE SUBMISSION]");

    let prompt = "";

    if (isCodeSubmission) {
        prompt = `You are a Senior Software Engineer acting as a technical interviewer. Evaluate the following coding solution provided by a candidate.

Question: "${question}"
Candidate's Solution:
"${answer}"

Provide a structured evaluation in JSON format with the following fields:
- score: Overall score from 1-10 (integer). Be strict. 10 is perfect production-ready code.
- feedback: Concise technical feedback (max 3 sentences) focusing on correctness and best practices.
- criteria: Object containing scores (1-10) for:
    - accuracy: Does the code solve the problem correctly? Are there logical errors?
    - communication: Code quality options (variable naming, modularity, readability, comments).
    - relevance: Efficiency (Time/Space complexity) and handling of edge cases.

Return ONLY the JSON object. No markdown formatting.`;

    } else {
        // Standard behavioral interview prompt
        prompt = `You are an expert HR interviewer. Evaluate the following answer to the interview question.

Question: "${question}"
Answer: "${answer}"

Provide a structured evaluation in JSON format with the following fields:
- score: Overall score from 1-10 (integer)
- feedback: Constructive feedback (max 3 sentences)
- criteria: Object containing scores (1-10) for:
    - accuracy: Technical accuracy of the answer
    - communication: Clarity and articulation
    - relevance: How well it answers the specific question

Return ONLY the JSON object. No markdown formatting.`;
    }

    try {
        const model = getGeminiModel();
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        console.log("Gemini Raw Response:", text);

        // Robust JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in response");
        }

        const jsonString = jsonMatch[0];
        const evaluation = JSON.parse(jsonString);
        return evaluation;
    } catch (error: any) {
        console.error("Gemini Evaluation Error:", error);

        if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("Resource has been exhausted")) {
            throw new RateLimitError("AI service is currently busy (Rate Limit Exceeded). Evaluation will be skipped.");
        }

        // Return a fallback result if AI fails, rather than crashing (unless it's a rate limit which we now throw)
        // Wait, for evaluation, we might still want to return a fallback score of 0?
        // But if we want to show the banner, strictly, we should throw OR return a flag.
        // Let's THROW RateLimitError, and let the caller decide to catch it and show banner.
        // If we return usage limits as just "score 0", the UI won't know to show the banner easily.

        return {
            score: 0,
            feedback: `Unable to evaluate answer at this time. Error: ${error.message}`,
            criteria: { accuracy: 0, communication: 0, relevance: 0 }
        };
    }
}
