import { describe, it, expect, vi } from "vitest";
import type { PersonaCode } from "@/lib/types";

/**
 * Packet 0005: Scoring Engine + Share Code Generation/Parsing
 *
 * Pure function layer:
 * - scoreQuiz: aggregate 12 answers → 3-axis scores → PersonaCode
 * - getPersona: lookup persona by code
 * - makeShareCode: generate shareable code
 * - parseShareCode: parse and validate share code
 */

describe("Packet 0005: Scoring Engine + Share Code", () => {
  // ============================================================================
  // AC-1: scoreQuiz([1,1,1,1,1,1,1,1,1,1,1,1]) returns correct shape and is deterministic
  // ============================================================================

  it("AC-1[P0]: scoreQuiz with all 1s returns {ok:true, personaCode:'FPC', axisScores with 3 entries}", async () => {
    // IMPORT AND RUN WHEN IMPLEMENTED
    const { scoreQuiz } = await import("@/lib/scoring");

    const result = scoreQuiz([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);

    // Shape validation
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    // PersonaCode validation
    expect(result.personaCode).toBe("FPC");

    // AxisScores structure
    expect(result.axisScores).toHaveLength(3);
    expect(result.axisScores[0]).toMatchObject({
      axis: "A1",
      score: 4,
      letter: "F",
      percent: 100,
    });
    expect(result.axisScores[1]).toMatchObject({
      axis: "A2",
      score: 4,
      letter: "P",
      percent: 100,
    });
    expect(result.axisScores[2]).toMatchObject({
      axis: "A3",
      score: 4,
      letter: "C",
      percent: 100,
    });
  });

  it("AC-1[P0]: scoreQuiz is deterministic — 100 identical calls return deep-equal results", async () => {
    const { scoreQuiz } = await import("@/lib/scoring");

    const input: (0 | 1)[] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const firstResult = scoreQuiz(input);
    const results = Array.from({ length: 100 }, () => scoreQuiz(input));

    // All should have ok:true
    results.forEach((r, idx) => {
      expect(r.ok, `Call ${idx} failed`).toBe(true);
    });

    // All should deep-equal the first result
    results.forEach((r, idx) => {
      expect(r, `Call ${idx} differs from first result`).toEqual(firstResult);
    });
  });

  // ============================================================================
  // AC-2: scoreQuiz validates input length and values
  // ============================================================================

  it("AC-2[P0]: scoreQuiz with length=3 returns {ok:false, reason:'invalid_answers'}", async () => {
    const { scoreQuiz } = await import("@/lib/scoring");

    const result = scoreQuiz([1, 1, 1] as any);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected ok:false");
    expect(result.reason).toBe("invalid_answers");
  });

  it("AC-2[P0]: scoreQuiz with invalid value (2) returns {ok:false, reason:'invalid_answers'}", async () => {
    const { scoreQuiz } = await import("@/lib/scoring");

    const result = scoreQuiz([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2] as any);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected ok:false");
    expect(result.reason).toBe("invalid_answers");
  });

  // ============================================================================
  // AC-3: Axis scoring — score>=2→first letter, score<2→second letter, percent=score*25
  // ============================================================================

  it("AC-3[P0]: [1,1,0,0,1,0,0,0,0,0,0,0] scores correctly — 'FIR' + axisScores[0].percent=50", async () => {
    const { scoreQuiz } = await import("@/lib/scoring");

    // A1: 1+1+0+0 = 2 → F (score>=2)
    // A2: 1+0+0+0 = 1 → I (score<2)
    // A3: 0+0+0+0 = 0 → R (score<2)
    // Expected: FIR

    const result = scoreQuiz([1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    expect(result.personaCode).toBe("FIR");

    // Check axis scores
    expect(result.axisScores[0]).toMatchObject({
      axis: "A1",
      score: 2,
      letter: "F",
      percent: 50, // 2 * 25
    });
    expect(result.axisScores[1]).toMatchObject({
      axis: "A2",
      score: 1,
      letter: "I",
      percent: 25, // 1 * 25
    });
    expect(result.axisScores[2]).toMatchObject({
      axis: "A3",
      score: 0,
      letter: "R",
      percent: 0, // 0 * 25
    });
  });

  // ============================================================================
  // AC-4: makeShareCode and parseShareCode
  // ============================================================================

  it("AC-4[P0]: makeShareCode('FPC') returns 'MP1-FPC-{checksum}'", async () => {
    const { makeShareCode } = await import("@/lib/shareCode");

    const result = makeShareCode("FPC");

    // Format: MP1-{PersonaCode}-{checksum}
    expect(result).toMatch(/^MP1-FPC-\d+$/);

    // Expected based on AC: should be 'MP1-FPC-2'
    expect(result).toBe("MP1-FPC-2");
  });

  it("AC-4[P0]: parseShareCode('mp1-spr-6') returns {ok:true}", async () => {
    const { parseShareCode } = await import("@/lib/shareCode");

    const result = parseShareCode("mp1-spr-6");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
  });

  it("AC-4[P0]: parseShareCode('MP1FPC2') (no hyphens) returns {ok:true, code:'FPC'}", async () => {
    const { parseShareCode } = await import("@/lib/shareCode");

    const result = parseShareCode("MP1FPC2");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.code).toBe("FPC");
  });

  it("AC-4[P0]: parseShareCode('ABCD') returns {ok:false, reason:'format'}", async () => {
    const { parseShareCode } = await import("@/lib/shareCode");

    const result = parseShareCode("ABCD");

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected ok:false");
    expect(result.reason).toBe("format");
  });

  it("AC-4[P0]: parseShareCode('MP1-FPC-9') (invalid checksum) returns {ok:false, reason:'checksum'}", async () => {
    const { parseShareCode } = await import("@/lib/shareCode");

    const result = parseShareCode("MP1-FPC-9");

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected ok:false");
    expect(result.reason).toBe("checksum");
  });

  // ============================================================================
  // AC-5: getPersona returns null for invalid code, zero console.* calls
  // ============================================================================

  it("AC-5[P0]: getPersona('XXX') returns null without throwing", async () => {
    const { getPersona } = await import("@/lib/scoring");

    const result = getPersona("XXX" as any);

    expect(result).toBeNull();
  });

  it("AC-5[P0]: getPersona('FPC') returns correct persona object", async () => {
    const { getPersona } = await import("@/lib/scoring");

    const result = getPersona("FPC");

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      code: "FPC",
      name: "알뜰형 다람쥐",
      emoji: "🐿",
    });
  });

  it("AC-5[P0]: No console.error or console.warn during scoring operations", async () => {
    const { scoreQuiz, getPersona } = await import("@/lib/scoring");
    const { makeShareCode, parseShareCode } = await import("@/lib/shareCode");

    const errorSpy = vi.spyOn(console, "error");
    const warnSpy = vi.spyOn(console, "warn");

    // Run all operations
    scoreQuiz([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    getPersona("FPC");
    makeShareCode("FPC");
    parseShareCode("MP1-FPC-2");

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  // ============================================================================
  // Edge cases and cross-validation
  // ============================================================================

  it("Edge case: All 0s → 'SIR' with all scores=0, percents=0", async () => {
    const { scoreQuiz } = await import("@/lib/scoring");

    const result = scoreQuiz([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    expect(result.personaCode).toBe("SIR");
    result.axisScores.forEach((axis) => {
      expect(axis.score).toBe(0);
      expect(axis.percent).toBe(0);
      expect(axis.letter).toMatch(/[SIR]/);
    });
  });

  it("Edge case: Boundary at score=2 → transitions from second to first letter", async () => {
    const { scoreQuiz } = await import("@/lib/scoring");

    // A1=2, A2=1, A3=3
    // [1,1,0,0, 1,0,0,0, 0,0,1,1]
    const result = scoreQuiz([1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1]);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    expect(result.personaCode).toBe("FIC");
    expect(result.axisScores[0].letter).toBe("F"); // A1: 2 >= 2
    expect(result.axisScores[1].letter).toBe("I"); // A2: 1 < 2
    expect(result.axisScores[2].letter).toBe("C"); // A3: 3 >= 2
  });

  it("parseShareCode is case-insensitive and flexible with format", async () => {
    const { parseShareCode } = await import("@/lib/shareCode");

    // All valid formats should parse
    const formats = ["MP1-FPC-2", "mp1-fpc-2", "MP1FPC2", "mp1fpc2"];
    formats.forEach((format) => {
      const result = parseShareCode(format);
      expect(result.ok, `Format "${format}" should be valid`).toBe(true);
    });
  });
});
