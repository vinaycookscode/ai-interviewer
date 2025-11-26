import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generatePersonalityProfile(interviewId: string) {
    try {
        // 1. Fetch interview data with answers
        const interview = await db.interview.findUnique({
            where: { id: interviewId },
            include: {
                answers: {
                    include: {
                        question: true,
                    },
                },
                job: true,
            },
        });

        if (!interview || interview.answers.length === 0) {
            console.log("No interview or answers found for personality analysis");
            return null;
        }

        // 2. Construct the prompt
        const transcript = interview.answers
            .map((a) => `Q: ${a.question.text}\nA: ${a.transcript}`)
            .join("\n\n");

        const prompt = `
      Analyze the following interview transcript for a ${interview.job.title} position.
      Focus on the candidate's personality, communication style, and behavioral traits.
      Ignore the technical correctness of the answers (that is scored separately).
      
      Transcript:
      ${transcript}

      Return a JSON object with the following structure:
      {
        "communicationStyle": "string (e.g., Concise, Elaborate, Technical)",
        "confidenceScore": number (0-10),
        "technicalDepth": "string (Surface, Intermediate, Expert)",
        "strengths": ["string", "string", "string"],
        "weaknesses": ["string", "string"],
        "cultureFitScore": number (0-100),
        "summary": "string"
      }
    `;

        // 3. Call Gemini API
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
        });

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean up text to ensure it's valid JSON (remove markdown code blocks if present)
        const jsonString = text.replace(/```json\n?|\n?```/g, "").trim();
        const object = JSON.parse(jsonString);

        // 4. Save to database
        const profile = await db.personalityProfile.create({
            data: {
                interviewId: interview.id,
                communicationStyle: object.communicationStyle,
                confidenceScore: object.confidenceScore,
                technicalDepth: object.technicalDepth,
                strengths: object.strengths,
                weaknesses: object.weaknesses,
                cultureFitScore: object.cultureFitScore,
                summary: object.summary,
            },
        });

        return profile;
    } catch (error) {
        console.error("Error generating personality profile:", error);
        return null; // Don't block the main flow if this fails
    }
}
