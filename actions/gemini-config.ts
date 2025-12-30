'use server';

import { cookies } from 'next/headers';

export async function setGeminiModel(model: string) {
    const cookieStore = await cookies();
    cookieStore.set('gemini_model', model);
}

export async function getGeminiModel() {
    const cookieStore = await cookies();
    return cookieStore.get('gemini_model')?.value || 'gemini-1.5-pro';
}

export async function markModelRateLimited(model: string) {
    const cookieStore = await cookies();
    // Block the model for 1 hour
    cookieStore.set(`rate_limit_${model}`, 'true', { maxAge: 3600 });
}

export async function getAvailableGeminiModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];

    const cookieStore = await cookies();

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            next: { revalidate: 0 } // Disable cache to ensure fresh model list
        });
        const data = await response.json();

        if (!data.models) return [];

        return data.models
            .filter((m: any) => {
                const name = m.name.toLowerCase();
                const displayName = m.displayName?.toLowerCase() || '';

                // Must support content generation
                if (!m.supportedGenerationMethods?.includes("generateContent")) return false;

                // Exclude specific categories associated with "not required" for a general interview app
                // Check both system name AND display name
                if (name.includes('gemma') || displayName.includes('gemma')) return false;
                if (name.includes('robotics') || displayName.includes('robotics')) return false;
                if (name.includes('computer-use') || displayName.includes('computer use')) return false; // "computer use"
                if (name.includes('nano') || displayName.includes('nano')) return false;
                if (name.includes('banana') || displayName.includes('banana')) return false; // Filter "Nano Banana"
                if (name.includes('tts') || displayName.includes('tts')) return false;
                if (name.includes('embedding')) return false;
                if (name.includes('image')) return false; // Generally image-only models or specialized ones

                // User requested removal of "secondary, preview and experimental"
                if (name.includes('exp') || displayName.includes('exp')) return false;
                if (name.includes('preview') || displayName.includes('preview')) return false;
                if (name.includes('experimental') || displayName.includes('experimental')) return false;
                // "Secondary" interpretation: Lite, 8b models?
                // Let's keep it safe and just remove explicit "lite" or "8b" if user considers them "secondary"
                // But definitely experimental/preview are gone.

                return true;
            })
            .map((m: any) => {
                const id = m.name.replace('models/', '');

                // Fuzzy rate limit check to handle aliases vs specific versions
                // e.g. gemini-1.5-pro-001 vs gemini-1.5-pro
                const baseId = id.replace(/-latest$/, '').replace(/-\d+$/, '');

                const isExactLimited = cookieStore.get(`rate_limit_${id}`)?.value === 'true';
                const isBaseLimited = cookieStore.get(`rate_limit_${baseId}`)?.value === 'true';

                return {
                    id: id,
                    name: m.displayName,
                    disabled: isExactLimited || isBaseLimited, // Add disabled flag
                };
            })
            .sort((a: any, b: any) => {
                // Heuristic scoring for sorting
                const getScore = (id: string) => {
                    let score = 0;

                    // Version scoring
                    if (id.includes('gemini-3')) score += 500;
                    else if (id.includes('gemini-2.5')) score += 400;
                    // Generic 2.0 or experimental flash
                    else if (id.includes('gemini-2.0')) score += 300;
                    // Experimental often implies bleeding edge, similar to high version
                    else if (id.includes('gemini-exp')) score += 350;
                    else if (id.includes('gemini-1.5')) score += 200;
                    else if (id.includes('gemini-1.0')) score += 100;
                    else if (id.includes('gemini-pro')) score += 150; // Generic pro fallback

                    // Type scoring (Prioritize Pro over Flash for same version usually, or maybe user wants Flash first?
                    // User asked for "newest" at top. Usually Pro > Flash in "power", but Flash is faster.
                    // Let's stick to version dominance.
                    // If same version, maybe prioritize stable over experimental? 
                    // Or experimental at top if it's "newest"?
                    // Actually, "preview" or "exp" usually means newer than stable of same version number.
                    if (id.includes('preview')) score += 10;
                    if (id.includes('exp') && !id.includes('gemini-exp')) score += 5; // boost existing version's experimental
                    if (id.includes('latest')) score += 2;

                    // Deprioritize some
                    if (id.includes('lite')) score -= 20;

                    return score;
                };

                const scoreA = getScore(a.id);
                const scoreB = getScore(b.id);

                if (scoreA !== scoreB) {
                    return scoreB - scoreA; // Descending score
                }

                // Tie-breaker: Alphabetical reverse (so 002 comes before 001 if text? No, standard alpha)
                // Actually maybe just alphanumeric
                return a.id.localeCompare(b.id);
            });
    } catch (error) {
        console.error("Failed to fetch models", error);
        return [];
    }
}
