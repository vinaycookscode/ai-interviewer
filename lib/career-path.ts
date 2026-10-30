// The career path a candidate sets up in onboarding (AIIN-52). Shared by the page and the wizard.

export const CAREER_ROLES = ["sde", "qa", "data", "devops"] as const;
export type CareerRole = (typeof CAREER_ROLES)[number];

/** What's stored in CandidateProfile.primaryRole for each track. */
export const ROLE_NAMES: Record<CareerRole, string> = {
    sde: "Software Development Engineer",
    qa: "Automation Tester / QA",
    data: "Data Engineer / Scientist",
    devops: "DevOps Engineer",
};

export const SUGGESTED_SKILLS: Record<CareerRole, string[]> = {
    sde: ["Python", "Java", "SQL", "AWS", "Docker", "Jest", "Go", "React", "Node.js", "TypeScript"],
    qa: ["Selenium", "Playwright", "Cypress", "Java", "Python", "Postman", "JMeter", "SQL"],
    data: ["Python", "SQL", "Pandas", "Spark", "Airflow", "TensorFlow", "Power BI", "AWS"],
    devops: ["Linux", "Docker", "Kubernetes", "Terraform", "AWS", "Jenkins", "Ansible", "Python"],
};

export const SKILL_LIMIT = 30;
export const SKILL_LENGTH = 40;
export const GOAL_LIMIT = 1000;

export function roleFromName(name: string | null | undefined): CareerRole | null {
    return CAREER_ROLES.find((r) => ROLE_NAMES[r] === name) ?? null;
}
