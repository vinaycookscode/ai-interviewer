import { Resend } from 'resend';
import { env } from '@/env';
import { escapeHtml } from '@/lib/utils';
import { CONTACT_EMAIL } from '@/lib/legal';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Determine APP_URL for production
const getAppUrl = () => {
    // If APP_URL is explicitly set to something other than localhost (via env.ts), use it
    if (env.APP_URL && !env.APP_URL.includes("localhost")) {
        return env.APP_URL;
    }

    // Fallback to common build/deployment env vars if they exist
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }

    if (process.env.NEXTAUTH_URL) {
        return process.env.NEXTAUTH_URL;
    }

    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    // Default from env.ts (likely localhost)
    return env.APP_URL;
};

export const APP_URL = getAppUrl();

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${APP_URL}/auth/reset-password?token=${token}`;

    // If Resend is not configured, log the link for development
    if (!resend) {
        console.log('='.repeat(60));
        console.log('📧 PASSWORD RESET EMAIL (RESEND NOT CONFIGURED)');
        console.log('='.repeat(60));
        console.log(`To: ${email}`);
        console.log(`Reset Link: ${resetLink}`);
        console.log('='.repeat(60));
        return { success: true, dev: true };
    }

    try {
        await resend.emails.send({
            from: 'Get Back To U <noreply@getbacktou.com>',
            to: email,
            subject: 'Reset Your Password',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
                    <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0;">Reset Your Password</h1>
                        </div>
                        
                        <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                            You requested to reset your password. Click the button below to set a new password:
                        </p>
                        
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${escapeHtml(resetLink)}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                Reset Password
                            </a>
                        </div>
                        
                        <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
                            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
                        
                        <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                            Get Back To U - Your AI Interview Preparation Platform
                        </p>
                    </div>
                </body>
                </html>
            `,
        });

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to send email' };
    }
}

/**
 * "Verify your email" (AIIN-55), from the approved EmailVerify board. The link works for 24 hours; only the newest
 * one works. Without Resend configured, the link is logged for local development.
 */
