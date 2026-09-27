import type { DsaProblem } from '../dsaProblemsData.js';

export const section5GraphsDP: DsaProblem[] = [
  {
    id: 254,
    title: "Number of Islands",
    difficulty: "Medium",
    section: "Graphs",
    subSection: "BFS (Shortest Path / Level-order)",
    pattern: "BFS / DFS",
    description: `Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.

Example 1:
Input: grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
Output: 1

Constraints:
- m == grid.length
- n == grid[i].length
- 1 <= m, n <= 300
- grid[i][j] is '0' or '1'.`,
    naiveSolution: {
      explanation: "Iterate through the grid. When a '1' is found, start a BFS/DFS to visit all connected '1's, marking them as visited (or changing them to '0'). Increment the island count. A naive approach might not modify the original grid in place but use a secondary boolean visited matrix.",
      timeComplexity: "O(M * N) where M is number of rows and N is number of columns.",
      spaceComplexity: "O(M * N) for the visited matrix and recursion stack in worst case.",
      code: {
        python: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid:
            return 0
        
        m, n = len(grid), len(grid[0])
        visited = [[False] * n for _ in range(m)]
        islands = 0
        
        def dfs(r, c):
            if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] == '0' or visited[r][c]:
                return
            visited[r][c] = True
            dfs(r+1, c)
            dfs(r-1, c)
            dfs(r, c+1)
            dfs(r, c-1)
            
        for i in range(m):
            for j in range(n):
                if grid[i][j] == '1' and not visited[i][j]:
                    islands += 1
                    dfs(i, j)
                    
        return islands`,
        javascript: `var numIslands = function(grid) {
    if (!grid || grid.length === 0) return 0;
    
    let m = grid.length, n = grid[0].length;
    let visited = Array.from({length: m}, () => Array(n).fill(false));
    let islands = 0;
    
    const dfs = (r, c) => {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] === '0' || visited[r][c]) {
            return;
        }
        visited[r][c] = true;
        dfs(r+1, c);
        dfs(r-1, c);
        dfs(r, c+1);
        dfs(r, c-1);
    };
    
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === '1' && !visited[i][j]) {
                islands++;
                dfs(i, j);
            }
        }
    }
    
    return islands;
};`,
        typescript: `function numIslands(grid: string[][]): number {
    if (!grid || grid.length === 0) return 0;
    
    const m = grid.length, n = grid[0].length;
    const visited: boolean[][] = Array.from({length: m}, () => Array(n).fill(false));
    let islands = 0;
    
    const dfs = (r: number, c: number): void => {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] === '0' || visited[r][c]) {
            return;
        }
        visited[r][c] = true;
        dfs(r+1, c);
        dfs(r-1, c);
        dfs(r, c+1);
        dfs(r, c-1);
    };
    
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === '1' && !visited[i][j]) {
                islands++;
                dfs(i, j);
            }
        }
    }
    
    return islands;
}`,
        cpp: `class Solution {
public:
    void dfs(vector<vector<char>>& grid, vector<vector<bool>>& visited, int r, int c) {
        if (r < 0 || r >= grid.size() || c < 0 || c >= grid[0].size() || grid[r][c] == '0' || visited[r][c]) {
            return;
        }
        visited[r][c] = true;
        dfs(grid, visited, r+1, c);
        dfs(grid, visited, r-1, c);
        dfs(grid, visited, r, c+1);
        dfs(grid, visited, r, c-1);
    }
    
    int numIslands(vector<vector<char>>& grid) {
        if (grid.empty()) return 0;
        int m = grid.size(), n = grid[0].size();
        vector<vector<bool>> visited(m, vector<bool>(n, false));
        int islands = 0;
        
        for (int i = 0; i < m; ++i) {
            for (int j = 0; j < n; ++j) {
                if (grid[i][j] == '1' && !visited[i][j]) {
                    islands++;
                    dfs(grid, visited, i, j);
                }
            }
        }
        return islands;
    }
};`,
        java: `class Solution {
    private void dfs(char[][] grid, boolean[][] visited, int r, int c) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] == '0' || visited[r][c]) {
            return;
        }
        visited[r][c] = true;
        dfs(grid, visited, r+1, c);
        dfs(grid, visited, r-1, c);
        dfs(grid, visited, r, c+1);
        dfs(grid, visited, r, c-1);
    }
    
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int m = grid.length, n = grid[0].length;
        boolean[][] visited = new boolean[m][n];
        int islands = 0;
        
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == '1' && !visited[i][j]) {
                    islands++;
                    dfs(grid, visited, i, j);
                }
            }
        }
        return islands;
    }
}`
      }
    },
    optimizedSolution: {
      explanation: "We can optimize the space complexity by mutating the original grid instead of using a visited array. When a '1' is encountered, we modify it to '0' during our DFS to indicate that it has been visited.",
      timeComplexity: "O(M * N) where M is the number of rows and N is the number of columns.",
      spaceComplexity: "O(min(M, N)) in case of BFS or O(M * N) worst case for DFS stack if the whole grid is filled with lands.",
      code: {
        python: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid:
            return 0
        
        m, n = len(grid), len(grid[0])
        islands = 0
        
        def dfs(r, c):
            if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] == '0':
                return
            grid[r][c] = '0' # Mark as visited
            dfs(r+1, c)
            dfs(r-1, c)
            dfs(r, c+1)
            dfs(r, c-1)
            
        for i in range(m):
            for j in range(n):
                if grid[i][j] == '1':
                    islands += 1
                    dfs(i, j)
                    
        return islands`,
        javascript: `var numIslands = function(grid) {
    if (!grid || grid.length === 0) return 0;
    
    let m = grid.length, n = grid[0].length;
    let islands = 0;
    
    const dfs = (r, c) => {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] === '0') {
            return;
        }
        grid[r][c] = '0';
        dfs(r+1, c);
        dfs(r-1, c);
        dfs(r, c+1);
        dfs(r, c-1);
    };
    
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === '1') {
                islands++;
                dfs(i, j);
            }
        }
    }
    
    return islands;
};`,
        typescript: `function numIslands(grid: string[][]): number {
    if (!grid || grid.length === 0) return 0;
    
    const m = grid.length, n = grid[0].length;
    let islands = 0;
    
    const dfs = (r: number, c: number): void => {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] === '0') {
            return;
        }
        grid[r][c] = '0';
        dfs(r+1, c);
        dfs(r-1, c);
        dfs(r, c+1);
        dfs(r, c-1);
    };
    
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === '1') {
                islands++;
                dfs(i, j);
            }
        }
    }
    
    return islands;
}`,
        cpp: `class Solution {
public:
    void dfs(vector<vector<char>>& grid, int r, int c) {
        if (r < 0 || r >= grid.size() || c < 0 || c >= grid[0].size() || grid[r][c] == '0') {
            return;
        }
        grid[r][c] = '0';
        dfs(grid, r+1, c);
        dfs(grid, r-1, c);
        dfs(grid, r, c+1);
        dfs(grid, r, c-1);
    }
    
    int numIslands(vector<vector<char>>& grid) {
        if (grid.empty()) return 0;
        int m = grid.size(), n = grid[0].size();
        int islands = 0;
        
        for (int i = 0; i < m; ++i) {
            for (int j = 0; j < n; ++j) {
                if (grid[i][j] == '1') {
                    islands++;
                    dfs(grid, i, j);
                }
            }
        }
        return islands;
    }
};`,
        java: `class Solution {
    private void dfs(char[][] grid, int r, int c) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] == '0') {
            return;
        }
        grid[r][c] = '0';
        dfs(grid, r+1, c);
        dfs(grid, r-1, c);
        dfs(grid, r, c+1);
        dfs(grid, r, c-1);
    }
    
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int m = grid.length, n = grid[0].length;
        int islands = 0;
        
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == '1') {
                    islands++;
                    dfs(grid, i, j);
                }
            }
        }
        return islands;
    }
}`
      }
    }
  },
  {
    id: 255,
    title: "Max Area of Island",
    difficulty: "Medium",
    section: "Graphs",
    subSection: "BFS / DFS",
    pattern: "BFS / DFS",
    description: `You are given an m x n binary matrix grid. An island is a group of 1's (representing land) connected 4-directionally (horizontal or vertical). You may assume all four edges of the grid are surrounded by water.

The area of an island is the number of cells with a value 1 in the island.

Return the maximum area of an island in grid. If there is no island, return 0.

Example 1:
Input: grid = [[0,0,1,0,0],[0,0,0,0,0],[0,1,1,0,1],[0,1,0,0,1],[0,1,0,0,0]]
Output: 3

Constraints:
- m == grid.length
- n == grid[i].length
- 1 <= m, n <= 50
- grid[i][j] is either 0 or 1.`,
    naiveSolution: {
      explanation: "Similar to Number of Islands, we can use DFS to explore each island. A visited array keeps track of seen cells. We compute the area by returning 1 + the recursive sum of neighbors and keep track of the max area found.",
      timeComplexity: "O(M * N)",
      spaceComplexity: "O(M * N)",
      code: {
        python: `class Solution:
    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:
        if not grid: return 0
        m, n = len(grid), len(grid[0])
        visited = set()
        max_area = 0
        
        def dfs(r, c):
            if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] == 0 or (r, c) in visited:
                return 0
            visited.add((r, c))
            return 1 + dfs(r+1, c) + dfs(r-1, c) + dfs(r, c+1) + dfs(r, c-1)
            
        for i in range(m):
            for j in range(n):
                if grid[i][j] == 1 and (i, j) not in visited:
                    max_area = max(max_area, dfs(i, j))
                    
        return max_area`,
        javascript: `var maxAreaOfIsland = function(grid) {
    if (!grid || grid.length === 0) return 0;
    let m = grid.length, n = grid[0].length;
    let visited = Array.from({length: m}, () => Array(n).fill(false));
    let maxArea = 0;
    
    const dfs = (r, c) => {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] === 0 || visited[r][c]) {
            return 0;
        }
        visited[r][c] = true;
        return 1 + dfs(r+1, c) + dfs(r-1, c) + dfs(r, c+1) + dfs(r, c-1);
    };
    
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === 1 && !visited[i][j]) {
                maxArea = Math.max(maxArea, dfs(i, j));
            }
        }
    }
    
    return maxArea;
};`,
        typescript: `function maxAreaOfIsland(grid: number[][]): number {
    if (!grid || grid.length === 0) return 0;
    const m = grid.length, n = grid[0].length;
    const visited: boolean[][] = Array.from({length: m}, () => Array(n).fill(false));
    let maxArea = 0;
    
    const dfs = (r: number, c: number): number => {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] === 0 || visited[r][c]) {
            return 0;
        }
        visited[r][c] = true;
        return 1 + dfs(r+1, c) + dfs(r-1, c) + dfs(r, c+1) + dfs(r, c-1);
    };
    
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === 1 && !visited[i][j]) {
                maxArea = Math.max(maxArea, dfs(i, j));
            }
        }
    }
    
    return maxArea;
}`,
        cpp: `class Solution {
public:
    int dfs(vector<vector<int>>& grid, vector<vector<bool>>& visited, int r, int c) {
        if (r < 0 || r >= grid.size() || c < 0 || c >= grid[0].size() || grid[r][c] == 0 || visited[r][c]) {
            return 0;
        }
        visited[r][c] = true;
        return 1 + dfs(grid, visited, r+1, c) + dfs(grid, visited, r-1, c) + 
                   dfs(grid, visited, r, c+1) + dfs(grid, visited, r, c-1);
    }
    
    int maxAreaOfIsland(vector<vector<int>>& grid) {
        if (grid.empty()) return 0;
        int m = grid.size(), n = grid[0].size();
        vector<vector<bool>> visited(m, vector<bool>(n, false));
        int maxArea = 0;
        
        for (int i = 0; i < m; ++i) {
            for (int j = 0; j < n; ++j) {
                if (grid[i][j] == 1 && !visited[i][j]) {
                    maxArea = max(maxArea, dfs(grid, visited, i, j));
                }
            }
        }
        return maxArea;
    }
};`,
        java: `class Solution {
    private int dfs(int[][] grid, boolean[][] visited, int r, int c) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] == 0 || visited[r][c]) {
            return 0;
        }
        visited[r][c] = true;
        return 1 + dfs(grid, visited, r+1, c) + dfs(grid, visited, r-1, c) + 
                   dfs(grid, visited, r, c+1) + dfs(grid, visited, r, c-1);
    }
    
    public int maxAreaOfIsland(int[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int m = grid.length, n = grid[0].length;
        boolean[][] visited = new boolean[m][n];
        int maxArea = 0;
        
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 1 && !visited[i][j]) {
                    maxArea = Math.max(maxArea, dfs(grid, visited, i, j));
                }
            }
        }
        return maxArea;
    }
}`
      }
    },
    optimizedSolution: {
      explanation: "Avoid external visited storage by modifying the grid directly (sink the island by replacing 1s with 0s). Note that in a production environment, mutating input parameters might be frowned upon, but for algorithmic space optimization, this achieves O(1) auxiliary space beyond recursion stack.",
      timeComplexity: "O(M * N)",
      spaceComplexity: "O(M * N) in the worst case for the recursion stack (if the grid is a single long snake path).",
      code: {
        python: `class Solution:
    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:
        if not grid: return 0
        m, n = len(grid), len(grid[0])
        max_area = 0
        
        def dfs(r, c):
            if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] == 0:
                return 0
            grid[r][c] = 0
            return 1 + dfs(r+1, c) + dfs(r-1, c) + dfs(r, c+1) + dfs(r, c-1)
            
        for i in range(m):
            for j in range(n):
                if grid[i][j] == 1:
                    max_area = max(max_area, dfs(i, j))
                    
        return max_area`,
        javascript: `var maxAreaOfIsland = function(grid) {
    if (!grid || grid.length === 0) return 0;
    let m = grid.length, n = grid[0].length;
    let maxArea = 0;
    
    const dfs = (r, c) => {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] === 0) {
            return 0;
        }
        grid[r][c] = 0;
        return 1 + dfs(r+1, c) + dfs(r-1, c) + dfs(r, c+1) + dfs(r, c-1);
    };
    
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === 1) {
                maxArea = Math.max(maxArea, dfs(i, j));
            }
        }
    }
    
    return maxArea;
};`,
        typescript: `function maxAreaOfIsland(grid: number[][]): number {
    if (!grid || grid.length === 0) return 0;
    const m = grid.length, n = grid[0].length;
    let maxArea = 0;
    
    const dfs = (r: number, c: number): number => {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] === 0) {
            return 0;
        }
        grid[r][c] = 0;
        return 1 + dfs(r+1, c) + dfs(r-1, c) + dfs(r, c+1) + dfs(r, c-1);
    };
    
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === 1) {
                maxArea = Math.max(maxArea, dfs(i, j));
            }
        }
    }
    
    return maxArea;
}`,
        cpp: `class Solution {
public:
    int dfs(vector<vector<int>>& grid, int r, int c) {
        if (r < 0 || r >= grid.size() || c < 0 || c >= grid[0].size() || grid[r][c] == 0) {
            return 0;
        }
        grid[r][c] = 0;
        return 1 + dfs(grid, r+1, c) + dfs(grid, r-1, c) + 
                   dfs(grid, r, c+1) + dfs(grid, r, c-1);
    }
    
    int maxAreaOfIsland(vector<vector<int>>& grid) {
        if (grid.empty()) return 0;
        int m = grid.size(), n = grid[0].size();
        int maxArea = 0;
        
        for (int i = 0; i < m; ++i) {
            for (int j = 0; j < n; ++j) {
                if (grid[i][j] == 1) {
                    maxArea = max(maxArea, dfs(grid, i, j));
                }
            }
        }
        return maxArea;
    }
};`,
        java: `class Solution {
    private int dfs(int[][] grid, int r, int c) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] == 0) {
            return 0;
        }
        grid[r][c] = 0;
        return 1 + dfs(grid, r+1, c) + dfs(grid, r-1, c) + 
                   dfs(grid, r, c+1) + dfs(grid, r, c-1);
    }
    
    public int maxAreaOfIsland(int[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int m = grid.length, n = grid[0].length;
        int maxArea = 0;
        
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 1) {
                    maxArea = Math.max(maxArea, dfs(grid, i, j));
                }
            }
        }
        return maxArea;
    }
}`
      }
    }
  }
];
