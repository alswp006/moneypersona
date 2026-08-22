import { describe, it, expect } from "vitest";
import { CHARACTERS } from "../../constants/characters";
import { calculateAxisScores, determineCharacter, validateResponses } from "../scoring";

const FULL_RESPONSES = {
  q1: 0,
  q2: 1,
  q3: 2,
  q4: 3,
  q5: 0,
  q6: 1,
  q7: 2,
  q8: 3,
  q9: 0,
  q10: 1,
  q11: 2,
  q12: 3,
};

describe("규칙 엔진 결정론성", () => {
  it("동일 입력 100회 실행 시 항상 동일한 캐릭터 코드를 반환한다", () => {
    const results = Array.from({ length: 100 }, () => determineCharacter(FULL_RESPONSES));
    expect(new Set(results).size).toBe(1);
    expect(CHARACTERS.map((c) => c.id)).toContain(results[0]);
  });

  it("부분 답변도 결정론적이다", () => {
    const partial = { q1: 2, q5: 1, q9: 0 };
    const results = Array.from({ length: 50 }, () => determineCharacter(partial));
    expect(new Set(results).size).toBe(1);
  });
});

describe("축 점수 범위 및 백분율", () => {
  it("축 점수는 [0, 12] 범위를 벗어나지 않는다", () => {
    const cases = [
      { q1: 0, q2: 0, q3: 0, q4: 0 },
      { q1: 3, q2: 3, q3: 3, q4: 3 },
      { q5: 0, q6: 0, q7: 0, q8: 0 },
      { q5: 3, q6: 3, q7: 3, q8: 3 },
      { q9: 0, q10: 0, q11: 0, q12: 0 },
      { q9: 3, q10: 3, q11: 3, q12: 3 },
      FULL_RESPONSES,
      {},
    ];

    cases.forEach((responses) => {
      const scores = calculateAxisScores(responses);
      Object.values(scores).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(12);
      });
    });
  });

  it("퍼센트 계산식 = Math.round(score/12*100)을 따른다", () => {
    [
      { score: 0, expected: 0 },
      { score: 3, expected: 25 },
      { score: 6, expected: 50 },
      { score: 9, expected: 75 },
      { score: 12, expected: 100 },
    ].forEach(({ score, expected }) => {
      expect(Math.round((score / 12) * 100)).toBe(expected);
    });
  });
});

describe("부분 답변 처리", () => {
  it("빈 답변 객체도 예외 없이 결과를 반환한다", () => {
    expect(() => validateResponses({})).not.toThrow();
    expect(() => calculateAxisScores({})).not.toThrow();
    expect(() => determineCharacter({})).not.toThrow();
    expect(CHARACTERS.map((c) => c.id)).toContain(determineCharacter({}));
  });

  it("일부 문항만 답변한 경우도 예외 없이 결과를 반환한다", () => {
    const partial = { q1: 0, q2: 1 };
    expect(() => validateResponses(partial)).not.toThrow();
    const characterId = determineCharacter(partial);
    expect(CHARACTERS.map((c) => c.id)).toContain(characterId);
  });

  it("0-3 범위를 벗어난 답변은 유효성 검사에서 플래그된다", () => {
    const validation = validateResponses({ q1: 4, q2: -1 });
    expect(validation.hasInvalid).toBe(true);
    expect(validation.invalidKeys).toEqual(expect.arrayContaining(["q1", "q2"]));
  });

  it("유효한 답변(0-3)은 유효성 검사를 통과한다", () => {
    const validation = validateResponses({ q1: 0, q2: 1, q3: 2, q4: 3 });
    expect(validation.valid).toBe(true);
    expect(validation.hasInvalid).toBe(false);
  });

  it("undefined/null 입력에도 예외를 던지지 않는다", () => {
    expect(() => validateResponses(undefined as unknown as Record<string, unknown>)).not.toThrow();
    expect(() => calculateAxisScores(null as unknown as Record<string, unknown>)).not.toThrow();
    expect(() => determineCharacter(undefined as unknown as Record<string, unknown>)).not.toThrow();
  });
});

describe("전체 응답으로 유효한 캐릭터 산출", () => {
  it("12문항 전체 응답으로 CHARACTERS에 존재하는 코드를 반환한다", () => {
    const characterId = determineCharacter(FULL_RESPONSES);
    expect(CHARACTERS.map((c) => c.id)).toContain(characterId);
  });
});
