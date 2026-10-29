// Company prep runs tests in the candidate's browser, which can only run JavaScript and TypeScript (AIIN-149).
// Other languages get "Ask U to review" instead, and no test counts are saved for them.
const BROWSER_RUNNABLE = ["javascript", "typescript"];

export function canRunTests(language: string): boolean {
    return BROWSER_RUNNABLE.includes(language);
}
