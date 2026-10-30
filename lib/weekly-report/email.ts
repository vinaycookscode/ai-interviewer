// The weekly report email, in HTML (Soft Glass, from the approved Batch 10 artboard) and plain text (AIIN-103).
import { escapeHtml } from "@/lib/utils";
import { practiceLine, type NextStep, type Report } from "@/lib/weekly-report/report";

export interface WeeklyEmail {
    subject: string;
    html: string;
    text: string;
}

interface Links {
    app: string;
    unsubscribe: string;
}

const C = {
    bg: "#f6f2ee", card: "#ffffff", text: "#1f1a26", muted: "#5b5466", row: "#f6f2ee", rule: "#e6e1ea",
    coral: "#f28c6b", coralInk: "#2a1612", lavender: "#e7e2ff", lavenderInk: "#3f3196",
};

const NEXT: Record<NextStep["kind"], { body: (s: NextStep) => string; cta: string; path: string }> = {
    practiseRole: {
        body: (s) => `Your weakest answer this week was below 7. Another ${s.kind === "practiseRole" ? s.role : ""} practice interview is the quickest way to lift your average.`,
        cta: "Practise again",
        path: "/candidate/practice",
    },
    startPlan: { body: () => "A few minutes a day adds up. The 90-day plan gives you one small task each day.", cta: "Start the 90-day plan", path: "/candidate/placement-program" },
    planTask: { body: () => "Keep your streak going: today’s plan task takes about 15 minutes.", cta: "Do today’s task", path: "/candidate/placement-program" },
    practice: { body: () => "Ten minutes of practice keeps what you’ve learned fresh.", cta: "Do a practice interview", path: "/candidate/practice" },
};

