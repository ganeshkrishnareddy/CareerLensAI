export const SKILL_CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: "PROGRAMMING", label: "Programming Languages", color: "#6366f1" },
  { value: "DSA", label: "Data Structures & Algorithms", color: "#8b5cf6" },
  { value: "FRAMEWORK", label: "Frameworks", color: "#0ea5e9" },
  { value: "DATABASE", label: "Databases", color: "#10b981" },
  { value: "CLOUD", label: "Cloud & DevOps", color: "#f59e0b" },
  { value: "CYBERSECURITY", label: "Cybersecurity", color: "#ef4444" },
  { value: "DATA_AI", label: "Data & AI", color: "#ec4899" },
  { value: "TOOLS", label: "Tools", color: "#14b8a6" },
  { value: "SOFT", label: "Soft Skills", color: "#84cc16" },
  { value: "COMMUNICATION", label: "Communication", color: "#f97316" },
  { value: "APTITUDE", label: "Aptitude", color: "#a855f7" },
  { value: "OTHER", label: "Other", color: "#64748b" }
];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  SKILL_CATEGORIES.map((c) => [c.value, c.label])
);

export const CATEGORY_COLOR: Record<string, string> = Object.fromEntries(
  SKILL_CATEGORIES.map((c) => [c.value, c.color])
);

export interface CatalogSkill {
  name: string;
  category: string;
  aliases?: string[];
}

