import { describe, it, expect, vi } from "vitest";
import { makeShareCode, parseShareCode, generateShareCode } from "@/lib/shareCode";
import type { Result } from "@/lib/contract";

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
  const baseResult: Result = {
    id: "r1",
    timestamp: 0,
    answers: [],
    scores: { A1: 4, A2: 4, A3: 4 },
    shareCode: "",
  };

  it("derives 'MP1-FPC-2' from full-score axes", () => {
    expect(generateShareCode(baseResult)).toBe("MP1-FPC-2");
  });

  it("derives the low-letter code when every axis score is below 2", () => {
    const result: Result = { ...baseResult, scores: { A1: 0, A2: 0, A3: 0 } };
    expect(generateShareCode(result)).toBe(makeShareCode("SIR"));
  });

  it("treats a missing axis score as 0 (low letter)", () => {
    const result: Result = { ...baseResult, scores: { A1: 4 } };
    expect(generateShareCode(result)).toBe(makeShareCode("FIR"));
  });

  it("round-trips through parseShareCode", () => {
    const generated = generateShareCode(baseResult);
    expect(parseShareCode(generated)).toEqual({ ok: true, code: "FPC" });
  });
});
