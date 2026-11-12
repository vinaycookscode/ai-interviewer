import { test } from "node:test";
import assert from "node:assert/strict";
import { objectKey, ownFileKey, ownFileUrl } from "./storage-key.ts";

test("file keys: normal keys pass", () => {
    assert.equal(objectKey(["profiles", "u1", "pan_1.pdf"]), "profiles/u1/pan_1.pdf");
    assert.equal(objectKey(["documents", "int1", "resume_1.pdf"]), "documents/int1/resume_1.pdf");
});

test("file keys: anything that could reach another folder is refused", () => {
    assert.equal(objectKey(["profiles", "u2", "../u1", "offer.pdf"]), null); // "..%2Fu1" decoded
    assert.equal(objectKey(["profiles", "u2", "..", "u1", "offer.pdf"]), null);
    assert.equal(objectKey(["profiles", "u2", ".", "x.pdf"]), null);
    assert.equal(objectKey(["profiles", "u2", "a\\..\\x.pdf"]), null);
    assert.equal(objectKey(["profiles", "u2/../u1", "x.pdf"]), null);
    assert.equal(objectKey(["profiles", "", "x.pdf"]), null);
    assert.equal(objectKey(["profiles", "u1"]), null);
});

const B = "https://pub-abc.r2.dev";

test("stored URLs: the user's own file passes", () => {
    assert.equal(ownFileUrl(`${B}/profiles/u1/offer_1.pdf`, B, "u1"), `${B}/profiles/u1/offer_1.pdf`);
    assert.equal(ownFileUrl(`https://cdn.example/files/profiles/u1/a.pdf`, "https://cdn.example/files/", "u1"), "https://cdn.example/files/profiles/u1/a.pdf");
});

test("stored URLs: other users, other hosts and path tricks are refused", () => {
    for (const url of [
        `${B}/profiles/u2/x.pdf`,
        `${B}/profiles/u1/../u2/x.pdf`,
        `${B}/profiles/u1/%2e%2e/u2/x.pdf`,
        `${B}/profiles/u1/..%2Fu2/x.pdf`,
        `${B}/profiles/u1/a%5C..%5Cx.pdf`,
        `${B}/profiles/u1\\..\\u2/x.pdf`,
        `${B}/profiles/u10/x.pdf`,
        `${B}/profiles/u1/`,
        `${B}/documents/u1/x.pdf`,
        `${B}/profiles/u1/x.pdf?x=1`,
        `https://evil.example/profiles/u1/x.pdf`,
        `${B}.evil.example/profiles/u1/x.pdf`,
        `${B}@evil.example/profiles/u1/x.pdf`,
        "not a url",
    ])
        assert.equal(ownFileUrl(url, B, "u1"), undefined, url);
    assert.equal(ownFileUrl(`${B}/profiles/u1/x.pdf`, undefined, "u1"), undefined);
    assert.equal(ownFileUrl(`${B}/profiles/u1/x.pdf`, B, ""), undefined);
});

test("AIIN-224: the key of one's own stored file, and nothing else", () => {
    assert.equal(ownFileKey(`${B}/profiles/u1/pan_1.pdf`, B, "u1"), "profiles/u1/pan_1.pdf");
    assert.equal(ownFileKey("https://cdn.example/files/profiles/u1/a%20b.pdf", "https://cdn.example/files", "u1"), "profiles/u1/a b.pdf");
    assert.equal(ownFileKey(`${B}/profiles/u2/pan_1.pdf`, B, "u1"), undefined);
    assert.equal(ownFileKey(`${B}/profiles/u1/../u2/x.pdf`, B, "u1"), undefined);
    assert.equal(ownFileKey(null, B, "u1"), undefined);
});
