/**
 * 90-Day Placement Bootcamp Curriculum Configuration
 * 
 * This file defines the structured curriculum for the entire program.
 * Used by the seed script to generate AI content and by the UI for display.
 */

export interface DayTopic {
    dayNumber: number;
    week: number;
    topic: string;
    subtopic: string;
    conceptTitle: string;
    difficulty: "beginner" | "intermediate" | "advanced";
}

export interface ContentStructure {
    conceptTitle: string;
    conceptExplanation: string;
    keyLearnings: string[];
    realWorldUseCases: Array<{
        title: string;
        description: string;
        icon: string;
    }>;
    interviewTips: string[];
}

/**
 * Complete 90-day curriculum mapping
 */
export const CURRICULUM: DayTopic[] = [
    // Week 1-2: Arrays & Hashing (Days 1-14)
    { dayNumber: 1, week: 1, topic: "Arrays & Hashing", subtopic: "Array Basics", conceptTitle: "Arrays & Hashing: The Foundation", difficulty: "beginner" },
    { dayNumber: 2, week: 1, topic: "Arrays & Hashing", subtopic: "Two Sum Pattern", conceptTitle: "The Two Sum Pattern", difficulty: "beginner" },
    { dayNumber: 3, week: 1, topic: "Arrays & Hashing", subtopic: "Valid Anagram", conceptTitle: "Character Frequency Counting", difficulty: "beginner" },
    { dayNumber: 4, week: 1, topic: "Arrays & Hashing", subtopic: "Contains Duplicate", conceptTitle: "HashSet for Duplicate Detection", difficulty: "beginner" },
    { dayNumber: 5, week: 1, topic: "Arrays & Hashing", subtopic: "Group Anagrams", conceptTitle: "Grouping with HashMap Keys", difficulty: "intermediate" },
    { dayNumber: 6, week: 1, topic: "Arrays & Hashing", subtopic: "Top K Frequent Elements", conceptTitle: "Frequency Analysis & Bucket Sort", difficulty: "intermediate" },
    { dayNumber: 7, week: 1, topic: "Arrays & Hashing", subtopic: "Product of Array Except Self", conceptTitle: "Prefix & Suffix Products", difficulty: "intermediate" },
    { dayNumber: 8, week: 2, topic: "Arrays & Hashing", subtopic: "Longest Consecutive Sequence", conceptTitle: "HashSet for O(n) Sequences", difficulty: "intermediate" },
    { dayNumber: 9, week: 2, topic: "Arrays & Hashing", subtopic: "String Encode/Decode", conceptTitle: "String Encoding Techniques", difficulty: "intermediate" },
    { dayNumber: 10, week: 2, topic: "Arrays & Hashing", subtopic: "Subarray Sum Equals K", conceptTitle: "Prefix Sum with HashMap", difficulty: "advanced" },
    { dayNumber: 11, week: 2, topic: "Arrays & Hashing", subtopic: "Majority Element", conceptTitle: "Boyer-Moore Voting Algorithm", difficulty: "intermediate" },
    { dayNumber: 12, week: 2, topic: "Arrays & Hashing", subtopic: "First Missing Positive", conceptTitle: "Cyclic Sort Pattern", difficulty: "advanced" },
    { dayNumber: 13, week: 2, topic: "Arrays & Hashing", subtopic: "Array Rotation", conceptTitle: "In-Place Array Manipulation", difficulty: "beginner" },
    { dayNumber: 14, week: 2, topic: "Arrays & Hashing", subtopic: "Review & Practice", conceptTitle: "Arrays & Hashing Mastery Review", difficulty: "intermediate" },

    // Week 3-4: Two Pointers & Sliding Window (Days 15-28)
    { dayNumber: 15, week: 3, topic: "Two Pointers", subtopic: "Two Pointer Basics", conceptTitle: "Introduction to Two Pointers", difficulty: "beginner" },
    { dayNumber: 16, week: 3, topic: "Two Pointers", subtopic: "Valid Palindrome", conceptTitle: "Palindrome Verification Techniques", difficulty: "beginner" },
    { dayNumber: 17, week: 3, topic: "Two Pointers", subtopic: "3Sum", conceptTitle: "Finding Triplets with Two Pointers", difficulty: "intermediate" },
    { dayNumber: 18, week: 3, topic: "Two Pointers", subtopic: "Container With Most Water", conceptTitle: "Optimizing Area with Pointers", difficulty: "intermediate" },
    { dayNumber: 19, week: 3, topic: "Two Pointers", subtopic: "Trapping Rain Water", conceptTitle: "Water Trapping Algorithm", difficulty: "advanced" },
    { dayNumber: 20, week: 3, topic: "Two Pointers", subtopic: "Remove Duplicates", conceptTitle: "In-Place Duplicate Removal", difficulty: "beginner" },
    { dayNumber: 21, week: 3, topic: "Sliding Window", subtopic: "Window Basics", conceptTitle: "Introduction to Sliding Window", difficulty: "beginner" },
    { dayNumber: 22, week: 4, topic: "Sliding Window", subtopic: "Best Time to Buy Stock", conceptTitle: "Maximum Profit with Sliding Window", difficulty: "beginner" },
    { dayNumber: 23, week: 4, topic: "Sliding Window", subtopic: "Longest Substring Without Repeats", conceptTitle: "Dynamic Window for Unique Characters", difficulty: "intermediate" },
    { dayNumber: 24, week: 4, topic: "Sliding Window", subtopic: "Longest Repeating Character Replacement", conceptTitle: "Character Replacement Strategy", difficulty: "intermediate" },
    { dayNumber: 25, week: 4, topic: "Sliding Window", subtopic: "Permutation in String", conceptTitle: "Anagram Window Detection", difficulty: "intermediate" },
    { dayNumber: 26, week: 4, topic: "Sliding Window", subtopic: "Minimum Window Substring", conceptTitle: "Minimum Covering Substring", difficulty: "advanced" },
    { dayNumber: 27, week: 4, topic: "Sliding Window", subtopic: "Maximum Sum Subarray", conceptTitle: "Kadane's Algorithm", difficulty: "intermediate" },
    { dayNumber: 28, week: 4, topic: "Two Pointers & Sliding Window", subtopic: "Review & Practice", conceptTitle: "Two Pointers & Sliding Window Mastery", difficulty: "intermediate" },

    // Week 5-6: Binary Search (Days 29-42)
    { dayNumber: 29, week: 5, topic: "Binary Search", subtopic: "Binary Search Basics", conceptTitle: "Binary Search Fundamentals", difficulty: "beginner" },
    { dayNumber: 30, week: 5, topic: "Binary Search", subtopic: "Search Insert Position", conceptTitle: "Finding Insertion Points", difficulty: "beginner" },
    { dayNumber: 31, week: 5, topic: "Binary Search", subtopic: "Search in Rotated Array", conceptTitle: "Binary Search on Rotated Arrays", difficulty: "intermediate" },
    { dayNumber: 32, week: 5, topic: "Binary Search", subtopic: "Find Minimum in Rotated Array", conceptTitle: "Pivot Finding with Binary Search", difficulty: "intermediate" },
    { dayNumber: 33, week: 5, topic: "Binary Search", subtopic: "Search 2D Matrix", conceptTitle: "2D Matrix Binary Search", difficulty: "intermediate" },
    { dayNumber: 34, week: 5, topic: "Binary Search", subtopic: "Koko Eating Bananas", conceptTitle: "Binary Search on Answer Space", difficulty: "intermediate" },
    { dayNumber: 35, week: 5, topic: "Binary Search", subtopic: "Find Peak Element", conceptTitle: "Peak Finding Algorithm", difficulty: "intermediate" },
    { dayNumber: 36, week: 6, topic: "Linked Lists", subtopic: "Linked List Basics", conceptTitle: "Understanding Linked Lists", difficulty: "beginner" },
    { dayNumber: 37, week: 6, topic: "Linked Lists", subtopic: "Reverse Linked List", conceptTitle: "Iterative & Recursive Reversal", difficulty: "beginner" },
    { dayNumber: 38, week: 6, topic: "Linked Lists", subtopic: "Merge Two Sorted Lists", conceptTitle: "Merging Sorted Lists", difficulty: "beginner" },
    { dayNumber: 39, week: 6, topic: "Linked Lists", subtopic: "Linked List Cycle", conceptTitle: "Floyd's Cycle Detection", difficulty: "intermediate" },
    { dayNumber: 40, week: 6, topic: "Linked Lists", subtopic: "Remove Nth Node From End", conceptTitle: "Two-Pointer List Traversal", difficulty: "intermediate" },
    { dayNumber: 41, week: 6, topic: "Linked Lists", subtopic: "Reorder List", conceptTitle: "List Manipulation Techniques", difficulty: "intermediate" },
    { dayNumber: 42, week: 6, topic: "Linked Lists", subtopic: "Review & Practice", conceptTitle: "Binary Search & Linked Lists Review", difficulty: "intermediate" },

    // Week 7-8: Stacks, Queues & Trees (Days 43-56)
    { dayNumber: 43, week: 7, topic: "Stacks & Queues", subtopic: "Stack Basics", conceptTitle: "Stack Data Structure", difficulty: "beginner" },
    { dayNumber: 44, week: 7, topic: "Stacks & Queues", subtopic: "Valid Parentheses", conceptTitle: "Bracket Matching with Stacks", difficulty: "beginner" },
    { dayNumber: 45, week: 7, topic: "Stacks & Queues", subtopic: "Min Stack", conceptTitle: "Designing a Min Stack", difficulty: "intermediate" },
    { dayNumber: 46, week: 7, topic: "Stacks & Queues", subtopic: "Evaluate RPN", conceptTitle: "Reverse Polish Notation", difficulty: "intermediate" },
    { dayNumber: 47, week: 7, topic: "Stacks & Queues", subtopic: "Daily Temperatures", conceptTitle: "Monotonic Stack Pattern", difficulty: "intermediate" },
    { dayNumber: 48, week: 7, topic: "Stacks & Queues", subtopic: "Largest Rectangle in Histogram", conceptTitle: "Stack-Based Area Calculation", difficulty: "advanced" },
    { dayNumber: 49, week: 7, topic: "Trees", subtopic: "Binary Tree Basics", conceptTitle: "Introduction to Binary Trees", difficulty: "beginner" },
    { dayNumber: 50, week: 8, topic: "Trees", subtopic: "Tree Traversals", conceptTitle: "Inorder, Preorder, Postorder", difficulty: "beginner" },
    { dayNumber: 51, week: 8, topic: "Trees", subtopic: "Maximum Depth of Binary Tree", conceptTitle: "Recursive Depth Calculation", difficulty: "beginner" },
    { dayNumber: 52, week: 8, topic: "Trees", subtopic: "Same Tree & Subtree", conceptTitle: "Tree Comparison Algorithms", difficulty: "beginner" },
    { dayNumber: 53, week: 8, topic: "Trees", subtopic: "Invert Binary Tree", conceptTitle: "Tree Transformation", difficulty: "beginner" },
    { dayNumber: 54, week: 8, topic: "Trees", subtopic: "Level Order Traversal", conceptTitle: "BFS on Trees", difficulty: "intermediate" },
    { dayNumber: 55, week: 8, topic: "Trees", subtopic: "Validate BST", conceptTitle: "BST Property Validation", difficulty: "intermediate" },
    { dayNumber: 56, week: 8, topic: "Trees", subtopic: "Review & Practice", conceptTitle: "Stacks, Queues & Trees Mastery", difficulty: "intermediate" },

    // Week 9-10: Advanced Trees & Heaps (Days 57-70)
    { dayNumber: 57, week: 9, topic: "Trees", subtopic: "Lowest Common Ancestor", conceptTitle: "LCA in Binary Trees", difficulty: "intermediate" },
    { dayNumber: 58, week: 9, topic: "Trees", subtopic: "Binary Tree Right Side View", conceptTitle: "Level-Based Tree Views", difficulty: "intermediate" },
    { dayNumber: 59, week: 9, topic: "Trees", subtopic: "Construct Tree from Traversals", conceptTitle: "Building Trees from Arrays", difficulty: "advanced" },
    { dayNumber: 60, week: 9, topic: "Trees", subtopic: "Serialize & Deserialize Binary Tree", conceptTitle: "Tree Serialization", difficulty: "advanced" },
    { dayNumber: 61, week: 9, topic: "Heaps", subtopic: "Heap Basics", conceptTitle: "Introduction to Heaps", difficulty: "beginner" },
    { dayNumber: 62, week: 9, topic: "Heaps", subtopic: "Kth Largest Element", conceptTitle: "Min-Heap for Top K Problems", difficulty: "intermediate" },
    { dayNumber: 63, week: 9, topic: "Heaps", subtopic: "Last Stone Weight", conceptTitle: "Max-Heap Simulation", difficulty: "beginner" },
    { dayNumber: 64, week: 10, topic: "Heaps", subtopic: "K Closest Points to Origin", conceptTitle: "Heap-Based Distance Sorting", difficulty: "intermediate" },
    { dayNumber: 65, week: 10, topic: "Heaps", subtopic: "Task Scheduler", conceptTitle: "Greedy Scheduling with Heaps", difficulty: "intermediate" },
    { dayNumber: 66, week: 10, topic: "Heaps", subtopic: "Find Median from Data Stream", conceptTitle: "Two-Heap Median Finding", difficulty: "advanced" },
    { dayNumber: 67, week: 10, topic: "Tries", subtopic: "Trie Basics", conceptTitle: "Introduction to Tries", difficulty: "intermediate" },
    { dayNumber: 68, week: 10, topic: "Tries", subtopic: "Implement Trie", conceptTitle: "Trie Implementation", difficulty: "intermediate" },
    { dayNumber: 69, week: 10, topic: "Tries", subtopic: "Word Search II", conceptTitle: "Trie + DFS Combination", difficulty: "advanced" },
    { dayNumber: 70, week: 10, topic: "Tries & Heaps", subtopic: "Review & Practice", conceptTitle: "Advanced Trees & Heaps Mastery", difficulty: "intermediate" },

    // Week 11-12: Graphs (Days 71-84)
    { dayNumber: 71, week: 11, topic: "Graphs", subtopic: "Graph Basics", conceptTitle: "Introduction to Graphs", difficulty: "beginner" },
    { dayNumber: 72, week: 11, topic: "Graphs", subtopic: "Number of Islands", conceptTitle: "DFS for Connected Components", difficulty: "intermediate" },
    { dayNumber: 73, week: 11, topic: "Graphs", subtopic: "Clone Graph", conceptTitle: "Graph Cloning with HashMap", difficulty: "intermediate" },
    { dayNumber: 74, week: 11, topic: "Graphs", subtopic: "Pacific Atlantic Water Flow", conceptTitle: "Multi-Source DFS", difficulty: "intermediate" },
    { dayNumber: 75, week: 11, topic: "Graphs", subtopic: "Course Schedule", conceptTitle: "Topological Sort", difficulty: "intermediate" },
    { dayNumber: 76, week: 11, topic: "Graphs", subtopic: "Course Schedule II", conceptTitle: "Kahn's Algorithm", difficulty: "intermediate" },
    { dayNumber: 77, week: 11, topic: "Graphs", subtopic: "Graph Valid Tree", conceptTitle: "Union-Find Basics", difficulty: "intermediate" },
    { dayNumber: 78, week: 12, topic: "Graphs", subtopic: "Rotting Oranges", conceptTitle: "Multi-Source BFS", difficulty: "intermediate" },
    { dayNumber: 79, week: 12, topic: "Graphs", subtopic: "Walls and Gates", conceptTitle: "BFS from Multiple Sources", difficulty: "intermediate" },
    { dayNumber: 80, week: 12, topic: "Graphs", subtopic: "Shortest Path in Binary Matrix", conceptTitle: "BFS for Shortest Path", difficulty: "intermediate" },
    { dayNumber: 81, week: 12, topic: "Graphs", subtopic: "Network Delay Time", conceptTitle: "Dijkstra's Algorithm", difficulty: "advanced" },
    { dayNumber: 82, week: 12, topic: "Graphs", subtopic: "Alien Dictionary", conceptTitle: "Advanced Topological Sort", difficulty: "advanced" },
    { dayNumber: 83, week: 12, topic: "Graphs", subtopic: "Union Find Advanced", conceptTitle: "Path Compression & Union by Rank", difficulty: "advanced" },
    { dayNumber: 84, week: 12, topic: "Graphs", subtopic: "Review & Practice", conceptTitle: "Graph Algorithms Mastery", difficulty: "intermediate" },

    // Week 13: Dynamic Programming (Days 85-90)
    { dayNumber: 85, week: 13, topic: "Dynamic Programming", subtopic: "DP Basics", conceptTitle: "Introduction to Dynamic Programming", difficulty: "beginner" },
    { dayNumber: 86, week: 13, topic: "Dynamic Programming", subtopic: "Climbing Stairs & Fibonacci", conceptTitle: "1D DP Fundamentals", difficulty: "beginner" },
    { dayNumber: 87, week: 13, topic: "Dynamic Programming", subtopic: "House Robber", conceptTitle: "Decision-Based DP", difficulty: "intermediate" },
    { dayNumber: 88, week: 13, topic: "Dynamic Programming", subtopic: "Coin Change", conceptTitle: "Unbounded Knapsack Pattern", difficulty: "intermediate" },
    { dayNumber: 89, week: 13, topic: "Dynamic Programming", subtopic: "Longest Common Subsequence", conceptTitle: "2D DP Patterns", difficulty: "intermediate" },
    { dayNumber: 90, week: 13, topic: "Dynamic Programming", subtopic: "Final Review & Next Steps", conceptTitle: "Your Journey Continues", difficulty: "intermediate" },
];

/**
 * Get topic for a specific day
 */
export function getDayTopic(dayNumber: number): DayTopic | undefined {
    return CURRICULUM.find(d => d.dayNumber === dayNumber);
}

/**
 * Get all topics for a week
 */
export function getWeekTopics(week: number): DayTopic[] {
    return CURRICULUM.filter(d => d.week === week);
}

/**
 * Get topics by category
 */
export function getTopicsByCategory(topic: string): DayTopic[] {
    return CURRICULUM.filter(d => d.topic === topic);
}
