// Turns a problem's tests into one program per language that calls the candidate's function on every test and
// prints one tagged JSON line per test (AIIN-105). Pure: no database, no "@/" imports, tested with `npm test`.
//
// Tests are written once, in JSON, for every language:
// - an array input is the argument list: `[[1,2,3], 9]` calls f([1,2,3], 9)
// - the older `[2,7,11,15], 9` form is (nums, target)
// - `{"list": [1,2,3]}` is a linked list's head node
// Java and C++ need types, so the signature is inferred from the first test: its arguments and its expected output.

export const JUDGE_LANGUAGES = ["javascript", "python", "java", "cpp"] as const;
export type JudgeLanguage = (typeof JUDGE_LANGUAGES)[number];
export const isJudgeLanguage = (l: string): l is JudgeLanguage => (JUDGE_LANGUAGES as readonly string[]).includes(l);

export const LANGUAGE_NAMES: Record<JudgeLanguage, string> = { javascript: "JavaScript", python: "Python", java: "Java", cpp: "C++" };

/** An interview's Run button also takes TypeScript and C#: it only shows output, with no tests to call. */
export const RUN_LANGUAGES = [...JUDGE_LANGUAGES, "typescript", "csharp"] as const;
export type RunLanguage = (typeof RUN_LANGUAGES)[number];
export const isRunLanguage = (l: string): l is RunLanguage => (RUN_LANGUAGES as readonly string[]).includes(l);

/** A value's type, as far as Java and C++ need it. */
export type ValueType = "int" | "long" | "double" | "bool" | "string" | "list" | { of: ValueType };

export interface Signature {
    name: string;
    params: { name: string; type: ValueType }[];
    returns: ValueType;
}

const isListMarker = (v: unknown): v is { list: unknown[] } =>
    !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 1 && Array.isArray((v as { list?: unknown }).list);

/** A test's input as the argument list, in plain JSON (lists stay as {"list": [...]}). */
export function testArgs(input: string): unknown[] {
    const text = input.trim();
    if (text.includes(",") && text.includes("[") && !text.startsWith("[[") && !text.includes("{")) {
        const parts = text.split("],");
        if (parts.length === 2) {
            try {
                return [JSON.parse(parts[0] + "]"), parseInt(parts[1].trim())];
            } catch {
                // fall through to JSON
            }
        }
    }
    let value: unknown;
    try {
        value = JSON.parse(text);
    } catch {
        value = text;
    }
    if (Array.isArray(value)) return value;
    return [value];
}

export function parseExpected(expected: string): unknown {
    try {
        return JSON.parse(expected);
    } catch {
        return expected;
    }
}

/** The type of one JSON value. Empty arrays are taken as arrays of ints. */
export function typeOf(v: unknown): ValueType {
    if (isListMarker(v)) return "list";
    if (typeof v === "boolean") return "bool";
    if (typeof v === "string") return "string";
    if (typeof v === "number") return Number.isInteger(v) ? (Math.abs(v) > 2 ** 31 - 1 ? "long" : "int") : "double";
    if (Array.isArray(v)) {
        const first = v.find((x) => !(Array.isArray(x) && x.length === 0)) ?? v[0];
        return { of: first === undefined ? "int" : typeOf(first) };
    }
    return "string";
}

/** The candidate's function name and parameter names, from JavaScript or Python code. */
export function functionHead(code: string): { name: string; params: string[] } | null {
    const js = code.match(/function\s+(\w+)\s*\(([^)]*)\)/) ?? code.match(/(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/);
    const py = code.match(/def\s+(\w+)\s*\(([^)]*)\)/);
    // Java or C++: the first method with a return type, e.g. "public int[] twoSum(int[] nums, int target) {"
    const typed = [...code.matchAll(/[\w>\]*&]\s+(\w+)\s*\(([^)]*)\)\s*(?:const\s*)?\{/g)].find((x) => !["if", "for", "while", "switch", "catch", "main"].includes(x[1]));
    const m = js ?? py ?? typed;
    if (!m) return null;
    if (m === typed) return { name: m[1], params: m[2].split(",").map((p) => p.trim().split(/[\s&*]+/).pop() ?? "").filter(Boolean) };
    const params = m[2]
        .split(",")
        .map((p) => p.replace(/[:=].*$/, "").trim())
        .filter((p) => p && p !== "self");
    return { name: m[1], params };
}

