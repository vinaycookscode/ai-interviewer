// Test to verify the bug
const userCode = `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`;

const funcName = "twoSum";
const inputArg = { nums: [2, 7, 11, 15], target: 9 };

const wrappedCode = `
    ${userCode}
    
    // Try to call the function
    if (typeof ${funcName} === 'function') {
        if (typeof input === 'object' && input !== null) {
            if (input.nums && input.target !== undefined) {
                return ${funcName}(input.nums, input.target);
            } else if (Array.isArray(input)) {
                return ${funcName}(...input);
            }
            return ${funcName}(input);
        }
        return ${funcName}(input);
    }
    throw new Error('Function ${funcName} not defined');
`;

console.log("=== Testing Wrapped Code ===");
console.log("Input:", inputArg);

try {
    const func = new Function('input', wrappedCode);
    const result = func(inputArg);
    console.log("Result:", result);
    console.log("Expected: [0, 1]");
    console.log("Match:", JSON.stringify(result) === JSON.stringify([0, 1]));
} catch (err) {
    console.error("Error:", err);
}
