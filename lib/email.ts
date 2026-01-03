import { Resend } from 'resend';
import { env } from '@/env';

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

const APP_URL = getAppUrl();

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
                            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
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
