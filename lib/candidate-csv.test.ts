import { test } from "node:test";
import assert from "node:assert/strict";
import { CSV_BOM, attachmentHeader, csvCell, csvRow, exportFileName, istDateTime } from "./candidate-csv.ts";

test("AC3: formulas are defused with a leading quote", () => {
    for (const s of ["=HYPERLINK(1)", "+91 98", "-2+3", "@SUM(A1)", "\tx", "\rx"]) assert.equal(csvCell(s).replace(/^"|"$/g, "")[0], "'");
    assert.equal(csvCell("Priya"), "Priya");
    assert.equal(csvCell(7.5), "7.5");
    assert.equal(csvCell(null), "");
});

test("cells with commas, quotes or line breaks are quoted", () => {
    assert.equal(csvCell('Shah, "KS"'), '"Shah, ""KS"""');
    assert.equal(csvCell("a\nb"), '"a\nb"');
    assert.equal(csvRow(["=1", "a,b", 3]), `'=1,"a,b",3\r\n`);
});

test("AC2: UTF-8 with a BOM keeps Devanagari names whole", () => {
    assert.equal(CSV_BOM, "\uFEFF");
    assert.equal(csvCell("प्रिया शर्मा"), "प्रिया शर्मा");
    assert.equal(new TextEncoder().encode(CSV_BOM).length, 3);
});

test("file name and dates are in IST", () => {
    const late = new Date("2026-11-12T20:00:00Z"); // 13 Nov, 01:30 IST
    assert.equal(istDateTime(late), "2026-11-13 01:30");
    assert.equal(exportFileName("Senior Frontend Engineer (React)", late), "senior-frontend-engineer-react-candidates-2026-11-13.csv");
    assert.equal(exportFileName("विक्री प्रतिनिधी", late), "विक्री-प्रतिनिधी-candidates-2026-11-13.csv");
    assert.equal(exportFileName("!!!", late), "job-candidates-2026-11-13.csv");
    assert.match(attachmentHeader("विक्री-candidates.csv"), /^attachment; filename="_+-candidates\.csv"; filename\*=UTF-8''%E0/);
});
