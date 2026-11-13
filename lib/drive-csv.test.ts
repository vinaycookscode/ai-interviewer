import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRows, csvCell, guessMapping, parseCsv, validMapping } from "./drive-csv.ts";

test("parses quotes, commas, line breaks, CRLF and a BOM", () => {
    const rows = parseCsv('﻿Name,Email\r\n"Rao, Asha","a@x.in"\r\n"Line\nbreak","say ""hi"""\n\n');
    assert.deepEqual(rows, [["Name", "Email"], ["Rao, Asha", "a@x.in"], ["Line\nbreak", 'say "hi"']]);
});

test("AC5: Student Name, Email ID, College are matched", () => {
    assert.deepEqual(guessMapping(["Student Name", "Email ID", "College", "PRN", "Mobile", "Branch"]), ["name", "email", "college", "roll", "phone", null]);
    assert.deepEqual(guessMapping(["email", "Email"]), ["email", null], "each field once");
});

test("mappings from the browser are checked", () => {
    assert.ok(validMapping(["name", "email", null], 3));
    assert.ok(!validMapping(["name", null, null], 3), "email required");
    assert.ok(!validMapping(["name", "email", "email"], 3), "used twice");
    assert.ok(!validMapping(["name", "email", "salary"], 3), "unknown field");
    assert.ok(!validMapping(["name", "email"], 3), "wrong length");
});

test("AC1: each row gets one status, and the counts add up", () => {
    const head = ["name", "email", "college"] as const;
    const rows = [
        ["Asha Rao", "Asha.Rao@DIT.edu.in ", "Deccan Institute of Technology"],
        ["Rohan", "rohan@dit", "Deccan Institute of Technology"],
        ["Sneha", "asha.rao@dit.edu.in", ""],
        ["", "noname@dit.edu.in", ""],
        ["Aditya", "aditya@dit.edu.in", ""],
        ["HR", "hr@northwind.test", ""],
        ["Kunal", "kunal@vit.edu", "Vishwa Institute"],
        ["=HYPERLINK(\"x\")", "formula@dit.edu.in", "deccan institute of  technology"],
    ];
    const r = checkRows(rows, [...head], {
        colleges: [{ id: "c1", name: "Deccan Institute of Technology" }],
        inDrive: new Set(["aditya@dit.edu.in"]),
        staff: new Set(["hr@northwind.test"]),
    });
    assert.deepEqual(r.rows.map((x) => x.status), ["READY", "INVALID_EMAIL", "DUPLICATE", "MISSING_NAME", "IN_DRIVE", "STAFF", "UNKNOWN_COLLEGE", "READY"]);
    assert.equal(r.rows[0].email, "asha.rao@dit.edu.in");
    assert.equal(r.rows[0].collegeId, "c1");
    assert.equal(r.rows[7].collegeId, "c1", "college names match ignoring case and spaces");
    assert.equal(r.rows[7].name, '=HYPERLINK("x")', "AC7: kept as text");
    assert.equal(r.rows[1].line, 3);
    assert.equal(Object.values(r.counts).reduce((a, b) => a + b, 0), rows.length);
});

test("AC7: problem rows download without formulas", () => {
    assert.equal(csvCell("=SUM(A1)"), `"'=SUM(A1)"`);
    assert.equal(csvCell("@cmd"), `"'@cmd"`);
    assert.equal(csvCell('say "hi"'), '"say ""hi"""');
    assert.equal(csvCell("Asha"), '"Asha"');
});
