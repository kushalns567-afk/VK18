// ==============================================================================
// CHALLENGE REPOSITORY & CODE TEMPLATES
// ==============================================================================

window.CHALLENGES = [
  {
    id: "recursion_factorial",
    title: "1. Recursive Factorial (Stack Overflow Trap)",
    category: "Recursion & Call Stack",
    difficulty: "Medium",
    topic: "recursion",
    description: `Write a function \`factorial(n)\` that computes the product of all positive integers up to \\(n\\).

**Catch for Learners:**
Many beginners forget the **Base Case** (stopping condition) or incorrectly decrement \\(n\\), causing infinite recursion and call stack explosion!`,
    defaultCode: `// Challenge: Compute factorial of n
// Example: factorial(4) should return 24 (4 * 3 * 2 * 1)

function factorial(n) {
  // TODO: Add your logic here
  // Beware of infinite recursion!
  
  return n * factorial(n - 1);
}

// Test runner
console.log("factorial(4) =", factorial(4));
`,
    expectedOutput: "24",
    testCases: [
      { input: 4, expected: 24 },
      { input: 1, expected: 1 },
      { input: 5, expected: 120 }
    ],
    commonConfusionPoints: [
      "Missing base case `if (n <= 1) return 1;`",
      "Calling `factorial(n)` instead of `factorial(n - 1)`",
      "Confusing call stack unwinding with return value propagation"
    ],
    defaultMetaphor: {
      type: "recursion_dolls",
      title: "Russian Nesting Dolls (Matryoshka)",
      explanation: "Every recursive call opens a smaller doll. Without a solid baby doll at the center (Base Case), you keep opening phantom dolls forever until the table collapses (Stack Overflow)!"
    }
  },
  {
    id: "two_sum_pointers",
    title: "2. Two-Pointer Target Sum",
    category: "Arrays & Memory Pointers",
    difficulty: "Easy-Medium",
    topic: "array two sum",
    description: `Given a sorted array of numbers \`numbers\` and a target integer \`target\`, find the two indices (0-indexed) such that they add up to \`target\`.

**Catch for Learners:**
Beginners often struggle with knowing *which* pointer to move when the current sum is too small or too large, leading to repetitive backspaces and index out-of-bounds.`,
    defaultCode: `// Challenge: Find two indices in a sorted array that sum to target
// Example: twoSum([2, 7, 11, 15], 9) -> [0, 1]

function twoSum(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    let currentSum = numbers[left] + numbers[right];

    if (currentSum === target) {
      return [left, right];
    }
    
    // TODO: Which pointer do you shift if currentSum < target?
    // And which if currentSum > target?
    
  }
  return [];
}

console.log("Result:", twoSum([2, 7, 11, 15], 9));
`,
    expectedOutput: "[0, 1]",
    testCases: [
      { input: "([2, 7, 11, 15], 9)", expected: "[0, 1]" },
      { input: "([1, 3, 5, 9], 8)", expected: "[1, 2]" }
    ],
    commonConfusionPoints: [
      "Incrementing right instead of decrementing right",
      "Using `left <= right` instead of `left < right` (adding same element twice)",
      "Infinite loop when no pointer shifts"
    ],
    defaultMetaphor: {
      type: "array_lockers",
      title: "School Hallway Lockers",
      explanation: "Imagine lockers numbered 0 to 3 in a neat row. Two students stand at Locker 0 and Locker 3. If their sum is too big, the right student steps left towards smaller numbers!"
    }
  },
  {
    id: "binary_search",
    title: "3. Binary Search (Boundary Confusion)",
    category: "Algorithms & Pointers",
    difficulty: "Medium",
    topic: "binary search",
    description: `Search for a target value in an ascending sorted array in \\(O(\\log N)\\) time. Return its index or -1 if not found.

**Catch for Learners:**
The notorious "Off-by-One" bug: should it be \`high = mid\` or \`high = mid - 1\`? And is the loop condition \`low <= high\` or \`low < high\`?`,
    defaultCode: `// Challenge: Implement Binary Search
// Example: binarySearch([3, 8, 14, 20, 27, 35, 42], 35) -> index 5

function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    let mid = Math.floor((low + high) / 2);

    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      // TODO: Adjust lower bound
      low = mid; // Is this right? Or should it be mid + 1?
    } else {
      // TODO: Adjust upper bound
      high = mid; // Is this right? Or mid - 1?
    }
  }

  return -1;
}

console.log("Index of 35:", binarySearch([3, 8, 14, 20, 27, 35, 42], 35));
`,
    expectedOutput: "5",
    testCases: [
      { input: "([3, 8, 14, 20, 27, 35, 42], 35)", expected: "5" },
      { input: "([3, 8, 14, 20, 27, 35, 42], 8)", expected: "1" },
      { input: "([3, 8, 14, 20, 27, 35, 42], 99)", expected: "-1" }
    ],
    commonConfusionPoints: [
      "Stuck in infinite loop because `low = mid` doesn't advance when `low + 1 === high`",
      "Off-by-one errors in array boundary checks"
    ],
    defaultMetaphor: {
      type: "binary_search",
      title: "The Phonebook Ripping Trick",
      explanation: "Ripping a 1000-page book in half. If your name starts with 'P' and page 500 is 'M', you discard pages 1 through 500 into the recycling bin!"
    }
  },
  {
    id: "math_matrix",
    title: "4. STEM/Math: 2D Matrix Dot Product",
    category: "Computational Mathematics",
    difficulty: "Medium-Hard",
    topic: "matrix multiplication math",
    description: `Multiply a \\(2 \\times 2\\) matrix by a \\(2 \\times 1\\) vector:
\\[
\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} ax + by \\\\ cx + dy \\end{pmatrix}
\\]`,
    defaultCode: `// Challenge: Compute 2x2 Matrix * 2x1 Vector product
function matrixTransform(matrix, vec) {
  // matrix is [[a, b], [c, d]]
  // vec is [x, y]
  
  // TODO: Calculate transformed [x', y']
  let x_prime = matrix[0][0] * vec[0] + matrix[0][1] * vec[1];
  let y_prime = 0; // Fill in the second coordinate!
  
  return [x_prime, y_prime];
}

console.log("Transformed:", matrixTransform([[2, 1], [0, 3]], [4, 5]));
`,
    expectedOutput: "[13, 15]",
    testCases: [
      { input: "([[2, 1], [0, 3]], [4, 5])", expected: "[13, 15]" }
    ],
    commonConfusionPoints: [
      "Mixing row indices with column indices",
      "Order of dot products (row 1 dot vector vs row 2 dot vector)"
    ],
    defaultMetaphor: {
      type: "general_flow",
      title: "The Conveyor Belt Sifter",
      explanation: "Each row of the matrix acts as a separate set of weights weighing your coordinate bag!"
    }
  }
];

