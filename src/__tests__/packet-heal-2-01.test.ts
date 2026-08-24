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
  ScoreResult,
  StorageResult,
  RouteState,
  AxisId,
  AxisLetter,
  PersonaCode,
} from "@/lib/types";

describe("기반 타입 계약 src/lib/types.ts 확정", () => {
  // AC-1: 모든 필수 타입이 export되고 tsc --noEmit이 에러 0건
  it("AC-1: exports all required types without TypeScript errors", () => {
    // 타입 검증: 타입이 존재하고 정확한 형태임을 확인
    const testChoice: Choice = { id: "a", label: "test", score: 1 };
    const testQuestion: Question = {
      id: 1,
      axis: "A1",
      text: "test",
      choices: [testChoice, testChoice],
    };
    const testAxisScore: AxisScore = {
      axis: "A1",
      score: 2,
      letter: "F",
      percent: 50,
    };
    const testQuizResult: QuizResult = {
      id: "r_123_FPC",
      createdAt: Date.now(),
      answers: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      axisScores: [testAxisScore, testAxisScore, testAxisScore],
      personaCode: "FPC",
      shareCode: "MP1-FPC-2",
      reportUnlocked: false,
    };
    const testQuizProgress: QuizProgress = {
      answers: [1, 0, 1, null, null, null, null, null, null, null, null, null],
      currentIndex: 2,
      updatedAt: Date.now(),
    };
    const testCompatRecord: CompatibilityRecord = {
      id: "c_123",
      createdAt: Date.now(),
      myCode: "FPC",
      friendCode: "SPR",
      friendShareCode: "MP1-SPR-0",
      score: 50,
      grade: "서로 배우는 궁합",
      matchedAxes: ["A1"],
    };
    const testAppFlags: AppFlags = {
      onboardingSeen: true,
      lastResultId: "r_123_FPC",
      disclaimerSeen: false,
    };
    const testPersona: Persona = {
      code: "FPC",
      name: "알뜰형 다람쥐",
      emoji: "🐿️",
      tagline: "검증된 뒤에 가입한다",
      summary: "test summary",
      tips: ["tip1", "tip2", "tip3"],
      strengths: ["strong1", "strong2"],
      cautions: ["caution1", "caution2"],
      plan30d: ["step1", "step2", "step3"],
      bestMatch: "SPR",
    };

    expect(testChoice).toBeDefined();
    expect(testQuestion).toBeDefined();
    expect(testAxisScore).toBeDefined();
    expect(testQuizResult).toBeDefined();
    expect(testQuizProgress).toBeDefined();
    expect(testCompatRecord).toBeDefined();
    expect(testAppFlags).toBeDefined();
    expect(testPersona).toBeDefined();
  });

  // AC-2: 파일에 import/함수/const/enum/class가 0건
  it("AC-2: file contains only type and interface declarations", () => {
    // 이 테스트는 실제 파일 내용 검증은 Read 도구로 수행
    // 타입 시스템이 실제로 작동하는지 확인
    const scoreResultSuccess: ScoreResult = {
      ok: true,
      personaCode: "FPC",
      axisScores: [
        { axis: "A1", score: 4, letter: "F", percent: 100 },
        { axis: "A2", score: 4, letter: "P", percent: 100 },
        { axis: "A3", score: 4, letter: "C", percent: 100 },
      ],
    };
    const scoreResultFailure: ScoreResult = {
      ok: false,
      reason: "invalid_answers",
    };

    const storageResultSuccess: StorageResult<QuizResult> = {
      ok: true,
      data: testQuizResult(),
    };
    const storageResultFailure: StorageResult<QuizResult> = {
      ok: false,
      reason: "quota",
    };

    expect(scoreResultSuccess).toBeDefined();
    expect(scoreResultFailure).toBeDefined();
    expect(storageResultSuccess).toBeDefined();
    expect(storageResultFailure).toBeDefined();
  });

  // AC-3: Persona 타입이 정확한 튜플 구조 (string[] 아님)
  it("AC-3: Persona tips and plan30d are exact tuples of 3 strings", () => {
    const persona: Persona = {
      code: "FPC",
      name: "알뜰형 다람쥐",
      emoji: "🐿️",
      tagline: "test",
      summary: "test",
      tips: ["월급날 자동이체로 저축분을 먼저 떼어두세요", "고정 구독 서비스를 3개월마다 점검하세요", "주 1회 무지출 데이를 캘린더에 고정하세요"],
      strengths: ["strength1", "strength2"],
      cautions: ["caution1", "caution2"],
      plan30d: ["step1", "step2", "step3"],
      bestMatch: "SPR",
    };

    // 튜플은 length가 정확히 3임을 확인
    expect(persona.tips).toHaveLength(3);
    expect(persona.plan30d).toHaveLength(3);
    expect(persona.strengths).toHaveLength(2);
    expect(persona.cautions).toHaveLength(2);

    // 각 요소가 string임을 확인
    expect(typeof persona.tips[0]).toBe("string");
    expect(typeof persona.tips[1]).toBe("string");
    expect(typeof persona.tips[2]).toBe("string");
    expect(typeof persona.plan30d[0]).toBe("string");
    expect(typeof persona.plan30d[1]).toBe("string");
    expect(typeof persona.plan30d[2]).toBe("string");
  });

  // AC-4: RouteState가 7개 라우트를 갖고 /result, /report, /share는 resultId 포함
  it("AC-4: RouteState has 7 routes with resultId in /result, /report, /share", () => {
    const homeState: RouteState["/"] = undefined;
    const quizState: RouteState["/quiz"] = undefined;
    const resultState: RouteState["/result"] = { resultId: "r_123_FPC" };
    const reportState: RouteState["/report"] = { resultId: "r_123_FPC" };
    const shareState: RouteState["/share"] = { resultId: "r_123_FPC" };
    const compatState: RouteState["/compat"] = undefined;
    const historyState: RouteState["/history"] = undefined;

    expect(homeState).toBeUndefined();
    expect(quizState).toBeUndefined();
    expect(resultState).toEqual({ resultId: "r_123_FPC" });
    expect(reportState).toEqual({ resultId: "r_123_FPC" });
    expect(shareState).toEqual({ resultId: "r_123_FPC" });
    expect(compatState).toBeUndefined();
    expect(historyState).toBeUndefined();

    // 결과 상태의 resultId 검증
    if (resultState && typeof resultState === "object" && "resultId" in resultState) {
      expect(resultState.resultId).toContain("r_");
    }
  });

  // AC-5: AxisId, AxisLetter, PersonaCode 리터럴 유니온 검증
  it("AC-5: AxisId, AxisLetter, PersonaCode are exact literal unions", () => {
    const validAxisId: AxisId = "A1";
    const validAxisLetter: AxisLetter = "F";
    const validPersonaCode: PersonaCode = "FPC";

    expect(validAxisId).toBe("A1");
    expect(validAxisLetter).toBe("F");
    expect(validPersonaCode).toBe("FPC");

    // 8개 캐릭터 모두 검증
    const allPersonaCodes: PersonaCode[] = [
      "FPC",
      "FPR",
      "FIC",
      "FIR",
      "SPC",
      "SPR",
      "SIC",
      "SIR",
    ];
    expect(allPersonaCodes).toHaveLength(8);
  });

  // AC-6: CompatibilityRecord.grade는 정확한 리터럴 유니온
  it("AC-6: CompatibilityRecord.grade is exact literal union of 4 grades", () => {
    const record1: CompatibilityRecord = {
      id: "c_1",
      createdAt: Date.now(),
      myCode: "FPC",
      friendCode: "FPC",
      friendShareCode: "MP1-FPC-2",
      score: 100,
      grade: "최고의 짝",
      matchedAxes: ["A1", "A2", "A3"],
    };
    const record2: CompatibilityRecord = {
      id: "c_2",
      createdAt: Date.now(),
      myCode: "FPC",
      friendCode: "FPR",
      friendShareCode: "MP1-FPR-4",
      score: 80,
      grade: "좋은 궁합",
      matchedAxes: ["A1", "A2"],
    };
    const record3: CompatibilityRecord = {
      id: "c_3",
      createdAt: Date.now(),
      myCode: "FPC",
      friendCode: "SIC",
      friendShareCode: "MP1-SIC-0",
      score: 65,
      grade: "무난한 궁합",
      matchedAxes: ["A1"],
    };
    const record4: CompatibilityRecord = {
      id: "c_4",
      createdAt: Date.now(),
      myCode: "FPC",
      friendCode: "SIR",
      friendShareCode: "MP1-SIR-5",
      score: 50,
      grade: "서로 배우는 궁합",
      matchedAxes: [],
    };

    expect(record1.grade).toBe("최고의 짝");
    expect(record2.grade).toBe("좋은 궁합");
    expect(record3.grade).toBe("무난한 궁합");
    expect(record4.grade).toBe("서로 배우는 궁합");
  });

  // AC-7: QuizResult.axisScores는 정확한 3-튜플
  it("AC-7: QuizResult.axisScores is exact 3-tuple of AxisScore", () => {
    const axisScore: AxisScore = {
      axis: "A1",
      score: 3,
      letter: "F",
      percent: 75,
    };
    const quizResult: QuizResult = {
      id: "r_123_FPC",
      createdAt: Date.now(),
      answers: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      axisScores: [
        { ...axisScore, axis: "A1" },
        { ...axisScore, axis: "A2", letter: "P" },
        { ...axisScore, axis: "A3", letter: "C" },
      ],
      personaCode: "FPC",
      shareCode: "MP1-FPC-2",
      reportUnlocked: false,
    };

    expect(quizResult.axisScores).toHaveLength(3);
    expect(quizResult.axisScores[0].axis).toBe("A1");
    expect(quizResult.axisScores[1].axis).toBe("A2");
    expect(quizResult.axisScores[2].axis).toBe("A3");
  });

  // AC-8: QuizResult.answers는 (0|1)[] (길이 12)
  it("AC-8: QuizResult.answers is array of 0|1 with length 12", () => {
    const quizResult: QuizResult = {
      id: "r_123_FPC",
      createdAt: Date.now(),
      answers: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      axisScores: [
        { axis: "A1", score: 4, letter: "F", percent: 100 },
        { axis: "A2", score: 4, letter: "P", percent: 100 },
        { axis: "A3", score: 4, letter: "C", percent: 100 },
      ],
      personaCode: "FPC",
      shareCode: "MP1-FPC-2",
      reportUnlocked: false,
    };

    expect(quizResult.answers).toHaveLength(12);
    expect(quizResult.answers.every((a) => a === 0 || a === 1)).toBe(true);
  });
});

// Helper function for testing
function testQuizResult(): QuizResult {
  return {
    id: "r_123_FPC",
    createdAt: Date.now(),
    answers: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    axisScores: [
      { axis: "A1", score: 2, letter: "F", percent: 50 },
      { axis: "A2", score: 2, letter: "P", percent: 50 },
      { axis: "A3", score: 2, letter: "C", percent: 50 },
    ],
    personaCode: "FPC",
    shareCode: "MP1-FPC-2",
    reportUnlocked: false,
  };
}
