import { describe, it, expect, vi } from "vitest";
import { makeShareCode, parseShareCode, generateShareCode } from "@/lib/shareCode";
import type { QuizResult } from "@/lib/types";

describe("makeShareCode", () => {
  it("generates 'MP1-FPC-2' for FPC", () => {
    expect(makeShareCode("FPC")).toBe("MP1-FPC-2");
  });
});

describe("parseShareCode", () => {
  it("accepts a lowercase hyphenated code", () => {
    expect(parseShareCode("mp1-spr-6")).toEqual({ ok: true, code: "SPR" });
  });

  it("accepts a code with no hyphens", () => {
    expect(parseShareCode("MP1FPC2")).toEqual({ ok: true, code: "FPC" });
  });

  it("rejects a code with wrong format", () => {
    expect(parseShareCode("ABCD")).toEqual({ ok: false, reason: "format" });
  });

  it("rejects a code with wrong checksum", () => {
    expect(parseShareCode("MP1-FPC-9")).toEqual({ ok: false, reason: "checksum" });
  });

  it("round-trips through makeShareCode for every persona code", () => {
    const codes = ["FPC", "FPR", "FIC", "FIR", "SPC", "SPR", "SIC", "SIR"] as const;
    codes.forEach((code) => {
      const shared = makeShareCode(code);
      expect(parseShareCode(shared)).toEqual({ ok: true, code });
    });
  });

  it("emits zero console.error/console.warn", () => {
    const errorSpy = vi.spyOn(console, "error");
    const warnSpy = vi.spyOn(console, "warn");
    makeShareCode("FPC");
    parseShareCode("MP1-FPC-2");
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});

describe("generateShareCode", () => {
  const baseResult: QuizResult = {
    id: "r1",
    createdAt: 0,
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

  it("returns the pre-computed shareCode if available", () => {
    expect(generateShareCode(baseResult)).toBe("MP1-FPC-2");
  });

  it("falls back to makeShareCode when shareCode is empty", () => {
    const result: QuizResult = { ...baseResult, shareCode: "" };
    expect(generateShareCode(result)).toBe(makeShareCode("FPC"));
  });

  it("round-trips through parseShareCode", () => {
    const generated = generateShareCode(baseResult);
    expect(parseShareCode(generated)).toEqual({ ok: true, code: "FPC" });
  });
});
