// Test the fixed parsing logic
const testCase = {
    input: "[2,7,11,15], 9",
    expected: "[0,1]"
};

console.log("=== Testing Fixed Parser ===");
console.log("Input string:", testCase.input);

let inputArg;
if (typeof testCase.input === 'string') {
    try {
        // Handle format like "[2,7,11,15], 9" (array, value)
        if (testCase.input.includes(',') && testCase.input.includes('[')) {
            const parts = testCase.input.split('],');
            if (parts.length === 2) {
                const nums = JSON.parse(parts[0] + ']');
                const target = parseInt(parts[1].trim());
                inputArg = { nums, target };
            } else {
                inputArg = JSON.parse(testCase.input);
            }
        } else {
            inputArg = JSON.parse(testCase.input);
        }
    } catch (err) {
        console.error("Parse error:", err);
        inputArg = testCase.input;
    }
}

console.log("Parsed input:", inputArg);
console.log("Expected structure: { nums: [2,7,11,15], target: 9 }");
console.log("Match:", JSON.stringify(inputArg) === JSON.stringify({ nums: [2, 7, 11, 15], target: 9 }));
