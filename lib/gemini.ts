import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiModel } from "@/actions/gemini-config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getGeminiModelInstance(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("No Gemini API key provided");

    const client = new GoogleGenerativeAI(key);
    const modelName = await getGeminiModel();

    return client.getGenerativeModel({ model: modelName });
}


export async function generateInterviewQuestions(jobDescription: string): Promise<string[]> {
    const model = await getGeminiModelInstance();
    // We need modelName for error logging if something goes wrong, but getGeminiModelInstance handles the connection.
    // Ideally we should catch the error and get the model name again if needed, or better, the helper could attach it?
    // checking generic error handler logic...
    // The existing error handler uses `modelName`. We can fetch it again or accept that the helper abstracts it. 
    // Let's keep `modelName` variable for the error block, or fetch it inside the catch block if needed.
    // Actually, to keep it clean, let's fetch it for the error message if we crash.
    let modelName = 'unknown';
    try {
        modelName = model.model.replace('models/', ''); // model object usually has this
    } catch (e) { }


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
            .filter(q => q.length > 0)
            .map(q => q.replace(/^\d+[\.\)]\s*/, '')) // Remove "1." or "1)" at start
            .filter(q => q.length > 0) // Filter again in case line was just a number
            .slice(0, 8); // Ensure we only get 8 questions

        return questions;
    } catch (error: any) {
        console.error("Gemini API Error:", error);

        // Check for rate limit (429) or overloaded (503) which can also happen
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
            const { markModelRateLimited } = await import("@/actions/gemini-config");
            await markModelRateLimited(modelName);
            throw new Error(`Rate limit reached for ${modelName}. Please select a different model.`);
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
    const model = await getGeminiModelInstance();
    let modelName = 'unknown';
    try { modelName = model.model.replace('models/', ''); } catch (e) { }


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

        // Check for rate limit
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
            const { markModelRateLimited } = await import("@/actions/gemini-config");
            await markModelRateLimited(modelName);
            return {
                score: 0,
                feedback: `Rate limit reached for ${modelName}. Please select a different model using the selector in the top bar.`,
                criteria: { accuracy: 0, communication: 0, relevance: 0 }
            };
        }

        // Return a fallback result if AI fails, rather than crashing
        return {
            score: 0,
            feedback: "Unable to evaluate answer at this time. Please try again later.",
            criteria: { accuracy: 0, communication: 0, relevance: 0 }
        };
    }
}
