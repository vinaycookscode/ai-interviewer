import { test } from "node:test";
import assert from "node:assert/strict";
import { CHECKS, EVENT_CHECK, NOTICE, NOTICE_LANGUAGES, NOTICE_VERSION, consentNeeded, noticeLanguage } from "./notice.ts";
import { PROCTORING_EVENT_TYPES } from "./verdict.ts";

test("every proctoring event belongs to a check the notice lists", () => {
    for (const type of PROCTORING_EVENT_TYPES) {
        assert.ok(EVENT_CHECK[type], `${type} has no check`);
        assert.ok((CHECKS as readonly string[]).includes(EVENT_CHECK[type]));
    }
});

test("asked before starting, not again for the same version", () => {
    assert.equal(consentNeeded([], false), true);
    assert.equal(consentNeeded([NOTICE_VERSION], false), false);
});

test("a new notice version asks again before the start, but never halfway through", () => {
    assert.equal(consentNeeded(["2000-01-01"], false), true);
    assert.equal(consentNeeded(["2000-01-01"], true), false);
    // Started before consent existed: asked once anyway
    assert.equal(consentNeeded([], true), true);
});

test("every language says every check, and unknown languages fall back to English", () => {
    for (const lang of NOTICE_LANGUAGES) {
        for (const check of CHECKS) assert.ok(NOTICE[lang].checks[check].length > 10, `${lang} ${check}`);
        assert.match(NOTICE[lang].why("Acme"), /Acme/);
        assert.match(NOTICE[lang].declined("Acme", "2 Nov"), /2 Nov/);
    }
    assert.equal(noticeLanguage("hi"), "hi");
    assert.equal(noticeLanguage("ta"), "en");
    assert.equal(noticeLanguage(null), "en");
});
