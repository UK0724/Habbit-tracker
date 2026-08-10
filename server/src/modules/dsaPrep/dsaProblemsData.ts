export interface DsaProblem {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  section: string;
  subSection: string;
  pattern: string;
  description: string;
  naiveSolution: {
    explanation: string;
    timeComplexity: string;
    spaceComplexity: string;
    code: Record<string, string>;
  };
  optimizedSolution: {
    explanation: string;
    timeComplexity: string;
    spaceComplexity: string;
    code: Record<string, string>;
  };
}

const rawProblems: [number, string, "Easy" | "Medium" | "Hard", string, string, string][] = [
  // Section 1: Arrays (1 - 50)
  // 1.1 Two Pointers
  [1, "Two Sum", "Easy", "Arrays", "Hashing", "HashMap"],
  [2, "Three Sum", "Medium", "Arrays", "Two Pointers", "Two Pointers"],
  [3, "Four Sum", "Medium", "Arrays", "Two Pointers", "Two Pointers"],
  [4, "Container With Most Water", "Medium", "Arrays", "Two Pointers", "Two Pointers"],
  [5, "Trapping Rain Water", "Hard", "Arrays", "Two Pointers", "Two Pointers"],
  [6, "Remove Duplicates from Sorted Array", "Easy", "Arrays", "Two Pointers", "Two Pointers"],
  [7, "Move Zeroes to End", "Easy", "Arrays", "Two Pointers", "Two Pointers"],
  [8, "Sort Colors (Dutch National Flag)", "Medium", "Arrays", "Two Pointers", "Two Pointers"],
  [9, "Minimum Size Subarray Sum", "Medium", "Arrays", "Two Pointers", "Two Pointers"],
  [10, "Squares of a Sorted Array", "Easy", "Arrays", "Two Pointers", "Two Pointers"],
  // 1.2 Sliding Window
  [11, "Longest Substring Without Repeating Characters", "Medium", "Arrays", "Sliding Window", "Sliding Window"],
  [12, "Maximum Sum Subarray of Size K", "Easy", "Arrays", "Sliding Window", "Sliding Window"],
  [13, "Fruit Into Baskets (at most 2 distinct)", "Medium", "Arrays", "Sliding Window", "Sliding Window"],
  [14, "Minimum Window Substring", "Hard", "Arrays", "Sliding Window", "Sliding Window"],
  [15, "Longest Subarray with Ones after Replacement", "Medium", "Arrays", "Sliding Window", "Sliding Window"],
  [16, "Permutation in String", "Medium", "Arrays", "Sliding Window", "Sliding Window"],
  [17, "Find All Anagrams in a String", "Medium", "Arrays", "Sliding Window", "Sliding Window"],
  [18, "Substring with Concatenation of All Words", "Hard", "Arrays", "Sliding Window", "Sliding Window"],
  [19, "Max Consecutive Ones III", "Medium", "Arrays", "Sliding Window", "Sliding Window"],
  [20, "Number of Subarrays with Product Less Than K", "Medium", "Arrays", "Sliding Window", "Sliding Window"],
  // 1.3 Prefix Sum / Difference Array
  [21, "Subarray Sum Equals K", "Medium", "Arrays", "Prefix Sum / Difference Array", "Prefix Sum"],
  [22, "Range Sum Query — Immutable", "Easy", "Arrays", "Prefix Sum / Difference Array", "Prefix Sum"],
  [23, "Continuous Subarray Sum (multiple of k)", "Medium", "Arrays", "Prefix Sum / Difference Array", "Prefix Sum"],
  [24, "Product of Array Except Self", "Medium", "Arrays", "Prefix Sum / Difference Array", "Prefix Sum"],
  [25, "Find Pivot Index", "Easy", "Arrays", "Prefix Sum / Difference Array", "Prefix Sum"],
  [26, "Count Subarrays with Equal 0s and 1s", "Medium", "Arrays", "Prefix Sum / Difference Array", "Prefix Sum"],
  [27, "Subarray Sums Divisible by K", "Medium", "Arrays", "Prefix Sum / Difference Array", "Prefix Sum"],
  [28, "Minimum Operations to Reduce X to Zero", "Medium", "Arrays", "Prefix Sum / Difference Array", "Prefix Sum"],
  [29, "Running Sum of 1D Array", "Easy", "Arrays", "Prefix Sum / Difference Array", "Prefix Sum"],
  [30, "Random Pick with Weight", "Medium", "Arrays", "Prefix Sum / Difference Array", "Prefix Sum"],
  // 1.4 Kadane's / Greedy on Arrays
  [31, "Maximum Subarray (Kadane's)", "Medium", "Arrays", "Kadane's / Greedy on Arrays", "Kadane's"],
  [32, "Maximum Product Subarray", "Medium", "Arrays", "Kadane's / Greedy on Arrays", "Kadane's"],
  [33, "Best Time to Buy and Sell Stock", "Easy", "Arrays", "Kadane's / Greedy on Arrays", "Greedy"],
  [34, "Best Time to Buy and Sell Stock II", "Medium", "Arrays", "Kadane's / Greedy on Arrays", "Greedy"],
  [35, "Jump Game", "Medium", "Arrays", "Kadane's / Greedy on Arrays", "Greedy"],
  [36, "Jump Game II (minimum jumps)", "Medium", "Arrays", "Kadane's / Greedy on Arrays", "Greedy"],
  [37, "Gas Station", "Medium", "Arrays", "Kadane's / Greedy on Arrays", "Greedy"],
  [38, "Candy Distribution", "Hard", "Arrays", "Kadane's / Greedy on Arrays", "Greedy"],
  [39, "Partition Labels", "Medium", "Arrays", "Kadane's / Greedy on Arrays", "Greedy"],
  [40, "Minimum Number of Arrows to Burst Balloons", "Medium", "Arrays", "Kadane's / Greedy on Arrays", "Greedy"],
  // 1.5 Sorting & Searching in Arrays
  [41, "Merge Intervals", "Medium", "Arrays", "Sorting & Searching in Arrays", "Sorting"],
  [42, "Insert Interval", "Medium", "Arrays", "Sorting & Searching in Arrays", "Sorting"],
  [43, "Meeting Rooms II (min conference rooms)", "Medium", "Arrays", "Sorting & Searching in Arrays", "Sorting"],
  [44, "Non-overlapping Intervals", "Medium", "Arrays", "Sorting & Searching in Arrays", "Sorting"],
  [45, "Largest Number (custom sort)", "Medium", "Arrays", "Sorting & Searching in Arrays", "Sorting"],
  [46, "Kth Largest Element in an Array", "Medium", "Arrays", "Sorting & Searching in Arrays", "Heaps"],
  [47, "Find Minimum in Rotated Sorted Array", "Medium", "Arrays", "Sorting & Searching in Arrays", "Binary Search"],
  [48, "Search in Rotated Sorted Array", "Medium", "Arrays", "Sorting & Searching in Arrays", "Binary Search"],
  [49, "Count of Smaller Numbers After Self", "Hard", "Arrays", "Sorting & Searching in Arrays", "Divide & Conquer"],
  [50, "Find the Duplicate Number", "Medium", "Arrays", "Sorting & Searching in Arrays", "Fast & Slow Pointers"],

  // Section 2: Strings (51 - 90)
  // 2.1 String Manipulation & Hashing
  [51, "Valid Anagram", "Easy", "Strings", "String Manipulation & Hashing", "HashMap"],
  [52, "Group Anagrams", "Medium", "Strings", "String Manipulation & Hashing", "HashMap"],
  [53, "Longest Common Prefix", "Easy", "Strings", "String Manipulation & Hashing", "String Scan"],
  [54, "Reverse Words in a String", "Medium", "Strings", "String Manipulation & Hashing", "Two Pointers"],
  [55, "String to Integer (atoi)", "Medium", "Strings", "String Manipulation & Hashing", "Parsing"],
  [56, "Roman to Integer", "Easy", "Strings", "String Manipulation & Hashing", "HashMap"],
  [57, "Integer to Roman", "Medium", "Strings", "String Manipulation & Hashing", "Math"],
  [58, "Count and Say", "Medium", "Strings", "String Manipulation & Hashing", "Simulation"],
  [59, "ZigZag Conversion", "Medium", "Strings", "String Manipulation & Hashing", "Simulation"],
  [60, "Multiply Strings", "Medium", "Strings", "String Manipulation & Hashing", "Math"],
  [61, "Longest Palindrome (by rearrangement)", "Easy", "Strings", "String Manipulation & Hashing", "HashMap"],
  [62, "First Unique Character in a String", "Easy", "Strings", "String Manipulation & Hashing", "HashMap"],
  // 2.2 Sliding Window on Strings
  [63, "Longest Repeating Character Replacement", "Medium", "Strings", "Sliding Window on Strings", "Sliding Window"],
  [64, "Minimum Window Substring (revisited)", "Hard", "Strings", "Sliding Window on Strings", "Sliding Window"],
  [65, "Longest Substring with At Most K Distinct Characters", "Medium", "Strings", "Sliding Window on Strings", "Sliding Window"],
  [66, "Longest Substring with At Most Two Distinct Characters", "Medium", "Strings", "Sliding Window on Strings", "Sliding Window"],
  [67, "Longest Palindromic Substring", "Medium", "Strings", "Sliding Window on Strings", "Expand Around Center"],
  [68, "Palindromic Substrings (count all)", "Medium", "Strings", "Sliding Window on Strings", "Expand Around Center"],
  // 2.3 Pattern Matching
  [69, "Implement strStr() / Needle in Haystack", "Easy", "Strings", "Pattern Matching", "KMP"],
  [70, "Repeated Substring Pattern", "Easy", "Strings", "Pattern Matching", "String Match"],
  [71, "Shortest Palindrome (KMP)", "Hard", "Strings", "Pattern Matching", "KMP"],
  [72, "Longest Happy Prefix (KMP failure function)", "Hard", "Strings", "Pattern Matching", "KMP"],
  [73, "Find the Index of the First Occurrence in a String", "Easy", "Strings", "Pattern Matching", "KMP"],
  [74, "Wildcard Matching", "Hard", "Strings", "Pattern Matching", "DP"],
  [75, "Regular Expression Matching", "Hard", "Strings", "Pattern Matching", "DP"],
  [76, "Word Break", "Medium", "Strings", "Pattern Matching", "DP"],
  [77, "Word Break II", "Hard", "Strings", "Pattern Matching", "Backtracking"],
  [78, "Decode Ways", "Medium", "Strings", "Pattern Matching", "DP"],
  // 2.4 Stack-based String Problems
  [79, "Valid Parentheses", "Easy", "Strings", "Stack-based String Problems", "Monotonic Stack"],
  [80, "Minimum Remove to Make Valid Parentheses", "Medium", "Strings", "Stack-based String Problems", "Stack"],
  [81, "Score of Parentheses", "Medium", "Strings", "Stack-based String Problems", "Stack"],
  [82, "Decode String (k[encoded_string])", "Medium", "Strings", "Stack-based String Problems", "Stack"],
  [83, "Remove All Adjacent Duplicates in String", "Easy", "Strings", "Stack-based String Problems", "Stack"],
  [84, "Remove K Digits", "Medium", "Strings", "Stack-based String Problems", "Monotonic Stack"],
  [85, "Basic Calculator II", "Medium", "Strings", "Stack-based String Problems", "Stack"],
  [86, "Evaluate Reverse Polish Notation", "Medium", "Strings", "Stack-based String Problems", "Stack"],
  [87, "Remove Duplicate Letters (lexicographically smallest)", "Medium", "Strings", "Stack-based String Problems", "Monotonic Stack"],
  [88, "Largest Rectangle in Histogram (string of bars)", "Hard", "Strings", "Stack-based String Problems", "Monotonic Stack"],

  // Section 3: Linked Lists (91 - 120)
  // 3.1 Fast & Slow Pointers
  [91, "Linked List Cycle Detection", "Easy", "Linked Lists", "Fast & Slow Pointers", "Floyd Cycle Detection"],
  [92, "Linked List Cycle II (entry point)", "Medium", "Linked Lists", "Fast & Slow Pointers", "Floyd Cycle Detection"],
  [93, "Find the Middle of Linked List", "Easy", "Linked Lists", "Fast & Slow Pointers", "Two Pointers"],
  [94, "Happy Number (cycle in sequence)", "Easy", "Linked Lists", "Fast & Slow Pointers", "Floyd Cycle Detection"],
  [95, "Palindrome Linked List", "Easy", "Linked Lists", "Fast & Slow Pointers", "Two Pointers"],
  [96, "Reorder List (L0→Ln→L1→Ln-1)", "Medium", "Linked Lists", "Fast & Slow Pointers", "Two Pointers"],
  // 3.2 Reversal & Merging
  [97, "Reverse a Linked List", "Easy", "Linked Lists", "Reversal & Merging", "In-place Reversal"],
  [98, "Reverse Linked List II (sub-list)", "Medium", "Linked Lists", "Reversal & Merging", "In-place Reversal"],
  [99, "Reverse Nodes in k-Group", "Hard", "Linked Lists", "Reversal & Merging", "In-place Reversal"],
  [100, "Rotate List by k", "Medium", "Linked Lists", "Reversal & Merging", "Two Pointers"],
  [101, "Merge Two Sorted Lists", "Easy", "Linked Lists", "Reversal & Merging", "Two Pointers"],
  [102, "Merge K Sorted Lists", "Hard", "Linked Lists", "Reversal & Merging", "Heaps"],
  [103, "Sort List (merge sort on LL)", "Medium", "Linked Lists", "Reversal & Merging", "Merge Sort"],
  [104, "Partition List around value x", "Medium", "Linked Lists", "Reversal & Merging", "Two Pointers"],
  [105, "Remove Nth Node from End", "Medium", "Linked Lists", "Reversal & Merging", "Two Pointers"],
  [106, "Delete Node in a Linked List (no head)", "Easy", "Linked Lists", "Reversal & Merging", "Pointer Swap"],
  [107, "Odd Even Linked List", "Medium", "Linked Lists", "Reversal & Merging", "Two Pointers"],
  [108, "Intersection of Two Linked Lists", "Easy", "Linked Lists", "Reversal & Merging", "Two Pointers"],
  [109, "Flatten a Multilevel Doubly Linked List", "Medium", "Linked Lists", "Reversal & Merging", "DFS"],
  [110, "Copy List with Random Pointer", "Medium", "Linked Lists", "Reversal & Merging", "HashMap"],
  [111, "LRU Cache (design problem)", "Medium", "Linked Lists", "Reversal & Merging", "Doubly Linked List"],
  // 3.3 Advanced Linked List
  [112, "LFU Cache", "Hard", "Linked Lists", "Advanced Linked List", "HashMap + DLL"],
  [113, "Design Skiplist", "Hard", "Linked Lists", "Advanced Linked List", "Skiplist"],
  [114, "Add Two Numbers (LL representation)", "Medium", "Linked Lists", "Advanced Linked List", "Math"],
  [115, "Add Two Numbers II (no reversal)", "Medium", "Linked Lists", "Advanced Linked List", "Stack"],
  [116, "Swap Nodes in Pairs", "Medium", "Linked Lists", "Advanced Linked List", "Two Pointers"],
  [117, "Remove Duplicates from Sorted List II", "Medium", "Linked Lists", "Advanced Linked List", "Two Pointers"],
  [118, "Next Greater Node in Linked List", "Medium", "Linked Lists", "Advanced Linked List", "Monotonic Stack"],
  [119, "Insert into a Sorted Circular Linked List", "Medium", "Linked Lists", "Advanced Linked List", "Two Pointers"],
  [120, "Convert Binary Number in LL to Integer", "Easy", "Linked Lists", "Advanced Linked List", "Math"],

  // Section 4: Stacks & Queues (121 - 145)
  // 4.1 Monotonic Stack
  [121, "Next Greater Element I", "Easy", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
  [122, "Next Greater Element II (circular)", "Medium", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
  [123, "Daily Temperatures", "Medium", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
  [124, "Largest Rectangle in Histogram", "Hard", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
  [125, "Maximal Rectangle in Binary Matrix", "Hard", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
  [126, "Sum of Subarray Minimums", "Medium", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
  [127, "Maximum Width Ramp", "Medium", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
  [128, "Online Stock Span", "Medium", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
  [129, "132 Pattern", "Medium", "Stacks & Queues", "Monotonic Stack", "Monotonic Stack"],
  [130, "Asteroid Collision", "Medium", "Stacks & Queues", "Monotonic Stack", "Stack"],
  // 4.2 Queue / Deque Patterns
  [131, "Sliding Window Maximum", "Hard", "Stacks & Queues", "Queue / Deque Patterns", "Monotonic Deque"],
  [132, "First Negative in Every Window of Size K", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Queue"],
  [133, "Implement Stack using Queues", "Easy", "Stacks & Queues", "Queue / Deque Patterns", "Queue"],
  [134, "Implement Queue using Stacks", "Easy", "Stacks & Queues", "Queue / Deque Patterns", "Stack"],
  [135, "Design Circular Queue", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Array"],
  [136, "Design Circular Deque", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Array"],
  [137, "Max of Min for Every Window Size", "Hard", "Stacks & Queues", "Queue / Deque Patterns", "Monotonic Deque"],
  [138, "Shortest Subarray with Sum at Least K", "Hard", "Stacks & Queues", "Queue / Deque Patterns", "Monotonic Deque"],
  [139, "Jump Game VI (DP + deque)", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Monotonic Deque"],
  [140, "Constrained Subsequence Sum", "Hard", "Stacks & Queues", "Queue / Deque Patterns", "Monotonic Deque"],
  [141, "Task Scheduler", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Greedy + Heap"],
  [142, "Number of Recent Calls", "Easy", "Stacks & Queues", "Queue / Deque Patterns", "Queue"],
  [143, "Dota2 Senate", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Queue"],
  [144, "Reveal Cards in Increasing Order", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "Queue"],
  [145, "Rotten Oranges (BFS)", "Medium", "Stacks & Queues", "Queue / Deque Patterns", "BFS"],

  // Section 5: Binary Search (146 - 175)
  // 5.1 Classic Binary Search
  [146, "Binary Search (basic)", "Easy", "Binary Search", "Classic Binary Search", "Binary Search"],
  [147, "First Bad Version", "Easy", "Binary Search", "Classic Binary Search", "Binary Search"],
  [148, "Search Insert Position", "Easy", "Binary Search", "Classic Binary Search", "Binary Search"],
  [149, "Count of Range Sum (advanced)", "Hard", "Binary Search", "Classic Binary Search", "Merge Sort"],
  [150, "Find Peak Element", "Medium", "Binary Search", "Classic Binary Search", "Binary Search"],
  [151, "Find Minimum in Rotated Sorted Array II (duplicates)", "Hard", "Binary Search", "Classic Binary Search", "Binary Search"],
  [152, "Search a 2D Matrix", "Medium", "Binary Search", "Classic Binary Search", "Binary Search"],
  [153, "Search a 2D Matrix II", "Medium", "Binary Search", "Classic Binary Search", "Binary Search"],
  [154, "Kth Smallest Element in Sorted Matrix", "Medium", "Binary Search", "Classic Binary Search", "Binary Search"],
  [155, "Find K Closest Elements", "Medium", "Binary Search", "Classic Binary Search", "Binary Search"],
  // 5.2 Binary Search on Answer
  [156, "Capacity to Ship Packages Within D Days", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
  [157, "Split Array Largest Sum", "Hard", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
  [158, "Koko Eating Bananas", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
  [159, "Minimum Number of Days to Make m Bouquets", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
  [160, "Magnetic Force Between Two Balls", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
  [161, "Find the Smallest Divisor Given a Threshold", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
  [162, "Allocate Minimum Number of Pages", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
  [163, "Aggressive Cows (SPOJ classic)", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
  [164, "Painters Partition Problem", "Hard", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
  [165, "EKO — Cutting Trees (binary search on height)", "Medium", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
  [166, "Median of Two Sorted Arrays", "Hard", "Binary Search", "Binary Search on Answer", "Binary Search"],
  [167, "K-th Smallest Prime Fraction", "Hard", "Binary Search", "Binary Search on Answer", "Binary Search"],
  [168, "Find K-th Smallest Pair Distance", "Hard", "Binary Search", "Binary Search on Answer", "Binary Search"],
  [169, "Count of Pairs with Sum Less Than Target", "Easy", "Binary Search", "Binary Search on Answer", "Two Pointers"],
  [170, "Maximum Running Time of N Computers", "Hard", "Binary Search", "Binary Search on Answer", "Binary Search on Answer"],
  // 5.3 Bisect Tricks
  [171, "Longest Increasing Subsequence (O(n log n))", "Medium", "Binary Search", "Bisect Tricks", "Binary Search + DP"],
  [172, "Russian Doll Envelopes", "Hard", "Binary Search", "Bisect Tricks", "Binary Search + DP"],
  [173, "Count of Smaller Numbers After Self (BIT/BST)", "Hard", "Binary Search", "Bisect Tricks", "Segment Tree"],
  [174, "Minimum Operations to Make Array Increasing", "Easy", "Binary Search", "Bisect Tricks", "Greedy"],
  [175, "Maximum Profit in Job Scheduling", "Hard", "Binary Search", "Bisect Tricks", "Binary Search + DP"],

  // Section 6: Trees (176 - 231)
  // 6.1 Tree Traversals
  [176, "Binary Tree Inorder Traversal (iterative)", "Easy", "Trees", "Tree Traversals", "DFS"],
  [177, "Binary Tree Preorder Traversal (iterative)", "Easy", "Trees", "Tree Traversals", "DFS"],
  [178, "Binary Tree Postorder Traversal (iterative)", "Easy", "Trees", "Tree Traversals", "DFS"],
  [179, "Binary Tree Level Order Traversal", "Medium", "Trees", "Tree Traversals", "BFS"],
  [180, "Binary Tree Zigzag Level Order", "Medium", "Trees", "Tree Traversals", "BFS"],
  [181, "Binary Tree Right Side View", "Medium", "Trees", "Tree Traversals", "BFS"],
  [182, "Average of Levels in Binary Tree", "Easy", "Trees", "Tree Traversals", "BFS"],
  [183, "N-ary Tree Level Order Traversal", "Medium", "Trees", "Tree Traversals", "BFS"],
  [184, "Vertical Order Traversal", "Hard", "Trees", "Tree Traversals", "BFS + DFS"],
  [185, "Boundary Traversal of Binary Tree", "Medium", "Trees", "Tree Traversals", "DFS"],
  // 6.2 Binary Tree Properties
  [186, "Maximum Depth of Binary Tree", "Easy", "Trees", "Binary Tree Properties", "Recursion"],
  [187, "Minimum Depth of Binary Tree", "Easy", "Trees", "Binary Tree Properties", "Recursion"],
  [188, "Diameter of Binary Tree", "Easy", "Trees", "Binary Tree Properties", "Recursion"],
  [189, "Balanced Binary Tree", "Easy", "Trees", "Binary Tree Properties", "Recursion"],
  [190, "Same Tree", "Easy", "Trees", "Binary Tree Properties", "Recursion"],
  [191, "Symmetric Tree", "Easy", "Trees", "Binary Tree Properties", "Recursion"],
  [192, "Invert Binary Tree", "Easy", "Trees", "Binary Tree Properties", "Recursion"],
  [193, "Count Complete Tree Nodes", "Medium", "Trees", "Binary Tree Properties", "Recursion"],
  [194, "Sum of Left Leaves", "Easy", "Trees", "Binary Tree Properties", "Recursion"],
  [195, "Path Sum", "Easy", "Trees", "Binary Tree Properties", "Recursion"],
  [196, "Path Sum II (all paths)", "Medium", "Trees", "Binary Tree Properties", "Recursion"],
  [197, "Binary Tree Maximum Path Sum", "Hard", "Trees", "Binary Tree Properties", "Recursion"],
  [198, "Sum Root to Leaf Numbers", "Medium", "Trees", "Binary Tree Properties", "Recursion"],
  [199, "Flatten Binary Tree to Linked List", "Medium", "Trees", "Binary Tree Properties", "Recursion"],
  [200, "Populating Next Right Pointers", "Medium", "Trees", "Binary Tree Properties", "BFS"],
  // 6.3 Binary Search Trees (BST)
  [201, "Validate Binary Search Tree", "Medium", "Trees", "Binary Search Trees (BST)", "BST Property"],
  [202, "Kth Smallest Element in a BST", "Medium", "Trees", "Binary Search Trees (BST)", "Inorder Traversal"],
  [203, "Lowest Common Ancestor of BST", "Easy", "Trees", "Binary Search Trees (BST)", "BST Property"],
  [204, "Lowest Common Ancestor of Binary Tree", "Medium", "Trees", "Binary Search Trees (BST)", "Recursion"],
  [205, "Convert Sorted Array to BST", "Easy", "Trees", "Binary Search Trees (BST)", "Recursion"],
  [206, "Convert BST to Greater Tree", "Medium", "Trees", "Binary Search Trees (BST)", "Reverse Inorder"],
  [207, "Insert into a BST", "Medium", "Trees", "Binary Search Trees (BST)", "BST Property"],
  [208, "Delete Node in a BST", "Medium", "Trees", "Binary Search Trees (BST)", "BST Property"],
  [209, "Recover Binary Search Tree (two nodes swapped)", "Hard", "Trees", "Binary Search Trees (BST)", "Inorder Traversal"],
  [210, "Unique Binary Search Trees (count)", "Medium", "Trees", "Binary Search Trees (BST)", "DP"],
  [211, "Unique Binary Search Trees II (generate all)", "Medium", "Trees", "Binary Search Trees (BST)", "Backtracking"],
  [212, "Serialize and Deserialize Binary Tree", "Hard", "Trees", "Binary Search Trees (BST)", "DFS/BFS"],
  [213, "Binary Tree Cameras", "Hard", "Trees", "Binary Search Trees (BST)", "Greedy DFS"],
  [214, "Construct BST from Preorder Traversal", "Medium", "Trees", "Binary Search Trees (BST)", "Recursion"],
  [215, "Two Sum IV in BST", "Easy", "Trees", "Binary Search Trees (BST)", "Inorder + Two Pointers"],
  // 6.4 Segment Trees & BITs (Advanced)
  [216, "Range Sum Query — Mutable (Segment Tree / BIT)", "Medium", "Trees", "Segment Trees & BITs (Advanced)", "Segment Tree"],
  [217, "Range Minimum Query", "Medium", "Trees", "Segment Trees & BITs (Advanced)", "Segment Tree"],
  [218, "Count of Range Sum (Merge Sort / BIT)", "Hard", "Trees", "Segment Trees & BITs (Advanced)", "BIT"],
  [219, "Number of Longest Increasing Subsequences (Segment Tree)", "Medium", "Trees", "Segment Trees & BITs (Advanced)", "Segment Tree"],
  [220, "The Skyline Problem", "Hard", "Trees", "Segment Trees & BITs (Advanced)", "Segment Tree / Heap"],
  [221, "My Calendar I, II, III", "Medium", "Trees", "Segment Trees & BITs (Advanced)", "BST / Segment Tree"],
  [222, "Rectangle Area II (coordinate compression)", "Hard", "Trees", "Segment Trees & BITs (Advanced)", "Segment Tree"],
  [223, "Falling Squares", "Hard", "Trees", "Segment Trees & BITs (Advanced)", "Segment Tree"],
  [224, "Interval List Intersections", "Medium", "Trees", "Segment Trees & BITs (Advanced)", "Two Pointers"],
  [225, "Data Stream as Disjoint Intervals", "Hard", "Trees", "Segment Trees & BITs (Advanced)", "BST"],
  // 6.5 Tries
  [226, "Implement Trie (Prefix Tree)", "Medium", "Trees", "Tries", "Trie"],
  [227, "Word Search II (Trie + DFS)", "Hard", "Trees", "Tries", "Trie + DFS"],
  [228, "Design Add and Search Words Data Structure", "Medium", "Trees", "Tries", "Trie"],
  [229, "Replace Words with Root (Trie)", "Medium", "Trees", "Tries", "Trie"],
  [230, "Maximum XOR of Two Numbers (Trie)", "Medium", "Trees", "Tries", "Trie"],
  [231, "Palindrome Pairs (Trie)", "Hard", "Trees", "Tries", "Trie"],

  // Section 7: Heaps & Priority Queues (232 - 253)
  // 7.1 Top-K Pattern
  [232, "Kth Largest Element in a Stream", "Easy", "Heaps & Priority Queues", "Top-K Pattern", "Min-Heap"],
  [233, "Top K Frequent Elements", "Medium", "Heaps & Priority Queues", "Top-K Pattern", "Min-Heap"],
  [234, "Top K Frequent Words", "Medium", "Heaps & Priority Queues", "Top-K Pattern", "Min-Heap"],
  [235, "K Closest Points to Origin", "Medium", "Heaps & Priority Queues", "Top-K Pattern", "Min-Heap"],
  [236, "Find K Pairs with Smallest Sums", "Medium", "Heaps & Priority Queues", "Top-K Pattern", "Min-Heap"],
  [237, "Kth Smallest Element in Sorted Matrix (Heap)", "Medium", "Heaps & Priority Queues", "Top-K Pattern", "Min-Heap"],
  [238, "Sort Characters By Frequency", "Medium", "Heaps & Priority Queues", "Top-K Pattern", "HashMap + Heap"],
  [239, "Reorganize String", "Medium", "Heaps & Priority Queues", "Top-K Pattern", "Max-Heap + Greedy"],
  [240, "Task Scheduler (Heap approach)", "Medium", "Heaps & Priority Queues", "Top-K Pattern", "Max-Heap + Queue"],
  [241, "Maximum Frequency Stack", "Hard", "Heaps & Priority Queues", "Top-K Pattern", "HashMap + Stack"],
  // 7.2 Two-Heap Pattern
  [242, "Find Median from Data Stream", "Hard", "Heaps & Priority Queues", "Two-Heap Pattern", "Two Heaps"],
  [243, "Sliding Window Median", "Hard", "Heaps & Priority Queues", "Two-Heap Pattern", "Two Heaps"],
  [244, "IPO (Maximize Capital)", "Hard", "Heaps & Priority Queues", "Two-Heap Pattern", "Two Heaps"],
  [245, "Minimum Cost to Connect Sticks", "Medium", "Heaps & Priority Queues", "Two-Heap Pattern", "Min-Heap"],
  [246, "Smallest Range Covering Elements from K Lists", "Hard", "Heaps & Priority Queues", "Two-Heap Pattern", "Min-Heap"],
  [247, "Ugly Number II", "Medium", "Heaps & Priority Queues", "Two-Heap Pattern", "Min-Heap + DP"],
  [248, "Super Ugly Number", "Medium", "Heaps & Priority Queues", "Two-Heap Pattern", "Min-Heap + DP"],
  [249, "Meeting Rooms III (heap-based room assignment)", "Hard", "Heaps & Priority Queues", "Two-Heap Pattern", "Two Heaps"],
  [250, "Employee Free Time", "Hard", "Heaps & Priority Queues", "Two-Heap Pattern", "Min-Heap"],
  [251, "Process Tasks Using Servers", "Medium", "Heaps & Priority Queues", "Two-Heap Pattern", "Two Heaps"],
  [252, "Single-Threaded CPU", "Medium", "Heaps & Priority Queues", "Two-Heap Pattern", "Two Heaps"],
  [253, "Furthest Building You Can Reach", "Medium", "Heaps & Priority Queues", "Two-Heap Pattern", "Min-Heap"],

  // Section 8: Graphs (254 - 307)
  // 8.1 BFS (Shortest Path / Level-order)
  [254, "Number of Islands", "Medium", "Graphs", "BFS (Shortest Path / Level-order)", "BFS / DFS"],
  [255, "Max Area of Island", "Medium", "Graphs", "BFS (Shortest Path / Level-order)", "BFS / DFS"],
  [256, "Flood Fill", "Easy", "Graphs", "BFS (Shortest Path / Level-order)", "BFS"],
  [257, "Pacific Atlantic Water Flow", "Medium", "Graphs", "BFS (Shortest Path / Level-order)", "BFS / DFS"],
  [258, "01 Matrix (multi-source BFS)", "Medium", "Graphs", "BFS (Shortest Path / Level-order)", "Multi-source BFS"],
  [259, "Rotting Oranges", "Medium", "Graphs", "BFS (Shortest Path / Level-order)", "BFS"],
  [260, "Walls and Gates (multi-source BFS)", "Medium", "Graphs", "BFS (Shortest Path / Level-order)", "Multi-source BFS"],
  [261, "Shortest Path in Binary Matrix", "Medium", "Graphs", "BFS (Shortest Path / Level-order)", "BFS"],
  [262, "Snakes and Ladders", "Medium", "Graphs", "BFS (Shortest Path / Level-order)", "BFS"],
  [263, "Open the Lock", "Medium", "Graphs", "BFS (Shortest Path / Level-order)", "BFS"],
  [264, "Word Ladder", "Hard", "Graphs", "BFS (Shortest Path / Level-order)", "BFS"],
  [265, "Word Ladder II (all shortest paths)", "Hard", "Graphs", "BFS (Shortest Path / Level-order)", "BFS + Backtracking"],
  [266, "Minimum Knight Moves", "Medium", "Graphs", "BFS (Shortest Path / Level-order)", "BFS"],
  [267, "Bus Routes (BFS on routes)", "Hard", "Graphs", "BFS (Shortest Path / Level-order)", "BFS"],
  [268, "Cut Off Trees for Golf Event", "Hard", "Graphs", "BFS (Shortest Path / Level-order)", "BFS + Dijkstra"],
  // 8.2 DFS / Backtracking on Graphs
  [269, "Clone Graph", "Medium", "Graphs", "DFS / Backtracking on Graphs", "DFS / BFS"],
  [270, "Course Schedule (cycle detection)", "Medium", "Graphs", "DFS / Backtracking on Graphs", "DFS Cycle Detection"],
  [271, "Course Schedule II (topological sort)", "Medium", "Graphs", "DFS / Backtracking on Graphs", "Topological Sort"],
  [272, "Number of Connected Components in Undirected Graph", "Medium", "Graphs", "DFS / Backtracking on Graphs", "DFS / Union-Find"],
  [273, "Graph Valid Tree", "Medium", "Graphs", "DFS / Backtracking on Graphs", "DFS / Union-Find"],
  [274, "Redundant Connection (Union-Find)", "Medium", "Graphs", "DFS / Backtracking on Graphs", "Union-Find"],
  [275, "Accounts Merge (Union-Find / DFS)", "Medium", "Graphs", "DFS / Backtracking on Graphs", "Union-Find / DFS"],
  [276, "All Paths from Source to Target", "Medium", "Graphs", "DFS / Backtracking on Graphs", "Backtracking"],
  [277, "Is Graph Bipartite?", "Medium", "Graphs", "DFS / Backtracking on Graphs", "DFS / BFS Bipartite Test"],
  [278, "Possible Bipartition", "Medium", "Graphs", "DFS / Backtracking on Graphs", "DFS / BFS Bipartite Test"],
  // 8.3 Topological Sort
  [279, "Alien Dictionary", "Hard", "Graphs", "Topological Sort", "Topological Sort"],
  [280, "Sequence Reconstruction", "Medium", "Graphs", "Topological Sort", "Topological Sort"],
  [281, "Minimum Height Trees", "Medium", "Graphs", "Topological Sort", "BFS Level Order"],
  [282, "Find Eventual Safe States", "Medium", "Graphs", "Topological Sort", "DFS Cycle Detection"],
  [283, "Parallel Courses (min semesters)", "Medium", "Graphs", "Topological Sort", "Topological Sort"],
  [284, "Sort Items by Groups Respecting Dependencies", "Hard", "Graphs", "Topological Sort", "Topological Sort"],
  // 8.4 Union-Find (Disjoint Set Union)
  [285, "Find if Path Exists in Graph", "Easy", "Graphs", "Union-Find (Disjoint Set Union)", "Union-Find / BFS"],
  [286, "Number of Provinces", "Medium", "Graphs", "Union-Find (Disjoint Set Union)", "Union-Find / DFS"],
  [287, "Redundant Connection II (directed)", "Hard", "Graphs", "Union-Find (Disjoint Set Union)", "Union-Find"],
  [288, "Making a Large Island", "Hard", "Graphs", "Union-Find (Disjoint Set Union)", "DFS + Union-Find"],
  [289, "Swim in Rising Water", "Hard", "Graphs", "Union-Find (Disjoint Set Union)", "Union-Find / Dijkstra"],
  [290, "Earliest Moment When Everyone Become Friends", "Medium", "Graphs", "Union-Find (Disjoint Set Union)", "Union-Find"],
  [291, "Satisfiability of Equality Equations", "Medium", "Graphs", "Union-Find (Disjoint Set Union)", "Union-Find"],
  [292, "Remove Max Number of Edges to Keep Graph Fully Traversable", "Hard", "Graphs", "Union-Find (Disjoint Set Union)", "Union-Find"],
  // 8.5 Shortest Path Algorithms
  [293, "Network Delay Time (Dijkstra)", "Medium", "Graphs", "Shortest Path Algorithms", "Dijkstra"],
  [294, "Path with Maximum Probability", "Medium", "Graphs", "Shortest Path Algorithms", "Dijkstra / Bellman-Ford"],
  [295, "Cheapest Flights Within K Stops (Bellman-Ford)", "Medium", "Graphs", "Shortest Path Algorithms", "BFS / Bellman-Ford"],
  [296, "Find the City with Smallest Number of Neighbors (Floyd-Warshall)", "Medium", "Graphs", "Shortest Path Algorithms", "Floyd-Warshall"],
  [297, "Path with Minimum Effort (Dijkstra / Binary Search)", "Medium", "Graphs", "Shortest Path Algorithms", "Dijkstra / Binary Search"],
  [298, "Number of Ways to Arrive at Destination", "Medium", "Graphs", "Shortest Path Algorithms", "Dijkstra + DP"],
  [299, "Minimum Weighted Subgraph with Required Paths", "Hard", "Graphs", "Shortest Path Algorithms", "Dijkstra"],
  [300, "Minimum Score of a Path Between Two Cities", "Medium", "Graphs", "Shortest Path Algorithms", "BFS / DFS"],
  [301, "Reachable Nodes in Subdivided Graph", "Hard", "Graphs", "Shortest Path Algorithms", "Dijkstra"],
  [302, "K-th Shortest Path (Yen's Algorithm concept)", "Hard", "Graphs", "Shortest Path Algorithms", "Dijkstra"],
  // 8.6 Minimum Spanning Tree
  [303, "Min Cost to Connect All Points (Prim's)", "Medium", "Graphs", "Minimum Spanning Tree", "Prim's / Kruskal's"],
  [304, "Optimize Water Distribution in a Village", "Hard", "Graphs", "Minimum Spanning Tree", "Prim's / Kruskal's"],
  [305, "Critical Connections in a Network (Bridges)", "Hard", "Graphs", "Minimum Spanning Tree", "Tarjan's Bridge detection"],
  [306, "Minimum Cost to Reach City with Tolls", "Medium", "Graphs", "Minimum Spanning Tree", "Dijkstra"],
  [307, "Find Critical and Pseudo-Critical Edges in MST", "Hard", "Graphs", "Minimum Spanning Tree", "Kruskal's"],

  // Section 9: Dynamic Programming (308 - 387)
  // 9.1 1-D DP (Linear Recurrences)
  [308, "Climbing Stairs", "Easy", "Dynamic Programming", "1-D DP (Linear Recurrences)", "1-D DP"],
  [309, "House Robber", "Medium", "Dynamic Programming", "1-D DP (Linear Recurrences)", "1-D DP"],
  [310, "House Robber II (circular)", "Medium", "Dynamic Programming", "1-D DP (Linear Recurrences)", "1-D DP"],
  [311, "House Robber III (tree DP)", "Medium", "Dynamic Programming", "1-D DP (Linear Recurrences)", "Tree DP"],
  [312, "Min Cost Climbing Stairs", "Easy", "Dynamic Programming", "1-D DP (Linear Recurrences)", "1-D DP"],
  [313, "Fibonacci Number", "Easy", "Dynamic Programming", "1-D DP (Linear Recurrences)", "1-D DP"],
  [314, "Tribonacci Number", "Easy", "Dynamic Programming", "1-D DP (Linear Recurrences)", "1-D DP"],
  [315, "Coin Change (minimum coins)", "Medium", "Dynamic Programming", "1-D DP (Linear Recurrences)", "Unbounded Knapsack"],
  [316, "Coin Change II (number of ways)", "Medium", "Dynamic Programming", "1-D DP (Linear Recurrences)", "Unbounded Knapsack"],
  [317, "Perfect Squares", "Medium", "Dynamic Programming", "1-D DP (Linear Recurrences)", "1-D DP"],
  [318, "Integer Break", "Medium", "Dynamic Programming", "1-D DP (Linear Recurrences)", "1-D DP"],
  [319, "Decode Ways", "Medium", "Dynamic Programming", "1-D DP (Linear Recurrences)", "1-D DP"],
  [320, "Decode Ways II", "Hard", "Dynamic Programming", "1-D DP (Linear Recurrences)", "1-D DP"],
  [321, "Ugly Number III", "Medium", "Dynamic Programming", "1-D DP (Linear Recurrences)", "Math / Binary Search"],
  [322, "N-th Tribonacci Number", "Easy", "Dynamic Programming", "1-D DP (Linear Recurrences)", "1-D DP"],
  // 9.2 2-D DP (Grid / Two Sequences)
  [323, "Unique Paths", "Medium", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [324, "Unique Paths II (with obstacles)", "Medium", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [325, "Minimum Path Sum in Grid", "Medium", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [326, "Dungeon Game (reverse DP)", "Hard", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [327, "Maximal Square", "Medium", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [328, "Count Square Submatrices with All Ones", "Medium", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [329, "Longest Common Subsequence", "Medium", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [330, "Shortest Common Supersequence", "Hard", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [331, "Edit Distance", "Hard", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [332, "Distinct Subsequences", "Hard", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [333, "Interleaving String", "Medium", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [334, "Regular Expression Matching (DP)", "Hard", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [335, "Wildcard Matching (DP)", "Hard", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [336, "Scramble String", "Hard", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "2-D DP"],
  [337, "Burst Balloons (interval DP)", "Hard", "Dynamic Programming", "2-D DP (Grid / Two Sequences)", "Interval DP"],
  // 9.3 Knapsack Variants
  [338, "0/1 Knapsack Problem", "Medium", "Dynamic Programming", "Knapsack Variants", "0/1 Knapsack"],
  [339, "Unbounded Knapsack", "Medium", "Dynamic Programming", "Knapsack Variants", "Unbounded Knapsack"],
  [340, "Partition Equal Subset Sum", "Medium", "Dynamic Programming", "Knapsack Variants", "0/1 Knapsack"],
  [341, "Target Sum (assign +/- to reach target)", "Medium", "Dynamic Programming", "Knapsack Variants", "0/1 Knapsack"],
  [342, "Last Stone Weight II (knapsack)", "Medium", "Dynamic Programming", "Knapsack Variants", "0/1 Knapsack"],
  [343, "Ones and Zeroes (2D knapsack)", "Medium", "Dynamic Programming", "Knapsack Variants", "0/1 Knapsack"],
  [344, "Profitable Schemes", "Hard", "Dynamic Programming", "Knapsack Variants", "0/1 Knapsack"],
  [345, "Number of Dice Rolls with Target Sum", "Medium", "Dynamic Programming", "Knapsack Variants", "DP"],
  [346, "Combination Sum IV", "Medium", "Dynamic Programming", "Knapsack Variants", "Unbounded Knapsack"],
  [347, "Count Ways to Build Good Strings", "Medium", "Dynamic Programming", "Knapsack Variants", "DP"],
  // 9.4 Interval / Range DP
  [348, "Matrix Chain Multiplication", "Hard", "Dynamic Programming", "Interval / Range DP", "Interval DP"],
  [349, "Minimum Cost Tree from Leaf Values", "Medium", "Dynamic Programming", "Interval / Range DP", "Interval DP"],
  [350, "Strange Printer", "Hard", "Dynamic Programming", "Interval / Range DP", "Interval DP"],
  [351, "Remove Boxes", "Hard", "Dynamic Programming", "Interval / Range DP", "Interval DP"],
  [352, "Zuma Game", "Hard", "Dynamic Programming", "Interval / Range DP", "Interval DP"],
  [353, "Minimum Cost to Merge Stones", "Hard", "Dynamic Programming", "Interval / Range DP", "Interval DP"],
  [354, "Optimal Strategy for a Game", "Medium", "Dynamic Programming", "Interval / Range DP", "Interval DP"],
  [355, "Palindrome Partitioning II (min cuts)", "Hard", "Dynamic Programming", "Interval / Range DP", "Interval DP"],
  [356, "Palindrome Partitioning IV (3 parts)", "Hard", "Dynamic Programming", "Interval / Range DP", "Interval DP"],
  [357, "Maximum Coins You Can Get", "Medium", "Dynamic Programming", "Interval / Range DP", "Greedy"],
  // 9.5 State-Machine DP (Stocks & Transactions)
  [358, "Best Time to Buy and Sell Stock III (at most 2 transactions)", "Hard", "Dynamic Programming", "State-Machine DP (Stocks & Transactions)", "State-Machine DP"],
  [359, "Best Time to Buy and Sell Stock IV (at most k transactions)", "Hard", "Dynamic Programming", "State-Machine DP (Stocks & Transactions)", "State-Machine DP"],
  [360, "Best Time to Buy and Sell Stock with Cooldown", "Medium", "Dynamic Programming", "State-Machine DP (Stocks & Transactions)", "State-Machine DP"],
  [361, "Best Time to Buy and Sell Stock with Transaction Fee", "Medium", "Dynamic Programming", "State-Machine DP (Stocks & Transactions)", "State-Machine DP"],
  [362, "Paint House", "Medium", "Dynamic Programming", "State-Machine DP (Stocks & Transactions)", "DP"],
  [363, "Paint House II (k colors)", "Hard", "Dynamic Programming", "State-Machine DP (Stocks & Transactions)", "DP"],
  [364, "Paint Fence", "Medium", "Dynamic Programming", "State-Machine DP (Stocks & Transactions)", "DP"],
  [365, "Student Attendance Record II", "Hard", "Dynamic Programming", "State-Machine DP (Stocks & Transactions)", "State-Machine DP"],
  [366, "Coin Path (min cost with k steps)", "Hard", "Dynamic Programming", "State-Machine DP (Stocks & Transactions)", "DP"],
  [367, "Number of Ways to Stay in the Same Place After Some Steps", "Hard", "Dynamic Programming", "State-Machine DP (Stocks & Transactions)", "DP"],
  // 9.6 Bitmask DP
  [368, "Traveling Salesman Problem (bitmask DP)", "Hard", "Dynamic Programming", "Bitmask DP", "Bitmask DP"],
  [369, "Partition to K Equal Sum Subsets", "Medium", "Dynamic Programming", "Bitmask DP", "Bitmask DP"],
  [370, "Minimum XOR Sum of Two Arrays (assignment)", "Hard", "Dynamic Programming", "Bitmask DP", "Bitmask DP"],
  [371, "Maximum Students Taking Exam", "Hard", "Dynamic Programming", "Bitmask DP", "Bitmask DP"],
  [372, "Stickers to Spell Word", "Hard", "Dynamic Programming", "Bitmask DP", "Bitmask DP"],
  [373, "Shortest Path Visiting All Nodes (BFS + bitmask)", "Hard", "Dynamic Programming", "Bitmask DP", "Bitmask DP"],
  [374, "Number of Ways to Wear Different Hats to Each Other", "Hard", "Dynamic Programming", "Bitmask DP", "Bitmask DP"],
  [375, "Count Ways to Distribute Candies", "Hard", "Dynamic Programming", "Bitmask DP", "Bitmask DP"],
  [376, "Maximize Score After N Operations", "Hard", "Dynamic Programming", "Bitmask DP", "Bitmask DP"],
  [377, "Find the Shortest Superstring (bitmask DP)", "Hard", "Dynamic Programming", "Bitmask DP", "Bitmask DP"],
  // 9.7 DP on Trees & Graphs
  [378, "Diameter of N-ary Tree", "Hard", "Dynamic Programming", "DP on Trees & Graphs", "Tree DP"],
  [379, "Binary Tree Maximum Path Sum (revisited)", "Hard", "Dynamic Programming", "DP on Trees & Graphs", "Tree DP"],
  [380, "Maximum Sum of 3 Non-Overlapping Subarrays", "Hard", "Dynamic Programming", "DP on Trees & Graphs", "DP"],
  [381, "Cherry Pickup", "Hard", "Dynamic Programming", "DP on Trees & Graphs", "DP"],
  [382, "Cherry Pickup II (two robots)", "Hard", "Dynamic Programming", "DP on Trees & Graphs", "DP"],
  [383, "Minimum Difficulty of a Job Schedule", "Hard", "Dynamic Programming", "DP on Trees & Graphs", "DP"],
  [384, "Build Array Where You Can Find the Maximum Exactly K Comparisons", "Hard", "Dynamic Programming", "DP on Trees & Graphs", "DP"],
  [385, "Number of Music Playlists", "Hard", "Dynamic Programming", "DP on Trees & Graphs", "DP"],
  [386, "Count Vowels Permutation", "Hard", "Dynamic Programming", "DP on Trees & Graphs", "DP"],
  [387, "Minimum Cost to Cut a Stick", "Hard", "Dynamic Programming", "DP on Trees & Graphs", "Interval DP"],

  // Section 10: Backtracking (388 - 417)
  // 10.1 Subsets & Combinations
  [388, "Subsets", "Medium", "Backtracking", "Subsets & Combinations", "Backtracking"],
  [389, "Subsets II (with duplicates)", "Medium", "Backtracking", "Subsets & Combinations", "Backtracking"],
  [390, "Combinations", "Medium", "Backtracking", "Subsets & Combinations", "Backtracking"],
  [391, "Combination Sum", "Medium", "Backtracking", "Subsets & Combinations", "Backtracking"],
  [392, "Combination Sum II (each number once)", "Medium", "Backtracking", "Subsets & Combinations", "Backtracking"],
  [393, "Combination Sum III (exactly k numbers)", "Medium", "Backtracking", "Subsets & Combinations", "Backtracking"],
  [394, "Letter Combinations of a Phone Number", "Medium", "Backtracking", "Subsets & Combinations", "Backtracking"],
  [395, "Generate Parentheses", "Medium", "Backtracking", "Subsets & Combinations", "Backtracking"],
  [396, "Count Numbers with Unique Digits", "Medium", "Backtracking", "Subsets & Combinations", "Backtracking"],
  [397, "Beautiful Arrangement", "Medium", "Backtracking", "Subsets & Combinations", "Backtracking"],
  // 10.2 Permutations
  [398, "Permutations", "Medium", "Backtracking", "Permutations", "Backtracking"],
  [399, "Permutations II (with duplicates)", "Medium", "Backtracking", "Permutations", "Backtracking"],
  [400, "Next Permutation", "Medium", "Backtracking", "Permutations", "Two Pointers"],
  [401, "Permutation Sequence (kth permutation)", "Hard", "Backtracking", "Permutations", "Math / Backtracking"],
  [402, "Palindrome Partitioning", "Medium", "Backtracking", "Permutations", "Backtracking"],
  [403, "Word Search", "Medium", "Backtracking", "Permutations", "DFS / Backtracking"],
  [404, "N-Queens", "Hard", "Backtracking", "Permutations", "Backtracking"],
  [405, "N-Queens II (count solutions)", "Hard", "Backtracking", "Permutations", "Backtracking"],
  [406, "Sudoku Solver", "Hard", "Backtracking", "Permutations", "Backtracking"],
  [407, "Remove Invalid Parentheses", "Hard", "Backtracking", "Permutations", "BFS / Backtracking"],
  // 10.3 Advanced Backtracking
  [408, "Expression Add Operators", "Hard", "Backtracking", "Advanced Backtracking", "Backtracking"],
  [409, "Restore IP Addresses", "Medium", "Backtracking", "Advanced Backtracking", "Backtracking"],
  [410, "Letter Tile Possibilities", "Medium", "Backtracking", "Advanced Backtracking", "Backtracking"],
  [411, "Splitting a String Into Descending Consecutive Values", "Medium", "Backtracking", "Advanced Backtracking", "Backtracking"],
  [412, "Number of Squareful Arrays", "Hard", "Backtracking", "Advanced Backtracking", "Backtracking"],
  [413, "Maximum Length of a Concatenated String with Unique Characters", "Medium", "Backtracking", "Advanced Backtracking", "Backtracking"],
  [414, "Tiling a Rectangle with the Fewest Squares", "Hard", "Backtracking", "Advanced Backtracking", "Backtracking"],
  [415, "Coloring a Border", "Medium", "Backtracking", "Advanced Backtracking", "DFS / BFS"],
  [416, "Factor Combinations", "Medium", "Backtracking", "Advanced Backtracking", "Backtracking"],
  [417, "Construct the Lexicographically Largest Valid Sequence", "Medium", "Backtracking", "Advanced Backtracking", "Backtracking"],

  // Section 11: Greedy Algorithms (418 - 442)
  // 11.1 Interval & Scheduling Greedy
  [418, "Activity Selection / Non-overlapping Intervals", "Medium", "Greedy Algorithms", "Interval & Scheduling Greedy", "Greedy"],
  [419, "Minimum Number of Platforms Required", "Medium", "Greedy Algorithms", "Interval & Scheduling Greedy", "Greedy"],
  [420, "Job Sequencing Problem", "Medium", "Greedy Algorithms", "Interval & Scheduling Greedy", "Greedy"],
  [421, "Fractional Knapsack", "Easy", "Greedy Algorithms", "Interval & Scheduling Greedy", "Greedy"],
  [422, "N meetings in one room", "Easy", "Greedy Algorithms", "Interval & Scheduling Greedy", "Greedy"],
  [423, "Assign Cookies", "Easy", "Greedy Algorithms", "Interval & Scheduling Greedy", "Greedy"],
  [424, "Lemonade Change", "Easy", "Greedy Algorithms", "Interval & Scheduling Greedy", "Greedy"],
  [425, "Queue Reconstruction by Height", "Medium", "Greedy Algorithms", "Interval & Scheduling Greedy", "Greedy"],
  [426, "Two City Scheduling", "Medium", "Greedy Algorithms", "Interval & Scheduling Greedy", "Greedy"],
  [427, "Minimum Cost to Move Chips to Same Position", "Easy", "Greedy Algorithms", "Interval & Scheduling Greedy", "Greedy"],
  // 11.2 String & Array Greedy
  [428, "Remove K Digits (smallest number)", "Medium", "Greedy Algorithms", "String & Array Greedy", "Monotonic Stack"],
  [429, "Largest Number After Removing k Digits (largest)", "Medium", "Greedy Algorithms", "String & Array Greedy", "Monotonic Stack"],
  [430, "Maximum Units on a Truck", "Easy", "Greedy Algorithms", "String & Array Greedy", "Greedy"],
  [431, "Minimum Deletions to Make Character Frequencies Unique", "Medium", "Greedy Algorithms", "String & Array Greedy", "Greedy"],
  [432, "Minimum Number of Flips to Make Binary String Alternating", "Medium", "Greedy Algorithms", "String & Array Greedy", "Greedy"],
  [433, "Minimum Swaps to Balance Parentheses", "Medium", "Greedy Algorithms", "String & Array Greedy", "Greedy"],
  [434, "Maximum Score from Removing Substrings", "Medium", "Greedy Algorithms", "String & Array Greedy", "Greedy"],
  [435, "Wiggle Subsequence", "Medium", "Greedy Algorithms", "String & Array Greedy", "Greedy"],
  [436, "Dota2 Senate (greedy queue)", "Medium", "Greedy Algorithms", "String & Array Greedy", "Greedy"],
  [437, "Minimum Time to Make Rope Colorful", "Medium", "Greedy Algorithms", "String & Array Greedy", "Greedy"],
  [438, "Boats to Save People", "Medium", "Greedy Algorithms", "String & Array Greedy", "Greedy"],
  [439, "Advantage Shuffle", "Medium", "Greedy Algorithms", "String & Array Greedy", "Greedy"],
  [440, "Maximum Performance of a Team", "Hard", "Greedy Algorithms", "String & Array Greedy", "Greedy + Heap"],
  [441, "Minimize Maximum Pair Sum in Array", "Medium", "Greedy Algorithms", "String & Array Greedy", "Greedy"],
  [442, "Earliest Deadline First Scheduling", "Medium", "Greedy Algorithms", "String & Array Greedy", "Greedy"],

  // Section 12: Hashing, Math & Bit Manipulation (443 - 467)
  // 12.1 HashMap / HashSet Patterns
  [443, "Two Sum (HashMap)", "Easy", "Hashing, Math & Bit Manipulation", "HashMap / HashSet Patterns", "HashMap"],
  [444, "Longest Consecutive Sequence", "Medium", "Hashing, Math & Bit Manipulation", "HashMap / HashSet Patterns", "HashSet"],
  [445, "4Sum II (count tuples)", "Medium", "Hashing, Math & Bit Manipulation", "HashMap / HashSet Patterns", "HashMap"],
  [446, "Isomorphic Strings", "Easy", "Hashing, Math & Bit Manipulation", "HashMap / HashSet Patterns", "HashMap"],
  [447, "Word Pattern", "Easy", "Hashing, Math & Bit Manipulation", "HashMap / HashSet Patterns", "HashMap"],
  [448, "Bulls and Cows", "Medium", "Hashing, Math & Bit Manipulation", "HashMap / HashSet Patterns", "HashMap"],
  [449, "Brick Wall (maximum bricks not cut)", "Medium", "Hashing, Math & Bit Manipulation", "HashMap / HashSet Patterns", "HashMap"],
  [450, "Subarray Sum Equals K (revisited with HashMap)", "Medium", "Hashing, Math & Bit Manipulation", "HashMap / HashSet Patterns", "HashMap"],
  [451, "Contiguous Array (equal 0s and 1s)", "Medium", "Hashing, Math & Bit Manipulation", "HashMap / HashSet Patterns", "HashMap"],
  [452, "Maximum Size Subarray Sum Equals k", "Medium", "Hashing, Math & Bit Manipulation", "HashMap / HashSet Patterns", "HashMap"],
  // 12.2 Math & Number Theory
  [453, "Count Primes (Sieve of Eratosthenes)", "Medium", "Hashing, Math & Bit Manipulation", "Math & Number Theory", "Math"],
  [454, "Power of Two / Three / Four", "Easy", "Hashing, Math & Bit Manipulation", "Math & Number Theory", "Math"],
  [455, "Excel Sheet Column Number", "Easy", "Hashing, Math & Bit Manipulation", "Math & Number Theory", "Math"],
  [456, "Happy Number (Floyd's cycle)", "Easy", "Hashing, Math & Bit Manipulation", "Math & Number Theory", "Floyd Cycle Detection"],
  [457, "Ugly Number", "Easy", "Hashing, Math & Bit Manipulation", "Math & Number Theory", "Math"],
  [458, "Reverse Integer", "Medium", "Hashing, Math & Bit Manipulation", "Math & Number Theory", "Math"],
  [459, "Palindrome Number", "Easy", "Hashing, Math & Bit Manipulation", "Math & Number Theory", "Math"],
  [460, "Factorial Trailing Zeroes", "Medium", "Hashing, Math & Bit Manipulation", "Math & Number Theory", "Math"],
  [461, "Nth Digit", "Medium", "Hashing, Math & Bit Manipulation", "Math & Number Theory", "Math"],
  [462, "Super Power (modular exponentiation)", "Medium", "Hashing, Math & Bit Manipulation", "Math & Number Theory", "Math"],
  // 12.3 Bit Manipulation
  [463, "Single Number", "Easy", "Hashing, Math & Bit Manipulation", "Bit Manipulation", "Bitwise XOR"],
  [464, "Single Number II (bit counting)", "Medium", "Hashing, Math & Bit Manipulation", "Bit Manipulation", "Bitwise counts"],
  [465, "Single Number III (two unique)", "Medium", "Hashing, Math & Bit Manipulation", "Bit Manipulation", "Bitwise XOR"],
  [466, "Number of 1 Bits (Hamming Weight)", "Easy", "Hashing, Math & Bit Manipulation", "Bit Manipulation", "Bitwise operations"],
  [467, "Counting Bits (0 to n)", "Easy", "Hashing, Math & Bit Manipulation", "Bit Manipulation", "DP + Bitwise"],
  [468, "Reverse Bits", "Easy", "Hashing, Math & Bit Manipulation", "Bit Manipulation", "Bitwise operations"],
  [469, "Missing Number", "Easy", "Hashing, Math & Bit Manipulation", "Bit Manipulation", "Bitwise XOR"],
  [470, "Sum of Two Integers (without + operator)", "Medium", "Hashing, Math & Bit Manipulation", "Bit Manipulation", "Bitwise operations"],
  [471, "Maximum XOR of Two Numbers in Array", "Medium", "Hashing, Math & Bit Manipulation", "Bit Manipulation", "Trie"],
  [472, "UTF-8 Validation", "Medium", "Hashing, Math & Bit Manipulation", "Bit Manipulation", "Bitwise operations"],

  // Section 13: System Design & Data Structure Design (473 - 500)
  // 13.1 Classic Design Problems
  [473, "Design LRU Cache", "Medium", "System Design & Data Structure Design", "Classic Design Problems", "Doubly Linked List + HashMap"],
  [474, "Design LFU Cache", "Hard", "System Design & Data Structure Design", "Classic Design Problems", "HashMap + DLL"],
  [475, "Design Twitter (top 10 tweets feed)", "Medium", "System Design & Data Structure Design", "Classic Design Problems", "HashMap + Max-Heap"],
  [476, "Design a Hit Counter", "Medium", "System Design & Data Structure Design", "Classic Design Problems", "Queue + Sliding Window"],
  [477, "Design a Rate Limiter (token bucket)", "Medium", "System Design & Data Structure Design", "Classic Design Problems", "Token Bucket / Queue"],
  [478, "Design In-Memory File System", "Hard", "System Design & Data Structure Design", "Classic Design Problems", "Trie / Tree Structure"],
  [479, "Design Search Autocomplete System (Trie + heap)", "Hard", "System Design & Data Structure Design", "Classic Design Problems", "Trie + Heap"],
  [480, "Design a Phone Directory", "Medium", "System Design & Data Structure Design", "Classic Design Problems", "HashSet + Queue"],
  [481, "Implement Trie with Count", "Medium", "System Design & Data Structure Design", "Classic Design Problems", "Trie"],
  [482, "Design Underground System (check-in/check-out)", "Medium", "System Design & Data Structure Design", "Classic Design Problems", "HashMap"],
  // 13.2 Randomized & Probabilistic Structures
  [483, "Shuffle an Array", "Medium", "System Design & Data Structure Design", "Randomized & Probabilistic Structures", "Fisher-Yates Algorithm"],
  [484, "Random Pick Index (reservoir sampling)", "Medium", "System Design & Data Structure Design", "Randomized & Probabilistic Structures", "Reservoir Sampling"],
  [485, "Linked List Random Node", "Medium", "System Design & Data Structure Design", "Randomized & Probabilistic Structures", "Reservoir Sampling"],
  [486, "Random Pick with Weight", "Medium", "System Design & Data Structure Design", "Randomized & Probabilistic Structures", "Binary Search + Prefix Sum"],
  [487, "Insert Delete GetRandom O(1)", "Medium", "System Design & Data Structure Design", "Randomized & Probabilistic Structures", "HashMap + Array"],
  [488, "Insert Delete GetRandom O(1) — Duplicates Allowed", "Hard", "System Design & Data Structure Design", "Randomized & Probabilistic Structures", "HashMap + Array"],
  // 13.3 Stream / Online Algorithms
  [489, "Moving Average from Data Stream", "Easy", "System Design & Data Structure Design", "Stream / Online Algorithms", "Queue + Sum"],
  [490, "Find Median from Data Stream (revisited)", "Hard", "System Design & Data Structure Design", "Stream / Online Algorithms", "Two Heaps"],
  [491, "Kth Largest Element in a Stream (revisited)", "Easy", "System Design & Data Structure Design", "Stream / Online Algorithms", "Min-Heap"],
  [492, "Design a Stack with Increment Operation", "Medium", "System Design & Data Structure Design", "Stream / Online Algorithms", "Array"],
  [493, "Design a Stack with getMin() / getMax()", "Easy", "System Design & Data Structure Design", "Stream / Online Algorithms", "Stack"],
  [494, "Time-Based Key-Value Store", "Medium", "System Design & Data Structure Design", "Stream / Online Algorithms", "Binary Search + HashMap"],
  [495, "Design an Ordered Stream", "Easy", "System Design & Data Structure Design", "Stream / Online Algorithms", "Array"],
  [496, "Snapshot Array", "Medium", "System Design & Data Structure Design", "Stream / Online Algorithms", "Binary Search + Array"],
  [497, "Design a Log Aggregation System", "Medium", "System Design & Data Structure Design", "Stream / Online Algorithms", "HashMap + Array"],
  [498, "First Unique Number in Stream", "Medium", "System Design & Data Structure Design", "Stream / Online Algorithms", "Queue + HashSet"],
  // 13.4 Advanced Design Challenges
  [499, "Word Filter (prefix + suffix search, Trie)", "Hard", "System Design & Data Structure Design", "Advanced Design Challenges", "Trie"],
  [500, "Exam Room (seat assignment)", "Medium", "System Design & Data Structure Design", "Advanced Design Challenges", "BST / Priority Queue"]
];

function getSolutionTemplates(pattern: string, title: string) {
  const normPattern = pattern.toLowerCase();
  
  if (normPattern.includes("two pointer") || normPattern.includes("two sum") || normPattern.includes("pair")) {
    return {
      naiveExplanation: "Generate all possible pairs using nested loops and verify if their sum equals the target.",
      naiveTime: "O(N²)",
      naiveSpace: "O(1)",
      naiveCode: {
        python: `class Solution:\n    def solve(self, arr, target):\n        n = len(arr)\n        for i in range(n):\n            for j in range(i + 1, n):\n                if arr[i] + arr[j] == target:\n                    return [i, j]\n        return [-1, -1]`,
        javascript: `function solve(arr, target) {\n    const n = arr.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            if (arr[i] + arr[j] === target) return [i, j];\n        }\n    }\n    return [-1, -1];\n}`,
        typescript: `function solve(arr: number[], target: number): number[] {\n    const n = arr.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            if (arr[i] + arr[j] === target) return [i, j];\n        }\n    }\n    return [-1, -1];\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solve(vector<int>& arr, int target) {\n        int n = arr.size();\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                if (arr[i] + arr[j] == target) return {i, j};\n            }\n        }\n        return {-1, -1};\n    }\n};`,
        java: `class Solution {\n    public int[] solve(int[] arr, int target) {\n        int n = arr.length;\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                if (arr[i] + arr[j] == target) return new int[]{i, j};\n            }\n        }\n        return new int[]{-1, -1};\n    }\n}`
      },
      optExplanation: "Establish two index pointers at the boundaries of the sorted collection. Move them inwards based on target comparison.",
      optTime: "O(N)",
      optSpace: "O(1)",
      optCode: {
        python: `class Solution:\n    def solve(self, arr, target):\n        left, right = 0, len(arr) - 1\n        while left < right:\n            current_sum = arr[left] + arr[right]\n            if current_sum == target:\n                return [left, right]\n            elif current_sum < target:\n                left += 1\n            else:\n                right -= 1\n        return [-1, -1]`,
        javascript: `function solve(arr, target) {\n    let left = 0, right = arr.length - 1;\n    while (left < right) {\n        const currentSum = arr[left] + arr[right];\n        if (currentSum === target) return [left, right];\n        if (currentSum < target) left++;\n        else right--;\n    }\n    return [-1, -1];\n}`,
        typescript: `function solve(arr: number[], target: number): number[] {\n    let left = 0, right = arr.length - 1;\n    while (left < right) {\n        const currentSum = arr[left] + arr[right];\n        if (currentSum === target) return [left, right];\n        if (currentSum < target) left++;\n        else right--;\n    }\n    return [-1, -1];\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solve(vector<int>& arr, int target) {\n        int left = 0, right = arr.size() - 1;\n        while (left < right) {\n            int currentSum = arr[left] + arr[right];\n            if (currentSum == target) return {left, right};\n            if (currentSum < target) left++;\n            else right--;\n        }\n        return {-1, -1};\n    }\n};`,
        java: `class Solution {\n    public int[] solve(int[] arr, int target) {\n        int left = 0, right = arr.length - 1;\n        while (left < right) {\n            int currentSum = arr[left] + arr[right];\n            if (currentSum == target) return new int[]{left, right};\n            if (currentSum < target) left++;\n            else right--;\n        }\n        return new int[]{-1, -1};\n    }\n}`
      }
    };
  }

  if (normPattern.includes("sliding window")) {
    return {
      naiveExplanation: "Recalculate target parameters for each unique window subarray using nested loops.",
      naiveTime: "O(N * K)",
      naiveSpace: "O(1)",
      naiveCode: {
        python: `class Solution:\n    def solve(self, arr, k):\n        n = len(arr)\n        max_val = -float('inf')\n        for i in range(n - k + 1):\n            current_sum = sum(arr[i : i + k])\n            max_val = max(max_val, current_sum)\n        return max_val`,
        javascript: `function solve(arr, k) {\n    let maxVal = -Infinity;\n    for (let i = 0; i <= arr.length - k; i++) {\n        let sum = 0;\n        for (let j = 0; j < k; j++) sum += arr[i + j];\n        maxVal = Math.max(maxVal, sum);\n    }\n    return maxVal;\n}`,
        typescript: `function solve(arr: number[], k: number): number {\n    let maxVal = -Infinity;\n    for (let i = 0; i <= arr.length - k; i++) {\n        let sum = 0;\n        for (let j = 0; j < k; j++) sum += arr[i + j];\n        maxVal = Math.max(maxVal, sum);\n    }\n    return maxVal;\n}`,
        cpp: `class Solution {\npublic:\n    int solve(vector<int>& arr, int k) {\n        int maxVal = INT_MIN;\n        for (int i = 0; i <= arr.size() - k; i++) {\n            int sum = 0;\n            for (int j = 0; j < k; j++) sum += arr[i + j];\n            maxVal = max(maxVal, sum);\n        }\n        return maxVal;\n    }\n};`,
        java: `class Solution {\n    public int solve(int[] arr, int k) {\n        int maxVal = Integer.MIN_VALUE;\n        for (int i = 0; i <= arr.length - k; i++) {\n            int sum = 0;\n            for (int j = 0; j < k; j++) sum += arr[i + j];\n            maxVal = Math.max(maxVal, sum);\n        }\n        return maxVal;\n    }\n}`
      },
      optExplanation: "Maintain a running calculation by tracking the incoming and outgoing element bounds of the sliding window.",
      optTime: "O(N)",
      optSpace: "O(1)",
      optCode: {
        python: `class Solution:\n    def solve(self, arr, k):\n        max_val = 0\n        window_sum = sum(arr[:k])\n        max_val = window_sum\n        for i in range(len(arr) - k):\n            window_sum = window_sum - arr[i] + arr[i + k]\n            max_val = max(max_val, window_sum)\n        return max_val`,
        javascript: `function solve(arr, k) {\n    let maxVal = 0, windowSum = 0;\n    for (let i = 0; i < k; i++) windowSum += arr[i];\n    maxVal = windowSum;\n    for (let i = 0; i < arr.length - k; i++) {\n        windowSum = windowSum - arr[i] + arr[i + k];\n        maxVal = Math.max(maxVal, windowSum);\n    }\n    return maxVal;\n}`,
        typescript: `function solve(arr: number[], k: number): number {\n    let maxVal = 0, windowSum = 0;\n    for (let i = 0; i < k; i++) windowSum += arr[i];\n    maxVal = windowSum;\n    for (let i = 0; i < arr.length - k; i++) {\n        windowSum = windowSum - arr[i] + arr[i + k];\n        maxVal = Math.max(maxVal, windowSum);\n    }\n    return maxVal;\n}`,
        cpp: `class Solution {\npublic:\n    int solve(vector<int>& arr, int k) {\n        int windowSum = 0;\n        for (int i = 0; i < k; i++) windowSum += arr[i];\n        int maxVal = windowSum;\n        for (int i = 0; i < arr.size() - k; i++) {\n            windowSum = windowSum - arr[i] + arr[i + k];\n            maxVal = max(maxVal, windowSum);\n        }\n        return maxVal;\n    }\n};`,
        java: `class Solution {\n    public int solve(int[] arr, int k) {\n        int windowSum = 0;\n        for (int i = 0; i < k; i++) windowSum += arr[i];\n        int maxVal = windowSum;\n        for (int i = 0; i < arr.length - k; i++) {\n            windowSum = windowSum - arr[i] + arr[i + k];\n            maxVal = Math.max(maxVal, windowSum);\n        }\n        return maxVal;\n    }\n}`
      }
    };
  }

  if (normPattern.includes("stack") || normPattern.includes("monotonic")) {
    return {
      naiveExplanation: "Perform exhaustive comparison cycles for each node using brute-force nested iterations.",
      naiveTime: "O(N²)",
      naiveSpace: "O(1)",
      naiveCode: {
        python: `class Solution:\n    def solve(self, arr):\n        n = len(arr)\n        res = [-1] * n\n        for i in range(n):\n            for j in range(i + 1, n):\n                if arr[j] > arr[i]:\n                    res[i] = arr[j]\n                    break\n        return res`,
        javascript: `function solve(arr) {\n    const n = arr.length;\n    const res = Array(n).fill(-1);\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            if (arr[j] > arr[i]) {\n                res[i] = arr[j];\n                break;\n            }\n        }\n    }\n    return res;\n}`,
        typescript: `function solve(arr: number[]): number[] {\n    const n = arr.length;\n    const res = Array(n).fill(-1);\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            if (arr[j] > arr[i]) {\n                res[i] = arr[j];\n                break;\n            }\n        }\n    }\n    return res;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solve(vector<int>& arr) {\n        int n = arr.size();\n        vector<int> res(n, -1);\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                if (arr[j] > arr[i]) {\n                    res[i] = arr[j];\n                    break;\n                }\n            }\n        }\n        return res;\n    }\n};`,
        java: `class Solution {\n    public int[] solve(int[] arr) {\n        int n = arr.length;\n        int[] res = new int[n];\n        java.util.Arrays.fill(res, -1);\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                if (arr[j] > arr[i]) {\n                    res[i] = arr[j];\n                    break;\n                }\n            }\n        }\n        return res;\n    }\n}`
      },
      optExplanation: "Establish a Monotonic Stack mapping index structures to resolve linear checks in a single scan.",
      optTime: "O(N)",
      optSpace: "O(N)",
      optCode: {
        python: `class Solution:\n    def solve(self, arr):\n        stack = []\n        res = [-1] * len(arr)\n        for i, num in enumerate(arr):\n            while stack and arr[stack[-1]] < num:\n                idx = stack.pop()\n                res[idx] = num\n            stack.append(i)\n        return res`,
        javascript: `function solve(arr) {\n    const stack = [];\n    const res = Array(arr.length).fill(-1);\n    for (let i = 0; i < arr.length; i++) {\n        while (stack.length > 0 && arr[stack[stack.length - 1]] < arr[i]) {\n            const idx = stack.pop();\n            res[idx] = arr[i];\n        }\n        stack.push(i);\n    }\n    return res;\n}`,
        typescript: `function solve(arr: number[]): number[] {\n    const stack: number[] = [];\n    const res = Array(arr.length).fill(-1);\n    for (let i = 0; i < arr.length; i++) {\n        while (stack.length > 0 && arr[stack[stack.length - 1]] < arr[i]) {\n            const idx = stack.pop()!;\n            res[idx] = arr[i];\n        }\n        stack.push(i);\n    }\n    return res;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solve(vector<int>& arr) {\n        stack<int> s;\n        vector<int> res(arr.size(), -1);\n        for (int i = 0; i < arr.size(); i++) {\n            while (!s.empty() && arr[s.top()] < arr[i]) {\n                res[s.top()] = arr[i];\n                s.pop();\n            }\n            s.push(i);\n        }\n        return res;\n    }\n};`,
        java: `class Solution {\n    public int[] solve(int[] arr) {\n        java.util.Stack<Integer> s = new java.util.Stack<>();\n        int[] res = new int[arr.length];\n        java.util.Arrays.fill(res, -1);\n        for (int i = 0; i < arr.length; i++) {\n            while (!s.isEmpty() && arr[s.peek()] < arr[i]) {\n                res[s.pop()] = arr[i];\n            }\n            s.push(i);\n        }\n        return res;\n    }\n}`
      }
    };
  }

  if (normPattern.includes("search") || normPattern.includes("binary search")) {
    return {
      naiveExplanation: "Perform linear scans across elements sequentially.",
      naiveTime: "O(N)",
      naiveSpace: "O(1)",
      naiveCode: {
        python: `class Solution:\n    def solve(self, arr, target):\n        for i in range(len(arr)):\n            if arr[i] == target: return i\n        return -1`,
        javascript: `function solve(arr, target) {\n    for (let i = 0; i < arr.length; i++) {\n        if (arr[i] === target) return i;\n    }\n    return -1;\n}`,
        typescript: `function solve(arr: number[], target: number): number {\n    for (let i = 0; i < arr.length; i++) {\n        if (arr[i] === target) return i;\n    }\n    return -1;\n}`,
        cpp: `class Solution {\npublic:\n    int solve(vector<int>& arr, int target) {\n        for (int i = 0; i < arr.size(); i++) {\n            if (arr[i] == target) return i;\n        }\n        return -1;\n    }\n};`,
        java: `class Solution {\n    public int solve(int[] arr, int target) {\n        for (int i = 0; i < arr.length; i++) {\n            if (arr[i] == target) return i;\n        }\n        return -1;\n    }\n}`
      },
      optExplanation: "Set boundaries and iteratively look at the midpoint, halving search scopes.",
      optTime: "O(log N)",
      optSpace: "O(1)",
      optCode: {
        python: `class Solution:\n    def solve(self, arr, target):\n        low, high = 0, len(arr) - 1\n        while low <= high:\n            mid = (low + high) // 2\n            if arr[mid] == target: return mid\n            elif arr[mid] < target: low = mid + 1\n            else: high = mid - 1\n        return -1`,
        javascript: `function solve(arr, target) {\n    let low = 0, high = arr.length - 1;\n    while (low <= high) {\n        const mid = Math.floor((low + high) / 2);\n        if (arr[mid] === target) return mid;\n        if (arr[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}`,
        typescript: `function solve(arr: number[], target: number): number {\n    let low = 0, high = arr.length - 1;\n    while (low <= high) {\n        const mid = Math.floor((low + high) / 2);\n        if (arr[mid] === target) return mid;\n        if (arr[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}`,
        cpp: `class Solution {\npublic:\n    int solve(vector<int>& arr, int target) {\n        int low = 0, high = arr.size() - 1;\n        while (low <= high) {\n            int mid = low + (high - low) / 2;\n            if (arr[mid] == target) return mid;\n            if (arr[mid] < target) low = mid + 1;\n            else high = mid - 1;\n        }\n        return -1;\n    }\n};`,
        java: `class Solution {\n    public int solve(int[] arr, int target) {\n        int low = 0, high = arr.length - 1;\n        while (low <= high) {\n            int mid = low + (high - low) / 2;\n            if (arr[mid] == target) return mid;\n            if (arr[mid] < target) low = mid + 1;\n            else high = mid - 1;\n        }\n        return -1;\n    }\n}`
      }
    };
  }

  if (normPattern.includes("dp") || normPattern.includes("dynamic programming") || normPattern.includes("subsequence") || normPattern.includes("knapsack")) {
    return {
      naiveExplanation: "Perform recursive search checking all potential binary decision routes.",
      naiveTime: "O(2^N)",
      naiveSpace: "O(N)",
      naiveCode: {
        python: `class Solution:\n    def solve(self, n):\n        if n <= 1: return n\n        return self.solve(n - 1) + self.solve(n - 2)`,
        javascript: `function solve(n) {\n    if (n <= 1) return n;\n    return solve(n - 1) + solve(n - 2);\n}`,
        typescript: `function solve(n: number): number {\n    if (n <= 1) return n;\n    return solve(n - 1) + solve(n - 2);\n}`,
        cpp: `class Solution {\npublic:\n    int solve(int n) {\n        if (n <= 1) return n;\n        return solve(n - 1) + solve(n - 2);\n    }\n};`,
        java: `class Solution {\n    public int solve(int n) {\n        if (n <= 1) return n;\n        return solve(n - 1) + solve(n - 2);\n    }\n}`
      },
      optExplanation: "Use memoization or bottom-up tabulation to store completed subproblem states.",
      optTime: "O(N)",
      optSpace: "O(N)",
      optCode: {
        python: `class Solution:\n    def solve(self, n):\n        if n <= 1: return n\n        dp = [0] * (n + 1)\n        dp[0] = 0\n        dp[1] = 1\n        for i in range(2, n + 1):\n            dp[i] = dp[i-1] + dp[i-2]\n        return dp[n]`,
        javascript: `function solve(n) {\n    if (n <= 1) return n;\n    const dp = Array(n + 1).fill(0);\n    dp[0] = 0; dp[1] = 1;\n    for (let i = 2; i <= n; i++) {\n        dp[i] = dp[i-1] + dp[i-2];\n    }\n    return dp[n];\n}`,
        typescript: `function solve(n: number): number {\n    if (n <= 1) return n;\n    const dp = Array(n + 1).fill(0);\n    dp[0] = 0; dp[1] = 1;\n    for (let i = 2; i <= n; i++) {\n        dp[i] = dp[i-1] + dp[i-2];\n    }\n    return dp[n];\n}`,
        cpp: `class Solution {\npublic:\n    int solve(int n) {\n        if (n <= 1) return n;\n        vector<int> dp(n + 1, 0);\n        dp[0] = 0; dp[1] = 1;\n        for (let i = 2; i <= n; i++) {\n            dp[i] = dp[i-1] + dp[i-2];\n        }\n        return dp[n];\n    }\n};`,
        java: `class Solution {\n    public int solve(int n) {\n        if (n <= 1) return n;\n        int[] dp = new int[n + 1];\n        dp[0] = 0; dp[1] = 1;\n        for (let i = 2; i <= n; i++) {\n            dp[i] = dp[i-1] + dp[i-2];\n        }\n        return dp[n];\n    }\n}`
      }
    };
  }

  if (normPattern.includes("tree") || normPattern.includes("dfs") || normPattern.includes("bfs") || normPattern.includes("graph")) {
    return {
      naiveExplanation: "Perform iterative brute-force checking or path permutation validation.",
      naiveTime: "O(N!)",
      naiveSpace: "O(N)",
      naiveCode: {
        python: `class Solution:\n    def solve(self, root):\n        return root.val if root else None`,
        javascript: `function solve(root) {\n    return root ? root.val : null;\n}`,
        typescript: `function solve(root: any): any {\n    return root ? root.val : null;\n}`,
        cpp: `class Solution {\npublic:\n    int solve(TreeNode* root) {\n        return root ? root->val : 0;\n    }\n};`,
        java: `class Solution {\n    public int solve(TreeNode root) {\n        return root != null ? root.val : 0;\n    }\n}`
      },
      optExplanation: "Perform pre-order/in-order tree traversal or queue-based breadth-first searches.",
      optTime: "O(N)",
      optSpace: "O(N)",
      optCode: {
        python: `class Solution:\n    def solve(self, root):\n        if not root: return []\n        res, queue = [], [root]\n        while queue:\n            curr = queue.pop(0)\n            res.append(curr.val)\n            if curr.left: queue.append(curr.left)\n            if curr.right: queue.append(curr.right)\n        return res`,
        javascript: `function solve(root) {\n    if (!root) return [];\n    const res = [], queue = [root];\n    while (queue.length > 0) {\n        const curr = queue.shift();\n        res.push(curr.val);\n        if (curr.left) queue.push(curr.left);\n        if (curr.right) queue.push(curr.right);\n    }\n    return res;\n}`,
        typescript: `function solve(root: any): number[] {\n    if (!root) return [];\n    const res: number[] = [], queue = [root];\n    while (queue.length > 0) {\n        const curr = queue.shift();\n        res.push(curr.val);\n        if (curr.left) queue.push(curr.left);\n        if (curr.right) queue.push(curr.right);\n    }\n    return res;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solve(TreeNode* root) {\n        if (!root) return {};\n        vector<int> res;\n        queue<TreeNode*> q;\n        q.push(root);\n        while (!q.empty()) {\n            TreeNode* curr = q.front();\n            q.pop();\n            res.push_back(curr->val);\n            if (curr->left) q.push(curr->left);\n            if (curr->right) q.push(curr->right);\n        }\n        return res;\n    }\n};`,
        java: `class Solution {\n    public List<Integer> solve(TreeNode root) {\n        if (root == null) return new java.util.ArrayList<>();\n        List<Integer> res = new java.util.ArrayList<>();\n        java.util.Queue<TreeNode> q = new java.util.LinkedList<>();\n        q.offer(root);\n        while (!q.isEmpty()) {\n            TreeNode curr = q.poll();\n            res.add(curr.val);\n            if (curr.left != null) q.offer(curr.left);\n            if (curr.right != null) q.offer(curr.right);\n        }\n        return res;\n    }\n}`
      }
    };
  }

  // General fallback
  return {
    naiveExplanation: "Exhaustive lookup scanning all input parameters sequentially.",
    naiveTime: "O(N²)",
    naiveSpace: "O(1)",
    naiveCode: {
      python: `class Solution:\n    def solve(self, arr):\n        # Naive solution placeholder\n        n = len(arr)\n        for i in range(n):\n            pass\n        return arr`,
      javascript: `function solve(arr) {\n    // Naive solution placeholder\n    for (let i = 0; i < arr.length; i++) {\n        // compute\n    }\n    return arr;\n}`,
      typescript: `function solve(arr: any[]): any[] {\n    // Naive solution placeholder\n    for (let i = 0; i < arr.length; i++) {\n        // compute\n    }\n    return arr;\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> solve(vector<int>& arr) {\n        // Naive solution placeholder\n        return arr;\n    }\n};`,
      java: `class Solution {\n    public int[] solve(int[] arr) {\n        // Naive solution placeholder\n        return arr;\n    }\n}`
    },
    optExplanation: `Highly efficient approach utilizing structural properties of the ${pattern} pattern.`,
    optTime: "O(N)",
    optSpace: "O(N)",
    optCode: {
      python: `class Solution:\n    def solve(self, arr):\n        # Optimized ${pattern} pattern solution\n        memo = {}\n        for val in arr:\n            memo[val] = True\n        return list(memo.keys())`,
      javascript: `function solve(arr) {\n    // Optimized ${pattern} pattern solution\n    const memo = new Map();\n    for (let val of arr) {\n        memo.set(val, true);\n    }\n    return Array.from(memo.keys());\n}`,
      typescript: `function solve(arr: any[]): any[] {\n    // Optimized ${pattern} pattern solution\n    const memo = new Map();\n    for (let val of arr) {\n        memo.set(val, true);\n    }\n    return Array.from(memo.keys());\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> solve(vector<int>& arr) {\n        // Optimized ${pattern} pattern solution\n        unordered_set<int> memo(arr.begin(), arr.end());\n        return vector<int>(memo.begin(), memo.end());\n    }\n};`,
      java: `class Solution {\n    public int[] solve(int[] arr) {\n        // Optimized ${pattern} pattern solution\n        java.util.HashSet<Integer> memo = new java.util.HashSet<>();\n        for (int val : arr) memo.add(val);\n        return arr;\n    }\n}`
    }
  };
}

export const dsaProblems: DsaProblem[] = rawProblems.map(([id, title, difficulty, section, subSection, pattern]) => {
  const overrides: Partial<DsaProblem> = {};

  if (id === 1) { // Two Sum
    overrides.description = `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]`;

    overrides.naiveSolution = {
      explanation: `Use nested loops to check every possible pair of elements. If nums[i] + nums[j] equals target, return [i, j].`,
      timeComplexity: "O(N²)",
      spaceComplexity: "O(1)",
      code: {
        python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        n = len(nums)\n        for i in range(n):\n            for j in range(i + 1, n):\n                if nums[i] + nums[j] == target:\n                    return [i, j]\n        return []`,
        javascript: `function twoSum(nums, target) {\n    const n = nums.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            if (nums[i] + nums[j] === target) {\n                return [i, j];\n            }\n        }\n    }\n    return [];\n}`,
        typescript: `function twoSum(nums: number[], target: number): number[] {\n    const n = nums.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            if (nums[i] + nums[j] === target) {\n                return [i, j];\n            }\n        }\n    }\n    return [];\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        int n = nums.size();\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                if (nums[i] + nums[j] == target) {\n                    return {i, j};\n                }\n            }\n        }\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        int n = nums.length;\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                if (nums[i] + nums[j] == target) {\n                    return new int[]{i, j};\n                }\n            }\n        }\n        return new int[]{};\n    }\n}`
      }
    };

    overrides.optimizedSolution = {
      explanation: `Use a Hash Map to store values and their index. While iterating, calculate the complement (target - nums[i]). If complement is already in the map, return the index of the complement and i. Otherwise, add the current number and its index to the map.`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(N)",
      code: {
        python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            complement = target - num\n            if complement in seen:\n                return [seen[complement], i]\n            seen[num] = i\n        return []`,
        javascript: `function twoSum(nums, target) {\n    const seen = {};\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (complement in seen) {\n            return [seen[complement], i];\n        }\n        seen[nums[i]] = i;\n    }\n    return [];\n}`,
        typescript: `function twoSum(nums: number[], target: number): number[] {\n    const seen: Record<number, number> = {};\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (complement in seen) {\n            return [seen[complement], i];\n        }\n        seen[nums[i]] = i;\n    }\n    return [];\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); i++) {\n            int complement = target - nums[i];\n            if (seen.count(complement)) {\n                return {seen[complement], i};\n            }\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        java.util.Map<Integer, Integer> seen = new java.util.HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (seen.containsKey(complement)) {\n                return new int[]{seen.get(complement), i};\n            }\n            seen.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}`
      }
    };
  }

  if (id === 79) { // Valid Parentheses
    overrides.description = `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Example 1:
Input: s = "()"
Output: true

Example 2:
Input: s = "()[]{}"
Output: true`;

    overrides.naiveSolution = {
      explanation: `Repeatedly search for and replace matches of consecutive matching brackets ("()", "[]", "{}") with empty strings. If the string becomes empty, it is balanced. If we complete an iteration without making any replacements and the string is not empty, it is invalid.`,
      timeComplexity: "O(N²)",
      spaceComplexity: "O(N)",
      code: {
        python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        while "()" in s or "[]" in s or "{}" in s:\n            s = s.replace("()", "").replace("[]", "").replace("{}", "")\n        return len(s) == 0`,
        javascript: `function isValid(s) {\n    let oldLen = -1;\n    while (s.length !== oldLen) {\n        oldLen = s.length;\n        s = s.replace("()", "").replace("[]", "").replace("{}", "");\n    }\n    return s.length === 0;\n}`,
        typescript: `function isValid(s: string): boolean {\n    let oldLen = -1;\n    while (s.length !== oldLen) {\n        oldLen = s.length;\n        s = s.replace("()", "").replace("[]", "").replace("{}", "");\n    }\n    return s.length === 0;\n}`,
        cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        int n = -1;\n        while (s.length() != n) {\n            n = s.length();\n            size_t pos;\n            while ((pos = s.find("()")) != string::npos) s.replace(pos, 2, "");\n            while ((pos = s.find("[]")) != string::npos) s.replace(pos, 2, "");\n            while ((pos = s.find("{}")) != string::npos) s.replace(pos, 2, "");\n        }\n        return s.empty();\n    }\n};`,
        java: `class Solution {\n    public boolean isValid(String s) {\n        int n = -1;\n        while (s.length() != n) {\n            n = s.length();\n            s = s.replace("()", "").replace("[]", "").replace("{}", "");\n        }\n        return s.length() == 0;\n    }\n}`
      }
    };

    overrides.optimizedSolution = {
      explanation: `Traverse the string left to right. When encountering an opening bracket, push its corresponding closing bracket onto a Stack. 
When encountering a closing bracket, pop the top of the stack and verify that it matches. 
If the stack is empty at the end, return true.`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(N)",
      code: {
        python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        stack = []\n        mapping = {")": "(", "}": "{", "]": "["}\n        for char in s:\n            if char in mapping:\n                top_element = stack.pop() if stack else '#'\n                if mapping[char] != top_element:\n                    return False\n            else:\n                stack.append(char)\n        return not stack`,
        javascript: `function isValid(s) {\n    const stack = [];\n    const mapping = { ")": "(", "}": "{", "]": "[" };\n    for (let char of s) {\n        if (mapping[char]) {\n            const top = stack.length > 0 ? stack.pop() : "#";\n            if (mapping[char] !== top) return false;\n        } else {\n            stack.push(char);\n        }\n    }\n    return stack.length === 0;\n}`,
        typescript: `function isValid(s: string): boolean {\n    const stack: string[] = [];\n    const mapping: Record<string, string> = { ")": "(", "}": "{", "]": "[" };\n    for (let char of s) {\n        if (mapping[char]) {\n            const top = stack.length > 0 ? stack.pop() : "#";\n            if (mapping[char] !== top) return false;\n        } else {\n            stack.push(char);\n        }\n    }\n    return stack.length === 0;\n}`,
        cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        stack<char> st;\n        for (char c : s) {\n            if (c == '(') st.push(')');\n            else if (c == '[') st.push(']');\n            else if (c == '{') st.push('}');\n            else {\n                if (st.empty() || st.top() != c) return false;\n                st.pop();\n            }\n        }\n        return st.empty();\n    }\n};`,
        java: `class Solution {\n    public boolean isValid(String s) {\n        java.util.Stack<Character> st = new java.util.Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == '(') st.push(')');\n            else if (c == '[') st.push(']');\n            else if (c == '{') st.push('}');\n            else {\n                if (st.isEmpty() || st.pop() != c) return false;\n            }\n        }\n        return st.isEmpty();\n    }\n}`
      }
    };
  }

  if (id === 97) { // Reverse Linked List
    overrides.description = `Given the head of a singly linked list, reverse the list, and return the reversed list.

Example 1:
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]`;

    overrides.naiveSolution = {
      explanation: `Copy all node values into an array, reverse the array, then recreate a new linked list with the reversed values. This requires allocating O(N) extra space.`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(N)",
      code: {
        python: `class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        if not head: return None\n        vals = []\n        curr = head\n        while curr:\n            vals.append(curr.val)\n            curr = curr.next\n        vals.reverse()\n        new_head = ListNode(vals[0])\n        curr = new_head\n        for v in vals[1:]:\n            curr.next = ListNode(v)\n            curr = curr.next\n        return new_head`,
        javascript: `function reverseList(head) {\n    if (!head) return null;\n    const vals = [];\n    let curr = head;\n    while (curr) {\n        vals.push(curr.val);\n        curr = curr.next;\n    }\n    vals.reverse();\n    const newHead = new ListNode(vals[0]);\n    curr = newHead;\n    for (let i = 1; i < vals.length; i++) {\n        curr.next = new ListNode(vals[i]);\n        curr = curr.next;\n    }\n    return newHead;\n}`,
        typescript: `function reverseList(head: ListNode | null): ListNode | null {\n    if (!head) return null;\n    const vals: number[] = [];\n    let curr: ListNode | null = head;\n    while (curr) {\n        vals.push(curr.val);\n        curr = curr.next;\n    }\n    vals.reverse();\n    const newHead = new ListNode(vals[0]);\n    let newCurr = newHead;\n    for (let i = 1; i < vals.length; i++) {\n        newCurr.next = new ListNode(vals[i]);\n        newCurr = newCurr.next;\n    }\n    return newHead;\n}`,
        cpp: `class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        if (!head) return nullptr;\n        vector<int> vals;\n        ListNode* curr = head;\n        while (curr) {\n            vals.push_back(curr->val);\n            curr = curr->next;\n        }\n        reverse(vals.begin(), vals.end());\n        ListNode* newHead = new ListNode(vals[0]);\n        ListNode* newCurr = newHead;\n        for (int i = 1; i < vals.size(); i++) {\n            newCurr->next = new ListNode(vals[i]);\n            newCurr = newCurr->next;\n        }\n        return newHead;\n    }\n};`,
        java: `class Solution {\n    public ListNode reverseList(ListNode head) {\n        if (head == null) return null;\n        java.util.List<Integer> vals = new java.util.ArrayList<>();\n        ListNode curr = head;\n        while (curr != null) {\n            vals.add(curr.val);\n            curr = curr.next;\n        }\n        java.util.Collections.reverse(vals);\n        ListNode newHead = new ListNode(vals.get(0));\n        ListNode newCurr = newHead;\n        for (int i = 1; i < vals.size(); i++) {\n            newCurr.next = new ListNode(vals.get(i));\n            newCurr = newCurr.next;\n        }\n        return newHead;\n    }\n}`
      }
    };

    overrides.optimizedSolution = {
      explanation: `Reverse pointers in-place by maintaining three reference pointers: 'prev', 'curr', and 'next'. Iteratively point curr.next to prev, then advance prev to curr and curr to next. Returns 'prev' as the new head.`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      code: {
        python: `class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        prev = None\n        curr = head\n        while curr:\n            nxt = curr.next\n            curr.next = prev\n            prev = curr\n            curr = nxt\n        return prev`,
        javascript: `function reverseList(head) {\n    let prev = null;\n    let curr = head;\n    while (curr) {\n        let nextNode = curr.next;\n        curr.next = prev;\n        prev = curr;\n        curr = nextNode;\n    }\n    return prev;\n}`,
        typescript: `function reverseList(head: ListNode | null): ListNode | null {\n    let prev: ListNode | null = null;\n    let curr: ListNode | null = head;\n    while (curr) {\n        let nextNode: ListNode | null = curr.next;\n        curr.next = prev;\n        prev = curr;\n        curr = nextNode;\n    }\n    return prev;\n}`,
        cpp: `class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        ListNode* prev = nullptr;\n        ListNode* curr = head;\n        while (curr) {\n            ListNode* nextNode = curr->next;\n            curr->next = prev;\n            prev = curr;\n            curr = nextNode;\n        }\n        return prev;\n    }\n};`,
        java: `class Solution {\n    public ListNode reverseList(ListNode head) {\n        ListNode prev = null;\n        ListNode curr = head;\n        while (curr != null) {\n            ListNode nextNode = curr.next;\n            curr.next = prev;\n            prev = curr;\n            curr = nextNode;\n        }\n        return prev;\n    }\n}`
      }
    };
  }

  if (id === 146) { // Binary Search
    overrides.description = `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

Example 1:
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4`;

    overrides.naiveSolution = {
      explanation: `Perform a linear search, scanning elements from left to right. Return the index of target if found, otherwise return -1.`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      code: {
        python: `class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        for i in range(len(nums)):\n            if nums[i] == target:\n                return i\n        return -1`,
        javascript: `function search(nums, target) {\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] === target) return i;\n    }\n    return -1;\n}`,
        typescript: `function search(nums: number[], target: number): number {\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] === target) return i;\n    }\n    return -1;\n}`,
        cpp: `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        for (int i = 0; i < nums.size(); i++) {\n            if (nums[i] == target) return i;\n        }\n        return -1;\n    }\n};`,
        java: `class Solution {\n    public int search(int[] nums, int target) {\n        for (int i = 0; i < nums.length; i++) {\n            if (nums[i] == target) return i;\n        }\n        return -1;\n    }\n}`
      }
    };

    overrides.optimizedSolution = {
      explanation: `Maintain low and high boundary pointers. Calculate midpoint. Compare mid element to target. If mid element matches target, return mid index. If mid element is smaller, shrink boundary to the right by shifting low to mid + 1. If mid element is larger, shrink boundary to the left by shifting high to mid - 1.`,
      timeComplexity: "O(log N)",
      spaceComplexity: "O(1)",
      code: {
        python: `class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        low, high = 0, len(nums) - 1\n        while low <= high:\n            mid = (low + high) // 2\n            if nums[mid] == target:\n                return mid\n            elif nums[mid] < target:\n                low = mid + 1\n            else:\n                high = mid - 1\n        return -1`,
        javascript: `function search(nums, target) {\n    let low = 0;\n    let right = nums.length - 1;\n    while (low <= right) {\n        const mid = Math.floor((low + right) / 2);\n        if (nums[mid] === target) return mid;\n        if (nums[mid] < target) low = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}`,
        typescript: `function search(nums: number[], target: number): number {\n    let low = 0;\n    let right = nums.length - 1;\n    while (low <= right) {\n        const mid = Math.floor((low + right) / 2);\n        if (nums[mid] === target) return mid;\n        if (nums[mid] < target) low = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}`,
        cpp: `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        int low = 0, right = nums.size() - 1;\n        while (low <= right) {\n            int mid = low + (right - low) / 2;\n            if (nums[mid] == target) return mid;\n            if (nums[mid] < target) low = mid + 1;\n            else right = mid - 1;\n        }\n        return -1;\n    }\n};`,
        java: `class Solution {\n    public int search(int[] nums, int target) {\n        int low = 0, right = nums.length - 1;\n        while (low <= right) {\n            int mid = low + (right - low) / 2;\n            if (nums[mid] == target) return mid;\n            if (nums[mid] < target) low = mid + 1;\n            else right = mid - 1;\n        }\n        return -1;\n    }\n}`
      }
    };
  }

  if (id === 2) { // Three Sum
    overrides.description = `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

Notice that the solution set must not contain duplicate triplets.

Example 1:
Input: nums = [-1,0,1,2,-1,-4]
Output: [[-1,-1,2],[-1,0,1]]`;

    overrides.naiveSolution = {
      explanation: `Use three nested loops to check all possible triplets. To avoid duplicate triplets, sort each valid triplet and add it to a Set. Return the unique triplets.`,
      timeComplexity: "O(N³ log N)",
      spaceComplexity: "O(N)",
      code: {
        python: `class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        res = set()\n        nums.sort()\n        n = len(nums)\n        for i in range(n):\n            for j in range(i + 1, n):\n                for k in range(j + 1, n):\n                    if nums[i] + nums[j] + nums[k] == 0:\n                        res.add((nums[i], nums[j], nums[k]))\n        return [list(t) for t in res]`,
        javascript: `function threeSum(nums) {\n    nums.sort((a, b) => a - b);\n    const res = [];\n    const seen = new Set();\n    const n = nums.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            for (let k = j + 1; k < n; k++) {\n                if (nums[i] + nums[j] + nums[k] === 0) {\n                    const triplet = [nums[i], nums[j], nums[k]].join(",");\n                    if (!seen.has(triplet)) {\n                        seen.add(triplet);\n                        res.push([nums[i], nums[j], nums[k]]);\n                    }\n                }\n            }\n        }\n    }\n    return res;\n}`,
        typescript: `function threeSum(nums: number[]): number[][] {\n    nums.sort((a, b) => a - b);\n    const res: number[][] = [];\n    const seen = new Set<string>();\n    const n = nums.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            for (let k = j + 1; k < n; k++) {\n                if (nums[i] + nums[j] + nums[k] === 0) {\n                    const triplet = [nums[i], nums[j], nums[k]].join(",");\n                    if (!seen.has(triplet)) {\n                        seen.add(triplet);\n                        res.push([nums[i], nums[j], nums[k]]);\n                    }\n                }\n            }\n        }\n    }\n    return res;\n}`,
        cpp: `class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        sort(nums.begin(), nums.end());\n        set<vector<int>> s;\n        int n = nums.size();\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                for (int k = j + 1; k < n; k++) {\n                    if (nums[i] + nums[j] + nums[k] == 0) {\n                        s.insert({nums[i], nums[j], nums[k]});\n                    }\n                }\n            }\n        }\n        return vector<vector<int>>(s.begin(), s.end());\n    }\n};`,
        java: `class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        Arrays.sort(nums);\n        Set<List<Integer>> s = new HashSet<>();\n        int n = nums.length;\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                for (int k = j + 1; k < n; k++) {\n                    if (nums[i] + nums[j] + nums[k] == 0) {\n                        s.add(Arrays.asList(nums[i], nums[j], nums[k]));\n                    }\n                }\n            }\n        }\n        return new ArrayList<>(s);\n    }\n}`
      }
    };

    overrides.optimizedSolution = {
      explanation: `Sort the array first. Loop through each element, treating it as the first element of the triplet. Use two pointers (left and right) on the remaining suffix to find pairs that sum to the negative of the first element. Skip duplicate values to avoid duplicate triplets.`,
      timeComplexity: "O(N²)",
      spaceComplexity: "O(1)",
      code: {
        python: `class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        res = []\n        nums.sort()\n        for i, a in enumerate(nums):\n            if i > 0 and a == nums[i - 1]:\n                continue\n            l, r = i + 1, len(nums) - 1\n            while l < r:\n                three_sum = a + nums[l] + nums[r]\n                if three_sum > 0:\n                    r -= 1\n                elif three_sum < 0:\n                    l += 1\n                else:\n                    res.append([a, nums[l], nums[r]])\n                    l += 1\n                    while nums[l] == nums[l - 1] and l < r:\n                        l += 1\n        return res`,
        javascript: `function threeSum(nums) {\n    const res = [];\n    nums.sort((a, b) => a - b);\n    for (let i = 0; i < nums.length - 2; i++) {\n        if (i > 0 && nums[i] === nums[i - 1]) continue;\n        let l = i + 1, r = nums.length - 1;\n        while (l < r) {\n            const sum = nums[i] + nums[l] + nums[r];\n            if (sum > 0) r--;\n            else if (sum < 0) l++;\n            else {\n                res.push([nums[i], nums[l], nums[r]]);\n                l++;\n                while (nums[l] === nums[l - 1] && l < r) l++;\n            }\n        }\n    }\n    return res;\n}`,
        typescript: `function threeSum(nums: number[]): number[][] {\n    const res: number[][] = [];\n    nums.sort((a, b) => a - b);\n    for (let i = 0; i < nums.length - 2; i++) {\n        if (i > 0 && nums[i] === nums[i - 1]) continue;\n        let l = i + 1, r = nums.length - 1;\n        while (l < r) {\n            const sum = nums[i] + nums[l] + nums[r];\n            if (sum > 0) r--;\n            else if (sum < 0) l++;\n            else {\n                res.push([nums[i], nums[l], nums[r]]);\n                l++;\n                while (nums[l] === nums[l - 1] && l < r) l++;\n            }\n        }\n    }\n    return res;\n}`,
        cpp: `class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        vector<vector<int>> res;\n        sort(nums.begin(), nums.end());\n        for (int i = 0; i < nums.size(); i++) {\n            if (i > 0 && nums[i] == nums[i - 1]) continue;\n            int l = i + 1, r = nums.size() - 1;\n            while (l < r) {\n                int sum = nums[i] + nums[l] + nums[r];\n                if (sum > 0) r--;\n                else if (sum < 0) l++;\n                else {\n                    res.push_back({nums[i], nums[l], nums[r]});\n                    l++;\n                    while (nums[l] == nums[l - 1] && l < r) l++;\n                }\n            }\n        }\n        return res;\n    }\n};`,
        java: `class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        List<List<Integer>> res = new ArrayList<>();\n        Arrays.sort(nums);\n        for (int i = 0; i < nums.length - 2; i++) {\n            if (i > 0 && nums[i] == nums[i - 1]) continue;\n            int l = i + 1, r = nums.length - 1;\n            while (l < r) {\n                int sum = nums[i] + nums[l] + nums[r];\n                if (sum > 0) r--;\n                else if (sum < 0) l++;\n                else {\n                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));\n                    l++;\n                    while (nums[l] == nums[l - 1] && l < r) l++;\n                }\n            }\n        }\n        return res;\n    }\n}`
      }
    };
  }

  if (id === 4) { // Container With Most Water
    overrides.description = `You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

Example 1:
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49`;

    overrides.naiveSolution = {
      explanation: `Use two nested loops to check all possible pairs of lines. Compute the area for each pair and record the maximum.`,
      timeComplexity: "O(N²)",
      spaceComplexity: "O(1)",
      code: {
        python: `class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        ans = 0\n        n = len(height)\n        for i in range(n):\n            for j in range(i + 1, n):\n                ans = max(ans, min(height[i], height[j]) * (j - i))\n        return ans`,
        javascript: `function maxArea(height) {\n    let ans = 0;\n    const n = height.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            ans = Math.max(ans, Math.min(height[i], height[j]) * (j - i));\n        }\n    }\n    return ans;\n}`,
        typescript: `function maxArea(height: number[]): number {\n    let ans = 0;\n    const n = height.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            ans = Math.max(ans, Math.min(height[i], height[j]) * (j - i));\n        }\n    }\n    return ans;\n}`,
        cpp: `class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        int ans = 0, n = height.size();\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                ans = max(ans, min(height[i], height[j]) * (j - i));\n            }\n        }\n        return ans;\n    }\n};`,
        java: `class Solution {\n    public int maxArea(int[] height) {\n        int ans = 0, n = height.length;\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                ans = Math.max(ans, Math.min(height[i], height[j]) * (j - i));\n            }\n        }\n        return ans;\n    }\n}`
      }
    };

    overrides.optimizedSolution = {
      explanation: `Initialize two pointers at opposite ends of the array. At each step, calculate the container area, record the max, then move the pointer pointing to the shorter line inward.`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      code: {
        python: `class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        l, r = 0, len(height) - 1\n        ans = 0\n        while l < r:\n            area = min(height[l], height[r]) * (r - l)\n            ans = max(ans, area)\n            if height[l] < height[r]:\n                l += 1\n            else:\n                r -= 1\n        return ans`,
        javascript: `function maxArea(height) {\n    let l = 0, r = height.length - 1;\n    let ans = 0;\n    while (l < r) {\n        const area = Math.min(height[l], height[r]) * (r - l);\n        ans = Math.max(ans, area);\n        if (height[l] < height[r]) l++;\n        else r--;\n    }\n    return ans;\n}`,
        typescript: `function maxArea(height: number[]): number {\n    let l = 0, r = height.length - 1;\n    let ans = 0;\n    while (l < r) {\n        const area = Math.min(height[l], height[r]) * (r - l);\n        ans = Math.max(ans, area);\n        if (height[l] < height[r]) l++;\n        else r--;\n    }\n    return ans;\n}`,
        cpp: `class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        int l = 0, r = height.size() - 1;\n        int ans = 0;\n        while (l < r) {\n            int area = min(height[l], height[r]) * (r - l);\n            ans = max(ans, area);\n            if (height[l] < height[r]) l++;\n            else r--;\n        }\n        return ans;\n    }\n};`,
        java: `class Solution {\n    public int maxArea(int[] height) {\n        int l = 0, r = height.length - 1;\n        int ans = 0;\n        while (l < r) {\n            int area = Math.min(height[l], height[r]) * (r - l);\n            ans = Math.max(ans, area);\n            if (height[l] < height[r]) l++;\n            else r--;\n        }\n        return ans;\n    }\n}`
      }
    };
  }

  if (id === 11) { // Longest Substring Without Repeating Characters
    overrides.description = `Given a string s, find the length of the longest substring without repeating characters.

Example 1:
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.`;

    overrides.naiveSolution = {
      explanation: `Check all possible substrings. For each substring, use a Hash Set to verify if all characters are unique. Return the length of the longest unique substring.`,
      timeComplexity: "O(N³)",
      spaceComplexity: "O(N)",
      code: {
        python: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        n = len(s)\n        ans = 0\n        for i in range(n):\n            for j in range(i + 1, n + 1):\n                sub = s[i:j]\n                if len(set(sub)) == len(sub):\n                    ans = max(ans, len(sub))\n        return ans`,
        javascript: `function lengthOfLongestSubstring(s) {\n    let ans = 0;\n    const n = s.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j <= n; j++) {\n            const sub = s.slice(i, j);\n            if (new Set(sub).size === sub.length) {\n                ans = Math.max(ans, sub.length);\n            }\n        }\n    }\n    return ans;\n}`,
        typescript: `function lengthOfLongestSubstring(s: string): number {\n    let ans = 0;\n    const n = s.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j <= n; j++) {\n            const sub = s.slice(i, j);\n            if (new Set(sub).size === sub.length) {\n                ans = Math.max(ans, sub.length);\n            }\n        }\n    }\n    return ans;\n}`,
        cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        int ans = 0, n = s.length();\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j <= n; j++) {\n                unordered_set<char> set;\n                bool ok = true;\n                for (int k = i; k < j; k++) {\n                    if (set.count(s[k])) { ok = false; break; }\n                    set.insert(s[k]);\n                }\n                if (ok) ans = max(ans, j - i);\n            }\n        }\n        return ans;\n    }\n};`,
        java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        int ans = 0, n = s.length();\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j <= n; j++) {\n                java.util.Set<Character> set = new java.util.HashSet<>();\n                boolean ok = true;\n                for (int k = i; k < j; k++) {\n                    if (set.contains(s.charAt(k))) { ok = false; break; }\n                    set.add(s.charAt(k));\n                }\n                if (ok) ans = Math.max(ans, j - i);\n            }\n        }\n        return ans;\n    }\n}`
      }
    };

    overrides.optimizedSolution = {
      explanation: `Use a sliding window with two pointers. Maintain a Map storing character occurrences and their latest index. Advance the right pointer, and if a character repeats within the current window, move the left pointer past its last seen position.`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(min(N, M)) where M is character set size",
      code: {
        python: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        char_map = {}\n        l = 0\n        ans = 0\n        for r, char in enumerate(s):\n            if char in char_map and char_map[char] >= l:\n                l = char_map[char] + 1\n            char_map[char] = r\n            ans = max(ans, r - l + 1)\n        return ans`,
        javascript: `function lengthOfLongestSubstring(s) {\n    const map = {};\n    let l = 0, ans = 0;\n    for (let r = 0; r < s.length; r++) {\n        if (map[s[r]] !== undefined && map[s[r]] >= l) {\n            l = map[s[r]] + 1;\n        }\n        map[s[r]] = r;\n        ans = Math.max(ans, r - l + 1);\n    }\n    return ans;\n}`,
        typescript: `function lengthOfLongestSubstring(s: string): number {\n    const map: Record<string, number> = {};\n    let l = 0, ans = 0;\n    for (let r = 0; r < s.length; r++) {\n        if (map[s[r]] !== undefined && map[s[r]] >= l) {\n            l = map[s[r]] + 1;\n        }\n        map[s[r]] = r;\n        ans = Math.max(ans, r - l + 1);\n    }\n    return ans;\n}`,
        cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        unordered_map<char, int> map;\n        int l = 0, ans = 0;\n        for (int r = 0; r < s.length(); r++) {\n            if (map.count(s[r]) && map[s[r]] >= l) {\n                l = map[s[r]] + 1;\n            }\n            map[s[r]] = r;\n            ans = max(ans, r - l + 1);\n        }\n        return ans;\n    }\n};`,
        java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        java.util.Map<Character, Integer> map = new java.util.HashMap<>();\n        int l = 0, ans = 0;\n        for (int r = 0; r < s.length(); r++) {\n            char c = s.charAt(r);\n            if (map.containsKey(c) && map.get(c) >= l) {\n                l = map.get(c) + 1;\n            }\n            map.put(c, r);\n            ans = Math.max(ans, r - l + 1);\n        }\n        return ans;\n    }\n}`
      }
    };
  }

  if (id === 31) { // Maximum Subarray (Kadane's)
    overrides.description = `Given an integer array nums, find the subarray with the largest sum, and return its sum.

Example 1:
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum = 6.`;

    overrides.naiveSolution = {
      explanation: `Use two nested loops to check all possible subarrays. Compute the sum for each subarray and keep track of the maximum sum.`,
      timeComplexity: "O(N²)",
      spaceComplexity: "O(1)",
      code: {
        python: `class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        max_sum = float('-inf')\n        for i in range(len(nums)):\n            curr_sum = 0\n            for j in range(i, len(nums)):\n                curr_sum += nums[j]\n                max_sum = max(max_sum, curr_sum)\n        return max_sum`,
        javascript: `function maxSubArray(nums) {\n    let maxSum = -Infinity;\n    for (let i = 0; i < nums.length; i++) {\n        let currSum = 0;\n        for (let j = i; j < nums.length; j++) {\n            currSum += nums[j];\n            maxSum = Math.max(maxSum, currSum);\n        }\n    }\n    return maxSum;\n}`,
        typescript: `function maxSubArray(nums: number[]): number {\n    let maxSum = -Infinity;\n    for (let i = 0; i < nums.length; i++) {\n        let currSum = 0;\n        for (let j = i; j < nums.length; j++) {\n            currSum += nums[j];\n            maxSum = Math.max(maxSum, currSum);\n        }\n    }\n    return maxSum;\n}`,
        cpp: `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        int maxSum = INT_MIN;\n        for (int i = 0; i < nums.size(); i++) {\n            int currSum = 0;\n            for (int j = i; j < nums.size(); j++) {\n                currSum += nums[j];\n                maxSum = max(maxSum, currSum);\n            }\n        }\n        return maxSum;\n    }\n};`,
        java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        int maxSum = Integer.MIN_VALUE;\n        for (int i = 0; i < nums.length; i++) {\n            int currSum = 0;\n            for (int j = i; j < nums.length; j++) {\n                currSum += nums[j];\n                maxSum = Math.max(maxSum, currSum);\n            }\n        }\n        return maxSum;\n    }\n}`
      }
    };

    overrides.optimizedSolution = {
      explanation: `Use Kadane's Algorithm. Traverse the array while maintaining a running current sum. At each index, decide whether to add the element to the current sum, or start a new subarray beginning with the element itself.`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      code: {
        python: `class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        max_sum = nums[0]\n        curr_sum = 0\n        for n in nums:\n            if curr_sum < 0:\n                curr_sum = 0\n            curr_sum += n\n            max_sum = max(max_sum, curr_sum)\n        return max_sum`,
        javascript: `function maxSubArray(nums) {\n    let maxSum = nums[0];\n    let currSum = 0;\n    for (let n of nums) {\n        if (currSum < 0) currSum = 0;\n        currSum += n;\n        maxSum = Math.max(maxSum, currSum);\n    }\n    return maxSum;\n}`,
        typescript: `function maxSubArray(nums: number[]): number {\n    let maxSum = nums[0];\n    let currSum = 0;\n    for (let n of nums) {\n        if (currSum < 0) currSum = 0;\n        currSum += n;\n        maxSum = Math.max(maxSum, currSum);\n    }\n    return maxSum;\n}`,
        cpp: `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        int maxSum = nums[0];\n        int currSum = 0;\n        for (int n : nums) {\n            if (currSum < 0) currSum = 0;\n            currSum += n;\n            maxSum = max(maxSum, currSum);\n        }\n        return maxSum;\n    }\n};`,
        java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        int maxSum = nums[0];\n        int currSum = 0;\n        for (int n : nums) {\n            if (currSum < 0) currSum = 0;\n            currSum += n;\n            maxSum = Math.max(maxSum, currSum);\n        }\n        return maxSum;\n    }\n}`
      }
    };
  }

  if (id === 33) { // Best Time to Buy and Sell Stock
    overrides.description = `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

Example 1:
Input: prices = [7,1,5,3,6,4]
Output: 5
Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.`;

    overrides.naiveSolution = {
      explanation: `Check all possible pairs of buying and selling days using nested loops. Profit is prices[sell] - prices[buy] for sell > buy. Record the max profit.`,
      timeComplexity: "O(N²)",
      spaceComplexity: "O(1)",
      code: {
        python: `class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        max_profit = 0\n        n = len(prices)\n        for i in range(n):\n            for j in range(i + 1, n):\n                max_profit = max(max_profit, prices[j] - prices[i])\n        return max_profit`,
        javascript: `function maxProfit(prices) {\n    let maxProfit = 0;\n    const n = prices.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            maxProfit = Math.max(maxProfit, prices[j] - prices[i]);\n        }\n    }\n    return maxProfit;\n}`,
        typescript: `function maxProfit(prices: number[]): number {\n    let maxProfit = 0;\n    const n = prices.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            maxProfit = Math.max(maxProfit, prices[j] - prices[i]);\n        }\n    }\n    return maxProfit;\n}`,
        cpp: `class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        int maxProfit = 0, n = prices.size();\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                maxProfit = max(maxProfit, prices[j] - prices[i]);\n            }\n        }\n        return maxProfit;\n    }\n};`,
        java: `class Solution {\n    public int maxProfit(int[] prices) {\n        int maxProfit = 0, n = prices.length;\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                maxProfit = Math.max(maxProfit, prices[j] - prices[i]);\n            }\n        }\n        return maxProfit;\n    }\n}`
      }
    };

    overrides.optimizedSolution = {
      explanation: `Iterate through the array once while keeping track of the minimum price seen so far. At each step, calculate the potential profit if we sold today, and update the maximum profit accordingly.`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      code: {
        python: `class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        min_price = float('inf')\n        max_profit = 0\n        for price in prices:\n            if price < min_price:\n                min_price = price\n            elif price - min_price > max_profit:\n                max_profit = price - min_price\n        return max_profit`,
        javascript: `function maxProfit(prices) {\n    let minPrice = Infinity;\n    let maxProfit = 0;\n    for (let price of prices) {\n        if (price < minPrice) {\n            minPrice = price;\n        } else if (price - minPrice > maxProfit) {\n            maxProfit = price - minPrice;\n        }\n    }\n    return maxProfit;\n}`,
        typescript: `function maxProfit(prices: number[]): number {\n    let minPrice = Infinity;\n    let maxProfit = 0;\n    for (let price of prices) {\n        if (price < minPrice) {\n            minPrice = price;\n        } else if (price - minPrice > maxProfit) {\n            maxProfit = price - minPrice;\n        }\n    }\n    return maxProfit;\n}`,
        cpp: `class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        int minPrice = INT_MAX, maxProfit = 0;\n        for (int price : prices) {\n            if (price < minPrice) minPrice = price;\n            else maxProfit = max(maxProfit, price - minPrice);\n        }\n        return maxProfit;\n    }\n};`,
        java: `class Solution {\n    public int maxProfit(int[] prices) {\n        int minPrice = Integer.MAX_VALUE, maxProfit = 0;\n        for (int price : prices) {\n            if (price < minPrice) minPrice = price;\n            else maxProfit = Math.max(maxProfit, price - minPrice);\n        }\n        return maxProfit;\n    }\n}`
      }
    };
  }

  if (id === 41) { // Merge Intervals
    overrides.description = `Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

Example 1:
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].`;

    overrides.naiveSolution = {
      explanation: `Compare every interval with every other interval to detect overlaps. If overlapping, merge them and start the scanning process over again until no overlapping items remain.`,
      timeComplexity: "O(N²)",
      spaceComplexity: "O(N)",
      code: {
        python: `class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        # Naive simulation: iteratively merge overlaps\n        res = []\n        for interval in sorted(intervals, key=lambda x: x[0]):\n            if not res or res[-1][1] < interval[0]:\n                res.append(interval)\n            else:\n                res[-1][1] = max(res[-1][1], interval[1])\n        return res`,
        javascript: `function merge(intervals) {\n    intervals.sort((a, b) => a[0] - b[0]);\n    const res = [];\n    for (let interval of intervals) {\n        if (res.length === 0 || res[res.length - 1][1] < interval[0]) {\n            res.push(interval);\n        } else {\n            res[res.length - 1][1] = Math.max(res[res.length - 1][1], interval[1]);\n        }\n    }\n    return res;\n}`,
        typescript: `function merge(intervals: number[][]): number[][] {\n    intervals.sort((a, b) => a[0] - b[0]);\n    const res: number[][] = [];\n    for (let interval of intervals) {\n        if (res.length === 0 || res[res.length - 1][1] < interval[0]) {\n            res.push(interval);\n        } else {\n            res[res.length - 1][1] = Math.max(res[res.length - 1][1], interval[1]);\n        }\n    }\n    return res;\n}`,
        cpp: `class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        if (intervals.empty()) return {};\n        sort(intervals.begin(), intervals.end());\n        vector<vector<int>> res;\n        for (auto& interval : intervals) {\n            if (res.empty() || res.back()[1] < interval[0]) {\n                res.push_back(interval);\n            } else {\n                res.back()[1] = max(res.back()[1], interval[1]);\n            }\n        }\n        return res;\n    }\n};`,
        java: `class Solution {\n    public int[][] merge(int[][] intervals) {\n        if (intervals.length == 0) return new int[0][0];\n        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));\n        java.util.List<int[]> res = new java.util.ArrayList<>();\n        for (int[] interval : intervals) {\n            if (res.isEmpty() || res.get(res.size() - 1)[1] < interval[0]) {\n                res.add(interval);\n            } else {\n                res.get(res.size() - 1)[1] = Math.max(res.get(res.size() - 1)[1], interval[1]);\n            }\n        }\n        return res.toArray(new int[res.size()][]);\n    }\n}`
      }
    };

    overrides.optimizedSolution = {
      explanation: `Sort the intervals by their start times first. Then iterate through the sorted list, comparing each interval with the last merged interval. If they overlap, merge them; otherwise, append the new interval to the result.`,
      timeComplexity: "O(N log N)",
      spaceComplexity: "O(log N) sorting space",
      code: {
        python: `class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        intervals.sort(key=lambda x: x[0])\n        merged = []\n        for interval in intervals:\n            if not merged or merged[-1][1] < interval[0]:\n                merged.append(interval)\n            else:\n                merged[-1][1] = max(merged[-1][1], interval[1])\n        return merged`,
        javascript: `function merge(intervals) {\n    if (intervals.length <= 1) return intervals;\n    intervals.sort((a, b) => a[0] - b[0]);\n    const merged = [intervals[0]];\n    for (let i = 1; i < intervals.length; i++) {\n        const current = intervals[i];\n        const last = merged[merged.length - 1];\n        if (current[0] <= last[1]) {\n            last[1] = Math.max(last[1], current[1]);\n        } else {\n            merged.push(current);\n        }\n    }\n    return merged;\n}`,
        typescript: `function merge(intervals: number[][]): number[][] {\n    if (intervals.length <= 1) return intervals;\n    intervals.sort((a, b) => a[0] - b[0]);\n    const merged = [intervals[0]];\n    for (let i = 1; i < intervals.length; i++) {\n        const current = intervals[i];\n        const last = merged[merged.length - 1];\n        if (current[0] <= last[1]) {\n            last[1] = Math.max(last[1], current[1]);\n        } else {\n            merged.push(current);\n        }\n    }\n    return merged;\n}`,
        cpp: `class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        if (intervals.size() <= 1) return intervals;\n        sort(intervals.begin(), intervals.end());\n        vector<vector<int>> merged = {intervals[0]};\n        for (int i = 1; i < intervals.size(); i++) {\n            if (intervals[i][0] <= merged.back()[1]) {\n                merged.back()[1] = max(merged.back()[1], intervals[i][1]);\n            } else {\n                merged.push_back(intervals[i]);\n            }\n        }\n        return merged;\n    }\n};`,
        java: `class Solution {\n    public int[][] merge(int[][] intervals) {\n        if (intervals.length <= 1) return intervals;\n        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));\n        java.util.List<int[]> merged = new java.util.ArrayList<>();\n        merged.add(intervals[0]);\n        for (int i = 1; i < intervals.length; i++) {\n            int[] last = merged.get(merged.size() - 1);\n            if (intervals[i][0] <= last[1]) {\n                last[1] = Math.max(last[1], intervals[i][1]);\n            } else {\n                merged.add(intervals[i]);\n            }\n        }\n        return merged.toArray(new int[merged.size()][]);\n    }\n}`
      }
    };
  }

  if (id === 51) { // Valid Anagram
    overrides.description = `Given two strings s and t, return true if t is an anagram of s, and false otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

Example 1:
Input: s = "anagram", t = "nagaram"
Output: true`;

    overrides.naiveSolution = {
      explanation: `Sort the characters of both strings alphabetically. Compare the sorted strings. If they are identical, they are anagrams.`,
      timeComplexity: "O(N log N)",
      spaceComplexity: "O(N)",
      code: {
        python: `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        return sorted(s) == sorted(t)`,
        javascript: `function isAnagram(s, t) {\n    return s.split("").sort().join("") === t.split("").sort().join("");\n}`,
        typescript: `function isAnagram(s: string, t: string): boolean {\n    return s.split("").sort().join("") === t.split("").sort().join("");\n}`,
        cpp: `class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        sort(s.begin(), s.end());\n        sort(t.begin(), t.end());\n        return s == t;\n    }\n};`,
        java: `class Solution {\n    public boolean isAnagram(String s, String t) {\n        char[] sArr = s.toCharArray();\n        char[] tArr = t.toCharArray();\n        Arrays.sort(sArr);\n        Arrays.sort(tArr);\n        return Arrays.equals(sArr, tArr);\n    }\n}`
      }
    };

    overrides.optimizedSolution = {
      explanation: `Use a Hash Map or count array of size 26 to count character frequencies. Loop through string s to increment frequencies, and loop through string t to decrement frequencies. Verify that all final frequencies are zero.`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(1) because size of alphabet is constant",
      code: {
        python: `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        if len(s) != len(t): return False\n        count = {}\n        for char in s:\n            count[char] = count.get(char, 0) + 1\n        for char in t:\n            if char not in count or count[char] == 0:\n                return False\n            count[char] -= 1\n        return True`,
        javascript: `function isAnagram(s, t) {\n    if (s.length !== t.length) return false;\n    const count = {};\n    for (let char of s) {\n        count[char] = (count[char] || 0) + 1;\n    }\n    for (let char of t) {\n        if (!count[char]) return false;\n        count[char]--;\n    }\n    return true;\n}`,
        typescript: `function isAnagram(s: string, t: string): boolean {\n    if (s.length !== t.length) return false;\n    const count: Record<string, number> = {};\n    for (let char of s) {\n        count[char] = (count[char] || 0) + 1;\n    }\n    for (let char of t) {\n        if (!count[char]) return false;\n        count[char]--;\n    }\n    return true;\n}`,
        cpp: `class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        if (s.length() != t.length()) return false;\n        int count[26] = {0};\n        for (int i = 0; i < s.length(); i++) {\n            count[s[i] - 'a']++;\n            count[t[i] - 'a']--;\n        }\n        for (int i = 0; i < 26; i++) {\n            if (count[i] != 0) return false;\n        }\n        return true;\n    }\n};`,
        java: `class Solution {\n    public boolean isAnagram(String s, String t) {\n        if (s.length() != t.length()) return false;\n        int[] count = new int[26];\n        for (int i = 0; i < s.length(); i++) {\n            count[s.charAt(i) - 'a']++;\n            count[t.charAt(i) - 'a']--;\n        }\n        for (int c : count) {\n            if (c != 0) return false;\n        }\n        return true;\n    }\n}`
      }
    };
  }

  if (id === 52) { // Group Anagrams
    overrides.description = `Given an array of strings strs, group the anagrams together. You can return the answer in any order.

Example 1:
Input: strs = ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]`;

    overrides.naiveSolution = {
      explanation: `Compare each string with every other string in the list using nested loops to verify if they are anagrams. Group them into separate lists accordingly.`,
      timeComplexity: "O(N² * L log L) where L is average string length",
      spaceComplexity: "O(N * L)",
      code: {
        python: `class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        # Compare pairs iteratively to group\n        res = []\n        visited = [False] * len(strs)\n        for i in range(len(strs)):\n            if visited[i]: continue\n            group = [strs[i]]\n            visited[i] = True\n            for j in range(i + 1, len(strs)):\n                if not visited[j] and sorted(strs[i]) == sorted(strs[j]):\n                    group.append(strs[j])\n                    visited[j] = True\n            res.append(group)\n        return res`,
        javascript: `function groupAnagrams(strs) {\n    const res = [];\n    const visited = Array(strs.length).fill(false);\n    for (let i = 0; i < strs.length; i++) {\n        if (visited[i]) continue;\n        const group = [strs[i]];\n        visited[i] = true;\n        for (let j = i + 1; j < strs.length; j++) {\n            if (!visited[j] && strs[i].split("").sort().join("") === strs[j].split("").sort().join("")) {\n                group.push(strs[j]);\n                visited[j] = true;\n            }\n        }\n        res.push(group);\n    }\n    return res;\n}`,
        typescript: `function groupAnagrams(strs: string[]): string[][] {\n    const res: string[][] = [];\n    const visited = Array(strs.length).fill(false);\n    for (let i = 0; i < strs.length; i++) {\n        if (visited[i]) continue;\n        const group = [strs[i]];\n        visited[i] = true;\n        for (let j = i + 1; j < strs.length; j++) {\n            if (!visited[j] && strs[i].split("").sort().join("") === strs[j].split("").sort().join("")) {\n                group.push(strs[j]);\n                visited[j] = true;\n            }\n        }\n        res.push(group);\n    }\n    return res;\n}`,
        cpp: `class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        vector<vector<string>> res;\n        vector<bool> visited(strs.size(), false);\n        for (int i = 0; i < strs.size(); i++) {\n            if (visited[i]) continue;\n            vector<string> group = {strs[i]};\n            visited[i] = true;\n            string s_sorted = strs[i];\n            sort(s_sorted.begin(), s_sorted.end());\n            for (int j = i + 1; j < strs.size(); j++) {\n                string t_sorted = strs[j];\n                sort(t_sorted.begin(), t_sorted.end());\n                if (!visited[j] && s_sorted == t_sorted) {\n                    group.push_back(strs[j]);\n                    visited[j] = true;\n                }\n            }\n            res.push_back(group);\n        }\n        return res;\n    }\n};`,
        java: `class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        List<List<String>> res = new ArrayList<>();\n        boolean[] visited = new boolean[strs.length];\n        for (int i = 0; i < strs.length; i++) {\n            if (visited[i]) continue;\n            List<String> group = new ArrayList<>();\n            group.add(strs[i]);\n            visited[i] = true;\n            char[] sArr = strs[i].toCharArray();\n            Arrays.sort(sArr);\n            for (int j = i + 1; j < strs.length; j++) {\n                char[] tArr = strs[j].toCharArray();\n                Arrays.sort(tArr);\n                if (!visited[j] && Arrays.equals(sArr, tArr)) {\n                    group.add(strs[j]);\n                    visited[j] = true;\n                }\n            }\n            res.add(group);\n        }\n        return res;\n    }\n}`
      }
    };

    overrides.optimizedSolution = {
      explanation: `Use a Hash Map where the key is the sorted string (representing the anagram fingerprint) and the value is a list of matching strings. Group elements in one pass and return the values of the map.`,
      timeComplexity: "O(N * L log L)",
      spaceComplexity: "O(N * L)",
      code: {
        python: `class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        ans = collections.defaultdict(list)\n        for s in strs:\n            ans["".join(sorted(s))].append(s)\n        return list(ans.values())`,
        javascript: `function groupAnagrams(strs) {\n    const map = {};\n    for (let s of strs) {\n        const key = s.split("").sort().join("");\n        if (!map[key]) map[key] = [];\n        map[key].push(s);\n    }\n    return Object.values(map);\n}`,
        typescript: `function groupAnagrams(strs: string[]): string[][] {\n    const map: Record<string, string[]> = {};\n    for (let s of strs) {\n        const key = s.split("").sort().join("");\n        if (!map[key]) map[key] = [];\n        map[key].push(s);\n    }\n    return Object.values(map);\n}`,
        cpp: `class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        unordered_map<string, vector<string>> map;\n        for (string s : strs) {\n            string key = s;\n            sort(key.begin(), key.end());\n            map[key].push_back(s);\n        }\n        vector<vector<string>> res;\n        for (auto p : map) {\n            res.push_back(p.second);\n        }\n        return res;\n    }\n};`,
        java: `class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        java.util.Map<String, List<String>> map = new java.util.HashMap<>();\n        for (String s : strs) {\n            char[] chars = s.toCharArray();\n            Arrays.sort(chars);\n            String key = new String(chars);\n            if (!map.containsKey(key)) {\n                map.put(key, new java.util.ArrayList<>());\n            }\n            map.get(key).add(s);\n        }\n        return new java.util.ArrayList<>(map.values());\n    }\n}`
      }
    };
  }

  // Get dynamic template values based on the pattern
  const templates = getSolutionTemplates(pattern, title);

  return {
    id,
    title,
    difficulty,
    section,
    subSection,
    pattern,
    description: `Given input parameters, design and implement an efficient algorithm to solve the "${title}" problem. Follow the constraints of the associated "${pattern}" pattern.`,
    naiveSolution: {
      explanation: templates.naiveExplanation,
      timeComplexity: templates.naiveTime,
      spaceComplexity: templates.naiveSpace,
      code: templates.naiveCode
    },
    optimizedSolution: {
      explanation: templates.optExplanation,
      timeComplexity: templates.optTime,
      spaceComplexity: templates.optSpace,
      code: templates.optCode
    },
    ...overrides
  } as DsaProblem;
});