const short = (s: string, n = 80) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function renderWeeklyEmail(report: Report, name: string | null, email: string, weekLabel: string, links: Links): WeeklyEmail {
    const first = name?.trim().split(/\s+/)[0] || null;
    const quiet = report.kind === "quiet";
    const p = report.practice;
    const subject = quiet
        ? "We missed you last week"
        : p.count
          ? `Your week: ${practiceLine(p)}`
          : `Your week: ${report.daysActive} day${report.daysActive === 1 ? "" : "s"} of practice`;
    const headline = quiet ? `We missed you${first ? `, ${first}` : ""}` : `Your week${first ? `, ${first}` : ""}`;
    const next = NEXT[report.next.kind];
    const nextBody = next.body(report.next);
    const cta = { label: next.cta, href: `${links.app}${next.path}` };

    const stats: [string, string, string][] = quiet
        ? []
        : [
              ["Practice interviews", p.average === null ? String(p.count) : `${p.count} · average ${p.average.toFixed(1)}`,
               p.change ? `${p.change > 0 ? "Up" : "Down"} ${Math.abs(p.change).toFixed(1)} on last week` : p.count ? "First scored week" : "None this week"],
              ["Days active", `${report.daysActive} of 7`, report.planStreak !== null ? `Plan streak: ${report.planStreak} day${report.planStreak === 1 ? "" : "s"}` : "Practice, plan or flashcards"],
              ["Flashcards", `${report.flashcardsReviewed} reviewed`, report.flashcardsReviewed ? "Spaced for memory" : "None this week"],
          ];
    const answers: [string, string][] = [];
    if (report.strongest) answers.push(["Best answer", `${short(report.strongest.question)} (${report.strongest.score.toFixed(1)})`]);
    if (report.weakest) answers.push(["To work on", `${short(report.weakest.question)} (${report.weakest.score.toFixed(1)})`]);

    const e = escapeHtml;
    const label = `font-size:13px;line-height:18px;font-weight:700;color:${C.muted}`;
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>${e(subject)}</title>
<style>
@media (prefers-color-scheme: dark) {
  .bg { background:#14111c !important; } .card { background:#221d2c !important; border-color:#332d3f !important; }
  .text { color:#f4f0f8 !important; } .muted { color:#b8b0c6 !important; } .row { background:#2a2435 !important; }
  .rule { border-color:#3a3346 !important; } .tip { background:#2f2850 !important; } .tip-ink { color:#d6cfff !important; }
}
</style></head>
<body class="bg" style="margin:0;padding:24px 12px 40px;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${C.text}">
<div style="display:none;max-height:0;overflow:hidden">${e(quiet ? "Ten minutes today keeps it fresh." : `${report.daysActive} of 7 days active. One thing to work on this week.`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td class="text" style="padding:0 4px 16px;font-family:Georgia,serif;font-size:18px;font-weight:600;color:${C.text}">Get Back To U</td></tr>
<tr><td class="card" style="background:${C.card};border:1px solid ${C.rule};border-radius:24px;padding:32px 24px">
<p class="muted" style="margin:0 0 8px;${label}">Your week · ${e(weekLabel)}</p>
<h1 class="text" style="margin:0 0 20px;font-family:Georgia,serif;font-size:28px;line-height:1.2;font-weight:600;color:${C.text}">${e(headline)}</h1>
${stats.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px">${stats
        .map(([l, v, n]) => `<tr><td class="row" style="background:${C.row};border-radius:16px;padding:14px 16px"><p class="muted" style="margin:0;${label}">${e(l)}</p><p class="text" style="margin:2px 0 0;font-size:20px;font-weight:700;color:${C.text}">${e(v)}</p><p class="text" style="margin:2px 0 0;font-size:14px;color:${C.text}">${e(n)}</p></td></tr><tr><td style="height:8px"></td></tr>`)
        .join("")}</table>` : ""}
${answers.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:15px">${answers
        .map(([l, v]) => `<tr><td class="rule muted" style="padding:10px 12px 10px 0;border-top:1px solid ${C.rule};color:${C.muted};width:35%;vertical-align:top">${e(l)}</td><td class="rule text" style="padding:10px 0;border-top:1px solid ${C.rule};font-weight:700;color:${C.text}">${e(v)}</td></tr>`)
        .join("")}</table>` : ""}
${quiet ? `<p class="text" style="margin:0 0 20px;font-size:16px;line-height:26px;color:${C.text}">No practice last week, and that’s fine. ${e(nextBody)}</p>` : `<div class="tip" style="background:${C.lavender};border-radius:18px;padding:16px 18px;margin:0 0 20px"><p class="tip-ink" style="margin:0 0 6px;${label};color:${C.lavenderInk}">One thing for this week</p><p class="text" style="margin:0;font-size:16px;line-height:24px;color:${C.text}">${e(nextBody)}</p></div>`}
<a href="${e(cta.href)}" style="display:inline-block;background:${C.coral};color:${C.coralInk};text-decoration:none;font-weight:700;font-size:16px;padding:15px 28px;border-radius:999px">${e(cta.label)}</a>
</td></tr>
<tr><td class="muted" style="padding:16px 4px 0;font-size:13px;line-height:20px;color:${C.muted}">You get this every Monday because you practise on Get Back To U as ${e(email)}. <a href="${e(links.unsubscribe)}" class="muted" style="color:${C.muted};text-decoration:underline">Stop weekly emails</a> · Get Back To U, Pune, India.</td></tr>
</table></td></tr></table></body></html>`;

    const text = [
        `${headline}`,
        `Your week · ${weekLabel}`,
        "",
        ...stats.map(([l, v, n]) => `${l}: ${v} (${n})`),
        ...answers.map(([l, v]) => `${l}: ${v}`),
        "",
        quiet ? `No practice last week, and that’s fine. ${nextBody}` : `One thing for this week: ${nextBody}`,
        `${cta.label}: ${cta.href}`,
        "",
        `You get this every Monday because you practise on Get Back To U as ${email}.`,
        `Stop weekly emails: ${links.unsubscribe}`,
    ].join("\n");

    return { subject, html, text };
}