/**
 * The signature from the reference (or starter) code's names and the first test's values. A linked list in, and an
 * array expected, means a linked list out.
 */
export function inferSignature(code: string, tests: { input: string; expected: string }[]): Signature | null {
    const first = tests[0];
    if (!first) return null;
    const head = functionHead(code);
    const args = testArgs(first.input);
    const params = args.map((value, i) => ({ name: head?.params[i] || `arg${i}`, type: typeOf(value) }));
    // A later test can widen int to long or double
    for (const test of tests.slice(1)) {
        testArgs(test.input).forEach((value, i) => {
            const t = typeOf(value);
            if (params[i] && params[i].type === "int" && (t === "long" || t === "double")) params[i].type = t;
        });
    }
    let returns = typeOf(parseExpected(first.expected));
    if (typeof returns !== "string" && returns.of === "int" && params.some((p) => p.type === "list")) returns = "list";
    return { name: head?.name || "solution", params, returns };
}

// ---------------------------------------------------------------- type names

function javaType(t: ValueType): string {
    if (typeof t !== "string") return `${javaType(t.of)}[]`;
    return { int: "int", long: "long", double: "double", bool: "boolean", string: "String", list: "ListNode" }[t];
}

function cppType(t: ValueType): string {
    if (typeof t !== "string") return `vector<${cppType(t.of)}>`;
    return { int: "int", long: "long long", double: "double", bool: "bool", string: "string", list: "ListNode*" }[t];
}

const JS_DEFAULT = (s: Signature) => `function ${s.name}(${s.params.map((p) => p.name).join(", ")}) {\n    // Your code here\n}\n`;

/** Starter code in each language, matching the signature the tests call. */
export function starterFor(language: JudgeLanguage, s: Signature, jsStarter?: string | null): string {
    const names = s.params.map((p) => p.name);
    switch (language) {
        case "javascript":
            return jsStarter?.trim() ? jsStarter : JS_DEFAULT(s);
        case "python":
            return `${s.params.some((p) => p.type === "list") || s.returns === "list" ? "# class ListNode: val, next\n" : ""}def ${s.name}(${names.join(", ")}):\n    # Your code here\n    pass\n`;
        case "java":
            return `${s.params.some((p) => p.type === "list") || s.returns === "list" ? "// class ListNode { int val; ListNode next; }\n" : ""}class Solution {\n    public ${javaType(s.returns)} ${s.name}(${s.params.map((p) => `${javaType(p.type)} ${p.name}`).join(", ")}) {\n        // Your code here\n    }\n}\n`;
        case "cpp":
            return `${s.params.some((p) => p.type === "list") || s.returns === "list" ? "// struct ListNode { int val; ListNode* next; };\n" : ""}class Solution {\npublic:\n    ${cppType(s.returns)} ${s.name}(${s.params.map((p) => `${typeof p.type === "string" && p.type !== "list" ? cppType(p.type) : `${cppType(p.type)}${p.type === "list" ? "" : "&"}`} ${p.name}`).join(", ")}) {\n        // Your code here\n    }\n};\n`;
    }
}

// ---------------------------------------------------------------- literals

const javaString = (s: string) => JSON.stringify(s);

function javaLiteral(v: unknown, t: ValueType, top = true): string {
    if (t === "list") return `Judge.list(new int[]{${((v as { list: unknown[] }).list ?? []).join(",")}})`;
    if (typeof t !== "string") {
        const items = (Array.isArray(v) ? v : []).map((x) => javaLiteral(x, t.of, false)).join(",");
        return top ? `new ${javaType(t)}{${items}}` : `{${items}}`;
    }
    if (t === "string") return javaString(String(v));
    if (t === "long") return `${v}L`;
    if (t === "double") return Number.isInteger(v) ? `${v}.0` : String(v);
    return String(v);
}

