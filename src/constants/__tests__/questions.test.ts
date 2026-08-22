import { describe, it, expect } from "vitest";
import { QUESTIONS, Question } from "../questions";

/**
 * QUESTIONS 상수 무결성 회귀 테스트
 * undefined 배열이 하류(퀴즈 화면·채점 엔진)로 흘러가는 것을 조기에 잡는다.
 */
describe("QUESTIONS 상수 무결성", () => {
  it("정확히 12개 문항을 가진다", () => {
    expect(Array.isArray(QUESTIONS)).toBe(true);
    expect(QUESTIONS.length).toBe(12);
  });

  it("id는 1..12에 대응하고 중복이 없다", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(12);
    expect(ids).toEqual(Array.from({ length: 12 }, (_, i) => `q${i + 1}`));
  });

  it("각 문항의 options는 정확히 4개다", () => {
    QUESTIONS.forEach((q) => {
      expect(q.options.length).toBe(4);
    });
  });

  it("각 문항의 옵션 점수 집합은 {0,1,2,3}이고 합은 6이다", () => {
    QUESTIONS.forEach((q) => {
      const scores = q.options.map((_, idx) => idx);
      expect(new Set(scores)).toEqual(new Set([0, 1, 2, 3]));
      expect(scores.reduce((a, b) => a + b, 0)).toBe(6);
    });
  });

  it("축(type)별 문항 수는 정확히 4개씩이다", () => {
    const byType = QUESTIONS.reduce(
      (acc, q) => {
        acc[q.type] = (acc[q.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    expect(Object.keys(byType).sort()).toEqual(["plan-impulse", "risk-safety", "spend-save"]);
    expect(byType["spend-save"]).toBe(4);
    expect(byType["plan-impulse"]).toBe(4);
    expect(byType["risk-safety"]).toBe(4);
  });

  it("문항 텍스트와 옵션 텍스트는 비어 있지 않다", () => {
    QUESTIONS.forEach((q) => {
      expect(q.text.trim().length).toBeGreaterThan(0);
      q.options.forEach((opt) => {
        expect(opt.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it("타입 계약(Question)을 만족한다", () => {
    const q: Question = QUESTIONS[0];
    expect(typeof q.id).toBe("string");
    expect(typeof q.text).toBe("string");
    expect(typeof q.type).toBe("string");
    expect(Array.isArray(q.options)).toBe(true);
  });
});
