// The emails a candidate gets after a bulk decision (AIIN-159), as previewed in the approved bulk decision dialog.
// Pure: no database, no "@/" imports. On hold sends nothing.

export type EmailedDecision = "SHORTLISTED" | "REJECTED";

export function emailsFor(decision: string): decision is EmailedDecision {
    return decision === "SHORTLISTED" || decision === "REJECTED";
}

const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export interface DecisionEmail {
    subject: string;
    /** The lines of the message, plain; the HTML is built from these. */
    lines: string[];
    signature: string;
    html: string;
    text: string;
}

/** One candidate's email: their first name, the job and who it's from, all escaped in the HTML. */
export function decisionEmail(decision: EmailedDecision, to: { name: string | null }, job: string, employer: { name: string | null; person: string | null }): DecisionEmail {
    const first = to.name?.trim().split(/\s+/)[0] || "there";
    const company = employer.name?.trim() || "the hiring team";
    const person = employer.person?.trim() || company;
    const subject = decision === "SHORTLISTED" ? `You’ve moved to the next round for ${job}` : `An update on your application for ${job}`;
    const lines =
        decision === "SHORTLISTED"
            ? [`Hi ${first}, good news: you’re through to the next round for ${job}.`, `${person} from ${company} will be in touch about what happens next.`]
            : [
                  `Hi ${first}, thank you for taking the interview for ${job}.`,
                  `We’ve decided not to move forward this time. We read every answer, and we wish you the best with your search.`,
              ];
    const signature = person === company ? company : `${person}, ${company}`;
    const html = `<!doctype html><html><body style="margin:0;background:#f6f2ee;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#1f1a26">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px"><tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;line-height:28px">${escape(subject)}</h1>
${lines.map((l) => `<p style="margin:0 0 12px;font-size:16px;line-height:24px">${escape(l)}</p>`).join("\n")}
<p style="margin:16px 0 0;font-size:15px;color:#5b5466">${escape(signature)}</p>
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#5b5466">Sent by ${escape(company)} through Get Back To U.</p>
</td></tr></table></body></html>`;
    const text = `${subject}\n\n${lines.join("\n\n")}\n\n${signature}\n\nSent by ${company} through Get Back To U.`;
    return { subject, lines, signature, html, text };
}