function cppLiteral(v: unknown, t: ValueType, top = true): string {
    if (t === "list") return `judge_list({${((v as { list: unknown[] }).list ?? []).join(",")}})`;
    if (typeof t !== "string") {
        const items = (Array.isArray(v) ? v : []).map((x) => cppLiteral(x, t.of, false)).join(",");
        return top ? `${cppType(t)}{${items}}` : `{${items}}`;
    }
    if (t === "string") return `string(${JSON.stringify(String(v))})`;
    if (t === "long") return `${v}LL`;
    if (t === "double") return Number.isInteger(v) ? `${v}.0` : String(v);
    return String(v);
}

// ---------------------------------------------------------------- drivers

/** A random tag for this run's result lines, so ordinary printing can't be mistaken for a result. */
export const newTag = (random: () => number = Math.random) => `@@R${Math.floor(random() * 1e12).toString(36)}@@`;

/** The program for a run: the candidate's code plus a driver that calls it on every test. */
export function buildProgram(language: JudgeLanguage, code: string, tests: { input: string }[], signature: Signature, tag: string): string {
    const allArgs = tests.map((t) => testArgs(t.input));
    switch (language) {
        case "javascript":
            return `${code}

;(() => {
    const __tests = ${JSON.stringify(allArgs)};
    const __revive = (v) => v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 1 && Array.isArray(v.list)
        ? v.list.reduceRight((next, val) => ({ val, next }), null)
        : Array.isArray(v) ? v.map(__revive) : v;
    const __out = (v) => {
        if (v && typeof v === "object" && !Array.isArray(v) && "val" in v && "next" in v) { const a = []; for (let n = v; n && a.length < 10000; n = n.next) a.push(n.val); return a; }
        return v === undefined ? null : v;
    };
    __tests.forEach((args, i) => {
        try { process.stdout.write(${JSON.stringify(tag)} + i + " " + JSON.stringify(__out(${signature.name}(...args.map(__revive)))) + "\\n"); }
        catch (e) { process.stdout.write(${JSON.stringify(tag)} + i + " !" + JSON.stringify(String(e && e.message || e)) + "\\n"); }
    });
})();
`;
        case "python":
            return `import json as __json
import sys as __sys

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

${code}

def __revive(v):
    if isinstance(v, dict) and list(v.keys()) == ["list"]:
        head = None
        for x in reversed(v["list"]):
            head = ListNode(x, head)
        return head
    if isinstance(v, list):
        return [__revive(x) for x in v]
    return v

def __out(v):
    if isinstance(v, ListNode):
        a = []
        while v is not None and len(a) < 10000:
            a.append(v.val)
            v = v.next
        return a
    return v

__fn = Solution().${signature.name} if "Solution" in globals() and hasattr(Solution, "${signature.name}") else ${signature.name}
for __i, __args in enumerate(__json.loads(${JSON.stringify(JSON.stringify(allArgs))})):
    try:
        print(${JSON.stringify(tag)} + str(__i) + " " + __json.dumps(__out(__fn(*[__revive(a) for a in __args])), separators=(",", ":")))
    except Exception as __e:
        print(${JSON.stringify(tag)} + str(__i) + " !" + __json.dumps(str(__e)))
    __sys.stdout.flush()
`;
        case "java": {
            // Imports must come first in a Java file; the Solution class mustn't be public beside Main
            const imports = code.match(/^\s*import\s+[\w.*]+\s*;\s*$/gm) ?? [];
            const body = code.replace(/^\s*import\s+[\w.*]+\s*;\s*$/gm, "").replace(/public\s+class\s+Solution/, "class Solution");
            const calls = allArgs
                .map((args, i) => {
                    const values = signature.params.map((p, j) => javaLiteral(args[j], p.type)).join(", ");
                    return `        try { Object r = new Solution().${signature.name}(${values}); System.out.println(TAG + ${i} + " " + Judge.json(r)); } catch (Throwable e) { System.out.println(TAG + ${i} + " !" + Judge.str(String.valueOf(e.getMessage() == null ? e.toString() : e.getMessage()))); }`;
                })
                .join("\n");
            return `import java.util.*;
${imports.join("\n")}

class ListNode {
    int val; ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

${body}

class Judge {
    static ListNode list(int[] values) { ListNode head = null; for (int i = values.length - 1; i >= 0; i--) head = new ListNode(values[i], head); return head; }
    static String str(String s) {
        StringBuilder b = new StringBuilder("\\"");
        for (char c : s.toCharArray()) { if (c == '"' || c == '\\\\') b.append('\\\\').append(c); else if (c == '\\n') b.append("\\\\n"); else if (c < 32) b.append(String.format("\\\\u%04x", (int) c)); else b.append(c); }
        return b.append('"').toString();
    }
    static String json(Object o) {
        if (o == null) return "null";
        if (o instanceof String) return str((String) o);
        if (o instanceof Character) return str(String.valueOf(o));
        if (o instanceof Double || o instanceof Float) { double d = ((Number) o).doubleValue(); return d == Math.rint(d) && !Double.isInfinite(d) ? String.valueOf((long) d) : String.valueOf(d); }
        if (o instanceof Number || o instanceof Boolean) return String.valueOf(o);
        if (o instanceof ListNode) { StringBuilder b = new StringBuilder("["); int n = 0; for (ListNode x = (ListNode) o; x != null && n < 10000; x = x.next, n++) { if (n > 0) b.append(","); b.append(x.val); } return b.append("]").toString(); }
        if (o instanceof Collection) { StringBuilder b = new StringBuilder("["); boolean f = true; for (Object x : (Collection<?>) o) { if (!f) b.append(","); f = false; b.append(json(x)); } return b.append("]").toString(); }
        if (o.getClass().isArray()) { StringBuilder b = new StringBuilder("["); int n = java.lang.reflect.Array.getLength(o); for (int i = 0; i < n; i++) { if (i > 0) b.append(","); b.append(json(java.lang.reflect.Array.get(o, i))); } return b.append("]").toString(); }
        return str(o.toString());
    }
}

public class Main {
    static final String TAG = ${javaString(tag)};
    public static void main(String[] args) {
${calls}
    }
}
`;
        }
        case "cpp": {
            const calls = allArgs
                .map((args, i) => {
                    const decls = signature.params.map((p, j) => `auto a${j} = ${cppLiteral(args[j], p.type)};`).join(" ");
                    const call = `Solution().${signature.name}(${signature.params.map((_, j) => `a${j}`).join(", ")})`;
                    return `    try { ${decls} auto r = ${call}; cout << TAG << ${i} << " " << judge_json(r) << "\\n"; } catch (const exception& e) { cout << TAG << ${i} << " !" << judge_json(string(e.what())) << "\\n"; } catch (...) { cout << TAG << ${i} << " !\\"error\\"\\n"; }\n    cout.flush();`;
                })
                .join("\n");
            return `#include <algorithm>
#include <climits>
#include <cmath>
#include <iostream>
#include <map>
#include <numeric>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
using namespace std;

struct ListNode {
    int val; ListNode* next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode* n) : val(x), next(n) {}
};

${code}

static ListNode* judge_list(vector<int> v) { ListNode* head = nullptr; for (int i = (int)v.size() - 1; i >= 0; i--) head = new ListNode(v[i], head); return head; }
static string judge_json(const string& s) { string o = "\\""; for (char c : s) { if (c == '"' || c == '\\\\') { o += '\\\\'; o += c; } else if (c == '\\n') o += "\\\\n"; else if ((unsigned char)c < 32) o += ' '; else o += c; } return o + "\\""; }
static string judge_json(const char* s) { return judge_json(string(s)); }
static string judge_json(bool b) { return b ? "true" : "false"; }
static string judge_json(int v) { return to_string(v); }
static string judge_json(long v) { return to_string(v); }
static string judge_json(long long v) { return to_string(v); }
static string judge_json(unsigned int v) { return to_string(v); }
static string judge_json(unsigned long v) { return to_string(v); }
static string judge_json(double v) { if (v == floor(v) && fabs(v) < 1e15) return to_string((long long)v); ostringstream s; s.precision(15); s << v; return s.str(); }
static string judge_json(char c) { return judge_json(string(1, c)); }
static string judge_json(ListNode* n) { string o = "["; int k = 0; for (; n && k < 10000; n = n->next, k++) { if (k) o += ","; o += to_string(n->val); } return o + "]"; }
template <typename T> static string judge_json(const vector<T>& v) { string o = "["; for (size_t i = 0; i < v.size(); i++) { if (i) o += ","; o += judge_json(v[i]); } return o + "]"; }

int main() {
    const string TAG = ${JSON.stringify(tag)};
${calls}
    return 0;
}
`;
        }
    }
}

