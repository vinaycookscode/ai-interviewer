import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSolutions, solutionsPrompt } from "./best-solutions.ts";

test("the prompt carries each language's signature", () => {
    const p = solutionsPrompt("Two Sum", "Find two numbers.", { javascript: "function twoSum(nums, target) {}", python: "def twoSum(nums, target):" });
    assert.match(p, /javascript:\nfunction twoSum\(nums, target\)/);
    assert.match(p, /python:\ndef twoSum/);
    assert.doesNotMatch(p, /java:\n/);
});

test("good approaches are kept, in order, with only the languages given", () => {
    const raw = '```json\n[{"name":"Brute force","time":"O(n²)","space":"O(1)","explanation":"Try every pair.","code":{"javascript":"function a(){}","python":"def a(): pass"}},{"name":"Hash map","time":"O(n)","space":"O(n)","explanation":"One pass.","code":{"cpp":"int a(){}"}}]\n```';
    const s = parseSolutions(raw);
    assert.equal(s.length, 2);
    assert.deepEqual(Object.keys(s[0].code), ["javascript", "python"]);
    assert.equal(s[1].name, "Hash map");
});

test("malformed answers are dropped, never thrown", () => {
    assert.deepEqual(parseSolutions("not json"), []);
    assert.deepEqual(parseSolutions('{"name":"x"}'), []);
    assert.equal(parseSolutions('[{"name":"No code","time":"O(1)","space":"O(1)","code":{}}]').length, 0);
    assert.equal(parseSolutions('[{"name":"Odd language","time":"O(1)","space":"O(1)","code":{"ruby":"x"}}]').length, 0);
});

test("never more than three", () => {
    const one = { name: "A", time: "O(1)", space: "O(1)", explanation: "", code: { javascript: "x" } };
    assert.equal(parseSolutions(JSON.stringify([one, one, one, one, one])).length, 3);
});
