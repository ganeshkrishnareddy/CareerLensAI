export interface SeedQuestion {
  text: string;
  type: "MCQ" | "MULTIPLE" | "CODING" | "TEXT";
  options?: { key: string; text: string }[];
  correctAnswer: { keys?: string[]; rubric?: string[] };
  marks: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  explanation?: string;
  skills: { name: string; weight?: number }[];
}

export interface SeedAssessment {
  title: string;
  description: string;
  type: string;
  difficulty: string;
  durationMinutes: number;
  passScore: number;
  roleName?: string;
  skillName?: string;
  questions: SeedQuestion[];
}

export const ASSESSMENT_SEEDS: SeedAssessment[] = [
  {
    title: "Technical Foundations",
    description: "Core DSA, Python, SQL and DBMS fundamentals for engineering roles.",
    type: "TECHNICAL",
    difficulty: "MEDIUM",
    durationMinutes: 15,
    passScore: 50,
    questions: [
      {
        text: "What is the time complexity of accessing an element in an array by index?",
        type: "MCQ",
        options: [
          { key: "a", text: "O(n)" },
          { key: "b", text: "O(1)" },
          { key: "c", text: "O(log n)" },
          { key: "d", text: "O(n²)" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "Array access by index is a direct memory address lookup — constant time O(1).",
        skills: [{ name: "Data Structures & Algorithms", weight: 1 }]
      },
      {
        text: "Which data structure provides FIFO (First In, First Out) behavior?",
        type: "MCQ",
        options: [
          { key: "a", text: "Stack" },
          { key: "b", text: "Queue" },
          { key: "c", text: "Binary Tree" },
          { key: "d", text: "Hash Map" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "Queues process elements in FIFO order; stacks are LIFO.",
        skills: [{ name: "Data Structures & Algorithms", weight: 1 }]
      },
      {
        text: "Which SQL clause is used to filter rows based on a condition?",
        type: "MCQ",
        options: [
          { key: "a", text: "WHERE" },
          { key: "b", text: "ORDER BY" },
          { key: "c", text: "GROUP BY" },
          { key: "d", text: "HAVING" }
        ],
        correctAnswer: { keys: ["a"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "WHERE filters rows before grouping/aggregation.",
        skills: [{ name: "SQL", weight: 1 }]
      },
      {
        text: "Which SQL command retrieves unique values from a column?",
        type: "MCQ",
        options: [
          { key: "a", text: "SELECT DISTINCT" },
          { key: "b", text: "SELECT UNIQUE" },
          { key: "c", text: "SELECT DIFFERENT" },
          { key: "d", text: "FILTER UNIQUE" }
        ],
        correctAnswer: { keys: ["a"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "DISTINCT removes duplicate rows from the result set.",
        skills: [{ name: "SQL", weight: 1 }]
      },
      {
        text: "What does the INNER JOIN keyword do in SQL?",
        type: "MCQ",
        options: [
          { key: "a", text: "Returns rows that match in both tables" },
          { key: "b", text: "Returns all rows from the left table" },
          { key: "c", text: "Returns all rows from both tables" },
          { key: "d", text: "Deletes duplicate rows" }
        ],
        correctAnswer: { keys: ["a"] },
        marks: 1,
        difficulty: "MEDIUM",
        explanation: "INNER JOIN returns only rows with matching keys in both tables.",
        skills: [{ name: "SQL", weight: 1 }]
      },
      {
        text: "Which data type in Python is immutable?",
        type: "MCQ",
        options: [
          { key: "a", text: "list" },
          { key: "b", text: "dict" },
          { key: "c", text: "tuple" },
          { key: "d", text: "set" }
        ],
        correctAnswer: { keys: ["c"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "Tuples cannot be modified after creation.",
        skills: [{ name: "Python", weight: 1 }]
      },
      {
        text: "What will this print? `print(len('career'))`",
        type: "MCQ",
        options: [
          { key: "a", text: "5" },
          { key: "b", text: "6" },
          { key: "c", text: "7" },
          { key: "d", text: "Error" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "len() returns the number of characters: c-a-r-e-e-r = 6.",
        skills: [{ name: "Python", weight: 1 }]
      },
      {
        text: "Which of the following are ACID properties of a database transaction? (Select all that apply)",
        type: "MULTIPLE",
        options: [
          { key: "a", text: "Atomicity" },
          { key: "b", text: "Consistency" },
          { key: "c", text: "Isolation" },
          { key: "d", text: "Durability" },
          { key: "e", text: "Serializability" }
        ],
        correctAnswer: { keys: ["a", "b", "c", "d"] },
        marks: 1,
        difficulty: "MEDIUM",
        explanation: "ACID = Atomicity, Consistency, Isolation, Durability.",
        skills: [{ name: "DBMS", weight: 1 }]
      },
      {
        text: "What is the primary key of a relational table used for?",
        type: "MCQ",
        options: [
          { key: "a", text: "Uniquely identifying each row" },
          { key: "b", text: "Sorting the table" },
          { key: "c", text: "Compressing the data" },
          { key: "d", text: "Encrypting the table" }
        ],
        correctAnswer: { keys: ["a"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "A primary key uniquely identifies each row and cannot be NULL.",
        skills: [{ name: "DBMS", weight: 1 }]
      },
      {
        text: "Which of these are O(n) operations on a linked list? (Select all that apply)",
        type: "MULTIPLE",
        options: [
          { key: "a", text: "Searching for a value" },
          { key: "b", text: "Inserting at the head" },
          { key: "c", text: "Accessing the k-th element" },
          { key: "d", text: "Deleting the head node" }
        ],
        correctAnswer: { keys: ["a", "c"] },
        marks: 1,
        difficulty: "MEDIUM",
        explanation: "Linked lists have O(n) access/search; head insert/delete are O(1).",
        skills: [{ name: "Data Structures & Algorithms", weight: 1 }]
      }
    ]
  },
  {
    title: "Coding Challenge",
    description: "Write short programs; auto-evaluated against key solution concepts.",
    type: "CODING",
    difficulty: "MEDIUM",
    durationMinutes: 20,
    passScore: 50,
    questions: [
      {
        text: "Write a Python function that checks whether a string is a palindrome (reads the same forwards and backwards, ignoring case).",
        type: "CODING",
        correctAnswer: { rubric: ["def", "return", "reverse", "lower", "==", "while"] },
        marks: 2,
        difficulty: "MEDIUM",
        explanation: "Compare the string with its reversed (case-folded) version.",
        skills: [{ name: "Python", weight: 1 }, { name: "Data Structures & Algorithms", weight: 1 }]
      },
      {
        text: "Write a Python function that returns the sum of all even numbers in a list.",
        type: "CODING",
        correctAnswer: { rubric: ["def", "for", "if", "%", "2", "sum", "return"] },
        marks: 2,
        difficulty: "EASY",
        explanation: "Iterate the list, add values where value % 2 == 0.",
        skills: [{ name: "Python", weight: 1 }]
      },
      {
        text: "Write a SQL query that returns the count of students grouped by department, ordered by count descending.",
        type: "CODING",
        correctAnswer: { rubric: ["select", "count", "group by", "department", "order by", "desc"] },
        marks: 2,
        difficulty: "MEDIUM",
        explanation: "SELECT department, COUNT(*) FROM students GROUP BY department ORDER BY COUNT(*) DESC.",
        skills: [{ name: "SQL", weight: 1 }]
      },
      {
        text: "Write a Python function that finds the second largest number in a list without using sorted().",
        type: "CODING",
        correctAnswer: { rubric: ["def", "for", "max", "largest", "second", "return", "if"] },
        marks: 2,
        difficulty: "HARD",
        explanation: "Track the largest and second-largest in a single pass.",
        skills: [{ name: "Python", weight: 1 }, { name: "Data Structures & Algorithms", weight: 1 }]
      }
    ]
  },
  {
    title: "Aptitude Sprint",
    description: "Quantitative aptitude and logical reasoning — first-round screening skills.",
    type: "APTITUDE",
    difficulty: "MEDIUM",
    durationMinutes: 15,
    passScore: 50,
    questions: [
      {
        text: "A train travels 240 km in 3 hours. What is its average speed in km/h?",
        type: "MCQ",
        options: [
          { key: "a", text: "60" },
          { key: "b", text: "70" },
          { key: "c", text: "80" },
          { key: "d", text: "90" }
        ],
        correctAnswer: { keys: ["c"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "Speed = distance / time = 240 / 3 = 80 km/h.",
        skills: [{ name: "Quantitative Aptitude", weight: 1 }]
      },
      {
        text: "If 15 workers can build a wall in 20 days, how many days will 10 workers take?",
        type: "MCQ",
        options: [
          { key: "a", text: "25 days" },
          { key: "b", text: "30 days" },
          { key: "c", text: "35 days" },
          { key: "d", text: "40 days" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "MEDIUM",
        explanation: "Work = workers × days → 15×20 = 10×d → d = 30.",
        skills: [{ name: "Quantitative Aptitude", weight: 1 }]
      },
      {
        text: "In a class, 60% of students passed. If 24 passed, how many students are in the class?",
        type: "MCQ",
        options: [
          { key: "a", text: "36" },
          { key: "b", text: "40" },
          { key: "c", text: "44" },
          { key: "d", text: "48" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "0.6 × N = 24 → N = 40.",
        skills: [{ name: "Quantitative Aptitude", weight: 1 }]
      },
      {
        text: "What is the next number: 2, 6, 12, 20, 30, ___?",
        type: "MCQ",
        options: [
          { key: "a", text: "40" },
          { key: "b", text: "42" },
          { key: "c", text: "44" },
          { key: "d", text: "48" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "MEDIUM",
        explanation: "Differences increase by 2: +4, +6, +8, +10 → next +12 = 42.",
        skills: [{ name: "Logical Reasoning", weight: 1 }]
      },
      {
        text: "A shopkeeper marks an item up 25% then gives a 20% discount. What is the net change in price?",
        type: "MCQ",
        options: [
          { key: "a", text: "5% increase" },
          { key: "b", text: "5% decrease" },
          { key: "c", text: "0% (no change)" },
          { key: "d", text: "2.5% increase" }
        ],
        correctAnswer: { keys: ["c"] },
        marks: 1,
        difficulty: "HARD",
        explanation: "1.25 × 0.80 = 1.00 → no net change.",
        skills: [{ name: "Quantitative Aptitude", weight: 1 }]
      },
      {
        text: "All roses are flowers. Some flowers fade quickly. Which statement is necessarily true?",
        type: "MCQ",
        options: [
          { key: "a", text: "Some roses fade quickly" },
          { key: "b", text: "All flowers are roses" },
          { key: "c", text: "Some roses may fade quickly" },
          { key: "d", text: "No roses fade quickly" }
        ],
        correctAnswer: { keys: ["c"] },
        marks: 1,
        difficulty: "HARD",
        explanation: "Only 'may' is guaranteed consistent with both premises.",
        skills: [{ name: "Logical Reasoning", weight: 1 }]
      }
    ]
  },
  {
    title: "Communication & Soft Skills",
    description: "Situational judgement and communication readiness.",
    type: "COMMUNICATION",
    difficulty: "MEDIUM",
    durationMinutes: 12,
    passScore: 50,
    questions: [
      {
        text: "In a group discussion, a teammate interrupts you repeatedly. The best response is to:",
        type: "MCQ",
        options: [
          { key: "a", text: "Raise your voice to be heard" },
          { key: "b", text: "Stop talking and let them speak" },
          { key: "c", text: "Politely say 'let me finish my point', then continue" },
          { key: "d", text: "Complain to the moderator" }
        ],
        correctAnswer: { keys: ["c"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "Assertive, respectful communication keeps the discussion constructive.",
        skills: [{ name: "Communication", weight: 1 }]
      },
      {
        text: "Which is the best structure for answering 'Tell me about yourself' in an interview?",
        type: "MCQ",
        options: [
          { key: "a", text: "Your full life story chronologically" },
          { key: "b", text: "Present role → relevant experience → why you fit this job" },
          { key: "c", text: "List all your hobbies" },
          { key: "d", text: "Your salary expectations" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "MEDIUM",
        explanation: "Recruiters want a concise, role-relevant summary, not a biography.",
        skills: [{ name: "Communication", weight: 1 }]
      },
      {
        text: "What does the STAR method stand for?",
        type: "MCQ",
        options: [
          { key: "a", text: "Start, Track, Act, Review" },
          { key: "b", text: "Situation, Task, Action, Result" },
          { key: "c", text: "State, Test, Answer, Reflect" },
          { key: "d", text: "Strategy, Timing, Approach, Result" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "STAR structures behavioral answers: Situation, Task, Action, Result.",
        skills: [{ name: "Communication", weight: 1 }]
      },
      {
        text: "You don't understand a requirement in a project meeting. Best practice:",
        type: "MCQ",
        options: [
          { key: "a", text: "Assume and proceed" },
          { key: "b", text: "Ask a clarifying question immediately" },
          { key: "c", text: "Wait until the meeting ends and email everyone" },
          { key: "d", text: "Silently note it and figure it out alone" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "Clarifying in the moment prevents rework and misalignment.",
        skills: [{ name: "Communication", weight: 1 }]
      },
      {
        text: "Describe a time you faced a challenge in a team project and how you handled it. (Write 2-4 sentences using the STAR format)",
        type: "TEXT",
        correctAnswer: { rubric: ["situation", "task", "action", "result", "team", "project", "time"] },
        marks: 2,
        difficulty: "MEDIUM",
        explanation: "A strong answer names the situation, your task, concrete actions, and a result.",
        skills: [{ name: "Communication", weight: 1 }]
      }
    ]
  },
  {
    title: "Interview Readiness",
    description: "Assess your interview preparation across technical and behavioral rounds.",
    type: "INTERVIEW",
    difficulty: "MEDIUM",
    durationMinutes: 12,
    passScore: 50,
    questions: [
      {
        text: "Before a technical interview, which preparation gives the highest return?",
        type: "MCQ",
        options: [
          { key: "a", text: "Practicing timed coding problems on your weakest topics" },
          { key: "b", text: "Memorizing company history" },
          { key: "c", text: "Buying a new outfit" },
          { key: "d", text: "Watching tutorials without coding along" }
        ],
        correctAnswer: { keys: ["a"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "Active, timed practice on weak areas converts directly to interview performance.",
        skills: [{ name: "Communication", weight: 1 }]
      },
      {
        text: "In a coding interview, the recommended first step after reading the problem is:",
        type: "MCQ",
        options: [
          { key: "a", text: "Start coding immediately" },
          { key: "b", text: "Clarify edge cases and state your approach aloud" },
          { key: "c", text: "Ask for the answer" },
          { key: "d", text: "Silently think for 10 minutes" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "MEDIUM",
        explanation: "Interviewers reward structured thinking and communication, not silence.",
        skills: [{ name: "Communication", weight: 1 }]
      },
      {
        text: "Which question is appropriate to ask an interviewer at the end?",
        type: "MCQ",
        options: [
          { key: "a", text: "How does the team handle code reviews and feedback?" },
          { key: "b", text: "What is your salary?" },
          { key: "c", text: "How many people were rejected last year?" },
          { key: "d", text: "Can you complete my assignment?" }
        ],
        correctAnswer: { keys: ["a"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "Team-culture and growth questions show genuine interest.",
        skills: [{ name: "Communication", weight: 1 }]
      },
      {
        text: "Explain the main idea of your final-year project in 2-3 sentences — problem, your solution, and result.",
        type: "TEXT",
        correctAnswer: { rubric: ["problem", "solution", "built", "project", "result", "users"] },
        marks: 2,
        difficulty: "MEDIUM",
        explanation: "A crisp project pitch is one of the most common interview asks.",
        skills: [{ name: "Communication", weight: 1 }]
      }
    ]
  },
  {
    title: "Software Developer Role Assessment",
    description: "Role-specific assessment for Software Developer positions.",
    type: "ROLE_SPECIFIC",
    difficulty: "MEDIUM",
    durationMinutes: 15,
    passScore: 50,
    roleName: "Software Developer",
    questions: [
      {
        text: "Which sorting algorithm has an average time complexity of O(n log n)?",
        type: "MCQ",
        options: [
          { key: "a", text: "Bubble Sort" },
          { key: "b", text: "Merge Sort" },
          { key: "c", text: "Insertion Sort" },
          { key: "d", text: "Selection Sort" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "MEDIUM",
        explanation: "Merge sort divides and conquers in O(n log n) average time.",
        skills: [{ name: "Data Structures & Algorithms", weight: 1 }]
      },
      {
        text: "What is the purpose of an index in a database?",
        type: "MCQ",
        options: [
          { key: "a", text: "Speed up query lookups" },
          { key: "b", text: "Store backups" },
          { key: "c", text: "Encrypt data" },
          { key: "d", text: "Add constraints automatically" }
        ],
        correctAnswer: { keys: ["a"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "Indexes accelerate WHERE/JOIN lookups at the cost of write performance.",
        skills: [{ name: "DBMS", weight: 1 }]
      },
      {
        text: "Which HTTP method should be used to update an existing resource?",
        type: "MCQ",
        options: [
          { key: "a", text: "GET" },
          { key: "b", text: "POST" },
          { key: "c", text: "PUT" },
          { key: "d", text: "DELETE" }
        ],
        correctAnswer: { keys: ["c"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "PUT replaces an existing resource; PATCH partially updates it.",
        skills: [{ name: "REST APIs", weight: 1 }]
      },
      {
        text: "In Python, which keyword is used to define a function?",
        type: "MCQ",
        options: [
          { key: "a", text: "func" },
          { key: "b", text: "def" },
          { key: "c", text: "function" },
          { key: "d", text: "lambda" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "Python uses 'def' to define functions.",
        skills: [{ name: "Python", weight: 1 }]
      },
      {
        text: "Which SQL statement returns the number of rows in a table?",
        type: "MCQ",
        options: [
          { key: "a", text: "SELECT COUNT(*) FROM table" },
          { key: "b", text: "SELECT ROWS FROM table" },
          { key: "c", text: "SELECT SIZE(table)" },
          { key: "d", text: "COUNT table" }
        ],
        correctAnswer: { keys: ["a"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "COUNT(*) aggregates the total row count.",
        skills: [{ name: "SQL", weight: 1 }]
      },
      {
        text: "A hash map has O(1) average time for which operations? (Select all that apply)",
        type: "MULTIPLE",
        options: [
          { key: "a", text: "Insert" },
          { key: "b", text: "Lookup" },
          { key: "c", text: "Delete" },
          { key: "d", text: "Sorted iteration" }
        ],
        correctAnswer: { keys: ["a", "b", "c"] },
        marks: 1,
        difficulty: "MEDIUM",
        explanation: "Hash maps give constant average time for insert/lookup/delete.",
        skills: [{ name: "Data Structures & Algorithms", weight: 1 }]
      }
    ]
  },
  {
    title: "SQL Mastery Test",
    description: "Skill-specific test for SQL proficiency.",
    type: "SKILL_SPECIFIC",
    difficulty: "MEDIUM",
    durationMinutes: 12,
    passScore: 60,
    skillName: "SQL",
    questions: [
      {
        text: "Which clause filters groups created by GROUP BY?",
        type: "MCQ",
        options: [
          { key: "a", text: "WHERE" },
          { key: "b", text: "HAVING" },
          { key: "c", text: "LIMIT" },
          { key: "d", text: "FILTER" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "MEDIUM",
        explanation: "HAVING filters aggregated groups; WHERE filters raw rows.",
        skills: [{ name: "SQL", weight: 1 }]
      },
      {
        text: "Which keyword combines two result sets and removes duplicates?",
        type: "MCQ",
        options: [
          { key: "a", text: "UNION" },
          { key: "b", text: "JOIN" },
          { key: "c", text: "MERGE" },
          { key: "d", text: "COMBINE" }
        ],
        correctAnswer: { keys: ["a"] },
        marks: 1,
        difficulty: "MEDIUM",
        explanation: "UNION merges results and removes duplicates; UNION ALL keeps them.",
        skills: [{ name: "SQL", weight: 1 }]
      },
      {
        text: "What does a LEFT JOIN return?",
        type: "MCQ",
        options: [
          { key: "a", text: "All rows from left table, matched rows from right" },
          { key: "b", text: "Only matching rows" },
          { key: "c", text: "All rows from both tables" },
          { key: "d", text: "Only rows in the right table" }
        ],
        correctAnswer: { keys: ["a"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "LEFT JOIN keeps every left row; unmatched right columns become NULL.",
        skills: [{ name: "SQL", weight: 1 }]
      },
      {
        text: "Which statement deletes all rows from a table but keeps the structure?",
        type: "MCQ",
        options: [
          { key: "a", text: "DELETE FROM table" },
          { key: "b", text: "DROP TABLE table" },
          { key: "c", text: "TRUNCATE TABLE table" },
          { key: "d", text: "REMOVE TABLE table" }
        ],
        correctAnswer: { keys: ["a", "c"] },
        marks: 1,
        difficulty: "HARD",
        explanation: "Both DELETE (without WHERE) and TRUNCATE clear rows; DROP removes the table.",
        skills: [{ name: "SQL", weight: 1 }]
      },
      {
        text: "Write a SQL query that returns employees with salary greater than 50000, ordered by salary descending.",
        type: "CODING",
        correctAnswer: { rubric: ["select", "where", "salary", "50000", "order by", "desc"] },
        marks: 2,
        difficulty: "MEDIUM",
        explanation: "SELECT * FROM employees WHERE salary > 50000 ORDER BY salary DESC.",
        skills: [{ name: "SQL", weight: 1 }]
      }
    ]
  },
  {
    title: "DSA Fundamentals Test",
    description: "Skill-specific test for Data Structures & Algorithms.",
    type: "SKILL_SPECIFIC",
    difficulty: "MEDIUM",
    durationMinutes: 15,
    passScore: 60,
    skillName: "Data Structures & Algorithms",
    questions: [
      {
        text: "What is the time complexity of binary search on a sorted array?",
        type: "MCQ",
        options: [
          { key: "a", text: "O(n)" },
          { key: "b", text: "O(log n)" },
          { key: "c", text: "O(1)" },
          { key: "d", text: "O(n log n)" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "EASY",
        explanation: "Binary search halves the search space each step → O(log n).",
        skills: [{ name: "Data Structures & Algorithms", weight: 1 }]
      },
      {
        text: "Which data structure is best for implementing an LRU cache?",
        type: "MCQ",
        options: [
          { key: "a", text: "Hash map + doubly linked list" },
          { key: "b", text: "Binary search tree only" },
          { key: "c", text: "Stack" },
          { key: "d", text: "Priority queue only" }
        ],
        correctAnswer: { keys: ["a"] },
        marks: 1,
        difficulty: "HARD",
        explanation: "Hash map gives O(1) lookup; the linked list tracks recency order.",
        skills: [{ name: "Data Structures & Algorithms", weight: 1 }]
      },
      {
        text: "What is the worst-case time complexity of quick sort?",
        type: "MCQ",
        options: [
          { key: "a", text: "O(n log n)" },
          { key: "b", text: "O(n²)" },
          { key: "c", "text": "O(n)" },
          { key: "d", text: "O(log n)" }
        ],
        correctAnswer: { keys: ["b"] },
        marks: 1,
        difficulty: "MEDIUM",
        explanation: "Bad pivot choices give O(n²), though average is O(n log n).",
        skills: [{ name: "Data Structures & Algorithms", weight: 1 }]
      },
      {
        text: "A graph traversal that explores neighbors before going deeper is called:",
        type: "MCQ",
        options: [
          { key: "a", text: "Breadth-First Search" },
          { key: "b", text: "Depth-First Search" },
          { key: "c", text: "Binary Search" },
          { key: "d", text: "Merge Sort" }
        ],
        correctAnswer: { keys: ["a"] },
        marks: 1,
        difficulty: "MEDIUM",
        explanation: "BFS uses a queue and visits all neighbors level by level.",
        skills: [{ name: "Data Structures & Algorithms", weight: 1 }]
      },
      {
        text: "Write a function that reverses a string without using built-in reverse methods.",
        type: "CODING",
        correctAnswer: { rubric: ["def", "for", "range", "return", "len", "-1"] },
        marks: 2,
        difficulty: "MEDIUM",
        explanation: "Iterate from the end, appending each character.",
        skills: [{ name: "Python", weight: 1 }, { name: "Data Structures & Algorithms", weight: 1 }]
      }
    ]
  }
];

export const LEARNING_RESOURCES: { title: string; description: string; url: string; type: string; difficulty: string; skillName?: string }[] = [
  { title: "NeetCode Roadmap", description: "Structured DSA practice path", url: "https://neetcode.io/roadmap", type: "PRACTICE", difficulty: "MEDIUM", skillName: "Data Structures & Algorithms" },
  { title: "LeetCode Study Plans", description: "Topic-wise coding problems", url: "https://leetcode.com/studyplan/", type: "PRACTICE", difficulty: "MEDIUM", skillName: "Data Structures & Algorithms" },
  { title: "SQLZoo Interactive", description: "Learn SQL by doing", url: "https://sqlzoo.net/", type: "PRACTICE", difficulty: "EASY", skillName: "SQL" },
  { title: "PGExercises", description: "PostgreSQL practice problems", url: "https://pgexercises.com/", type: "PRACTICE", difficulty: "MEDIUM", skillName: "SQL" },
  { title: "Real Python", description: "Python tutorials and best practices", url: "https://realpython.com/", type: "ARTICLE", difficulty: "MEDIUM", skillName: "Python" },
  { title: "MDN Web Docs", description: "Authoritative web platform reference", url: "https://developer.mozilla.org/", type: "ARTICLE", difficulty: "EASY", skillName: "JavaScript" },
  { title: "React Learn", description: "Official React documentation", url: "https://react.dev/learn", type: "COURSE", difficulty: "MEDIUM", skillName: "React" },
  { title: "Kaggle Learn", description: "Hands-on data science courses", url: "https://www.kaggle.com/learn", type: "COURSE", difficulty: "MEDIUM", skillName: "Machine Learning" },
  { title: "TryHackMe", description: "Hands-on cybersecurity labs", url: "https://tryhackme.com/", type: "PRACTICE", difficulty: "MEDIUM", skillName: "Network Security" },
  { title: "Docker Get Started", description: "Containerization fundamentals", url: "https://docs.docker.com/get-started/", type: "COURSE", difficulty: "EASY", skillName: "Docker" },
  { title: "Git Official Docs", description: "Version control reference", url: "https://git-scm.com/doc", type: "ARTICLE", difficulty: "EASY", skillName: "Git" },
  { title: "IndiaBix Aptitude", description: "Aptitude questions and answers", url: "https://www.indiabix.com/aptitude/", type: "PRACTICE", difficulty: "MEDIUM", skillName: "Quantitative Aptitude" },
  { title: "GeeksforGeeks DBMS", description: "Database management tutorials", url: "https://www.geeksforgeeks.org/dbms/", type: "ARTICLE", difficulty: "MEDIUM", skillName: "DBMS" },
  { title: "The Muse STAR Method", description: "Behavioral interview framework", url: "https://www.themuse.com/advice/star-interview-method", type: "ARTICLE", difficulty: "EASY", skillName: "Communication" }
];

export const INTERVIEW_QUESTION_SEEDS: { roleName?: string; skillName?: string; question: string; category: string; difficulty: string; sampleAnswer: string }[] = [
  { roleName: "Software Developer", question: "Explain the difference between an array and a linked list, and when you'd choose each.", category: "TECHNICAL", difficulty: "MEDIUM", sampleAnswer: "Arrays offer O(1) index access and cache locality but fixed/costly resizing; linked lists offer O(1) inserts/deletes at known positions but O(n) access. Choose arrays for indexed access and iteration, linked lists for frequent insert/delete at the head or when size is unpredictable." },
  { roleName: "Software Developer", question: "How does a hash map work internally? What happens on a collision?", category: "TECHNICAL", difficulty: "HARD", sampleAnswer: "A hash function maps keys to buckets; collisions are resolved with chaining (linked lists/trees) or open addressing. Good hash functions and load-factor-based resizing keep average operations O(1)." },
  { roleName: "Software Developer", question: "Walk me through how you would design a URL shortener.", category: "SYSTEM_DESIGN", difficulty: "HARD", sampleAnswer: "Requirements → API (encode/decode) → key generation (base62 or hash + collision check) → storage (DB row: short code, long URL) → caching with Redis → redirect at read time. Discuss scale, analytics and expiry." },
  { roleName: "Software Developer", question: "Tell me about a time you had a disagreement with a teammate. How did you resolve it?", category: "BEHAVIORAL", difficulty: "MEDIUM", sampleAnswer: "Use STAR: the situation, the differing viewpoints, the actions (listening, presenting evidence, finding a middle path), and the result (better solution + stronger relationship)." },
  { skillName: "SQL", question: "What is the difference between WHERE and HAVING in SQL?", category: "TECHNICAL", difficulty: "MEDIUM", sampleAnswer: "WHERE filters rows before grouping/aggregation; HAVING filters groups after aggregation. You can't use aggregate functions in WHERE." },
  { skillName: "Data Structures & Algorithms", question: "Describe how you'd find the kth largest element in an array efficiently.", category: "TECHNICAL", difficulty: "HARD", sampleAnswer: "Use a min-heap of size k (O(n log k)) or quickselect (average O(n)). Mention trade-offs and edge cases like duplicates." },
  { skillName: "Communication", question: "How do you explain a complex technical concept to a non-technical stakeholder?", category: "BEHAVIORAL", difficulty: "MEDIUM", sampleAnswer: "Anchor on the business outcome, use analogies, avoid jargon, check understanding, and offer a follow-up with more detail." },
  { skillName: "Python", question: "What is the difference between a list and a tuple in Python?", category: "TECHNICAL", difficulty: "EASY", sampleAnswer: "Lists are mutable and growable; tuples are immutable and hashable (usable as dict keys). Tuples are lighter and signal fixed structure." },
  { roleName: "Data Analyst", question: "Describe a dataset you analyzed. What question did you answer and what did you find?", category: "BEHAVIORAL", difficulty: "MEDIUM", sampleAnswer: "STAR + concrete numbers: the question, the cleaning steps, the analysis method (e.g., regression/cohort), and the actionable insight delivered." }
];

export const OPPORTUNITY_SEEDS: { roleName?: string; title: string; company: string; location: string; type: string; url: string; description: string; salaryRange: string }[] = [
  { roleName: "Software Developer", title: "Software Engineer — Campus Hiring", company: "TechNova Solutions", location: "Bengaluru", type: "FULL_TIME", url: "https://example.com/jobs/technova-se", description: "Campus drive for 2026 graduates. Core Java/Python, DSA and SQL screening rounds.", salaryRange: "₹8–12 LPA" },
  { roleName: "Frontend Developer", title: "Frontend Developer Intern", company: "PixelWorks", location: "Remote", type: "INTERNSHIP", url: "https://example.com/jobs/pixelworks-fe", description: "React + TypeScript internship with a real product team. Stipend + PPO potential.", salaryRange: "₹25–35k/mo" },
  { roleName: "Data Analyst", title: "Junior Data Analyst", company: "Insightly Analytics", location: "Hyderabad", type: "FULL_TIME", url: "https://example.com/jobs/insightly-da", description: "SQL, Excel and visualization-focused role. Aptitude and SQL screening.", salaryRange: "₹6–9 LPA" },
  { roleName: "Data Scientist", title: "Data Science Trainee", company: "CogniSphere AI", location: "Pune", type: "FULL_TIME", url: "https://example.com/jobs/cognisphere-ds", description: "Python, ML and statistics screening. Projects in the interview round.", salaryRange: "₹10–15 LPA" },
  { roleName: "DevOps Engineer", title: "DevOps Associate Engineer", company: "CloudNest", location: "Chennai", type: "FULL_TIME", url: "https://example.com/jobs/cloudnest-devops", description: "Linux, Docker and CI/CD focused role for fresh graduates.", salaryRange: "₹7–11 LPA" },
  { roleName: "Cybersecurity Analyst", title: "Security Analyst — SOC", company: "SecureShield", location: "Mumbai", type: "FULL_TIME", url: "https://example.com/jobs/secureshield-soc", description: "Entry-level SOC role. Networking and security fundamentals required.", salaryRange: "₹6–10 LPA" },
  { roleName: "QA Engineer", title: "QA Engineer", company: "TestCraft", location: "Noida", type: "FULL_TIME", url: "https://example.com/jobs/testcraft-qa", description: "Manual + automation QA role. Selenium knowledge is a plus.", salaryRange: "₹5–8 LPA" },
  { roleName: "Business Analyst", title: "Business Analyst Trainee", company: "StratEdge Consulting", location: "Gurugram", type: "FULL_TIME", url: "https://example.com/jobs/stratedge-ba", description: "Requirements analysis and documentation role. Strong communication required.", salaryRange: "₹6–9 LPA" }
];