export type CaseStatus = "passed" | "failed" | "error" | "timeLimit" | "notRun";

export interface CaseResult {
    n: number;
    status: CaseStatus;
    /** What the solution gave, as JSON, or its error message. */
    output: string | null;
}

/**
 * Each test's result from the program's output: its tagged line compared with the expected value, an error it
 * threw, or, when the run stopped early, a time limit for the first missing test and "not run" after it.
 */
export function readResults(stdout: string, tag: string, expected: string[], stoppedEarly: "timeLimit" | "error" | null, judge: (output: unknown, expected: string) => boolean): CaseResult[] {
    const lines = new Map<number, string>();
    for (const line of stdout.split("\n")) {
        if (!line.startsWith(tag)) continue;
        const rest = line.slice(tag.length);
        const space = rest.indexOf(" ");
        const n = Number(rest.slice(0, space));
        if (Number.isInteger(n) && !lines.has(n)) lines.set(n, rest.slice(space + 1));
    }
    let missingSeen = false;
    return expected.map((exp, i) => {
        const line = lines.get(i);
        if (line === undefined) {
            const status: CaseStatus = missingSeen ? "notRun" : (stoppedEarly ?? "error");
            missingSeen = true;
            return { n: i + 1, status, output: null };
        }
        if (line.startsWith("!")) {
            let message = line.slice(1);
            try {
                message = JSON.parse(message);
            } catch {
                // keep as printed
            }
            return { n: i + 1, status: "error", output: message };
        }
        let value: unknown = line;
        try {
            value = JSON.parse(line);
        } catch {
            // not JSON: compared as text
        }
        return { n: i + 1, status: judge(value, exp) ? "passed" : "failed", output: line };
    });
}

/** Free-form code from an interview, made runnable: Java gets a Main and C++ a main() if they have none. */
export function runnableProgram(language: RunLanguage, code: string): string {
    if (language === "csharp" && !/static\s+(?:async\s+)?\w+\s+Main\s*\(/.test(code)) {
        return `${code}\n\nclass Program {\n    static void Main() {\n        System.Console.WriteLine("Compiled. Add a Main method to print output.");\n    }\n}\n`;
    }
    if (language === "java") {
        if (/public\s+static\s+void\s+main\s*\(/.test(code)) {
            // Judge0 runs Main: rename the class that holds main
            const holder = code.match(/public\s+class\s+(\w+)/)?.[1];
            return holder && holder !== "Main" ? code.replace(new RegExp(`\\b${holder}\\b`, "g"), "Main") : code;
        }
        return `${code.replace(/public\s+class/g, "class")}\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Compiled. Add a main method to print output.");\n    }\n}\n`;
    }
    if (language === "cpp" && !/\bint\s+main\s*\(/.test(code)) {
        return `#include <iostream>\n${code}\n\nint main() {\n    std::cout << "Compiled. Add a main() to print output." << std::endl;\n    return 0;\n}\n`;
    }
    return code;
}
