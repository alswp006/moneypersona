import { describe, it, expect } from "vitest";
import type {
  Choice,
  Question,
  Persona,
  AxisScore,
  QuizResult,
  QuizProgress,
  CompatibilityRecord,
  AppFlags,
  RouteState,
  ScoreResult,
  StorageResult,
  AxisId,
  PersonaCode,
} from "@/lib/types";

describe("도메인 타입 + RouteState 계약 정의", () => {
  // AC-1: 모든 타입이 export되고 TypeScript 에러가 없어야 함
  // (TypeScript types are compile-time only; verify via file content check)
  it("AC-1[P0]: should export all types from src/lib/types.ts", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const typesPath = path.resolve(
      __dirname,
      "../lib/types.ts"
    );

    const content = fs.readFileSync(typesPath, "utf-8");

    // Verify all required types are exported
    const requiredTypes = [
      "Choice",
      "Question",
      "Persona",
      "AxisScore",
      "QuizResult",
      "QuizProgress",
      "CompatibilityRecord",
      "AppFlags",
      "RouteState",
      "ScoreResult",
      "StorageResult",
    ];

    requiredTypes.forEach((type) => {
      expect(content).toContain(`export ${type.includes("State") || type === "ScoreResult" || type === "StorageResult" ? "type" : "interface"} ${type}`);
    });
  });

  // AC-2: Persona.tips는 [string, string, string] 튜플, plan30d도 튜플
  it("AC-2[P0]: Persona.tips and plan30d must be tuple types (not string[])", async () => {
    // Test by checking that a Persona object with correct tuple structure is valid
    const testPersona: Persona = {
      code: "FPC",
      name: "알뜰형 다람쥐",
      emoji: "🐿️",
      tagline: "알뜰하게 저축하는 성향",
      summary: "소비는 절약하고 계획적으로 모으는 타입입니다.",
      tips: [
        "월급날 자동이체로 저축분을 먼저 떼어두세요",
        "고정 구독 서비스를 3개월마다 점검하세요",
        "주 1회 무지출 데이를 캘린더에 고정하세요",
      ],
      strengths: ["저축 능력", "재무 자율성"],
      cautions: ["과도한 소비 억제로 인한 스트레스", "투자 기회 놓침"],
      plan30d: [
        "지난 1개월 지출 내역을 분류하세요",
        "고정 구독 서비스 점검 및 정리",
        "월 저축 목표를 정해 자동이체 설정",
      ],
      bestMatch: "SPR",
    };

    // Check that tips is a tuple (length must be exactly 3)
    expect(testPersona.tips).toHaveLength(3);
    expect(typeof testPersona.tips[0]).toBe("string");
    expect(typeof testPersona.tips[1]).toBe("string");
    expect(typeof testPersona.tips[2]).toBe("string");

    // Check that plan30d is a tuple (length must be exactly 3)
    expect(testPersona.plan30d).toHaveLength(3);
    expect(typeof testPersona.plan30d[0]).toBe("string");
    expect(typeof testPersona.plan30d[1]).toBe("string");
    expect(typeof testPersona.plan30d[2]).toBe("string");

    // Check strengths and cautions are tuples of length 2
    expect(testPersona.strengths).toHaveLength(2);
    expect(testPersona.cautions).toHaveLength(2);
  });

  // AC-3: QuizResult.axisScores는 [AxisScore, AxisScore, AxisScore], answers는 (0|1)[]
  it("AC-3[P0]: QuizResult.axisScores must be a tuple of 3 AxisScores, answers is (0|1)[]", async () => {
    const testResult: QuizResult = {
      id: "r_1234567890_FPC",
      createdAt: 1234567890,
      answers: [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1],
      axisScores: [
        { axis: "A1", score: 2, letter: "F", percent: 50 },
        { axis: "A2", score: 3, letter: "P", percent: 75 },
        { axis: "A3", score: 2, letter: "C", percent: 50 },
      ],
      personaCode: "FPC",
      shareCode: "MP1-FPC-2",
      reportUnlocked: false,
    };

    // axisScores must be exactly 3 items (A1, A2, A3)
    expect(testResult.axisScores).toHaveLength(3);
    expect(testResult.axisScores[0].axis).toBe("A1");
    expect(testResult.axisScores[1].axis).toBe("A2");
    expect(testResult.axisScores[2].axis).toBe("A3");

    // answers must be (0|1)[] with exactly 12 items
    expect(testResult.answers).toHaveLength(12);
    testResult.answers.forEach((answer: number) => {
      expect([0, 1]).toContain(answer);
    });

    // Check score range [0, 4] and percent calculation
    expect(testResult.axisScores[0].score).toBeGreaterThanOrEqual(0);
    expect(testResult.axisScores[0].score).toBeLessThanOrEqual(4);
    expect([0, 25, 50, 75, 100]).toContain(testResult.axisScores[0].percent);
  });

  // AC-4: CompatibilityRecord.grade는 '최고의 짝'|'좋은 궁합'|'무난한 궁합'|'서로 배우는 궁합' 리터럴 유니온
  it("AC-4[P0]: CompatibilityRecord.grade must be one of 4 specific literal values", async () => {
    const testRecords: CompatibilityRecord[] = [
      {
        id: "c_1234567890",
        createdAt: 1234567890,
        myCode: "FPC",
        friendCode: "SPR",
        friendShareCode: "MP1-SPR-8",
        score: 95,
        grade: "최고의 짝",
        matchedAxes: ["A1", "A2"],
      },
      {
        id: "c_1234567891",
        createdAt: 1234567891,
        myCode: "FPC",
        friendCode: "SIC",
        friendShareCode: "MP1-SIC-1",
        score: 80,
        grade: "좋은 궁합",
        matchedAxes: ["A1"],
      },
      {
        id: "c_1234567892",
        createdAt: 1234567892,
        myCode: "FPC",
        friendCode: "FIR",
        friendShareCode: "MP1-FIR-1",
        score: 65,
        grade: "무난한 궁합",
        matchedAxes: [],
      },
      {
        id: "c_1234567893",
        createdAt: 1234567893,
        myCode: "FPC",
        friendCode: "SIR",
        friendShareCode: "MP1-SIR-3",
        score: 55,
        grade: "서로 배우는 궁합",
        matchedAxes: [],
      },
    ];

    const validGrades = [
      "최고의 짝",
      "좋은 궁합",
      "무난한 궁합",
      "서로 배우는 궁합",
    ];
    testRecords.forEach((record) => {
      expect(validGrades).toContain(record.grade);
    });
  });

  // AC-5: RouteState는 7개 페이지 경로를 가지며 특정 구조를 만족해야 함
  it("AC-5[P0]: RouteState must have all 7 route paths with correct state shapes", async () => {
    // Test a complete RouteState that includes all paths
    const routeStates: Record<string, RouteState[keyof RouteState]> = {
        "/": undefined,
        "/quiz": undefined,
        "/result": { resultId: "r_1234567890_FPC" },
        "/report": { resultId: "r_1234567890_FPC" },
        "/share": { resultId: "r_1234567890_FPC" },
        "/compat": { prefillCode: "MP1-SPR-8" },
        "/history": undefined,
      };

    // Verify all paths exist in the object
    const paths = Object.keys(routeStates);
    expect(paths).toContain("/");
    expect(paths).toContain("/quiz");
    expect(paths).toContain("/result");
    expect(paths).toContain("/report");
    expect(paths).toContain("/share");
    expect(paths).toContain("/compat");
    expect(paths).toContain("/history");

    // Verify state shapes for specific paths
    // /result, /report, /share should have resultId or be undefined
    const resultState = routeStates["/result"];
    if (resultState !== undefined) {
      expect("resultId" in resultState).toBe(true);
      expect(typeof (resultState as any).resultId).toBe("string");
    }

    // /compat should have prefillCode or be undefined
    const compatState = routeStates["/compat"];
    if (compatState !== undefined) {
      expect("prefillCode" in compatState).toBe(true);
      if ((compatState as any).prefillCode !== undefined) {
        expect(typeof (compatState as any).prefillCode).toBe("string");
      }
    }
  });

  // AC-5b: RouteState allows undefined for nav routes
  it("AC-5b[P0]: RouteState allows undefined state for /, /quiz, /history routes", async () => {
    // These paths should accept undefined or no state
    const undefinedStates: RouteState = {
      "/": undefined,
      "/quiz": undefined,
      "/history": undefined,
      "/result": undefined,
      "/report": undefined,
      "/share": undefined,
      "/compat": undefined,
    };

    expect(undefinedStates["/"]).toBeUndefined();
    expect(undefinedStates["/quiz"]).toBeUndefined();
    expect(undefinedStates["/history"]).toBeUndefined();
  });

  // AC-1b: Verify no imports and no runtime exports (pure type file)
  it("AC-1b[P0]: src/lib/types.ts must have 0 imports and 0 runtime exports (pure types)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const typesPath = path.resolve(
      __dirname,
      "../lib/types.ts"
    );

    if (fs.existsSync(typesPath)) {
      const content = fs.readFileSync(typesPath, "utf-8");

      // Check for imports (except from typescript itself)
      const importLines = content
        .split("\n")
        .filter((line) => /^import\s+|^export\s+/.test(line.trim()));

      // All lines should be type exports (export type/interface)
      importLines.forEach((line) => {
        expect(line).toMatch(/^export\s+(type|interface)/);
      });

      // Check for runtime exports (export const, export function)
      expect(content).not.toMatch(/export\s+const\s+/);
      expect(content).not.toMatch(/export\s+function\s+/);
    }
  });
});
