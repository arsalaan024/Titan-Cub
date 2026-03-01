
import { CodingModule } from '../types';

export const CODING_CHALLENGES: CodingModule[] = [
  {
    id: "logic_flow",
    name: "Logic Flow Builder",
    description: "Strengthens logical thinking and flow control",
    problems: [
      {
        id: "logic_001",
        level: "Beginner",
        difficulty: 1,
        points: 10,
        time_limit_seconds: 60,
        prompt: "Which code snippet correctly swaps the values of two variables 'a' and 'b' using a temporary variable 'temp'?",
        options: [
          "temp = a; a = b; b = temp;",
          "a = b; b = a;",
          "temp = b; b = a; a = temp;",
          "a = temp; temp = b; b = a;"
        ],
        correct_answer: "temp = a; a = b; b = temp;",
        hint: "Save one value before overwriting it.",
        explanation: "To swap values, you must store one variable in a temporary location, move the second to the first, then move the temporary value to the second."
      },
      {
        id: "logic_002",
        level: "Beginner",
        difficulty: 1,
        points: 10,
        time_limit_seconds: 60,
        prompt: "What is the correct logical operator to check if BOTH conditions are true?",
        options: ["||", "&&", "!", "=="],
        correct_answer: "&&",
        hint: "It represents 'AND'.",
        explanation: "The && operator returns true only if both operands evaluate to true."
      },
      {
        id: "logic_003",
        level: "Intermediate",
        difficulty: 2,
        points: 25,
        time_limit_seconds: 120,
        prompt: "In a 'for' loop, which part runs ONLY ONCE at the very beginning?",
        options: ["Condition", "Increment/Decrement", "Initialization", "Body"],
        correct_answer: "Initialization",
        hint: "It's the first part of the parentheses.",
        explanation: "The initialization expression (e.g., let i = 0) is executed once before the loop starts."
      },
      {
        id: "logic_004",
        level: "Expert",
        difficulty: 4,
        points: 100,
        time_limit_seconds: 600,
        prompt: "Which logic structure best prevents a Stack Overflow in recursive functions?",
        options: [
          "Base Case",
          "Global Variables",
          "Nested For Loops",
          "Infinite Recursion"
        ],
        correct_answer: "Base Case",
        hint: "It defines when the function should stop.",
        explanation: "A base case is a condition that terminates recursion, preventing the call stack from growing indefinitely."
      }
      // ... More logic problems (25 Beginner, 25 Inter, 25 Adv, 25 Expert)
    ]
  },
  {
    id: "bug_fix",
    name: "Bug Fix Challenge",
    description: "Identify and resolve technical errors in JavaScript code",
    problems: [
      {
        id: "bug_001",
        level: "Beginner",
        difficulty: 1,
        points: 10,
        time_limit_seconds: 60,
        prompt: "Find the syntax error in this variable declaration.",
        buggy_code: "const user name = 'Titan';",
        bug_type: "syntax",
        options: [
          "const user_name = 'Titan';",
          "var user name = 'Titan';",
          "const 'user name' = 'Titan';",
          "user name : 'Titan';"
        ],
        correct_answer: "const user_name = 'Titan';",
        fixed_code: "const userName = 'Titan';",
        hint: "Variables cannot contain spaces.",
        explanation: "JavaScript identifiers (variable names) must not contain spaces. Use camelCase or underscores."
      },
      {
        id: "bug_002",
        level: "Intermediate",
        difficulty: 2,
        points: 25,
        time_limit_seconds: 120,
        prompt: "This loop is supposed to print 1 to 5 but never stops. Why?",
        buggy_code: "for(let i = 1; i <= 5; i--) { console.log(i); }",
        bug_type: "logical",
        options: [
          "Change i-- to i++",
          "Change i <= 5 to i >= 5",
          "Change i = 1 to i = 5",
          "Change console.log to alert"
        ],
        correct_answer: "Change i-- to i++",
        fixed_code: "for(let i = 1; i <= 5; i++) { ... }",
        hint: "Is the counter going the right way?",
        explanation: "Decrementing 'i' when starting at 1 makes 'i <= 5' always true, causing an infinite loop."
      }
    ]
  },
  {
    id: "output_prediction",
    name: "Output Prediction",
    description: "Predict the exact console output of complex snippets",
    problems: [
      {
        id: "out_001",
        level: "Beginner",
        difficulty: 1,
        points: 10,
        time_limit_seconds: 60,
        prompt: "What will this code log?",
        code_snippet: "console.log(typeof NaN);",
        options: ["'number'", "'NaN'", "'undefined'", "'object'"],
        correct_answer: "'number'",
        hint: "Think about the underlying data type.",
        explanation: "In JavaScript, NaN (Not-a-Number) is technically a numeric data type."
      },
      {
        id: "out_002",
        level: "Intermediate",
        difficulty: 2,
        points: 25,
        time_limit_seconds: 120,
        prompt: "What is the output of this equality check?",
        code_snippet: "console.log(0 == '0'); console.log(0 === '0');",
        options: ["true false", "true true", "false false", "false true"],
        correct_answer: "true false",
        hint: "== uses coercion, === does not.",
        explanation: "Loose equality (==) coerces the string to a number, while strict equality (===) checks both value and type."
      }
    ]
  },
  {
    id: "algo_match",
    name: "Algorithm Match",
    description: "Match problem statements to the correct algorithmic approach",
    problems: [
      {
        id: "algo_001",
        level: "Beginner",
        difficulty: 1,
        points: 10,
        time_limit_seconds: 60,
        prompt: "Which algorithm should you use to find an item in a sorted list by repeatedly dividing the search interval in half?",
        options: ["Linear Search", "Binary Search", "Bubble Sort", "Quick Sort"],
        correct_answer: "Binary Search",
        hint: "Divide and conquer on a sorted list.",
        explanation: "Binary Search is O(log n) and only works on sorted collections by halving the search space."
      },
      {
        id: "algo_002",
        level: "Intermediate",
        difficulty: 2,
        points: 25,
        time_limit_seconds: 120,
        prompt: "To find if a string is a palindrome, which pattern is most efficient?",
        options: ["Two Pointers", "Sliding Window", "Dynamic Programming", "Dijkstra"],
        correct_answer: "Two Pointers",
        hint: "Check start and end characters simultaneously.",
        explanation: "The Two Pointers technique allows you to compare start and end elements moving towards the center in O(n) time."
      }
    ]
  }
];
