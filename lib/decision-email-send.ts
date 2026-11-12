// Sending decision emails after a bulk decision (AIIN-159). Batched like the weekly report: Resend takes 100 a call.
import { Resend } from "resend";
import { env } from "@/env";
import { decisionEmail, type EmailedDecision } from "@/lib/decision-email";

const BATCH = 100;

export interface Recipient {
    interviewId: string;
    name: string | null;
    email: string;
}

/**
 * Email each recipient once about their decision, from "{employer} via Get Back To U" with replies to the employer.
 * Returns the interviews whose email didn't go: a failed batch fails all of its emails, never the decisions.
 */
export async function sendDecisionEmails(decision: EmailedDecision, job: string, employer: { name: string | null; email: string }, recipients: Recipient[]): Promise<string[]> {
    const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
    const company = employer.name?.trim() || "Get Back To U";
    const failed: string[] = [];
    for (let i = 0; i < recipients.length; i += BATCH) {
        const batch = recipients.slice(i, i + BATCH);
        if (!resend) {
            console.log(`Decision emails: Resend isn't configured; would send ${batch.length}`);
            continue;
        }
        try {
            const { error } = await resend.batch.send(
                batch.map((r) => {
                    const mail = decisionEmail(decision, r, job, { name: employer.name, person: null });
                    return {
                        from: `${company.replace(/[<>"]/g, "")} via Get Back To U <noreply@getbacktou.com>`,
                        to: r.email,
                        replyTo: employer.email,
                        subject: mail.subject,
                        html: mail.html,
                        text: mail.text,
                    };
                })
            );
            if (error) throw new Error(error.message);
        } catch (error) {
            console.error("Decision email batch failed:", error);
            failed.push(...batch.map((r) => r.interviewId));
        }
    }
    return failed;
}
