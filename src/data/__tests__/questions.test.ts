import { describe, it, expect } from "vitest";
import { QUESTIONS, getQuestion } from "@/data/questions";

describe("QUESTIONS integrity", () => {
  it("has exactly 12 items with ids 1..12 in ascending order", () => {
    expect(QUESTIONS).toHaveLength(12);
    QUESTIONS.forEach((q, i) => {
      expect(q.id).toBe(i + 1);
    });
  });

  it("has 4 questions per axis (A1: 1-4, A2: 5-8, A3: 9-12)", () => {
    const a1 = QUESTIONS.filter((q) => q.axis === "A1");
    const a2 = QUESTIONS.filter((q) => q.axis === "A2");
    const a3 = QUESTIONS.filter((q) => q.axis === "A3");

    expect(a1.map((q) => q.id)).toEqual([1, 2, 3, 4]);
    expect(a2.map((q) => q.id)).toEqual([5, 6, 7, 8]);
    expect(a3.map((q) => q.id)).toEqual([9, 10, 11, 12]);
  });

  it("every question has exactly 2 choices with scores [1, 0]", () => {
    QUESTIONS.forEach((q) => {
      expect(q.choices).toHaveLength(2);
      expect(q.choices[0].id).toBe("a");
      expect(q.choices[0].score).toBe(1);
      expect(q.choices[1].id).toBe("b");
      expect(q.choices[1].score).toBe(0);
    });
  });
});

describe("getQuestion(index)", () => {
  it("returns the matching question for indices 0-11", () => {
    for (let i = 0; i < 12; i++) {
      expect(getQuestion(i)?.id).toBe(i + 1);
    }
  });

  it("returns null for out-of-bounds indices without throwing", () => {
    expect(() => getQuestion(-1)).not.toThrow();
    expect(getQuestion(-1)).toBeNull();
    expect(getQuestion(12)).toBeNull();
  });
});