export async function sendVerificationEmail(email: string, name: string | null, token: string) {
    const link = `${APP_URL}/auth/verify?token=${encodeURIComponent(token)}`;
    if (!resend) {
        console.log(`Verification email (Resend not configured) to ${email}: ${link}`);
        return { success: true, dev: true };
    }
    const hello = name?.trim() ? `Hi ${name.trim().split(/\s+/)[0]}, confirm` : "Confirm";
    try {
        await resend.emails.send({
            from: "Get Back To U <noreply@getbacktou.com>",
            to: email,
            subject: "Verify your email for Get Back To U",
            text: [
                `${hello} that ${email} is yours and your practice interviews are ready to go:`,
                link,
                "This link works for 24 hours. If you didn't create an account, ignore this email and nothing happens.",
            ].join("\n\n"),
            html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:24px 16px 40px;background:#f6f2ee;color:#1f1a26;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
<div style="max-width:600px;margin:0 auto">
<p style="margin:0 0 20px;font-size:18px;font-weight:600;font-family:Georgia,serif">Get Back To U</p>
<div style="padding:32px;border-radius:24px;background:#ffffff">
<h1 style="margin:0 0 20px;font-size:28px;line-height:1.2;font-weight:600;font-family:Georgia,serif">Verify your email</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:26px">${escapeHtml(hello)} that <strong>${escapeHtml(email)}</strong> is yours and your practice interviews are ready to go:</p>
<p style="margin:0 0 20px"><a href="${escapeHtml(link)}" style="display:inline-block;padding:15px 28px;border-radius:999px;background:#f28c6b;color:#2a1612;font-weight:700;text-decoration:none">Verify my email</a></p>
<p style="margin:0 0 16px;font-size:15px;line-height:23px;color:#5b5466">This link works for 24 hours. If you didn't create an account, ignore this email and nothing happens.</p>
<p style="margin:0;font-size:13px;line-height:20px;color:#5b5466">Button not working? Paste this into your browser:<br><span style="color:#1f1a26;word-break:break-all">${escapeHtml(link)}</span></p>
</div>
<p style="margin:16px 0 0;font-size:13px;line-height:20px;color:#5b5466">Sent because an account was created with this address on getbacktou.com. Get Back To U, Pune, India.</p>
</div></body></html>`,
        });
        return { success: true };
    } catch (error) {
        console.error("Verification email failed:", error);
        return { success: false };
    }
}

const shell = (title: string, body: string, footer: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:24px 16px 40px;background:#f6f2ee;color:#1f1a26;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
<div style="max-width:600px;margin:0 auto">
<p style="margin:0 0 20px;font-size:18px;font-weight:600;font-family:Georgia,serif">Get Back To U</p>
<div style="padding:32px;border-radius:24px;background:#ffffff">
<h1 style="margin:0 0 20px;font-size:28px;line-height:1.2;font-weight:600;font-family:Georgia,serif">${escapeHtml(title)}</h1>
${body}
</div>
<p style="margin:16px 0 0;font-size:13px;line-height:20px;color:#5b5466">${escapeHtml(footer)}</p>
</div></body></html>`;
const button = (href: string, label: string) =>
    `<p style="margin:0 0 20px"><a href="${escapeHtml(href)}" style="display:inline-block;padding:15px 28px;border-radius:999px;background:#f28c6b;color:#2a1612;font-weight:700;text-decoration:none">${escapeHtml(label)}</a></p>`;

/** The link that moves an account to a new address (AIIN-227), sent to the new address. */
export async function sendEmailChangeLink(email: string, name: string | null, token: string) {
    const link = `${APP_URL}/auth/verify?token=${encodeURIComponent(token)}`;
    if (!resend) {
        console.log(`Email change link (Resend not configured) to ${email}: ${link}`);
        return { success: true, dev: true };
    }
    const hello = name?.trim() ? `Hi ${name.trim().split(/\s+/)[0]}, confirm` : "Confirm";
    try {
        await resend.emails.send({
            from: "Get Back To U <noreply@getbacktou.com>",
            to: email,
            subject: "Confirm your new email for Get Back To U",
            text: [`${hello} that ${email} is yours, and your account will switch to it:`, link, "This link works for 24 hours. Until you open it, your account keeps its current email."].join("\n\n"),
            html: shell(
                "Confirm your new email",
                `<p style="margin:0 0 20px;font-size:16px;line-height:26px">${escapeHtml(hello)} that <strong>${escapeHtml(email)}</strong> is yours, and your account will switch to it:</p>` +
                    button(link, "Use this email") +
                    `<p style="margin:0;font-size:15px;line-height:23px;color:#5b5466">This link works for 24 hours. Until you open it, your account keeps its current email.</p>`,
                "Sent because someone asked to move a Get Back To U account to this address.",
            ),
        });
        return { success: true };
    } catch (error) {
        console.error("Email change link failed:", error);
        return { success: false };
    }
}

/** "Your email was changed", sent to the old address once the change is made (AIIN-227), from the EmailChanged board. */
export async function sendEmailChangedNotice(oldEmail: string, name: string | null, newEmail: string) {
    if (!resend) {
        console.log(`Email changed notice (Resend not configured) to ${oldEmail}: now ${newEmail}`);
        return { success: true, dev: true };
    }
    await resend.emails.send({
        from: "Get Back To U <noreply@getbacktou.com>",
        to: oldEmail,
        replyTo: CONTACT_EMAIL,
        subject: "Your Get Back To U email was changed",
        text: [
            `The account that used ${oldEmail} now signs in with ${newEmail}. This address won't get our emails any more.`,
            "If you made this change, there's nothing to do. If you didn't, reply to this email and we'll help you get your account back.",
        ].join("\n\n"),
        html: shell(
            "Your email was changed",
            `<p style="margin:0 0 20px;font-size:16px;line-height:26px">The account that used <strong>${escapeHtml(oldEmail)}</strong> now signs in with <strong>${escapeHtml(newEmail)}</strong>. This address won't get our emails any more.</p>` +
                `<p style="margin:0;font-size:15px;line-height:23px;color:#5b5466">If you made this change, there's nothing to do. If you didn't, reply to this email and we'll help you get your account back.</p>`,
            "Sent because the email on your Get Back To U account was changed.",
        ),
    });
    return { success: true };
}
