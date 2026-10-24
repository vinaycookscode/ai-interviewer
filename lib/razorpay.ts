import Razorpay from "razorpay";
import crypto from "crypto";


// Initialize Razorpay client
let razorpayInstance: Razorpay | null = null;

export function getRazorpayInstance(): Razorpay {
    if (!razorpayInstance) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay credentials not configured");
        }
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayInstance;
}

// Get the public key for frontend
export function getRazorpayKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || "";
}

/** Constant-time comparison of two hex signatures. */
function signaturesMatch(expected: string, received: string): boolean {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(received, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Verify webhook signature
export function verifyWebhookSignature(
    body: string,
    signature: string
): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        console.error("RAZORPAY_WEBHOOK_SECRET not configured");
        return false;
    }

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    return signaturesMatch(expectedSignature, signature);
}

// Verify payment signature (for checkout)
export function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
        console.error("RAZORPAY_KEY_SECRET not configured");
        return false;
    }

    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    return signaturesMatch(expectedSignature, signature);
}

// Convert amount to paise (Razorpay uses smallest currency unit)
export function toPaise(amount: number): number {
    return Math.round(amount * 100);
}

// Convert paise to rupees
export function toRupees(paise: number): number {
    return paise / 100;
}
