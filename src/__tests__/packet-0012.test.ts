/**
 * TDD RED PHASE: packet-0012 — 12문항 상수 테이블 (QUESTIONS)
 *
 * AC-1: QUESTIONS.length === 12, id set === {1..12}
 * AC-2: axis 분포 — spend 4, plan 4, risk 4
 * AC-3: text 길이 20~60자, options 구조 (A/B, value {0,1})
 * AC-4: types.ts만 import, HEX 리터럴 0개 (자동 검증)
 */

import { describe, it, expect } from "vitest";
import { QUESTIONS } from "@/domain/questions";
import type { Question } from "@/lib/types";

describe("QUESTIONS: 12문항 상수 테이블", () => {
  // AC-1: 정확히 12개, id 1~12
  it("AC-1[P0]: QUESTIONS.length === 12", () => {
    expect(QUESTIONS).toHaveLength(12);
  });

  it("AC-1[P0]: id 집합이 정확히 {1..12}와 일치한다", () => {
    const ids = QUESTIONS.map((q) => q.id).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    // 중복 없음 (Set 크기 검증)
    const uniqueIds = new Set(QUESTIONS.map((q) => q.id));
    expect(uniqueIds.size).toBe(12);
  });

  // AC-2: axis 분포
  it("AC-2[P0]: spend축 문항이 정확히 4개다 (id 1~4)", () => {
    const spendQuestions = QUESTIONS.filter((q) => q.axis === "spend");
    expect(spendQuestions).toHaveLength(4);

    // spend는 id 1~4
    const spendIds = spendQuestions.map((q) => q.id).sort((a, b) => a - b);
    expect(spendIds).toEqual([1, 2, 3, 4]);
  });

  it("AC-2[P0]: plan축 문항이 정확히 4개다 (id 5~8)", () => {
    const planQuestions = QUESTIONS.filter((q) => q.axis === "plan");
    expect(planQuestions).toHaveLength(4);

    // plan은 id 5~8
    const planIds = planQuestions.map((q) => q.id).sort((a, b) => a - b);
    expect(planIds).toEqual([5, 6, 7, 8]);
  });

  it("AC-2[P0]: risk축 문항이 정확히 4개다 (id 9~12)", () => {
    const riskQuestions = QUESTIONS.filter((q) => q.axis === "risk");
    expect(riskQuestions).toHaveLength(4);

    // risk는 id 9~12
    const riskIds = riskQuestions.map((q) => q.id).sort((a, b) => a - b);
    expect(riskIds).toEqual([9, 10, 11, 12]);
  });

  // AC-3: text 길이 및 options 구조
  it("AC-3[P0]: 모든 text 길이가 20~60자다", () => {
    QUESTIONS.forEach((q) => {
      expect(q.text.length).toBeGreaterThanOrEqual(20);
      expect(q.text.length).toBeLessThanOrEqual(60);
    });
  });

  it("AC-3[P0]: 모든 문항이 정확히 2개의 선택지를 가진다", () => {
    QUESTIONS.forEach((q) => {
      expect(q.options).toHaveLength(2);
      expect(q.options[0].key).toBe("A");
      expect(q.options[1].key).toBe("B");
    });
  });

  it("AC-3[P0]: 모든 선택지의 value가 {0,1}을 포함한다", () => {
    QUESTIONS.forEach((q) => {
      const values = new Set([q.options[0].value, q.options[1].value]);
      expect(values.size).toBe(2);
      expect(values.has(0)).toBe(true);
      expect(values.has(1)).toBe(true);
    });
  });

  it("AC-3[P1]: 모든 선택지가 label을 가진다", () => {
    QUESTIONS.forEach((q) => {
      expect(q.options[0].label).toBeDefined();
      expect(q.options[0].label.length).toBeGreaterThan(0);
      expect(q.options[1].label).toBeDefined();
      expect(q.options[1].label.length).toBeGreaterThan(0);
    });
  });

  // AC-4 보조: type guard (Question 타입 확인)
  it("AC-4[P1]: 모든 항목이 Question 타입을 만족한다", () => {
    QUESTIONS.forEach((q: Question) => {
      expect(typeof q.id).toBe("number");
      expect(["spend", "plan", "risk"]).toContain(q.axis);
      expect(typeof q.text).toBe("string");
      expect(Array.isArray(q.options)).toBe(true);
    });
  });

  // 보조 테스트: text가 제목처럼 보이지 않음 (앞말) 확인
  it("AC-3[P1]: text에 불필요한 마침표(.)로 끝나지 않는다", () => {
    QUESTIONS.forEach((q) => {
      // 한국어 마침표는 보통 없음, 영문 마침표 없음
      expect(q.text).not.toMatch(/\.$|。$/);
    });
  });
});
