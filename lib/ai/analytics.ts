import { GoogleGenerativeAI } from "@google/generative-ai";
import { GrowthDataPoint } from "@/actions/analytics";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateGrowthInsights(history: GrowthDataPoint[]) {
    if (history.length === 0) {
        return "No interview data available yet. Complete some mock or real interviews to get personalized insights!";
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
    });

    // Prepare data summary for the prompt
    const summaryData = history.map(h =>
        `- ${new Date(h.date).toLocaleDateString()}: ${h.type} Interview for "${h.title}" - Score: ${h.score}/10`
    ).join("\n");

    const prompt = `
    You are a career coach analyzing a candidate's interview performance history.
    
    Here is the candidate's score history (chronological order):
    ${summaryData}
    
    Task:
    Provide a concise, encouraging, and actionable summary of their progress.
    1. Identify trends (Are they improving? Stagnating?).
    2. Highlight consistency or inconsistency.
    3. Provide 1 specific tip for their next interview based on this trajectory.
    
    Keep the response under 100 words. Use markdown for emphasis (bolding key points).
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating growth insights:", error);
        return "Unable to generate insights at this time.";
    }
}
