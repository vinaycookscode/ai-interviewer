import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiModel } from "@/actions/gemini-config";

export async function getGeminiModelInstance(apiKey?: string, modelId?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("No Gemini API key provided");

    const client = new GoogleGenerativeAI(key);
    const modelName = modelId || await getGeminiModel();

    return client.getGenerativeModel({ model: modelName });
}

// Custom Error Class
export class RateLimitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RateLimitError";
    }
}

export async function generateInterviewQuestions(jobDescription: string): Promise<string[]> {
    const model = await getGeminiModelInstance();
    let modelName = 'unknown';
    try { modelName = model.model.replace('models/', ''); } catch (e) { }


    const prompt = `You are an expert HR interviewer. Based on the following job description, generate 8 relevant interview questions that would help assess a candidate's fit for this role.
    
    Job Description:
${jobDescription}

    Requirements:
    - Generate exactly 8 questions.
    - Questions MUST be in the same language as the Job Description provided above.
    - Mix of technical and behavioral questions.
    - Questions should be specific to the role.
    - Return only the questions, one per line.
    - No numbering or bullet points.
    - Questions must be independent (no "referring to the previous answer").

    Questions:`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        const questions = text
            .split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .map(q => q.replace(/^\d+[\.\)]\s*/, ''))
            .filter(q => q.length > 0)
            .slice(0, 8);

        return questions;
    } catch (error: any) {
        console.error("Gemini API Error:", error);

        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
            const { markModelRateLimited } = await import("@/actions/gemini-config");
            await markModelRateLimited(modelName);
            throw new Error(`Rate limit reached for ${modelName}. Please select a different model using the selector in the top bar.`);
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

export async function evaluateAnswer(question: string, answer: string, contextLanguage: string = "en"): Promise<EvaluationResult> {
    const model = await getGeminiModelInstance();
    let modelName = 'unknown';
    try { modelName = model.model.replace('models/', ''); } catch (e) { }


    // Check for code submission
    const isCodeSubmission = answer.includes("[CODE SUBMISSION]");

    let prompt = "";

    if (isCodeSubmission) {
        prompt = `You are a Senior Software Engineer acting as a technical interviewer. Evaluate the following coding solution provided by a candidate.
        
        Context Language: ${contextLanguage}
        (If the answer is in ${contextLanguage} or a mix of English and ${contextLanguage}, evaluate it normally. 
        If the Context Language is NOT English, ensure your feedback is provided in ${contextLanguage}.)

        Question: "${question}"
        Candidate's Solution:
        "${answer}"

        Provide a structured evaluation in JSON format with the following fields:
        - score: Overall score from 1-10 (integer). Be strict. 10 is perfect production-ready code.
        - feedback: Concise technical feedback (max 3 sentences) focusing on correctness and best practices. In ${contextLanguage}.
        - criteria: Object containing scores (1-10) for:
            - accuracy: Does the code solve the problem correctly? Are there logical errors?
            - communication: Code quality options (variable naming, modularity, readability, comments).
            - relevance: Efficiency (Time/Space complexity) and handling of edge cases.

        Return ONLY the JSON object. No markdown formatting.`;

    } else {
        // Standard behavioral interview prompt (Multilingual)
        prompt = `You are an expert interviewer. Evaluate the following answer to the interview question.
        
        Context Language: ${contextLanguage}
        (If the answer is in ${contextLanguage} or a mix of English and ${contextLanguage}, evaluate it normally. 
        If the Context Language is NOT English, ensure your feedback is provided in ${contextLanguage}.)

        Question: "${question}"
        Answer: "${answer}"
        
        Provide a structured evaluation in JSON format with the following fields:
        - score: Overall score from 1-10 (integer)
        - feedback: Constructive feedback (max 3 sentences) in ${contextLanguage}
        - criteria: Object containing scores (1-10) for:
            - accuracy: Technical accuracy of the answer
            - communication: Clarity and articulation
            - relevance: How well it answers the specific question
        
        Return ONLY the JSON object. No markdown formatting.`;
    }

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        console.log("Gemini Raw Response:", text);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in response");
        }

        const jsonString = jsonMatch[0];
        const evaluation = JSON.parse(jsonString);
        return evaluation;
    } catch (error: any) {
        console.error("Gemini Evaluation Error:", error);

        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
            const { markModelRateLimited } = await import("@/actions/gemini-config");
            await markModelRateLimited(modelName);
            return {
                score: 0,
                feedback: `Rate limit reached for ${modelName}. Please select a different model using the selector in the top bar.`,
                criteria: { accuracy: 0, communication: 0, relevance: 0 }
            };
        }

        return {
            score: 0,
            feedback: `Unable to evaluate answer at this time. Error: ${error.message}`,
            criteria: { accuracy: 0, communication: 0, relevance: 0 }
        };
    }
}
