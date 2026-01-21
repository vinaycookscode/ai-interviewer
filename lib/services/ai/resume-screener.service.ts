import { getGeminiModelInstance } from "@/lib/gemini";
import { ResumeAnalysis } from "@/types";

/**
 * Service for AI-powered resume analysis and content generation.
 * Encapsulates all Gemini AI logic for resume screening.
 */
export class ResumeScreenerService {
    /**
     * Analyze a resume against an optional job description
     */
    async analyze(resumeText: string, jobDescription?: string): Promise<ResumeAnalysis> {
        const model = await getGeminiModelInstance();

        let prompt = `
      You are an expert ATS (Applicant Tracking System) and Resume Coach.
      Analyze the following resume text and provide a structured evaluation.

      Resume Text:
      "${resumeText.slice(0, 10000)}"
    `;

        if (jobDescription && jobDescription.trim().length > 10) {
            prompt += `
      
      Target Job Description:
      "${jobDescription.slice(0, 5000)}"

      Perform a COMPARATIVE ANALYSIS.
      
      Return ONLY a valid JSON object with the following structure:
      {
          "score": number (0-100, based on match with JD),
          "summary": "Brief professional summary of the candidate (max 2 sentences)",
          "strengths": ["List of 3-5 key strengths identified in relation to the JD"],
          "weaknesses": ["List of 3-5 areas where the resume falls short of the JD"],
          "suggestions": ["List of 3-5 actionable tips to tailor the resume for THIS specific job"],
          "keywords": ["List of 5-10 important keywords/skills from the JD that are MISSING from the resume"],
          "atsCompatibility": number (0-100, similarity score)
      }
      `;
        } else {
            prompt += `
      
      Return ONLY a valid JSON object with the following structure:
      {
          "score": number (0-100),
          "summary": "Brief professional summary of the candidate (max 2 sentences)",
          "strengths": ["List of 3-5 key strengths identified"],
          "weaknesses": ["List of 3-5 areas for improvement"],
          "suggestions": ["List of 3-5 actionable tips to improve the resume"],
          "keywords": [],
          "atsCompatibility": 0
      }
      `;
        }

        prompt += `
      Do not include any markdown formatting (like \`\`\`json). Just the raw JSON string.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return this.parseAndCleanResponse(text);
    }

    /**
     * Generate a cover letter based on resume and job description
     */
    async generateCoverLetter(resumeText: string, jobDescription?: string): Promise<string> {
        if (!jobDescription) {
            throw new Error("Job description is required for cover letter generation");
        }
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
        return response.text();
    }

    /**
     * Robust JSON parsing with basic repair logic
     */
    private parseAndCleanResponse(text: string): any {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in AI response");
        }

        const jsonString = jsonMatch[0];
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            // Basic repair: remove trailing commas
            const repaired = jsonString.replace(/,(\s*[\]}])/g, '$1');
            try {
                return JSON.parse(repaired);
            } catch (e2) {
                throw new Error("Failed to parse AI response even after repair");
            }
        }
    }
}

// Export a singleton instance
export const resumeScreenerService = new ResumeScreenerService();
