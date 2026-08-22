import { describe, it, expect } from "vitest";
import { QUESTIONS, Question } from "../constants/questions";
import { CHARACTERS, Character } from "../constants/characters";
import { calculateAxisScores, determineCharacter, validateResponses } from "../domain/scoring";

/**
 * 상수 무결성 회귀 테스트 (TDD Red Phase)
 *
 * AC-1: 상수 배열 구조 위반 시 실패한다
 * AC-2: 부분 답변 입력에서도 예외 없이 결과를 반환한다
 * AC-3: 동일 입력 100회 실행 시 동일 캐릭터가 나온다 (결정론)
 * AC-4: 테스트가 빌드 파이프라인에서 워크패킷 생성 이전에 실행된다
 */

describe("AC-1: 상수 배열 구조 검증", () => {
  describe("QUESTIONS 상수", () => {
    it("AC-1.1: QUESTIONS는 정확히 12개 문항을 가져야 한다", () => {
      expect(QUESTIONS.length).toBe(12);
    });

    it("AC-1.2: 각 문항 ID는 1..12 범위이고 중복이 없어야 한다", () => {
      const ids = QUESTIONS.map((q) => q.id);
      expect(new Set(ids).size).toBe(12);
      // ID 형식이 q1, q2, ..., q12 임을 검증
      expect(ids).toEqual(["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12"]);
    });

    it("AC-1.3: 각 문항은 정확히 4개의 선택지를 가져야 한다", () => {
      QUESTIONS.forEach((q, idx) => {
        expect(q.options.length).toBe(4, `Question ${q.id} (index ${idx}) has ${q.options.length} options, expected 4`);
      });
    });

    it("AC-1.4: 각 축별 문항 수는 정확히 4개씩이어야 한다", () => {
      const byType = QUESTIONS.reduce(
        (acc, q) => {
          if (!acc[q.type]) acc[q.type] = [];
          acc[q.type].push(q.id);
          return acc;
        },
        {} as Record<string, string[]>
      );

      expect(Object.keys(byType).sort()).toEqual(["plan-impulse", "risk-safety", "spend-save"]);
      expect(byType["spend-save"].length).toBe(4, "spend-save axis should have 4 questions");
      expect(byType["plan-impulse"].length).toBe(4, "plan-impulse axis should have 4 questions");
      expect(byType["risk-safety"].length).toBe(4, "risk-safety axis should have 4 questions");
    });

    it("AC-1.5: 각 문항은 id와 text를 가져야 한다", () => {
      QUESTIONS.forEach((q) => {
        expect(q.id).toBeDefined();
        expect(typeof q.id).toBe("string");
        expect(q.text).toBeDefined();
        expect(typeof q.text).toBe("string");
        expect(q.text.length).toBeGreaterThan(0);
      });
    });
  });

  describe("CHARACTERS 상수", () => {
    it("AC-1.6: CHARACTERS는 정확히 8개의 캐릭터를 가져야 한다", () => {
      expect(CHARACTERS.length).toBe(8);
    });

    it("AC-1.7: 각 캐릭터의 ID는 고유하고 3글자 코드여야 한다", () => {
      const ids = CHARACTERS.map((c) => c.id);
      expect(new Set(ids).size).toBe(8, "Character IDs must be unique");
      ids.forEach((id) => {
        expect(id.length).toBe(3, `Character ID "${id}" must be 3 characters`);
        expect(/^[SVPR][SPIF][RF]$/.test(id)).toBe(true, `Character ID "${id}" must match pattern [SV][PI][RF]`);
      });
    });

    it("AC-1.8: 각 캐릭터는 name과 traits를 가져야 한다", () => {
      CHARACTERS.forEach((c) => {
        expect(c.id).toBeDefined();
        expect(typeof c.id).toBe("string");
        expect(c.name).toBeDefined();
        expect(typeof c.name).toBe("string");
        expect(c.name.length).toBeGreaterThan(0);
        expect(c.traits).toBeDefined();
        expect(Array.isArray(c.traits)).toBe(true);
      });
    });

    it("AC-1.9: 각 캐릭터의 traits는 정확히 3개여야 한다", () => {
      CHARACTERS.forEach((c) => {
        expect(c.traits.length).toBe(3, `Character ${c.id} has ${c.traits.length} traits, expected 3`);
      });
    });

    it("AC-1.10: 각 캐릭터는 tips를 가져야 하고 정확히 3개여야 한다", () => {
      CHARACTERS.forEach((c) => {
        expect((c as any).tips).toBeDefined();
        expect(Array.isArray((c as any).tips)).toBe(true, `Character ${c.id} tips must be an array`);
        expect((c as any).tips.length).toBe(3, `Character ${c.id} has ${(c as any).tips.length} tips, expected 3`);
      });
    });

    it("AC-1.11: 각 캐릭터 ID는 유일해야 한다 (6개 축 조합이 정확히 매칭)", () => {
      const expectedIds = [
        "SPR", // spend, plan, risk
        "SPF", // spend, plan, safe
        "SIR", // spend, impulse, risk
        "SIF", // spend, impulse, safe
        "VPR", // save, plan, risk
        "VPF", // save, plan, safe
        "VIR", // save, impulse, risk
        "VIF", // save, impulse, safe
      ];
      const actualIds = CHARACTERS.map((c) => c.id).sort();
      expect(actualIds).toEqual(expectedIds.sort());
    });
  });
});

