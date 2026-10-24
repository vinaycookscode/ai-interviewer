/**
 * Gemini model used when the user hasn't picked one, and the fallback when
 * a chosen model no longer exists. Keep this a stable (non-preview) model.
 */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** Shown in the model selector until the live model list loads. */
export const FALLBACK_GEMINI_MODELS = [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
];
