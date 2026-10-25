import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

/**
 * Soft Glass typefaces, self-hosted by next/font. Apply `softGlassFonts` on a
 * `.soft-glass` container; utilities `font-display` / `font-body` read them.
 */
const fraunces = Fraunces({
    subsets: ["latin"],
    axes: ["SOFT", "opsz"],
    variable: "--font-fraunces",
    display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-jakarta",
    display: "swap",
});

export const softGlassFonts = `${fraunces.variable} ${jakarta.variable}`;
