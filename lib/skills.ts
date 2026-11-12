// One name per skill, so "JS" and "JavaScript" match (AIIN-192). Plain module: the browser uses it too.

/** Lower-case spelling → the name we show and store. Add to this list rather than special-casing elsewhere. */
const SYNONYMS: Record<string, string> = {
    js: "JavaScript",
    javascript: "JavaScript",
    "java script": "JavaScript",
    es6: "JavaScript",
    ecmascript: "JavaScript",
    ts: "TypeScript",
    typescript: "TypeScript",
    react: "React",
    "react.js": "React",
    reactjs: "React",
    "react js": "React",
    "react native": "React Native",
    "react-native": "React Native",
    next: "Next.js",
    "next.js": "Next.js",
    nextjs: "Next.js",
    node: "Node.js",
    "node.js": "Node.js",
    nodejs: "Node.js",
    vue: "Vue",
    "vue.js": "Vue",
    vuejs: "Vue",
    angular: "Angular",
    angularjs: "Angular",
    py: "Python",
    python: "Python",
    python3: "Python",
    java: "Java",
    "c++": "C++",
    cpp: "C++",
    "c#": "C#",
    csharp: "C#",
    go: "Go",
    golang: "Go",
    sql: "SQL",
    mysql: "MySQL",
    postgres: "PostgreSQL",
    postgresql: "PostgreSQL",
    mongo: "MongoDB",
    mongodb: "MongoDB",
    aws: "AWS",
    "amazon web services": "AWS",
    gcp: "Google Cloud",
    "google cloud": "Google Cloud",
    azure: "Azure",
    k8s: "Kubernetes",
    kubernetes: "Kubernetes",
    docker: "Docker",
    html: "HTML",
    html5: "HTML",
    css: "CSS",
    css3: "CSS",
    tailwind: "Tailwind CSS",
    tailwindcss: "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    a11y: "Accessibility",
    accessibility: "Accessibility",
    wcag: "Accessibility",
    "accessibility (wcag)": "Accessibility",
    ml: "Machine Learning",
    "machine learning": "Machine Learning",
    dsa: "Data Structures and Algorithms",
    "data structures": "Data Structures and Algorithms",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    rest: "REST APIs",
    graphql: "GraphQL",
    git: "Git",
    redux: "Redux",
    jest: "Jest",
    playwright: "Playwright",
    excel: "Excel",
    "ms excel": "Excel",
};

export const SKILL_MAX = 40;

/** The one name for a skill: synonyms folded, spaces tidied, unknown skills kept as typed. "" for nothing usable. */
export function normalizeSkill(raw: string): string {
    const tidy = raw.replace(/\s+/g, " ").trim().slice(0, SKILL_MAX);
    if (!tidy) return "";
    return SYNONYMS[tidy.toLowerCase()] ?? tidy;
}

/** Normalised, without repeats (case-insensitive), first spelling kept. */
export function normalizeSkills(list: readonly string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of list) {
        const name = normalizeSkill(s);
        const key = name.toLowerCase();
        if (name && !seen.has(key)) {
            seen.add(key);
            out.push(name);
        }
    }
    return out;
}
