import { test } from "node:test";
import assert from "node:assert/strict";
import { jobText, profileText, scrubResume } from "./match-text.ts";

const resume = `Priya Sharma
priya.sharma@example.com | +91 98765 43210 | linkedin.com/in/priya-s | https://priya.dev
Gender: Female
Date of birth: 04/05/2000
Address: 12 MG Road, Pune 411001
Photo attached
Frontend engineer, 2.5 years. React and TypeScript.
Frontend Engineer, Razorpay - Jun 2022 to Present
B.E. Computer Engineering, College of Engineering Pune (COEP), 2022
Ms. Sharma led the WCAG work.`;

test("AC3: the embedded resume text has no name, email, phone or other personal details", () => {
    const s = scrubResume(resume, { name: "Priya Sharma", colleges: ["College of Engineering Pune (COEP)"] });
    for (const bad of [
        "Priya",
        "Sharma",
        "@",
        "98765",
        "linkedin",
        "priya.dev",
        "Female",
        "04/05/2000",
        "MG Road",
        "411001",
        "Photo",
        "COEP",
        "College of Engineering",
        "Ms.",
    ])
        assert.ok(!s.toLowerCase().includes(bad.toLowerCase()), `still has ${bad}`);
    assert.match(s, /React and TypeScript/);
    assert.match(s, /Razorpay/);
});

test("profile text uses only confirmed facts, and no college names", () => {
    const t = profileText(
        {
            skills: [{ name: "React", years: 2.5 }],
            experience: [{ title: "Frontend Engineer", company: "Razorpay", from: null, to: null }],
            education: [{ degree: "B.E. Computer Engineering", institution: "COEP", year: 2022 }],
            totalYears: 2.5,
            city: "Pune",
        },
        resume,
        { name: "Priya Sharma" },
    );
    assert.match(t, /React \(2\.5 years\)/);
    assert.match(t, /Studied B\.E\. Computer Engineering \(2022\)/);
    assert.ok(!/COEP|Priya|@|98765/.test(t));
});

test("job text has the confirmed requirements and leaves pay out", () => {
    const t = jobText({
        title: "Frontend Engineer",
        mustHaveSkills: ["React"],
        niceToHaveSkills: ["Jest"],
        minYears: 3,
        maxYears: 5,
        workMode: "HYBRID",
        location: "Pune",
    });
    assert.equal(t, "Role: Frontend Engineer.\nMust have: React.\nNice to have: Jest.\nExperience: 3 to 5 years.\nWork: hybrid, Pune.");
});
