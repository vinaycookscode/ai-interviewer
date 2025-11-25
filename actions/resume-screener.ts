"use server";

import { auth } from "@/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Polyfill for pdf-parse dependencies if needed
if (typeof Promise.withResolvers === "undefined") {
    // @ts-ignore
    Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

const pdf = require("pdf-parse/lib/pdf-parse.js");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeResume(formData: FormData) {
    const session = await auth();

    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    const file = formData.get("file") as File;

    if (!file) {
        return { error: "No file uploaded" };
    }

    try {
        // Convert file to buffer for pdf-parse
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text from PDF using simple function API (v1.1.1)
        const data = await pdf(buffer);
        const resumeText = data.text;

        if (!resumeText || resumeText.trim().length < 50) {
            return { error: "Could not extract sufficient text from the resume. Please ensure it is a text-based PDF." };
        }

        // Analyze with Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
            You are an expert ATS (Applicant Tracking System) and Resume Coach.
            Analyze the following resume text and provide a structured evaluation.

            Resume Text:
            "${resumeText.slice(0, 10000)}"

            Return ONLY a valid JSON object with the following structure:
            {
                "atsScore": number (0-100),
                "summary": "Brief professional summary of the candidate (max 2 sentences)",
                "strengths": ["List of 3-5 key strengths identified"],
                "weaknesses": ["List of 3-5 areas for improvement"],
                "formattingIssues": ["List of any formatting issues (e.g., missing sections, bad layout hints)"],
                "improvementTips": ["List of 3-5 actionable tips to improve the resume"]
            }
            
            Do not include any markdown formatting (like \`\`\`json). Just the raw JSON string.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up response
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const analysis = JSON.parse(cleanedText);

        // Include original text for rewriting purposes
        analysis.resumeText = resumeText;

        return { success: true, analysis };

    } catch (error: any) {
        console.error("Error analyzing resume:", error);
        return { error: `Failed to analyze resume: ${error.message || error}` };
    }
}

export async function rewriteResume(currentText: string, analysis: any, customInstructions?: string) {
    const session = await auth();

    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
            You are an expert Professional Resume Writer.
            Your task is to rewrite the following resume text to improve its ATS score and professional appeal.
            
            Use the following analysis to guide your improvements:
            - Strengths to highlight: ${JSON.stringify(analysis.strengths)}
            - Weaknesses to fix: ${JSON.stringify(analysis.weaknesses)}
            - Formatting issues to address (in text structure): ${JSON.stringify(analysis.formattingIssues)}
            - Specific tips to apply: ${JSON.stringify(analysis.improvementTips)}

            ${customInstructions ? `USER CUSTOM INSTRUCTIONS (PRIORITIZE THESE): "${customInstructions}"` : ""}

            Original Resume Text:
            "${currentText.slice(0, 15000)}"

            Instructions:
            1. Rewrite the content to be more impactful, using action verbs and quantifiable achievements where possible.
            2. Fix any grammar or spelling errors.
            3. Organize the content into clear sections (Summary, Experience, Education, Skills, etc.).
            4. Ensure the tone is professional and concise.
            5. Do NOT invent new facts. Stick to the information provided in the original text, but present it better.
            ${customInstructions ? "6. STRICTLY FOLLOW the user's custom instructions provided above." : ""}
            
            Return ONLY a valid JSON object with the following structure:
            {
                "rewrittenContent": "The complete rewritten resume text in clean Markdown format",
                "predictedATSScore": number (0-100, estimated score of the new version),
                "improvementsMade": ["List of 3-5 key specific changes you made"]
            }

            Do not include any markdown formatting (like \`\`\`json) around the JSON response. Just the raw JSON string.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up response
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const rewriteResult = JSON.parse(cleanedText);

        return { success: true, ...rewriteResult };

    } catch (error: any) {
        console.error("Error rewriting resume:", error);
        return { error: `Failed to rewrite resume: ${error.message || error}` };
    }
}