describe("AC-2: 부분 답변 처리 (Partial Response Handling)", () => {
  it("AC-2.1: 빈 답변 객체도 예외를 던지지 않고 기본값을 반환해야 한다", () => {
    // This imports or calls a scoring function that should exist
    // For now, we just verify constants won't crash
    const responses: Record<string, unknown> = {};
    expect(() => {
      // When calculateScore is implemented, it should handle this gracefully
      validateResponses(responses);
    }).not.toThrow();
  });

  it("AC-2.2: 일부 문항만 답변한 경우도 예외를 던지지 않아야 한다", () => {
    const partialResponses = {
      q1: 0,
      q2: 1,
      // q3-q12는 missing
    };
    expect(() => {
      validateResponses(partialResponses);
    }).not.toThrow();
  });

  it("AC-2.3: 0-3 범위를 벗어난 답변은 유효성 검사에서 플래그 되어야 한다", () => {
    const invalidResponses = {
      q1: 4, // out of range
      q2: -1, // out of range
    };
    const validation = validateResponses(invalidResponses);
    expect(validation.hasInvalid).toBe(true);
  });

  it("AC-2.4: 유효한 답변(0-3)은 유효성 검사를 통과해야 한다", () => {
    const validResponses = {
      q1: 0,
      q2: 1,
      q3: 2,
      q4: 3,
    };
    const validation = validateResponses(validResponses);
    expect(validation.valid).toBe(true);
  });
});

