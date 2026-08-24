import { describe, it, expect, vi } from "vitest";
import { scoreQuiz, getPersona } from "@/lib/scoring";

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
