import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateInterviewQuestions(jobDescription: string): Promise<string[]> {
    const model = genAI.getGenerativeModel({
        model: "gemini-pro",
    });

    const prompt = `You are an expert HR interviewer. Based on the following job description, generate 8 relevant interview questions that would help assess a candidate's fit for this role.

Job Description:
${jobDescription}

Requirements:
- Generate exactly 8 questions
- Mix of technical and behavioral questions
- Questions should be specific to the role
- Return only the questions, one per line
- No numbering or bullet points

Questions:`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Split by newlines and filter out empty lines
        const questions = text
            .split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 0 && !q.match(/^\d+\.?\s*/)) // Remove numbering if present
            .slice(0, 8); // Ensure we only get 8 questions

        return questions;
    } catch (error: any) {
        console.error("Gemini API Error:", error);
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
    const model = genAI.getGenerativeModel({
        model: "gemini-pro",
    });

    const prompt = `You are an expert interviewer. Evaluate the following answer to the interview question.

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

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        const evaluation = JSON.parse(text);
        return evaluation;
    } catch (error: any) {
        console.error("Gemini Evaluation Error:", error);
        // Return a fallback result if AI fails, rather than crashing
        return {
            score: 0,
            feedback: "Unable to evaluate answer at this time.",
            criteria: { accuracy: 0, communication: 0, relevance: 0 }
        };
    }
}
