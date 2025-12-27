import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateFollowUp(
    question: string,
    answer: string,
    jobTitle: string
): Promise<string | null> {
    const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
    });

    if (answer.includes("[CODE SUBMISSION]")) {
        return null;
    }

    const prompt = `
    You are an expert interviewer for the role of ${jobTitle}.
    
    Current Question: "${question}"
    Candidate's Answer: "${answer}"
    
    Task:
    Analyze the candidate's answer. 
    1. If the answer is vague, incomplete, or raises an interesting point that needs clarification, generate a short, specific follow-up question.
    2. If the answer is sufficient and clear, return "NO_FOLLOWUP".
    
    Constraints:
    - The follow-up question must be concise (under 20 words).
    - Do not repeat the original question.
    - Be professional and encouraging.
    - Return ONLY the follow-up question text or the string "NO_FOLLOWUP".
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text().trim();

        if (text.includes("NO_FOLLOWUP")) {
            return null;
        }

        return text;
    } catch (error) {
        console.error("Error generating follow-up:", error);
        return null;
    }
}
