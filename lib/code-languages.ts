// Without the code judge (AIIN-105), company prep falls back to running visible tests in the candidate's browser,
// which can only run JavaScript (AIIN-149).
const BROWSER_RUNNABLE = ["javascript"];

export function canRunTests(language: string): boolean {
    return BROWSER_RUNNABLE.includes(language);
}
