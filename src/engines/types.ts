export type GapStatus = "STRONG" | "IMPROVE" | "MAJOR_GAP" | "CRITICAL_GAP";

export interface SkillRef {
  id: string;
  name: string;
  category: string;
}

export interface StudentSkillData {
  skillId: string;
  name: string;
  category: string;
  score: number; // 0-100
  source?: string;
}

export interface RoleRequirement {
  skillId: string;
  name: string;
  category: string;
  requirement: "REQUIRED" | "PREFERRED";
  minProficiency: number; // 0-100
  weight: number;
}

export interface SkillGapResult {
  skillId: string;
  skillName: string;
  category: string;
  currentScore: number;
  requiredScore: number;
  gap: number; // required - current (negative = strong)
  status: GapStatus;
  priority: number; // 1-10
  weight: number;
  requirement: "REQUIRED" | "PREFERRED";
  impact: string;
}

export interface ReadinessComponents {
  overall: number;
  technical: number;
  coding: number;
  aptitude: number;
  communication: number;
  interview: number;
  projects: number;
  resume: number;
}

export interface ReadinessWeights {
  technical: number;
  coding: number;
  aptitude: number;
  communication: number;
  interview: number;
  projects: number;
  resume: number;
}

export interface RoleMatchResult {
  roleId: string;
  roleName: string;
  roleCategory?: string | null;
  fitScore: number;
  readinessScore: number;
  missingSkills: { skillId: string; name: string; current: number; required: number; gap: number; status: GapStatus }[];
  strengths: { skillId: string; name: string; score: number; required: number }[];
  reasons: string[];
}

export interface RoadmapTask {
  title: string;
  objective: string;
  tasks: string[];
  estimatedMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  resourceUrl?: string;
  resourceTitle?: string;
  assessmentId?: string;
}

export interface RoadmapPlan {
  title: string;
  weeks: number;
  items: (RoadmapTask & { week: number; skillId?: string; skillName?: string })[];
}
