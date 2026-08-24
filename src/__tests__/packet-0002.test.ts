import { describe, it, expect } from "vitest";
import type { Question } from "@/lib/types";

// These imports will fail until implementation is complete (TDD red phase)
let QUESTIONS: readonly Question[];
let getQuestion: (index: number) => Question | null;

// Mock implementation placeholder (will be replaced by actual import once src/data/questions.ts exists)
describe("Packet 0002: 12문항 정적 콘텐츠 + 무결성 테스트", () => {
  // Dynamically import to allow graceful TDD red phase
  it("setup: loads QUESTIONS and getQuestion", async () => {
    try {
      const module = await import("@/data/questions");
      QUESTIONS = module.QUESTIONS;
      getQuestion = module.getQuestion;
    } catch {
      // Expected to fail in red phase — implementation not yet written
      expect.hasAssertions();
    }
  });
});

// Tests run only after module loads
describe("AC-1[P0]: QUESTIONS integrity (12 items, id 1..12, SPEC text/choices exact match)", () => {
  it("QUESTIONS is exactly 12 items with ids 1..12 in ascending order", async () => {
    const module = await import("@/data/questions");
    const { QUESTIONS } = module;

    expect(QUESTIONS).toHaveLength(12);
    QUESTIONS.forEach((q, i) => {
      expect(q.id).toBe(i + 1);
    });
  });

  it("question texts match SPEC exactly", async () => {
    const module = await import("@/data/questions");
    const { QUESTIONS } = module;

    const expectedTexts = [
      "월급날 가장 먼저 하는 일은?",
      "평일 커피값은?",
      "세일 알림을 봤다",
      "20분 더 걸리지만 요금은 1/5",
      "여행을 갈 때 나는",
      "가계부는?",
      "큰 지출을 앞두고",
      "다음 달 고정지출 금액을",
      "여윳돈 100만 원이 생기면",
      "투자 원금이 20% 하락하면",
      "새로 나온 금융상품을 보면",
      "수입을 늘릴 기회가 있다면",
    ];

    QUESTIONS.forEach((q, i) => {
      expect(q.text).toBe(expectedTexts[i]);
    });
  });

  it("choice labels match SPEC exactly (choice a and b)", async () => {
    const module = await import("@/data/questions");
    const { QUESTIONS } = module;

    const expected = [
      [
        "저축·투자 계좌로 이체한다",
        "사고 싶던 걸 결제한다",
      ],
      [
        "회사 탕비실이나 편의점",
        "매일 카페에서 사 마신다",
      ],
      ["필요 없으면 안 산다", "일단 장바구니에 담는다"],
      ["지하철을 탄다", "택시를 탄다"],
      ["일정표를 미리 만든다", "가서 그때그때 정한다"],
      ["매달 기록하고 점검한다", "쓰지 않는다"],
      ["최소 3곳을 비교한다", "마음에 들면 바로 산다"],
      ["대략 알고 있다", "모른다"],
      ["예적금·파킹통장에 넣는다", "주식·코인 등에 투자한다"],
      ["정리하고 예금으로 옮긴다", "추가로 더 매수한다"],
      ["검증된 뒤에 가입한다", "먼저 써보고 판단한다"],
      ["안정적인 월급이 최고다", "리스크가 있어도 도전한다"],
    ];

    QUESTIONS.forEach((q, i) => {
      expect(q.choices[0].label).toBe(expected[i][0]);
      expect(q.choices[1].label).toBe(expected[i][1]);
    });
  });
});

