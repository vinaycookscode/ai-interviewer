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

        // Clean up response - Robust JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("No JSON found in response:", text);
            throw new Error("AI response format error. Please try again.");
        }

        const jsonString = jsonMatch[0];
        let analysis;

        try {
            analysis = JSON.parse(jsonString);
        } catch (e) {
            console.error("Initial JSON Parse failed, attempting repair:", e);
            // Common AI JSON errors: Trailing commas, unescaped newlines
            try {
                // Remove trailing commas before } or ]
                const repaired = jsonString.replace(/,(\s*[\]}])/g, '$1')
                    // Escape unescaped newlines within strings (basic attempt)
                    // .replace(/(?<!\\)\n/g, "\\n") // Risky if it hits formatting
                    ;
                analysis = JSON.parse(repaired);
            } catch (e2) {
                console.error("JSON Repair failed:", e2, "Raw:", jsonString);
                throw new Error("Failed to parse analysis results. The AI response was malformed.");
            }
        }

        // Include original text for rewriting purposes
        analysis.resumeText = resumeText;
        analysis.jobDescription = jobDescription; // Pass back for cover letter generation

        // Increment usage after successful analysis
        await incrementUsage("resume_analysis");

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

        // Increment usage after successful generation
        await incrementUsage("cover_letter");

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

        // Clean up response - Robust JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("No JSON found in response:", text);
            throw new Error("AI response format error. Please try again.");
        }

        const jsonString = jsonMatch[0];
        let rewriteResult;

        try {
            rewriteResult = JSON.parse(jsonString);
        } catch (e) {
            console.error("Initial JSON Parse failed, attempting repair:", e);
            try {
                const repaired = jsonString.replace(/,(\s*[\]}])/g, '$1');
                rewriteResult = JSON.parse(repaired);
            } catch (e2) {
                console.error("JSON Repair failed:", e2, "Raw:", jsonString);
                throw new Error("Failed to parse rewrite results. The AI response was malformed.");
            }
        }

        // Increment usage after successful rewrite
        await incrementUsage("resume_rewrite");

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
