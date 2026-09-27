const fs = require('fs');
const path = require('path');

const problems = [];

const problem_details = [
    [121, "Next Greater Element I", "Easy", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
    [122, "Next Greater Element II circular", "Medium", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
    [123, "Daily Temperatures", "Medium", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
    [124, "Largest Rectangle in Histogram", "Hard", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
    [125, "Maximal Rectangle in Binary Matrix", "Hard", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
    [126, "Sum of Subarray Minimums", "Medium", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
    [127, "Maximum Width Ramp", "Medium", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
    [128, "Online Stock Span", "Medium", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
    [129, "132 Pattern", "Medium", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
    [130, "Asteroid Collision", "Medium", "Stacks & Queues", "Monotonic Stack", "Stack"],
    [131, "Sliding Window Maximum", "Hard", "Stacks & Queues", "Queue / Deque Patterns", "Monotonic Deque"],
    [132, "First Negative in Every Window of Size K", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Queue"],
    [133, "Implement Stack using Queues", "Easy", "Stacks & Queues", "Queue / Deque Patterns", "Queue"],
    [134, "Implement Queue using Stacks", "Easy", "Stacks & Queues", "Queue / Deque Patterns", "Stack"],
    [135, "Design Circular Queue", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Array"],
    [136, "Design Circular Deque", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Array"],
    [137, "Max of Min for Every Window Size", "Hard", "Stacks & Queues", "Queue / Deque Patterns", "Monotonic Deque"],
    [138, "Shortest Subarray with Sum at Least K", "Hard", "Stacks & Queues", "Queue / Deque Patterns", "Monotonic Deque"],
    [139, "Jump Game VI DP + deque", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Monotonic Deque"],
    [140, "Constrained Subsequence Sum", "Hard", "Stacks & Queues", "Queue / Deque Patterns", "Monotonic Deque"],
    [141, "Task Scheduler", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Greedy + Heap"],
    [142, "Number of Recent Calls", "Easy", "Stacks & Queues", "Queue / Deque Patterns", "Queue"],
    [143, "Dota2 Senate", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Queue"],
    [144, "Reveal Cards in Increasing Order", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Queue"],
    [145, "Rotten Oranges BFS", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "BFS"],
    [146, "Binary Search basic", "Easy", "Binary Search", "Classic Binary Search", "Binary Search"],
    [147, "First Bad Version", "Easy", "Binary Search", "Classic Binary Search", "Binary Search"],
    [148, "Search Insert Position", "Easy", "Binary Search", "Classic Binary Search", "Binary Search"],
    [149, "Count of Range Sum advanced", "Hard", "Binary Search", "Classic Binary Search", "Merge Sort"],
    [150, "Find Peak Element", "Medium", "Binary Search", "Classic Binary Search", "Binary Search"],
    [151, "Find Minimum in Rotated Sorted Array II duplicates", "Hard", "Binary Search", "Classic Binary Search", "Binary Search"],
    [152, "Search a 2D Matrix", "Medium", "Binary Search", "Classic Binary Search", "Binary Search"],
    [153, "Search a 2D Matrix II", "Medium", "Binary Search", "Classic Binary Search", "Binary Search"],
    [154, "Kth Smallest Element in Sorted Matrix", "Medium", "Binary Search", "Classic Binary Search", "Binary Search"],
    [155, "Find K Closest Elements", "Medium", "Binary Search", "Classic Binary Search", "Binary Search"],
    [156, "Capacity to Ship Packages Within D Days", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
    [157, "Split Array Largest Sum", "Hard", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
    [158, "Koko Eating Bananas", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
    [159, "Minimum Number of Days to Make m Bouquets", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
    [160, "Magnetic Force Between Two Balls", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
    [161, "Find the Smallest Divisor Given a Threshold", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
    [162, "Allocate Minimum Number of Pages", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
    [163, "Aggressive Cows SPOJ classic", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
    [164, "Painters Partition Problem", "Hard", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
    [165, "EKO Cutting Trees binary search on height", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
    [166, "Median of Two Sorted Arrays", "Hard", "Binary Search", "Binary Search on Answer", "Binary Search"],
    [167, "K-th Smallest Prime Fraction", "Hard", "Binary Search", "Binary Search on Answer", "Binary Search"],
    [168, "Find K-th Smallest Pair Distance", "Hard", "Binary Search", "Binary Search on Answer", "Binary Search"],
    [169, "Count of Pairs with Sum Less Than Target", "Easy", "Binary Search", "Binary Search on Answer", "Two Pointers"],
    [170, "Maximum Running Time of N Computers", "Hard", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
    [171, "Longest Increasing Subsequence O(n log n)", "Medium", "Binary Search", "Bisect Tricks", "Binary Search + DP"],
    [172, "Russian Doll Envelopes", "Hard", "Binary Search", "Bisect Tricks", "Binary Search + DP"],
    [173, "Count of Smaller Numbers After Self BIT/BST", "Hard", "Binary Search", "Bisect Tricks", "Segment Tree"],
    [174, "Minimum Operations to Make Array Increasing", "Easy", "Binary Search", "Bisect Tricks", "Greedy"],
    [175, "Maximum Profit in Job Scheduling", "Hard", "Binary Search", "Bisect Tricks", "Binary Search + DP"]
];

for (const [pid, title, difficulty, section, subSection, pattern] of problem_details) {
    const problem = {
        id: pid,
        title: title,
        difficulty: difficulty,
        section: section,
        subSection: subSection,
        pattern: pattern,
        description: `Problem statement for ${title}. Given constraints and examples.`,
        naiveSolution: {
            explanation: "Brute force approach explanation.",
            timeComplexity: "O(N^2)",
            spaceComplexity: "O(1)",
            code: {
                python: `def solve():\n    # Brute force for ${title}\n    pass`,
                javascript: `function solve() {\n    // Brute force for ${title}\n}`,
                typescript: `function solve(): void {\n    // Brute force for ${title}\n}`,
                cpp: `class Solution {\npublic:\n    void solve() {\n        // Brute force for ${title}\n    }\n};`,
                java: `class Solution {\n    public void solve() {\n        // Brute force for ${title}\n    }\n}`
            }
        },
        optimizedSolution: {
            explanation: "Optimized approach explanation.",
            timeComplexity: "O(N log N)",
            spaceComplexity: "O(N)",
            code: {
                python: `def solve():\n    # Optimized for ${title}\n    pass`,
                javascript: `function solve() {\n    // Optimized for ${title}\n}`,
                typescript: `function solve(): void {\n    // Optimized for ${title}\n}`,
                cpp: `class Solution {\npublic:\n    void solve() {\n        // Optimized for ${title}\n    }\n};`,
                java: `class Solution {\n    public void solve() {\n        // Optimized for ${title}\n    }\n}`
            }
        }
    };
    problems.push(problem);
}

let ts_content = "import type { DsaProblem } from '../dsaProblemsData.js';\n\nexport const section3StacksBinarySearch: DsaProblem[] = ";
ts_content += JSON.stringify(problems, null, 2);
ts_content += ";\n";

const output_path = "E:\\projects\\Habbit-tracker\\server\\src\\modules\\dsaPrep\\sections\\section3_stacks_binarysearch.ts";
const dir = path.dirname(output_path);

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(output_path, ts_content, 'utf8');
console.log(`Successfully wrote ${problems.length} problems to ${output_path}`);
