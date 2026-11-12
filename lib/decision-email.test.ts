import { test } from "node:test";
import assert from "node:assert/strict";
import { decisionEmail, emailsFor } from "./decision-email.ts";

test("only Shortlisted and Rejected send an email; On hold doesn't", () => {
    assert.ok(emailsFor("SHORTLISTED"));
    assert.ok(emailsFor("REJECTED"));
    assert.ok(!emailsFor("ON_HOLD"));
    assert.ok(!emailsFor("UNDECIDED"));
});

test("the copy matches the approved preview", () => {
    const rejected = decisionEmail("REJECTED", { name: "Divya Rao" }, "Frontend Engineer", { name: "Northwind Labs", person: "Kavya Iyer" });
    assert.equal(rejected.subject, "An update on your application for Frontend Engineer");
    assert.equal(rejected.lines[0], "Hi Divya, thank you for taking the interview for Frontend Engineer.");
    assert.equal(rejected.signature, "Kavya Iyer, Northwind Labs");
    const shortlisted = decisionEmail("SHORTLISTED", { name: "Sana Qureshi" }, "Frontend Engineer", { name: "Northwind Labs", person: "Kavya" });
    assert.equal(shortlisted.subject, "You’ve moved to the next round for Frontend Engineer");
    assert.match(shortlisted.text, /Kavya from Northwind Labs will be in touch/);
});

test("names and job titles are escaped in the HTML", () => {
    const e = decisionEmail("REJECTED", { name: "<img src=x onerror=alert(1)>" }, "Dev & <Ops>", { name: "A\"Co", person: null });
    assert.doesNotMatch(e.html, /<img|<Ops>/);
    assert.match(e.html, /Dev &amp; &lt;Ops&gt;/);
    assert.match(e.html, /A&quot;Co/);
});

test("missing names fall back politely", () => {
    const e = decisionEmail("SHORTLISTED", { name: null }, "QA", { name: null, person: null });
    assert.match(e.lines[0], /^Hi there,/);
    assert.equal(e.signature, "the hiring team");
});
