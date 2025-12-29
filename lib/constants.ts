export const INTERVIEW_LANGUAGES = [
    'English',
    'Hindi',
    'Marathi',
    'Tamil',
    'Kannada',
    'Spanish',
    'French',
    'German'
] as const;

export type InterviewLanguage = typeof INTERVIEW_LANGUAGES[number];

export const LANGUAGE_CODES: Record<InterviewLanguage, string> = {
    'English': 'en-US',
    'Hindi': 'hi-IN',
    'Marathi': 'mr-IN',
    'Tamil': 'ta-IN',
    'Kannada': 'kn-IN',
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'German': 'de-DE'
};
