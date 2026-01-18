import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_QUERY_ENCRYPTION_KEY || "fallback-secret-key-123";

/**
 * Encrypts an object or string for use as a URL query parameter
 */
export function encryptData(data: any): string {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    return encodeURIComponent(encrypted);
}

/**
 * Decrypts a string from a URL query parameter
 */
export function decryptData(encryptedData: string): any {
    try {
        const decoded = decodeURIComponent(encryptedData);
        const bytes = CryptoJS.AES.decrypt(decoded, SECRET_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

        try {
            return JSON.parse(decryptedString);
        } catch {
            return decryptedString;
        }
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
}
