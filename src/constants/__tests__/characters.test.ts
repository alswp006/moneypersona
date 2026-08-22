import { describe, it, expect } from "vitest";
import { CHARACTERS, Character } from "../characters";

/**
 * CHARACTERS 상수 무결성 회귀 테스트
 * undefined 배열이 하류(결과 화면·채점 엔진)로 흘러가는 것을 조기에 잡는다.
 */
describe("CHARACTERS 상수 무결성", () => {
  it("정확히 8개 캐릭터를 가진다", () => {
    expect(Array.isArray(CHARACTERS)).toBe(true);
    expect(CHARACTERS.length).toBe(8);
  });

  it("code(id)는 8종이고 유일하다", () => {
    const ids = CHARACTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(8);
    const expectedIds = ["SPR", "SPF", "SIR", "SIF", "VPR", "VPF", "VIR", "VIF"];
    expect(ids.slice().sort()).toEqual(expectedIds.slice().sort());
  });

  it("각 캐릭터의 tips는 정확히 3개다", () => {
    CHARACTERS.forEach((c) => {
      expect(Array.isArray(c.tips)).toBe(true);
      expect(c.tips.length).toBe(3);
    });
  });

  it("각 캐릭터의 traits는 정확히 3개다", () => {
    CHARACTERS.forEach((c) => {
      expect(Array.isArray(c.traits)).toBe(true);
      expect(c.traits.length).toBe(3);
    });
  });

  it("name과 summary는 비어 있지 않다", () => {
    CHARACTERS.forEach((c) => {
      expect(c.name.trim().length).toBeGreaterThan(0);
      expect(c.summary.trim().length).toBeGreaterThan(0);
    });
  });

  it("타입 계약(Character)을 만족한다", () => {
    const c: Character = CHARACTERS[0];
    expect(typeof c.id).toBe("string");
    expect(typeof c.name).toBe("string");
    expect(Array.isArray(c.traits)).toBe(true);
    expect(Array.isArray(c.tips)).toBe(true);
  });
});
