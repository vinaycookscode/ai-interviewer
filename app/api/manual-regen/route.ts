
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { evaluateAnswer } from "@/lib/gemini";

export async function GET() {
    try {
        // 1. Find the user
        const user = await db.user.findUnique({
            where: { email: "abc@abc.com" }
        });

        if (!user) {
            return NextResponse.json({ error: "User abc@abc.com not found" }, { status: 404 });
        }

        // 2. Find latest interview
        const interview = await db.interview.findFirst({
            where: { candidateId: user.id },
            orderBy: { createdAt: 'desc' },
            include: { answers: { include: { question: true } } }
        });

        if (!interview) {
            return NextResponse.json({ error: "No interview found for user" }, { status: 404 });
        }

        // 3. Re-evaluate answers that might have failed
        const results = [];
        let totalScore = 0;
        let answerCount = 0;

        for (const answer of interview.answers) {
            // Evaluate using our (now fixed) Gemini function
            // We re-evaluate all to ensure "latest implementation" is used
            const evaluation = await evaluateAnswer(answer.question.text, answer.transcript);

            // Update the answer in DB
            await db.answer.update({
                where: { id: answer.id },
                data: {
                    score: evaluation.score,
                    feedback: evaluation.feedback
                }
            });

            if (evaluation.score) {
                totalScore += evaluation.score;
                answerCount++;
            }
            results.push({
                question: answer.question.text,
                oldScore: answer.score,
                newScore: evaluation.score,
                feedback: evaluation.feedback
            });
        }

        // 4. Update overall interview score/feedback
        const averageScore = answerCount > 0 ? totalScore / answerCount : 0;

        await db.interview.update({
            where: { id: interview.id },
            data: {
                score: averageScore,
                feedback: `Interview re-evaluated. Average score: ${averageScore.toFixed(1)}/10.`,
                status: "COMPLETED"
            }
        });

        return NextResponse.json({
            success: true,
            interviewId: interview.id,
            averageScore,
            results
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