/** Master skill catalog (seeded + used by resume extraction / onboarding). */
export const SKILL_CATALOG: CatalogSkill[] = [
  // Programming
  { name: "Python", category: "PROGRAMMING", aliases: ["py"] },
  { name: "JavaScript", category: "PROGRAMMING", aliases: ["js", "es6", "ecmascript"] },
  { name: "TypeScript", category: "PROGRAMMING", aliases: ["ts"] },
  { name: "Java", category: "PROGRAMMING" },
  { name: "C", category: "PROGRAMMING" },
  { name: "C++", category: "PROGRAMMING", aliases: ["cpp"] },
  { name: "C#", category: "PROGRAMMING", aliases: ["csharp"] },
  { name: "Go", category: "PROGRAMMING", aliases: ["golang"] },
  { name: "Rust", category: "PROGRAMMING" },
  { name: "Ruby", category: "PROGRAMMING" },
  { name: "PHP", category: "PROGRAMMING" },
  { name: "Swift", category: "PROGRAMMING" },
  { name: "Kotlin", category: "PROGRAMMING" },
  { name: "HTML & CSS", category: "PROGRAMMING", aliases: ["html", "css", "html5", "css3"] },
  { name: "Shell Scripting", category: "PROGRAMMING", aliases: ["bash", "shell"] },
  { name: "MATLAB", category: "PROGRAMMING" },
  // DSA
  { name: "Data Structures & Algorithms", category: "DSA", aliases: ["dsa", "algorithms", "data structures", "problem solving"] },
  { name: "Competitive Programming", category: "DSA", aliases: ["cp", "codeforces", "leetcode"] },
  // Frameworks
  { name: "React", category: "FRAMEWORK", aliases: ["reactjs", "react.js"] },
  { name: "Next.js", category: "FRAMEWORK", aliases: ["nextjs"] },
  { name: "Node.js", category: "FRAMEWORK", aliases: ["node", "express"] },
  { name: "Express", category: "FRAMEWORK" },
  { name: "Angular", category: "FRAMEWORK" },
  { name: "Vue.js", category: "FRAMEWORK", aliases: ["vue"] },
  { name: "Django", category: "FRAMEWORK" },
  { name: "Flask", category: "FRAMEWORK" },
  { name: "Spring Boot", category: "FRAMEWORK", aliases: ["spring"] },
  { name: "Flutter", category: "FRAMEWORK" },
  { name: "React Native", category: "FRAMEWORK", aliases: ["react-native"] },
  { name: ".NET", category: "FRAMEWORK" },
  { name: "Tailwind CSS", category: "FRAMEWORK", aliases: ["tailwind"] },
  { name: "Bootstrap", category: "FRAMEWORK" },
  // Databases
  { name: "SQL", category: "DATABASE" },
  { name: "MySQL", category: "DATABASE" },
  { name: "PostgreSQL", category: "DATABASE", aliases: ["postgres"] },
  { name: "MongoDB", category: "DATABASE" },
  { name: "MongoDB & NoSQL", category: "DATABASE", aliases: ["nosql"] },
  { name: "Redis", category: "DATABASE" },
  { name: "DBMS", category: "DATABASE", aliases: ["database management"] },
  { name: "SQLite", category: "DATABASE" },
  { name: "Oracle", category: "DATABASE" },
  // Cloud & DevOps
  { name: "AWS", category: "CLOUD" },
  { name: "Azure", category: "CLOUD" },
  { name: "Google Cloud Platform", category: "CLOUD", aliases: ["gcp", "google cloud"] },
  { name: "Docker", category: "CLOUD" },
  { name: "Kubernetes", category: "CLOUD", aliases: ["k8s"] },
  { name: "Terraform", category: "CLOUD" },
  { name: "CI/CD", category: "CLOUD", aliases: ["cicd", "jenkins", "github actions"] },
  { name: "Linux", category: "CLOUD", aliases: ["ubuntu"] },
  { name: "Cloud Platforms", category: "CLOUD" },
  { name: "Networking", category: "CLOUD", aliases: ["tcp/ip", "dns", "network"] },
  // Cybersecurity
  { name: "Network Security", category: "CYBERSECURITY" },
  { name: "Web Security", category: "CYBERSECURITY", aliases: ["owasp"] },
  { name: "Cryptography", category: "CYBERSECURITY" },
  { name: "Ethical Hacking", category: "CYBERSECURITY", aliases: ["pentesting", "penetration testing"] },
  { name: "Cloud Security", category: "CYBERSECURITY" },
  { name: "Security Tools", category: "CYBERSECURITY", aliases: ["burp", "nmap", "wireshark"] },
  // Data & AI
  { name: "Machine Learning", category: "DATA_AI", aliases: ["ml"] },
  { name: "Deep Learning", category: "DATA_AI", aliases: ["dl"] },
  { name: "Statistics", category: "DATA_AI", aliases: ["probability", "stats"] },
  { name: "Data Analysis", category: "DATA_AI", aliases: ["data analytics"] },
  { name: "Data Visualization", category: "DATA_AI", aliases: ["tableau", "power bi", "matplotlib"] },
  { name: "Pandas", category: "DATA_AI" },
  { name: "NumPy", category: "DATA_AI" },
  { name: "NLP", category: "DATA_AI", aliases: ["natural language processing"] },
  { name: "Computer Vision", category: "DATA_AI", aliases: ["cv"] },
  { name: "LLMs & Generative AI", category: "DATA_AI", aliases: ["genai", "generative ai", "gpt", "llm"] },
  { name: "Excel", category: "DATA_AI", aliases: ["spreadsheet"] },
  // Tools
  { name: "Git", category: "TOOLS", aliases: ["github", "gitlab"] },
  { name: "Jira", category: "TOOLS" },
  { name: "Agile & Scrum", category: "TOOLS", aliases: ["agile", "scrum"] },
  { name: "Postman", category: "TOOLS", aliases: ["api testing"] },
  { name: "Selenium", category: "TOOLS" },
  { name: "Testing & QA", category: "TOOLS", aliases: ["testing", "qa", "unit testing", "jest"] },
  { name: "Requirements Analysis", category: "TOOLS", aliases: ["requirements", "brd"] },
  { name: "REST APIs", category: "TOOLS", aliases: ["rest", "api"] },
  { name: "UML", category: "TOOLS" },
  { name: "Figma", category: "TOOLS", aliases: ["ui/ux design", "ui ux"] },
  // Soft & communication
  { name: "Communication", category: "COMMUNICATION", aliases: ["communication skills", "verbal"] },
  { name: "Presentation Skills", category: "COMMUNICATION", aliases: ["presenting"] },
  { name: "Teamwork", category: "SOFT" },
  { name: "Leadership", category: "SOFT" },
  { name: "Problem Solving", category: "SOFT", aliases: ["critical thinking"] },
  { name: "Time Management", category: "SOFT" },
  { name: "Adaptability", category: "SOFT" },
  // Aptitude
  { name: "Quantitative Aptitude", category: "APTITUDE", aliases: ["quant", "aptitude"] },
  { name: "Logical Reasoning", category: "APTITUDE", aliases: ["reasoning"] },
  { name: "Verbal Ability", category: "APTITUDE" },
  { name: "Data Interpretation", category: "APTITUDE", aliases: ["di"] }
];