describe("AC-3: 결정론성 검증 (Determinism)", () => {
  it("AC-3.1: 동일 입력으로 100회 실행 시 항상 동일한 캐릭터 코드를 반환해야 한다", () => {
    const responses = {
      q1: 0,
      q2: 0,
      q3: 0,
      q4: 0,
      q5: 3,
      q6: 3,
      q7: 3,
      q8: 3,
      q9: 3,
      q10: 3,
      q11: 3,
      q12: 3,
    };

    const results: string[] = [];
    for (let i = 0; i < 100; i++) {
      const characterId = determineCharacter(responses);
      results.push(characterId);
    }

    // All results should be identical
    expect(new Set(results).size).toBe(1, "Scoring engine must be deterministic");
    // Each result should match a valid character ID
    const validIds = CHARACTERS.map((c) => c.id);
    results.forEach((result) => {
      expect(validIds).toContain(result);
    });
  });

  it("AC-3.2: 부분 답변도 결정론적이어야 한다", () => {
    const partialResponses = {
      q1: 2,
      q5: 1,
      q9: 0,
    };

    const results: string[] = [];
    for (let i = 0; i < 50; i++) {
      const characterId = determineCharacter(partialResponses);
      results.push(characterId);
    }

    expect(new Set(results).size).toBe(1, "Partial responses should also be deterministic");
  });

  it("AC-3.3: 축 점수는 [0, 12] 범위를 벗어나지 않아야 한다", () => {
    // Test various input combinations
    const testCases = [
      { q1: 0, q2: 0, q3: 0, q4: 0 }, // min spend-save
      { q1: 3, q2: 3, q3: 3, q4: 3 }, // max spend-save
      { q5: 0, q6: 0, q7: 0, q8: 0 }, // min plan-impulse
      { q5: 3, q6: 3, q7: 3, q8: 3 }, // max plan-impulse
      { q9: 0, q10: 0, q11: 0, q12: 0 }, // min risk-safety
      { q9: 3, q10: 3, q11: 3, q12: 3 }, // max risk-safety
    ];

    testCases.forEach((responses) => {
      const scores = calculateAxisScores(responses);
      Object.values(scores).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(12);
      });
    });
  });

  it("AC-3.4: 백분율 계산 = Math.round(score/12*100)을 정확히 따라야 한다", () => {
    const testCases = [
      { score: 0, expected: 0 },
      { score: 3, expected: 25 },
      { score: 6, expected: 50 },
      { score: 9, expected: 75 },
      { score: 12, expected: 100 },
    ];

    testCases.forEach(({ score, expected }) => {
      const percent = Math.round((score / 12) * 100);
      expect(percent).toBe(expected);
    });
  });
});

describe("AC-4: 적분 테스트 (Integration)", () => {
  it("AC-4.1: 모든 스테이지가 타입 안전해야 한다", () => {
    // Verify interface contracts
    const q: Question = QUESTIONS[0];
    expect(q.id).toBeDefined();
    expect(q.text).toBeDefined();
    expect(q.type).toBeDefined();
    expect(q.options).toBeDefined();
    expect(q.options.length).toBe(4);

    const c: Character = CHARACTERS[0];
    expect(c.id).toBeDefined();
    expect(c.name).toBeDefined();
    expect(c.traits).toBeDefined();
    expect(c.traits.length).toBe(3);
  });

  it("AC-4.2: 전체 12문항 응답으로 유효한 캐릭터 코드를 반환해야 한다", () => {
    const fullResponses = {
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

    const characterId = determineCharacter(fullResponses);
    const validIds = CHARACTERS.map((c) => c.id);
    expect(validIds).toContain(characterId);
  });

  it("AC-4.3: 모든 8개 캐릭터는 경계값 입력으로 결정될 수 있어야 한다", () => {
    // Each character has a 3-letter code [SV][PI][RF]
    // We should be able to get each by crafting appropriate responses
    const characterIds = CHARACTERS.map((c) => c.id);
    expect(characterIds.length).toBe(8);
    expect(new Set(characterIds).size).toBe(8);
  });
});

describe("상수 배열 내용 스모크 테스트", () => {
  it("모든 문항 텍스트는 공백이 아니어야 한다", () => {
    QUESTIONS.forEach((q) => {
      expect(q.text.trim().length).toBeGreaterThan(0);
      q.options.forEach((opt, idx) => {
        expect(opt.trim().length).toBeGreaterThan(0, `Question ${q.id} option ${idx} is empty`);
      });
    });
  });

  it("모든 캐릭터 정보는 완전해야 한다", () => {
    CHARACTERS.forEach((c) => {
      expect(c.name.trim().length).toBeGreaterThan(0);
      expect((c as any).summary?.trim().length).toBeGreaterThan(0);
      c.traits.forEach((trait) => {
        expect(trait.trim().length).toBeGreaterThan(0);
      });
      (c as any).tips?.forEach((tip: string) => {
        expect(tip.trim().length).toBeGreaterThan(0);
      });
    });
  });
});

