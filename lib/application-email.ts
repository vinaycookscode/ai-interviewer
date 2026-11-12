// The email when an employer moves a candidate's application (AIIN-197). Pure: tested on its own.
import { candidateStage, type Stage } from "./applications.ts";

/** Stages worth an email. Applied, Invited and the candidate's own moves aren't. */
export const EMAILED: Stage[] = ["SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** Subject and body. Never carries the employer's notes or a rejection reason: only the stage, in the candidate's words. */
export function applicationEmail(input: { name: string | null; job: string; company: string; stage: Stage; appUrl: string }): {
    subject: string;
    html: string;
    text: string;
} {
    const word = candidateStage(input.stage);
    const subject = `${input.job} at ${input.company}: ${word}`;
    const hello = input.name ? `Hi ${input.name.split(" ")[0]},` : "Hi,";
    const line = `Your application for ${input.job} at ${input.company} is now: ${word}.`;
    const link = `${input.appUrl}/candidate/applications`;
    const stop = "You get these because you turned on application emails. Turn them off on My applications.";
    return {
        subject,
        text: `${hello}\n\n${line}\n\nSee all your applications: ${link}\n\n${stop}`,
        html: `<p>${esc(hello)}</p><p>${esc(line)}</p><p><a href="${esc(link)}">See all your applications</a></p><p style="color:#666;font-size:13px">${esc(stop)}</p>`,
    };
}