export const LEVEL_LABELS: Record<number, string> = {
  0: "Not started",
  1: "Beginner",
  2: "Basic",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert"
};

export function levelToScore(level: number): number {
  const map: Record<number, number> = { 0: 0, 1: 20, 2: 40, 3: 60, 4: 80, 5: 95 };
  return map[Math.max(0, Math.min(5, Math.round(level)))] ?? 0;
}

// ── Role requirements ─────────────────────────────────────────────
export interface RoleRequirementSeed {
  skill: string;
  requirement: "REQUIRED" | "PREFERRED";
  minProficiency: number;
  weight: number;
}

export interface RoleSeed {
  name: string;
  description: string;
  category: string;
  skills: RoleRequirementSeed[];
}

export const ROLE_CATALOG: RoleSeed[] = [
  {
    name: "Software Developer",
    description: "Designs, builds and maintains software applications across the stack.",
    category: "Engineering",
    skills: [
      { skill: "Python", requirement: "REQUIRED", minProficiency: 75, weight: 5 },
      { skill: "Data Structures & Algorithms", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "SQL", requirement: "REQUIRED", minProficiency: 80, weight: 4 },
      { skill: "DBMS", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "Communication", requirement: "REQUIRED", minProficiency: 75, weight: 3 },
      { skill: "Object Oriented Programming", requirement: "PREFERRED", minProficiency: 70, weight: 3 },
      { skill: "Git", requirement: "PREFERRED", minProficiency: 60, weight: 2 },
      { skill: "Problem Solving", requirement: "PREFERRED", minProficiency: 70, weight: 2 }
    ]
  },
  {
    name: "Frontend Developer",
    description: "Builds responsive, accessible and performant user interfaces.",
    category: "Engineering",
    skills: [
      { skill: "HTML & CSS", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "JavaScript", requirement: "REQUIRED", minProficiency: 80, weight: 5 },
      { skill: "React", requirement: "REQUIRED", minProficiency: 80, weight: 5 },
      { skill: "Communication", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Data Structures & Algorithms", requirement: "REQUIRED", minProficiency: 60, weight: 3 },
      { skill: "Tailwind CSS", requirement: "PREFERRED", minProficiency: 70, weight: 3 },
      { skill: "Git", requirement: "PREFERRED", minProficiency: 60, weight: 2 },
      { skill: "Figma", requirement: "PREFERRED", minProficiency: 55, weight: 2 }
    ]
  },
  {
    name: "Backend Developer",
    description: "Builds server-side logic, APIs and data layers that power applications.",
    category: "Engineering",
    skills: [
      { skill: "Python", requirement: "REQUIRED", minProficiency: 80, weight: 5 },
      { skill: "SQL", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "DBMS", requirement: "REQUIRED", minProficiency: 80, weight: 4 },
      { skill: "REST APIs", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "Data Structures & Algorithms", requirement: "REQUIRED", minProficiency: 70, weight: 4 },
      { skill: "Docker", requirement: "PREFERRED", minProficiency: 65, weight: 3 },
      { skill: "Git", requirement: "PREFERRED", minProficiency: 65, weight: 2 }
    ]
  },
  {
    name: "Full Stack Developer",
    description: "Works across frontend and backend to ship complete features.",
    category: "Engineering",
    skills: [
      { skill: "JavaScript", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "React", requirement: "REQUIRED", minProficiency: 80, weight: 5 },
      { skill: "SQL", requirement: "REQUIRED", minProficiency: 80, weight: 4 },
      { skill: "Node.js", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "HTML & CSS", requirement: "REQUIRED", minProficiency: 80, weight: 3 },
      { skill: "Data Structures & Algorithms", requirement: "REQUIRED", minProficiency: 65, weight: 3 },
      { skill: "Communication", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Docker", requirement: "PREFERRED", minProficiency: 60, weight: 2 },
      { skill: "Git", requirement: "PREFERRED", minProficiency: 65, weight: 2 }
    ]
  },
  {
    name: "Data Analyst",
    description: "Turns raw data into insights, dashboards and business recommendations.",
    category: "Data & AI",
    skills: [
      { skill: "SQL", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "Python", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "Statistics", requirement: "REQUIRED", minProficiency: 70, weight: 4 },
      { skill: "Data Visualization", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "Excel", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Communication", requirement: "REQUIRED", minProficiency: 75, weight: 3 },
      { skill: "Pandas", requirement: "PREFERRED", minProficiency: 65, weight: 3 }
    ]
  },
  {
    name: "Data Scientist",
    description: "Builds models and experiments to extract predictive insight from data.",
    category: "Data & AI",
    skills: [
      { skill: "Python", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "Statistics", requirement: "REQUIRED", minProficiency: 80, weight: 5 },
      { skill: "Machine Learning", requirement: "REQUIRED", minProficiency: 80, weight: 5 },
      { skill: "SQL", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Data Visualization", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Data Structures & Algorithms", requirement: "REQUIRED", minProficiency: 60, weight: 3 },
      { skill: "Deep Learning", requirement: "PREFERRED", minProficiency: 70, weight: 4 },
      { skill: "NLP", requirement: "PREFERRED", minProficiency: 60, weight: 2 }
    ]
  },
  {
    name: "AI/ML Engineer",
    description: "Designs, trains and deploys machine learning systems at scale.",
    category: "Data & AI",
    skills: [
      { skill: "Python", requirement: "REQUIRED", minProficiency: 90, weight: 5 },
      { skill: "Machine Learning", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "Statistics", requirement: "REQUIRED", minProficiency: 80, weight: 4 },
      { skill: "Deep Learning", requirement: "REQUIRED", minProficiency: 80, weight: 4 },
      { skill: "Data Structures & Algorithms", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "SQL", requirement: "REQUIRED", minProficiency: 65, weight: 3 },
      { skill: "LLMs & Generative AI", requirement: "PREFERRED", minProficiency: 70, weight: 4 },
      { skill: "Cloud Platforms", requirement: "PREFERRED", minProficiency: 60, weight: 2 }
    ]
  },
  {
    name: "Cybersecurity Analyst",
    description: "Protects systems and data by monitoring, testing and hardening defenses.",
    category: "Security",
    skills: [
      { skill: "Network Security", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "Web Security", requirement: "REQUIRED", minProficiency: 80, weight: 5 },
      { skill: "Linux", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Cryptography", requirement: "REQUIRED", minProficiency: 70, weight: 4 },
      { skill: "Communication", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Python", requirement: "PREFERRED", minProficiency: 60, weight: 3 },
      { skill: "Cloud Security", requirement: "PREFERRED", minProficiency: 60, weight: 3 }
    ]
  },
  {
    name: "Cloud Engineer",
    description: "Architects and operates cloud infrastructure for reliability and scale.",
    category: "Cloud & DevOps",
    skills: [
      { skill: "Cloud Platforms", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "Linux", requirement: "REQUIRED", minProficiency: 80, weight: 4 },
      { skill: "Networking", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "Docker", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "Shell Scripting", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Data Structures & Algorithms", requirement: "REQUIRED", minProficiency: 60, weight: 2 },
      { skill: "Kubernetes", requirement: "PREFERRED", minProficiency: 70, weight: 4 },
      { skill: "Terraform", requirement: "PREFERRED", minProficiency: 65, weight: 3 }
    ]
  },
  {
    name: "DevOps Engineer",
    description: "Automates build, test and deployment pipelines to ship software reliably.",
    category: "Cloud & DevOps",
    skills: [
      { skill: "Linux", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "Docker", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "CI/CD", requirement: "REQUIRED", minProficiency: 80, weight: 5 },
      { skill: "Git", requirement: "REQUIRED", minProficiency: 80, weight: 3 },
      { skill: "Cloud Platforms", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "Shell Scripting", requirement: "REQUIRED", minProficiency: 75, weight: 3 },
      { skill: "Kubernetes", requirement: "PREFERRED", minProficiency: 70, weight: 4 },
      { skill: "Terraform", requirement: "PREFERRED", minProficiency: 65, weight: 3 }
    ]
  },
  {
    name: "QA Engineer",
    description: "Ensures software quality through manual and automated testing.",
    category: "Engineering",
    skills: [
      { skill: "Testing & QA", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "SQL", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Communication", requirement: "REQUIRED", minProficiency: 75, weight: 3 },
      { skill: "Python", requirement: "REQUIRED", minProficiency: 65, weight: 3 },
      { skill: "Data Structures & Algorithms", requirement: "REQUIRED", minProficiency: 55, weight: 2 },
      { skill: "Selenium", requirement: "PREFERRED", minProficiency: 70, weight: 4 },
      { skill: "Postman", requirement: "PREFERRED", minProficiency: 65, weight: 3 }
    ]
  },
  {
    name: "Business Analyst",
    description: "Bridges business needs and technology through analysis and documentation.",
    category: "Business",
    skills: [
      { skill: "Communication", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "Requirements Analysis", requirement: "REQUIRED", minProficiency: 75, weight: 5 },
      { skill: "Excel", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "SQL", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Data Visualization", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Quantitative Aptitude", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Agile & Scrum", requirement: "PREFERRED", minProficiency: 65, weight: 3 },
      { skill: "UML", requirement: "PREFERRED", minProficiency: 60, weight: 2 }
    ]
  },
  {
    name: "Network Engineer",
    description: "Designs and maintains network infrastructure and connectivity.",
    category: "Security",
    skills: [
      { skill: "Networking", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "Network Security", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "Linux", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Cloud Platforms", requirement: "REQUIRED", minProficiency: 60, weight: 3 },
      { skill: "Communication", requirement: "REQUIRED", minProficiency: 65, weight: 3 },
      { skill: "Quantitative Aptitude", requirement: "REQUIRED", minProficiency: 60, weight: 2 },
      { skill: "Cryptography", requirement: "PREFERRED", minProficiency: 60, weight: 2 }
    ]
  },
  {
    name: "Mobile App Developer",
    description: "Builds native and cross-platform mobile applications.",
    category: "Engineering",
    skills: [
      { skill: "Kotlin", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "Flutter", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "Dart", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "REST APIs", requirement: "REQUIRED", minProficiency: 70, weight: 3 },
      { skill: "Communication", requirement: "REQUIRED", minProficiency: 65, weight: 2 },
      { skill: "Firebase", requirement: "PREFERRED", minProficiency: 60, weight: 3 },
      { skill: "Git", requirement: "PREFERRED", minProficiency: 60, weight: 2 }
    ]
  },
  {
    name: "Product Manager",
    description: "Owns product vision, roadmap and cross-functional execution.",
    category: "Business",
    skills: [
      { skill: "Communication", requirement: "REQUIRED", minProficiency: 85, weight: 5 },
      { skill: "Requirements Analysis", requirement: "REQUIRED", minProficiency: 80, weight: 5 },
      { skill: "Agile & Scrum", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "Leadership", requirement: "REQUIRED", minProficiency: 75, weight: 4 },
      { skill: "Data Visualization", requirement: "REQUIRED", minProficiency: 65, weight: 3 },
      { skill: "Excel", requirement: "REQUIRED", minProficiency: 65, weight: 3 },
      { skill: "SQL", requirement: "PREFERRED", minProficiency: 55, weight: 2 }
    ]
  }
];