describe("AC-2[P0]: Axis distribution & choice structure (4/4/4 per axis, scores 1/0)", () => {
  it("should have exactly 4 questions per axis", async () => {
    const module = await import("@/data/questions");
    const { QUESTIONS } = module;

    const a1 = QUESTIONS.filter((q) => q.axis === "A1");
    const a2 = QUESTIONS.filter((q) => q.axis === "A2");
    const a3 = QUESTIONS.filter((q) => q.axis === "A3");

    expect(a1).toHaveLength(4);
    expect(a2).toHaveLength(4);
    expect(a3).toHaveLength(4);
  });

  it("A1 questions should have ids 1-4", async () => {
    const module = await import("@/data/questions");
    const { QUESTIONS } = module;

    const a1 = QUESTIONS.filter((q) => q.axis === "A1");
    expect(a1.map((q) => q.id)).toEqual([1, 2, 3, 4]);
  });

  it("A2 questions should have ids 5-8", async () => {
    const module = await import("@/data/questions");
    const { QUESTIONS } = module;

    const a2 = QUESTIONS.filter((q) => q.axis === "A2");
    expect(a2.map((q) => q.id)).toEqual([5, 6, 7, 8]);
  });

  it("A3 questions should have ids 9-12", async () => {
    const module = await import("@/data/questions");
    const { QUESTIONS } = module;

    const a3 = QUESTIONS.filter((q) => q.axis === "A3");
    expect(a3.map((q) => q.id)).toEqual([9, 10, 11, 12]);
  });

  it("all questions should have exactly 2 choices", async () => {
    const module = await import("@/data/questions");
    const { QUESTIONS } = module;

    QUESTIONS.forEach((q) => {
      expect(q.choices).toHaveLength(2);
    });
  });

  it("choice[0] should have score 1, choice[1] should have score 0", async () => {
    const module = await import("@/data/questions");
    const { QUESTIONS } = module;

    QUESTIONS.forEach((q) => {
      expect(q.choices[0].score).toBe(1);
      expect(q.choices[0].id).toBe("a");
      expect(q.choices[1].score).toBe(0);
      expect(q.choices[1].id).toBe("b");
    });
  });
});

describe("AC-3[P0]: getQuestion(index) lookup helper (0-11→Question, -1/12→null, no exceptions)", () => {
  it("should return correct question for indices 0-11", async () => {
    const module = await import("@/data/questions");
    const { QUESTIONS, getQuestion } = module;

    for (let i = 0; i < 12; i++) {
      const q = getQuestion(i);
      expect(q).not.toBeNull();
      expect(q?.id).toBe(i + 1);
      expect(q?.text).toBe(QUESTIONS[i].text);
    }
  });

  it("should return null for out-of-bounds indices (-1, 12, etc.)", async () => {
    const module = await import("@/data/questions");
    const { getQuestion } = module;

    expect(getQuestion(-1)).toBeNull();
    expect(getQuestion(12)).toBeNull();
    expect(getQuestion(13)).toBeNull();
    expect(getQuestion(-100)).toBeNull();
    expect(getQuestion(999)).toBeNull();
  });

  it("should not throw exceptions for any input", async () => {
    const module = await import("@/data/questions");
    const { getQuestion } = module;

    expect(() => getQuestion(-1)).not.toThrow();
    expect(() => getQuestion(12)).not.toThrow();
    expect(() => getQuestion(999)).not.toThrow();
    // @ts-expect-error testing non-number input
    expect(() => getQuestion(null)).not.toThrow();
    // @ts-expect-error testing non-number input
    expect(() => getQuestion(undefined)).not.toThrow();
  });
});

describe("AC-4[P0]: Integration - npx vitest run passes with 12 items, 4/4/4 axes, 2 choices per question", () => {
  it("summary: all validations pass", async () => {
    const module = await import("@/data/questions");
    const { QUESTIONS, getQuestion } = module;

    // Count
    expect(QUESTIONS).toHaveLength(12);

    // Axes
    const axes = { A1: 0, A2: 0, A3: 0 };
    QUESTIONS.forEach((q) => {
      axes[q.axis]++;
    });
    expect(axes).toEqual({ A1: 4, A2: 4, A3: 4 });

    // Choices per question
    QUESTIONS.forEach((q) => {
      expect(q.choices).toHaveLength(2);
      expect(q.choices[0].score).toBe(1);
      expect(q.choices[1].score).toBe(0);
    });

    // getQuestion works
    expect(getQuestion(0)?.id).toBe(1);
    expect(getQuestion(11)?.id).toBe(12);
    expect(getQuestion(12)).toBeNull();
  });
});
