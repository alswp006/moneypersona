import { describe, it, expect } from "vitest";
import { PERSONAS } from "@/domain/personas";
import type { PersonaId } from "@/lib/types";

describe("8캐릭터 상수 테이블 (PERSONAS)", () => {
  // AC-1: Object.keys(PERSONAS).length === 8 이고 키 집합이 정확히 일치
  it("AC-1[P0]: should have exactly 8 personas with correct IDs", () => {
    const keys = Object.keys(PERSONAS);
    expect(keys).toHaveLength(8);

    const expectedIds: PersonaId[] = [
      "TPS",
      "TPR",
      "TIS",
      "TIR",
      "FPS",
      "FPR",
      "FIS",
      "FIR",
    ];
    const sortedKeys = keys.sort();
    const sortedExpected = expectedIds.sort();
    expect(sortedKeys).toEqual(sortedExpected);
  });

  // AC-2: 8종 name/emoji가 SPEC 표와 일치
  it("AC-2[P0]: should have correct name and emoji for each persona", () => {
    const specs = [
      { id: "TPS" as PersonaId, name: "알뜰형 다람쥐", emoji: "🐿️" },
      { id: "TPR" as PersonaId, name: "전략가 여우", emoji: "🦊" },
      { id: "TIS" as PersonaId, name: "곳간지기 거북이", emoji: "🐢" },
      { id: "TIR" as PersonaId, name: "한방노림 매", emoji: "🦅" },
      { id: "FPS" as PersonaId, name: "균형잡힌 판다", emoji: "🐼" },
      { id: "FPR" as PersonaId, name: "성장추구 늑대", emoji: "🐺" },
      { id: "FIS" as PersonaId, name: "행복소비 강아지", emoji: "🐶" },
      { id: "FIR" as PersonaId, name: "욜로 앵무새", emoji: "🦜" },
    ];

    specs.forEach(({ id, name, emoji }) => {
      expect(PERSONAS[id]).toBeDefined();
      expect(PERSONAS[id].name).toBe(name);
      expect(PERSONAS[id].emoji).toBe(emoji);
    });
  });

  // AC-3[Part1]: strengths.length===3, tips.length===3, actionPlan.length===4
  it("AC-3[P0][Part1]: should have correct array lengths (strengths, tips, actionPlan)", () => {
    const personaIds = Object.keys(PERSONAS) as PersonaId[];

    personaIds.forEach((id) => {
      const persona = PERSONAS[id];
      expect(persona.strengths).toHaveLength(3);
      expect(persona.tips).toHaveLength(3);
      expect(persona.report.actionPlan).toHaveLength(4);
    });
  });

  // AC-3[Part2]: summary 길이 60~120, 코멘트 각 40~100
  it("AC-3[P0][Part2]: should have valid text lengths (summary 60~120, comments 40~100)", () => {
    const personaIds = Object.keys(PERSONAS) as PersonaId[];

    personaIds.forEach((id) => {
      const persona = PERSONAS[id];

      // summary: 60~120자
      expect(persona.summary.length).toBeGreaterThanOrEqual(60);
      expect(persona.summary.length).toBeLessThanOrEqual(120);

      // spendComment, planComment, riskComment: 각 40~100자
      expect(persona.report.spendComment.length).toBeGreaterThanOrEqual(40);
      expect(persona.report.spendComment.length).toBeLessThanOrEqual(100);

      expect(persona.report.planComment.length).toBeGreaterThanOrEqual(40);
      expect(persona.report.planComment.length).toBeLessThanOrEqual(100);

      expect(persona.report.riskComment.length).toBeGreaterThanOrEqual(40);
      expect(persona.report.riskComment.length).toBeLessThanOrEqual(100);
    });
  });

  // AC-4: colorToken이 /^var\(--tds-color-[a-z]+-\d{3}\)$/ 에 매치 (HEX 리터럴 0건)
  it("AC-4[P0]: should have valid colorToken format (no HEX literals)", () => {
    const colorTokenRegex = /^var\(--tds-color-[a-z]+-\d{3}\)$/;
    const personaIds = Object.keys(PERSONAS) as PersonaId[];

    personaIds.forEach((id) => {
      const persona = PERSONAS[id];
      expect(persona.colorToken).toMatch(colorTokenRegex);

      // Ensure no HEX color codes like #FFFFFF or #3182F6
      expect(persona.colorToken).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    });
  });

  // AC-5: 5개 단언이 green (종합 검증: id 일치 + 모든 필드 존재)
  it("AC-5[P0]: should have all required fields for each persona", () => {
    const personaIds = Object.keys(PERSONAS) as PersonaId[];
    const expectedIds = ["TPS", "TPR", "TIS", "TIR", "FPS", "FPR", "FIS", "FIR"];

    personaIds.forEach((id) => {
      const persona = PERSONAS[id];

      // Verify id exists and matches
      expect(expectedIds).toContain(id);

      // Verify all required fields exist and are correct types
      expect(persona.id).toBe(id);
      expect(typeof persona.name).toBe("string");
      expect(typeof persona.emoji).toBe("string");
      expect(typeof persona.summary).toBe("string");
      expect(Array.isArray(persona.strengths)).toBe(true);
      expect(typeof persona.weakness).toBe("string");
      expect(Array.isArray(persona.tips)).toBe(true);
      expect(typeof persona.report).toBe("object");
      expect(typeof persona.report.spendComment).toBe("string");
      expect(typeof persona.report.planComment).toBe("string");
      expect(typeof persona.report.riskComment).toBe("string");
      expect(Array.isArray(persona.report.actionPlan)).toBe(true);
      expect(typeof persona.colorToken).toBe("string");
    });
  });
});
