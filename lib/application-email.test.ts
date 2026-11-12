import { test } from "node:test";
import assert from "node:assert/strict";
import { EMAILED, applicationEmail } from "./application-email.ts";

test("a rejection reads 'Not selected' and carries no reason", () => {
    const e = applicationEmail({ name: "Priya Sharma", job: "Frontend Engineer", company: "Infosys", stage: "REJECTED", appUrl: "https://x.test" });
    assert.equal(e.subject, "Frontend Engineer at Infosys: Not selected");
    assert.match(e.text, /^Hi Priya,/);
    assert.match(e.html, /https:\/\/x\.test\/candidate\/applications/);
});

test("names are escaped, and only meaningful stages email", () => {
    const e = applicationEmail({ name: null, job: "<b>Dev</b>", company: "A&B", stage: "OFFER", appUrl: "https://x.test" });
    assert.ok(e.html.includes("&lt;b&gt;Dev&lt;/b&gt;") && e.html.includes("A&amp;B"));
    assert.ok(!EMAILED.includes("APPLIED") && !EMAILED.includes("WITHDRAWN"));
});
