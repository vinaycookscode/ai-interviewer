"use server";

import { ownFileUrl } from "@/lib/storage-key";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { validateUpload, MAX_UPLOAD_BYTES } from "@/lib/upload-validation";
import { resumeScreenerService } from "@/lib/services/ai/resume-screener.service";
import { handleError } from "@/lib/error-handler";
import { getGeminiModelInstance } from "@/lib/gemini";
import { getGeminiModel } from "@/actions/gemini-config";
import type { ResumeAnalysis } from "@/types";
import type { Prisma } from "@prisma/client";
import { readStoredAnalysis, reviewLabel } from "@/lib/resume-reviews";

// pdf-parse needs Promise.withResolvers, built into Node 22 (pinned in package.json engines; AIIN-65)
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

    // Never fetch a URL the client sends (SSRF). Use the resume stored on the
    // user's own profile, and only if it lives in our own bucket.
    const profile = await db.user.findUnique({
        where: { id: session.user.id },
        select: { resumeUrl: true },
    });
    // Only their own folder: a stored URL pointing at someone else's file is never fetched (AIIN-216)
    const profileResumeUrl = ownFileUrl(profile?.resumeUrl, process.env.R2_PUBLIC_URL, session.user.id) ?? null;

    if (!(file && file.size > 0) && !profileResumeUrl) {
        return { error: "No resume provided. Please upload a resume or complete your profile." };
    }

    try {
        let resumeText: string;
        if (file && file.size > 0) {
            const upload = await validateUpload(file, "resumePdf", "resume");
            if (!upload.ok) return { error: upload.error };
            resumeText = (await pdf(upload.buffer)).text;
        } else if (profileResumeUrl) {
            // The profile resume's text is kept once read, and cleared when the resume is replaced (AIIN-33)
            const cached = await db.candidateProfile.findUnique({ where: { userId: session.user.id }, select: { resumeText: true } });
            if (cached?.resumeText) {
                resumeText = cached.resumeText;
            } else {
                const response = await fetch(profileResumeUrl, { redirect: "error" });
                if (!response.ok) throw new Error("Failed to fetch resume from profile URL");
                if (Number(response.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES) {
                    return { error: "Your profile resume is too large to analyze." };
                }
                resumeText = (await pdf(Buffer.from(await response.arrayBuffer()))).text;
                if (resumeText?.trim().length >= 50) {
                    await db.candidateProfile.updateMany({ where: { userId: session.user.id }, data: { resumeText } });
                }
            }
        } else {
            return { error: "No valid resume source found." };
        }

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

        // Kept so the candidate can look back and compare (AIIN-64)
        const { score, ...review } = analysis;
        const saved = await db.resumeReview.create({
            data: {
                userId: session.user.id,
                score: Math.max(0, Math.min(100, Math.round(score))),
                label: reviewLabel(jobDescription),
                jobDescription: jobDescription?.trim() || null,
                resumeText,
                analysis: review as unknown as Prisma.InputJsonValue,
            },
            select: { id: true, createdAt: true, score: true, label: true },
        });

        return { success: true, analysis: result, saved: { ...saved, createdAt: saved.createdAt.toISOString() } };

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

export async function rewriteResume(currentText: string, analysis: ResumeAnalysis, customInstructions?: string) {
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
            - Formatting issues to address (in text structure): ${JSON.stringify(analysis.formattingIssues ?? [])}
            - Specific tips to apply: ${JSON.stringify(analysis.suggestions)}

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

/** One of the candidate's own past reviews, to show again (AIIN-64). Anyone else's is not found. */
export async function getResumeReview(id: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || typeof id !== "string") return { error: "notFound" as const };
    const r = await db.resumeReview.findFirst({
        where: { id, userId },
        select: { score: true, analysis: true, resumeText: true, jobDescription: true },
    });
    if (!r) return { error: "notFound" as const };
    return { ok: true as const, analysis: { ...readStoredAnalysis(r.analysis, r.score), resumeText: r.resumeText, jobDescription: r.jobDescription ?? undefined } };
}
