import { describe, it, expect, vi } from "vitest";
import { scoreQuiz, getPersona, calculateScore } from "@/lib/scoring";
import type { Answer } from "@/lib/contract";

describe("scoreQuiz", () => {
  it("all 1s → FPC persona, full-score axes", () => {
    const result = scoreQuiz([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    expect(result).toEqual({
      ok: true,
      personaCode: "FPC",
      axisScores: [
        { axis: "A1", score: 4, letter: "F", percent: 100 },
        { axis: "A2", score: 4, letter: "P", percent: 100 },
        { axis: "A3", score: 4, letter: "C", percent: 100 },
      ],
    });
  });

  it("is deterministic across repeated calls", () => {
    const input: (0 | 1)[] = [1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
    const first = scoreQuiz(input);
    for (let i = 0; i < 100; i++) {
      expect(scoreQuiz(input)).toEqual(first);
    }
  });

  it("rejects answers array with wrong length", () => {
    expect(scoreQuiz([1, 1, 1] as unknown as (0 | 1)[])).toEqual({
      ok: false,
      reason: "invalid_answers",
    });
  });

  it("rejects answers array containing values other than 0/1", () => {
    expect(
      scoreQuiz([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2] as unknown as (0 | 1)[])
    ).toEqual({ ok: false, reason: "invalid_answers" });
  });

  it("computes correct letters/percent per axis boundary (score<2 vs >=2)", () => {
    const result = scoreQuiz([1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.personaCode).toBe("FIR");
    expect(result.axisScores[0].percent).toBe(50);
  });
});

describe("calculateScore", () => {
  const questionIds = Array.from({ length: 12 }, (_, i) => `q${i + 1}`);

  it("returns axis scores keyed by axis id, matching scoreQuiz's per-axis sums", () => {
    const values = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const answers: Answer[] = questionIds.map((questionId, i) => ({ questionId, value: values[i] }));

    expect(calculateScore(answers, questionIds)).toEqual({ A1: 4, A2: 4, A3: 4 });
  });

  it("orders answers by questionIds regardless of input array order", () => {
    const values = [1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
    const inOrder: Answer[] = questionIds.map((questionId, i) => ({ questionId, value: values[i] }));
    const shuffled = [...inOrder].reverse();

    expect(calculateScore(shuffled, questionIds)).toEqual(calculateScore(inOrder, questionIds));
    expect(calculateScore(inOrder, questionIds)).toEqual({ A1: 2, A2: 1, A3: 0 });
  });

  it("treats a missing/unanswered questionId as 0", () => {
    const answers: Answer[] = [{ questionId: "q1", value: 1 }];
    expect(calculateScore(answers, questionIds)).toEqual({ A1: 1, A2: 0, A3: 0 });
  });
});

describe("getPersona", () => {
  it("returns null for an unknown code without throwing", () => {
    expect(getPersona("XXX" as never)).toBeNull();
  });

  it("returns the matching persona for a valid code", () => {
    expect(getPersona("FPC")).toMatchObject({ code: "FPC", name: "알뜰형 다람쥐" });
  });

  it("emits zero console.error/console.warn", () => {
    const errorSpy = vi.spyOn(console, "error");
    const warnSpy = vi.spyOn(console, "warn");
    scoreQuiz([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    getPersona("FPC");
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
