// CRITICAL: Pure type file — 0 imports, 0 runtime exports, only type/interface definitions

export type AxisId = "A1" | "A2" | "A3";
export type AxisLetter = "F" | "S" | "P" | "I" | "C" | "R";
export type PersonaCode =
  | "FPC"
  | "FPR"
  | "FIC"
  | "FIR"
  | "SPC"
  | "SPR"
  | "SIC"
  | "SIR";

export interface Choice {
  id: "a" | "b";
  label: string;
  score: 0 | 1;
}

export interface Question {
  id: number;
  axis: AxisId;
  text: string;
  choices: [Choice, Choice];
}

export interface Persona {
  code: PersonaCode;
  name: string;
  emoji: string;
  tagline: string;
  summary: string;
  tips: [string, string, string];
  strengths: [string, string];
  cautions: [string, string];
  plan30d: [string, string, string];
  bestMatch: PersonaCode;
}

export interface AxisScore {
  axis: AxisId;
  score: 0 | 1 | 2 | 3 | 4;
  letter: AxisLetter;
  percent: 0 | 25 | 50 | 75 | 100;
}

export interface QuizResult {
  id: string;
  createdAt: number;
  answers: (0 | 1)[];
  axisScores: [AxisScore, AxisScore, AxisScore];
  personaCode: PersonaCode;
  shareCode: string;
  reportUnlocked: boolean;
}

export interface QuizProgress {
  answers: (0 | 1 | null)[];
  currentIndex: number;
  updatedAt: number;
}

export interface CompatibilityRecord {
  id: string;
  createdAt: number;
  myCode: PersonaCode;
  friendCode: PersonaCode;
  friendShareCode: string;
  score: number;
  grade:
    | "최고의 짝"
    | "좋은 궁합"
    | "무난한 궁합"
    | "서로 배우는 궁합";
  matchedAxes: AxisId[];
}

export interface AppFlags {
  onboardingSeen: boolean;
  lastResultId: string | null;
  disclaimerSeen: boolean;
}

export type ScoreResult =
  | { success: true; score: number }
  | { success: false; error: string };

export type StorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type RouteState = {
  "/": undefined;
  "/quiz": undefined;
  "/result": { resultId: string } | undefined;
  "/report": { resultId: string } | undefined;
  "/share": { resultId: string } | undefined;
  "/compat": { prefillCode?: string } | undefined;
  "/history": undefined;
};
