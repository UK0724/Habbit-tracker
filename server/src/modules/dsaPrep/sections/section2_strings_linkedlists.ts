import type { DsaProblem } from '../dsaProblemsData.js';

export const section2StringsLinkedLists: DsaProblem[] = [
  {
    id: 51,
    title: "Valid Anagram",
    difficulty: "Easy",
    section: "Strings",
    subSection: "String Manipulation & Hashing",
    pattern: "HashMap",
    description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.\n\nExample 1:\nInput: s = 'anagram', t = 'nagaram'\nOutput: true\n\nExample 2:\nInput: s = 'rat', t = 'car'\nOutput: false",
    naiveSolution: {
      explanation: "Sort both strings and compare them. If the sorted versions are identical, they are anagrams.",
      timeComplexity: "O(N log N)",
      spaceComplexity: "O(N) depending on the sorting algorithm and string mutability in the language.",
      code: {
        python: "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        return sorted(s) == sorted(t)",
        javascript: "var isAnagram = function(s, t) {\n    return s.split('').sort().join('') === t.split('').sort().join('');\n};",
        typescript: "function isAnagram(s: string, t: string): boolean {\n    return s.split('').sort().join('') === t.split('').sort().join('');\n}",
        cpp: "class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        sort(s.begin(), s.end());\n        sort(t.begin(), t.end());\n        return s == t;\n    }\n};",
        java: "class Solution {\n    public boolean isAnagram(String s, String t) {\n        char[] sChars = s.toCharArray();\n        char[] tChars = t.toCharArray();\n        Arrays.sort(sChars);\n        Arrays.sort(tChars);\n        return Arrays.equals(sChars, tChars);\n    }\n}"
      }
    },
    optimizedSolution: {
      explanation: "Use a frequency array (or HashMap) of size 26 for lowercase English letters to count the occurrences of each character. Increment the count for characters in string 's' and decrement for characters in string 't'. If all counts are zero at the end, they are anagrams.",
      timeComplexity: "O(N)",
      spaceComplexity: "O(1) because the size of the frequency map is bounded by the alphabet size (26), which is constant.",
      code: {
        python: "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        if len(s) != len(t): return False\n        count = [0] * 26\n        for i in range(len(s)):\n            count[ord(s[i]) - 97] += 1\n            count[ord(t[i]) - 97] -= 1\n        return all(c == 0 for c in count)",
        javascript: "var isAnagram = function(s, t) {\n    if (s.length !== t.length) return false;\n    const count = new Array(26).fill(0);\n    for (let i = 0; i < s.length; i++) {\n        count[s.charCodeAt(i) - 97]++;\n        count[t.charCodeAt(i) - 97]--;\n    }\n    return count.every(c => c === 0);\n};",
        typescript: "function isAnagram(s: string, t: string): boolean {\n    if (s.length !== t.length) return false;\n    const count = new Array(26).fill(0);\n    for (let i = 0; i < s.length; i++) {\n        count[s.charCodeAt(i) - 97]++;\n        count[t.charCodeAt(i) - 97]--;\n    }\n    return count.every(c => c === 0);\n}",
        cpp: "class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        if (s.length() != t.length()) return false;\n        vector<int> count(26, 0);\n        for (int i = 0; i < s.length(); i++) {\n            count[s[i] - 'a']++;\n            count[t[i] - 'a']--;\n        }\n        for (int c : count) {\n            if (c != 0) return false;\n        }\n        return true;\n    }\n};",
        java: "class Solution {\n    public boolean isAnagram(String s, String t) {\n        if (s.length() != t.length()) return false;\n        int[] count = new int[26];\n        for (int i = 0; i < s.length(); i++) {\n            count[s.charAt(i) - 'a']++;\n            count[t.charAt(i) - 'a']--;\n        }\n        for (int c : count) {\n            if (c != 0) return false;\n        }\n        return true;\n    }\n}"
      }
    }
  },
  {
    id: 52,
    title: "Group Anagrams",
    difficulty: "Medium",
    section: "Strings",
    subSection: "String Manipulation & Hashing",
    pattern: "HashMap",
    description: "Given an array of strings strs, group the anagrams together. You can return the answer in any order.\n\nExample 1:\nInput: strs = ['eat','tea','tan','ate','nat','bat']\nOutput: [['bat'],['nat','tan'],['ate','eat','tea']]\n\nExample 2:\nInput: strs = ['']\nOutput: [['']]",
    naiveSolution: {
      explanation: "For each string, sort it and use the sorted string as a key in a hash map to group the original strings. This groups anagrams since all anagrams result in the same sorted string.",
      timeComplexity: "O(N * K log K) where N is the number of strings and K is the maximum length of a string.",
      spaceComplexity: "O(N * K) to store the hash map and grouped strings.",
      code: {
        python: "from collections import defaultdict\n\nclass Solution:\n    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:\n        anagrams = defaultdict(list)\n        for s in strs:\n            sorted_s = ''.join(sorted(s))\n            anagrams[sorted_s].append(s)\n        return list(anagrams.values())",
        javascript: "var groupAnagrams = function(strs) {\n    const map = new Map();\n    for (const str of strs) {\n        const sorted = str.split('').sort().join('');\n        if (!map.has(sorted)) map.set(sorted, []);\n        map.get(sorted).push(str);\n    }\n    return Array.from(map.values());\n};",
        typescript: "function groupAnagrams(strs: string[]): string[][] {\n    const map = new Map<string, string[]>();\n    for (const str of strs) {\n        const sorted = str.split('').sort().join('');\n        if (!map.has(sorted)) map.set(sorted, []);\n        map.get(sorted)!.push(str);\n    }\n    return Array.from(map.values());\n}",
        cpp: "class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        unordered_map<string, vector<string>> map;\n        for (string s : strs) {\n            string sorted_s = s;\n            sort(sorted_s.begin(), sorted_s.end());\n            map[sorted_s].push_back(s);\n        }\n        vector<vector<string>> result;\n        for (auto& pair : map) {\n            result.push_back(pair.second);\n        }\n        return result;\n    }\n};",
        java: "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        Map<String, List<String>> map = new HashMap<>();\n        for (String s : strs) {\n            char[] chars = s.toCharArray();\n            Arrays.sort(chars);\n            String sorted = new String(chars);\n            map.computeIfAbsent(sorted, k -> new ArrayList<>()).add(s);\n        }\n        return new ArrayList<>(map.values());\n    }\n}"
      }
    },
    optimizedSolution: {
      explanation: "Instead of sorting, create a frequency array of size 26 for each string, convert this array into a tuple or string format, and use that as the hash map key. This avoids the O(K log K) sorting time per string.",
      timeComplexity: "O(N * K) where N is the number of strings and K is the max length of a string.",
      spaceComplexity: "O(N * K) to store the mapping and results.",
      code: {
        python: "from collections import defaultdict\n\nclass Solution:\n    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:\n        anagrams = defaultdict(list)\n        for s in strs:\n            count = [0] * 26\n            for char in s:\n                count[ord(char) - ord('a')] += 1\n            anagrams[tuple(count)].append(s)\n        return list(anagrams.values())",
        javascript: "var groupAnagrams = function(strs) {\n    const map = new Map();\n    for (const str of strs) {\n        const count = new Array(26).fill(0);\n        for (let i = 0; i < str.length; i++) {\n            count[str.charCodeAt(i) - 97]++;\n        }\n        const key = count.join(',');\n        if (!map.has(key)) map.set(key, []);\n        map.get(key).push(str);\n    }\n    return Array.from(map.values());\n};",
        typescript: "function groupAnagrams(strs: string[]): string[][] {\n    const map = new Map<string, string[]>();\n    for (const str of strs) {\n        const count = new Array(26).fill(0);\n        for (let i = 0; i < str.length; i++) {\n            count[str.charCodeAt(i) - 97]++;\n        }\n        const key = count.join(',');\n        if (!map.has(key)) map.set(key, []);\n        map.get(key)!.push(str);\n    }\n    return Array.from(map.values());\n}",
        cpp: "class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        unordered_map<string, vector<string>> map;\n        for (const string& s : strs) {\n            string key(26, 0);\n            for (char c : s) {\n                key[c - 'a']++;\n            }\n            map[key].push_back(s);\n        }\n        vector<vector<string>> result;\n        for (auto& pair : map) {\n            result.push_back(pair.second);\n        }\n        return result;\n    }\n};",
        java: "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        Map<String, List<String>> map = new HashMap<>();\n        for (String s : strs) {\n            char[] count = new char[26];\n            for (char c : s.toCharArray()) {\n                count[c - 'a']++;\n            }\n            String key = new String(count);\n            map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);\n        }\n        return new ArrayList<>(map.values());\n    }\n}"
      }
    }
  },
  {
    id: 91,
    title: "Linked List Cycle Detection",
    difficulty: "Easy",
    section: "Linked Lists",
    subSection: "Fast & Slow Pointers",
    pattern: "Floyd Cycle Detection",
    description: "Given head, the head of a linked list, determine if the linked list has a cycle in it.\n\nThere is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the next pointer.\n\nExample 1:\nInput: head = [3,2,0,-4], pos = 1 (cycle exists)\nOutput: true\n\nExample 2:\nInput: head = [1], pos = -1 (no cycle)\nOutput: false",
    naiveSolution: {
      explanation: "Iterate through the linked list and keep track of visited nodes using a Hash Set. If you encounter a node that is already in the set, a cycle exists. If you reach the end of the list (null), there is no cycle.",
      timeComplexity: "O(N) where N is the number of nodes in the linked list.",
      spaceComplexity: "O(N) to store visited nodes in the Hash Set.",
      code: {
        python: "class Solution:\n    def hasCycle(self, head: Optional[ListNode]) -> bool:\n        visited = set()\n        current = head\n        while current:\n            if current in visited:\n                return True\n            visited.add(current)\n            current = current.next\n        return False",
        javascript: "var hasCycle = function(head) {\n    let visited = new Set();\n    let current = head;\n    while (current !== null) {\n        if (visited.has(current)) return true;\n        visited.add(current);\n        current = current.next;\n    }\n    return false;\n};",
        typescript: "function hasCycle(head: ListNode | null): boolean {\n    const visited = new Set<ListNode>();\n    let current = head;\n    while (current !== null) {\n        if (visited.has(current)) return true;\n        visited.add(current);\n        current = current.next;\n    }\n    return false;\n}",
        cpp: "class Solution {\npublic:\n    bool hasCycle(ListNode *head) {\n        unordered_set<ListNode*> visited;\n        ListNode* current = head;\n        while (current != nullptr) {\n            if (visited.count(current)) return true;\n            visited.insert(current);\n            current = current->next;\n        }\n        return false;\n    }\n};",
        java: "public class Solution {\n    public boolean hasCycle(ListNode head) {\n        Set<ListNode> visited = new HashSet<>();\n        ListNode current = head;\n        while (current != null) {\n            if (visited.contains(current)) return true;\n            visited.add(current);\n            current = current.next;\n        }\n        return false;\n    }\n}"
      }
    },
    optimizedSolution: {
      explanation: "Use Floyd's Cycle Detection Algorithm (Tortoise and Hare). Maintain two pointers: a slow pointer that moves 1 step at a time, and a fast pointer that moves 2 steps at a time. If there is a cycle, the fast pointer will eventually catch up to the slow pointer. If the fast pointer reaches the end of the list, there is no cycle.",
      timeComplexity: "O(N) where N is the number of nodes in the list.",
      spaceComplexity: "O(1) as we only use two pointers.",
      code: {
        python: "class Solution:\n    def hasCycle(self, head: Optional[ListNode]) -> bool:\n        slow, fast = head, head\n        while fast and fast.next:\n            slow = slow.next\n            fast = fast.next.next\n            if slow == fast:\n                return True\n        return False",
        javascript: "var hasCycle = function(head) {\n    let slow = head;\n    let fast = head;\n    while (fast !== null && fast.next !== null) {\n        slow = slow.next;\n        fast = fast.next.next;\n        if (slow === fast) return true;\n    }\n    return false;\n};",
        typescript: "function hasCycle(head: ListNode | null): boolean {\n    let slow = head;\n    let fast = head;\n    while (fast !== null && fast.next !== null) {\n        slow = slow.next;\n        fast = fast.next.next;\n        if (slow === fast) return true;\n    }\n    return false;\n}",
        cpp: "class Solution {\npublic:\n    bool hasCycle(ListNode *head) {\n        ListNode* slow = head;\n        ListNode* fast = head;\n        while (fast != nullptr && fast->next != nullptr) {\n            slow = slow->next;\n            fast = fast->next->next;\n            if (slow == fast) return true;\n        }\n        return false;\n    }\n};",
        java: "public class Solution {\n    public boolean hasCycle(ListNode head) {\n        ListNode slow = head;\n        ListNode fast = head;\n        while (fast != null && fast.next != null) {\n            slow = slow.next;\n            fast = fast.next.next;\n            if (slow == fast) return true;\n        }\n        return false;\n    }\n}"
      }
    }
  },
  {
    id: 93,
    title: "Find the Middle of Linked List",
    difficulty: "Easy",
    section: "Linked Lists",
    subSection: "Fast & Slow Pointers",
    pattern: "Two Pointers",
    description: "Given the head of a singly linked list, return the middle node of the linked list.\n\nIf there are two middle nodes, return the second middle node.\n\nExample 1:\nInput: head = [1,2,3,4,5]\nOutput: [3,4,5] (Node with value 3)\n\nExample 2:\nInput: head = [1,2,3,4,5,6]\nOutput: [4,5,6] (Node with value 4)",
    naiveSolution: {
      explanation: "Iterate through the linked list to count the total number of nodes (N). Then, iterate again from the head and stop at N / 2 to return the middle node.",
      timeComplexity: "O(N) since we traverse the list entirely once, and then half of it again.",
      spaceComplexity: "O(1) because we only need variables to count and track the current node.",
      code: {
        python: "class Solution:\n    def middleNode(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        count = 0\n        curr = head\n        while curr:\n            count += 1\n            curr = curr.next\n        \n        curr = head\n        for _ in range(count // 2):\n            curr = curr.next\n        return curr",
        javascript: "var middleNode = function(head) {\n    let count = 0;\n    let curr = head;\n    while (curr) {\n        count++;\n        curr = curr.next;\n    }\n    \n    curr = head;\n    for (let i = 0; i < Math.floor(count / 2); i++) {\n        curr = curr.next;\n    }\n    return curr;\n};",
        typescript: "function middleNode(head: ListNode | null): ListNode | null {\n    let count = 0;\n    let curr = head;\n    while (curr) {\n        count++;\n        curr = curr.next;\n    }\n    \n    curr = head;\n    for (let i = 0; i < Math.floor(count / 2); i++) {\n        if (curr) curr = curr.next;\n    }\n    return curr;\n}",
        cpp: "class Solution {\npublic:\n    ListNode* middleNode(ListNode* head) {\n        int count = 0;\n        ListNode* curr = head;\n        while (curr) {\n            count++;\n            curr = curr->next;\n        }\n        curr = head;\n        for (int i = 0; i < count / 2; i++) {\n            curr = curr->next;\n        }\n        return curr;\n    }\n};",
        java: "class Solution {\n    public ListNode middleNode(ListNode head) {\n        int count = 0;\n        ListNode curr = head;\n        while (curr != null) {\n            count++;\n            curr = curr.next;\n        }\n        curr = head;\n        for (int i = 0; i < count / 2; i++) {\n            curr = curr.next;\n        }\n        return curr;\n    }\n}"
      }
    },
    optimizedSolution: {
      explanation: "Use the fast and slow pointer technique. Move the slow pointer by 1 step and the fast pointer by 2 steps. When the fast pointer reaches the end, the slow pointer will be exactly at the middle.",
      timeComplexity: "O(N) since we traverse the list only once.",
      spaceComplexity: "O(1) because we only use two pointers.",
      code: {
        python: "class Solution:\n    def middleNode(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        slow, fast = head, head\n        while fast and fast.next:\n            slow = slow.next\n            fast = fast.next.next\n        return slow",
        javascript: "var middleNode = function(head) {\n    let slow = head;\n    let fast = head;\n    while (fast !== null && fast.next !== null) {\n        slow = slow.next;\n        fast = fast.next.next;\n    }\n    return slow;\n};",
        typescript: "function middleNode(head: ListNode | null): ListNode | null {\n    let slow = head;\n    let fast = head;\n    while (fast !== null && fast.next !== null) {\n        if (slow) slow = slow.next;\n        fast = fast.next.next;\n    }\n    return slow;\n}",
        cpp: "class Solution {\npublic:\n    ListNode* middleNode(ListNode* head) {\n        ListNode* slow = head;\n        ListNode* fast = head;\n        while (fast != nullptr && fast->next != nullptr) {\n            slow = slow->next;\n            fast = fast->next->next;\n        }\n        return slow;\n    }\n};",
        java: "class Solution {\n    public ListNode middleNode(ListNode head) {\n        ListNode slow = head;\n        ListNode fast = head;\n        while (fast != null && fast.next != null) {\n            slow = slow.next;\n            fast = fast.next.next;\n        }\n        return slow;\n    }\n}"
      }
    }
  }
];
