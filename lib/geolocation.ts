/**
 * Geolocation utilities for IP-based location tracking
 */

export interface GeoLocation {
    country: string;
    countryCode: string;
    city: string;
    latitude: number;
    longitude: number;
    ip: string;
}

/**
 * Fetch geolocation data from an IP address using ipapi.co (free tier: 1000 requests/day)
 * Falls back to ip-api.com if needed
 */
export async function getLocationFromIP(ip: string): Promise<GeoLocation | null> {
    try {
        // Try ipapi.co first (more reliable)
        const response = await fetch(`https://ipapi.co/${ip}/json/`, {
            headers: {
                'User-Agent': 'Get Back To U Platform',
            },
        });

        if (!response.ok) {
            throw new Error('ipapi.co failed');
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.reason || 'Unknown error');
        }

        return {
            country: data.country_name || 'Unknown',
            countryCode: data.country_code || 'XX',
            city: data.city || 'Unknown',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            ip: data.ip || ip,
        };
    } catch (error) {
        console.warn('ipapi.co failed, trying ip-api.com:', error);

        // Fallback to ip-api.com (free, no API key needed)
        try {
            const response = await fetch(`http://ip-api.com/json/${ip}`);
            const data = await response.json();

            if (data.status === 'fail') {
                throw new Error(data.message || 'Unknown error');
            }

            return {
                country: data.country || 'Unknown',
                countryCode: data.countryCode || 'XX',
                city: data.city || 'Unknown',
                latitude: data.lat || 0,
                longitude: data.lon || 0,
                ip: data.query || ip,
            };
        } catch (fallbackError) {
            console.error('Both geolocation services failed:', fallbackError);
            return null;
        }
    }
}

/**
 * Get IP address from request headers (works with Vercel, Cloudflare, etc.)
 */
export function getClientIP(headers: Headers): string {
    // Check common headers in order of reliability
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    const realIP = headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    const cfConnectingIP = headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP;
    }

    // Fallback (won't work locally, but safe default)
    return '0.0.0.0';
}
