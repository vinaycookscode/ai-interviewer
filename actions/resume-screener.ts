"use server";

import { auth } from "@/auth";
import { getGeminiModelInstance } from "@/lib/gemini";
// import { GoogleGenerativeAI } from "@google/generative-ai"; // Removed
import { getGeminiModel } from "@/actions/gemini-config";

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

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); // Removed global instance

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

        // Get optional Job Description
        const jobDescription = formData.get("jobDescription") as string;

        // Analyze with Gemini
        const model = await getGeminiModelInstance();

        let prompt = `
            You are an expert ATS (Applicant Tracking System) and Resume Coach.
            Analyze the following resume text and provide a structured evaluation.

            Resume Text:
            "${resumeText.slice(0, 10000)}"
        `;

        // Add JD Context if provided
        if (jobDescription && jobDescription.trim().length > 10) {
            prompt += `
            
            Target Job Description:
            "${jobDescription.slice(0, 5000)}"

            Perform a COMPARATIVE ANALYSIS.
            
            Return ONLY a valid JSON object with the following structure:
            {
                "atsScore": number (0-100, based on match with JD),
                "summary": "Brief professional summary of the candidate (max 2 sentences)",
                "strengths": ["List of 3-5 key strengths identified in relation to the JD"],
                "weaknesses": ["List of 3-5 areas where the resume falls short of the JD"],
                "formattingIssues": ["List of any formatting issues"],
                "improvementTips": ["List of 3-5 actionable tips to tailor the resume for THIS specific job"],
                "missingKeywords": ["List of 5-10 important keywords/skills from the JD that are MISSING from the resume"],
                "matchScore": number (0-100, similarity score)
            }
            `;
        } else {
            prompt += `
            
            Return ONLY a valid JSON object with the following structure:
            {
                "atsScore": number (0-100),
                "summary": "Brief professional summary of the candidate (max 2 sentences)",
                "strengths": ["List of 3-5 key strengths identified"],
                "weaknesses": ["List of 3-5 areas for improvement"],
                "formattingIssues": ["List of any formatting issues"],
                "improvementTips": ["List of 3-5 actionable tips to improve the resume"],
                "missingKeywords": [],
                "matchScore": null
            }
            `;
        }

        prompt += `
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
        analysis.jobDescription = jobDescription; // Pass back for cover letter generation

        return { success: true, analysis };

    } catch (error: any) {
        console.error("Error analyzing resume:", error);

        // Check for rate limit
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
            const { markModelRateLimited } = await import("@/actions/gemini-config");
            const modelName = await getGeminiModel();
            await markModelRateLimited(modelName);
            return { error: `Rate limit reached for ${modelName}. Please switch models.` };
        }

        return { error: `Failed to analyze resume: ${error.message || error}` };
    }
}

export async function generateCoverLetter(resumeText: string, jobDescription: string) {
    const session = await auth();

    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    try {
        const model = await getGeminiModelInstance();

        const prompt = `
            You are an expert Career Coach and Professional Writer.
            Write a compelling, professional Cover Letter for a candidate applying to a specific job.

            Candidate's Resume Context:
            "${resumeText.slice(0, 10000)}"

            Target Job Description:
            "${jobDescription.slice(0, 5000)}"

            Instructions:
            1. Address the hiring manager professionally.
            2. Hook the reader in the first paragraph by mentioning the specific role and why the candidate is a great fit.
            3. In the body paragraphs, map the candidate's specific achievements (from resume) to the key requirements of the JD.
            4. Keep the tone confident, enthusiastic, and professional.
            5. Use Markdown formatting for readability.

            Return ONLY the cover letter text in Markdown. Do not include any JSON wrapping.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const coverLetter = response.text();

        return { success: true, coverLetter };

    } catch (error: any) {
        console.error("Error generating cover letter:", error);
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
            return { error: "Rate limit reached. Please try again later." };
        }
        return { error: `Failed to generate cover letter: ${error.message}` };
    }
}

export async function rewriteResume(currentText: string, analysis: any, customInstructions?: string) {
    const session = await auth();

    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    try {
        const model = await getGeminiModelInstance();

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

        // Check for rate limit
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
            const { markModelRateLimited } = await import("@/actions/gemini-config");
            const modelName = await getGeminiModel();
            await markModelRateLimited(modelName);
            return { error: `Rate limit reached for ${modelName}. Please switch models.` };
        }

        return { error: `Failed to rewrite resume: ${error.message || error}` };
    }
}
