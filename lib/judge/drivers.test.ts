import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProgram, functionHead, inferSignature, readResults, runnableProgram, starterFor, testArgs, typeOf } from "./drivers.ts";

const twoSum = [
    { input: "[2,7,11,15], 9", expected: "[0,1]" },
    { input: "[3,2,4], 6", expected: "[1,2]" },
];
const same = (value: unknown, expected: string) => JSON.stringify(value) === JSON.stringify(JSON.parse(expected));

test("test inputs become argument lists, in every form", () => {
    assert.deepEqual(testArgs("[2,7,11,15], 9"), [[2, 7, 11, 15], 9]);
    assert.deepEqual(testArgs('[["flower","flow"]]'), [["flower", "flow"]]);
    assert.deepEqual(testArgs('{"list":[1,2]}'), [{ list: [1, 2] }]);
    assert.deepEqual(testArgs('"abc"'), ["abc"]);
});

test("types come from the values", () => {
    assert.equal(typeOf(3), "int");
    assert.equal(typeOf(3.5), "double");
    assert.equal(typeOf(2 ** 40), "long");
    assert.deepEqual(typeOf([[1, 2], []]), { of: { of: "int" } });
    assert.deepEqual(typeOf(["a"]), { of: "string" });
    assert.equal(typeOf({ list: [1] }), "list");
});

test("Two Sum's signature: names from the reference, types from the first test", () => {
    assert.deepEqual(inferSignature("function twoSum(nums, target) {}", twoSum), {
        name: "twoSum",
        params: [{ name: "nums", type: { of: "int" } }, { name: "target", type: "int" }],
        returns: { of: "int" },
    });
});

test("a linked list in and an array expected means a list out", () => {
    const s = inferSignature("def reverseList(head):", [{ input: '{"list":[1,2]}', expected: "[2,1]" }])!;
    assert.equal(s.returns, "list");
});

test("names come from Java and C++ reference solutions too", () => {
    assert.deepEqual(functionHead("class Solution {\n  public int[] twoSum(int[] nums, int target) {"), { name: "twoSum", params: ["nums", "target"] });
    assert.deepEqual(functionHead("class Solution { public:\n vector<int> twoSum(vector<int>& nums, int target) {"), { name: "twoSum", params: ["nums", "target"] });
});

test("starters match the signature in each language", () => {
    const s = inferSignature("function twoSum(nums, target) {}", twoSum)!;
    assert.match(starterFor("java", s), /public int\[\] twoSum\(int\[\] nums, int target\)/);
    assert.match(starterFor("cpp", s), /vector<int> twoSum\(vector<int>& nums, int target\)/);
    assert.match(starterFor("python", s), /def twoSum\(nums, target\):/);
    assert.equal(starterFor("javascript", s, "function twoSum(nums, target) {\n}"), "function twoSum(nums, target) {\n}");
});

test("Java programs get typed literals and keep imports first", () => {
    const s = inferSignature("function twoSum(nums, target) {}", twoSum)!;
    const program = buildProgram("java", "import java.util.HashMap;\npublic class Solution { public int[] twoSum(int[] nums, int target) { return null; } }", twoSum, s, "@@T@@");
    assert.ok(program.startsWith("import java.util.*;\nimport java.util.HashMap;"));
    assert.match(program, /new Solution\(\)\.twoSum\(new int\[\]\{2,7,11,15\}, 9\)/);
    assert.doesNotMatch(program, /public class Solution/);
    assert.match(program, /public class Main/);
});

test("C++ programs get typed literals", () => {
    const s = inferSignature("function twoSum(nums, target) {}", twoSum)!;
    assert.match(buildProgram("cpp", "", twoSum, s, "@@T@@"), /auto a0 = vector<int>\{2,7,11,15\}; auto a1 = 9;/);
});

test("results: passes, failures, errors, and a time limit stops the rest", () => {
    const out = "hello from the candidate\n@@T@@0 [0,1]\n@@T@@1 [9]\n@@T@@2 !\"boom\"\n";
    const results = readResults(out, "@@T@@", ["[0,1]", "[1,2]", "1", "2", "3"], "timeLimit", same);
    assert.deepEqual(
        results.map((r) => r.status),
        ["passed", "failed", "error", "timeLimit", "notRun"]
    );
    assert.equal(results[2].output, "boom");
});

test("printing that looks like a result but lacks the tag is ignored", () => {
    const results = readResults("0 [0,1]\n", "@@T@@", ["[0,1]"], null, same);
    assert.equal(results[0].status, "error");
});

test("interview code is made runnable: Java gets Main, C++ gets main()", () => {
    assert.match(runnableProgram("java", "class Solution {}"), /public class Main/);
    assert.match(runnableProgram("java", "public class Hello { public static void main(String[] a) {} }"), /public class Main \{ public static void main/);
    assert.match(runnableProgram("cpp", "int add(int a, int b) { return a + b; }"), /int main\(\)/);
    assert.equal(runnableProgram("python", "print(1)"), "print(1)");
});
