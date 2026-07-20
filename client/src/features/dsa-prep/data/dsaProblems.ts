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
  [1, "Two Sum (sorted array)", "Easy", "Arrays", "Two Pointers", "Two Pointers"],
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
    overrides.description = `Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number.

Return the indices of the two numbers, [index1, index2], added by one, as an integer array [index1, index2] of length 2.

The tests are generated such that there is exactly one solution. You may not use the same element twice.

Your solution must use only constant extra space.

Example 1:
Input: numbers = [2,7,11,15], target = 9
Output: [1,2]
Explanation: The sum of 2 and 7 is 9. Therefore, index1 = 1, index2 = 2. We return [1, 2].`;

    overrides.naiveSolution = {
      explanation: `Use nested loops to check every possible pair of elements. If numbers[i] + numbers[j] equals target, return [i + 1, j + 1].`,
      timeComplexity: "O(N²)",
      spaceComplexity: "O(1)",
      code: {
        python: `class Solution:\n    def twoSum(self, numbers: List[int], target: int) -> List[int]:\n        n = len(numbers)\n        for i in range(n):\n            for j in range(i + 1, n):\n                if numbers[i] + numbers[j] == target:\n                    return [i + 1, j + 1]\n        return []`,
        javascript: `function twoSum(numbers, target) {\n    const n = numbers.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            if (numbers[i] + numbers[j] === target) {\n                return [i + 1, j + 1];\n            }\n        }\n    }\n    return [];\n}`,
        typescript: `function twoSum(numbers: number[], target: number): number[] {\n    const n = numbers.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            if (numbers[i] + numbers[j] === target) {\n                return [i + 1, j + 1];\n            }\n        }\n    }\n    return [];\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& numbers, int target) {\n        int n = numbers.size();\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                if (numbers[i] + numbers[j] == target) {\n                    return {i + 1, j + 1};\n                }\n            }\n        }\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[] twoSum(int[] numbers, int target) {\n        int n = numbers.length;\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                if (numbers[i] + numbers[j] == target) {\n                    return new int[]{i + 1, j + 1};\n                }\n            }\n        }\n        return new int[]{};\n    }\n}`
      }
    };

    overrides.optimizedSolution = {
      explanation: `Initialize two pointers: left at the start (index 0) and right at the end (index numbers.length - 1). 
Calculate the sum at each step. 
Since the array is sorted, if the sum is greater than the target, decrement the right pointer. 
If the sum is less than the target, increment the left pointer. 
If they are equal, return the 1-based indices.`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      code: {
        python: `class Solution:\n    def twoSum(self, numbers: List[int], target: int) -> List[int]:\n        left, right = 0, len(numbers) - 1\n        while left < right:\n            curr = numbers[left] + numbers[right]\n            if curr == target:\n                return [left + 1, right + 1]\n            elif curr < target:\n                left += 1\n            else:\n                right -= 1\n        return []`,
        javascript: `function twoSum(numbers, target) {\n    let left = 0;\n    let right = numbers.length - 1;\n    while (left < right) {\n        const curr = numbers[left] + numbers[right];\n        if (curr === target) {\n            return [left + 1, right + 1];\n        } else if (curr < target) {\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return [];\n}`,
        typescript: `function twoSum(numbers: number[], target: number): number[] {\n    let left = 0;\n    let right = numbers.length - 1;\n    while (left < right) {\n        const curr = numbers[left] + numbers[right];\n        if (curr === target) {\n            return [left + 1, right + 1];\n        } else if (curr < target) {\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return [];\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& numbers, int target) {\n        int left = 0, right = numbers.size() - 1;\n        while (left < right) {\n            int curr = numbers[left] + numbers[right];\n            if (curr == target) {\n                return {left + 1, right + 1};\n            } else if (curr < target) {\n                left++;\n            } else {\n                right--;\n            }\n        }\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[] twoSum(int[] numbers, int target) {\n        int left = 0, right = numbers.length - 1;\n        while (left < right) {\n            int curr = numbers[left] + numbers[right];\n            if (curr == target) {\n                return new int[]{left + 1, right + 1};\n            } else if (curr < target) {\n                left++;\n            } else {\n                right--;\n            }\n        }\n        return new int[]{};\n    }\n}`
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
