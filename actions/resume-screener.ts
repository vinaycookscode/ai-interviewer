"use server";

import { auth } from "@/auth";
import { resumeScreenerService } from "@/lib/services/ai/resume-screener.service";
import { handleError } from "@/lib/error-handler";
import { getGeminiModelInstance } from "@/lib/gemini";
import { getGeminiModel } from "@/actions/gemini-config";

// Polyfill for pdf-parse dependencies
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

export async function analyzeResume(formData: FormData) {
    const session = await auth();

    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    // Check usage limit
    const { checkUsageLimit, incrementUsage } = await import("@/lib/usage");
    const usageCheck = await checkUsageLimit("resume_analysis");

    if (!usageCheck.allowed) {
        return {
            error: usageCheck.message,
            upgradeRequired: true,
            usage: {
                current: usageCheck.currentUsage,
                limit: usageCheck.limit,
                remaining: usageCheck.remaining,
            }
        };
    }

    let file = formData.get("file") as File | null;
    const resumeUrlFromProfile = formData.get("resumeUrl") as string | null;

    if (!file && !resumeUrlFromProfile) {
        return { error: "No resume provided. Please upload a resume or complete your profile." };
    }

    try {
        let buffer: Buffer;
        if (file && file.size > 0) {
            const arrayBuffer = await file.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else if (resumeUrlFromProfile) {
            const response = await fetch(resumeUrlFromProfile);
            if (!response.ok) throw new Error("Failed to fetch resume from profile URL");
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else {
            return { error: "No valid resume source found." };
        }

        // Extract text from PDF
        const pdfData = await pdf(buffer);
        const resumeText = pdfData.text;

        if (!resumeText || resumeText.trim().length < 50) {
            return { error: "Could not extract sufficient text from the resume. Please ensure it is a text-based PDF." };
        }

        // Get optional Job Description
        const jobDescription = (formData.get("jobDescription") as string) || undefined;

        // Use the new service
        const analysis = await resumeScreenerService.analyze(resumeText, jobDescription);

        // Include original text for consistency
        const result = {
            ...analysis,
            resumeText,
            jobDescription
        };

        // Increment usage
        await incrementUsage("resume_analysis");

        return { success: true, analysis: result };

    } catch (error) {
        handleError(error, "analyzeResume");
        return { error: "Failed to analyze resume. Please try again." };
    }
}

export async function generateCoverLetter(resumeText: string, jobDescription: string) {
    const session = await auth();

    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    // Check usage limit
    const { checkUsageLimit, incrementUsage } = await import("@/lib/usage");
    const usageCheck = await checkUsageLimit("cover_letter");

    if (!usageCheck.allowed) {
        return {
            error: usageCheck.message,
            upgradeRequired: true,
            usage: {
                current: usageCheck.currentUsage,
                limit: usageCheck.limit,
                remaining: usageCheck.remaining,
            }
        };
    }

    try {
        const coverLetter = await resumeScreenerService.generateCoverLetter(resumeText, jobDescription);

        // Increment usage
        await incrementUsage("cover_letter");

        return { success: true, coverLetter };

    } catch (error: any) {
        handleError(error, "generateCoverLetter");
        return { error: "Failed to generate cover letter. Please try again." };
    }
}

export async function rewriteResume(currentText: string, analysis: any, customInstructions?: string) {
    const session = await auth();

    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    // Check usage limit
    const { checkUsageLimit, incrementUsage } = await import("@/lib/usage");
    const usageCheck = await checkUsageLimit("resume_rewrite");

    if (!usageCheck.allowed) {
        return {
            error: usageCheck.message,
            upgradeRequired: true,
            usage: {
                current: usageCheck.currentUsage,
                limit: usageCheck.limit,
                remaining: usageCheck.remaining,
            }
        };
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
            6. FORMATTING REQUIREMENTS:
               - Use professional Markdown.
               - Find and correctly format all links (LinkedIn, Portfolio, Email) using Markdown syntax \`[Link Text](url)\`.
               - Use bullet points \`- \` for all lists.
               - Separate each job position or project entry with a horizontal rule \`---\` on a new line.
               - Ensure consistent spacing between sections.
            ${customInstructions ? "7. STRICTLY FOLLOW the user's custom instructions provided above." : ""}
            
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

        // Robust JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI response format error");
        }

        const rewriteResult = JSON.parse(jsonMatch[0].replace(/,(\s*[\]}])/g, '$1'));

        // Increment usage
        await incrementUsage("resume_rewrite");

        return { success: true, ...rewriteResult };

    } catch (error: any) {
        handleError(error, "rewriteResume");
        return { error: "Failed to rewrite resume. Please try again." };
    }
}

