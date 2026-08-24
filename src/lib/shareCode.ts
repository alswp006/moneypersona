import type { AxisLetter, PersonaCode, QuizResult } from "@/lib/types";

const SHARE_CODE_PATTERN = /^MP1([FS][PI][CR])(\d+)$/i;

// checksum = 3×(첫 글자 알파벳 위치) + 둘째 글자 위치 + 셋째 글자 위치, mod 10
function checksum(code: string): number {
  const letterIndex = (ch: string) => ch.toUpperCase().charCodeAt(0) - 65;
  const [c0, c1, c2] = code;
  return (letterIndex(c0) * 3 + letterIndex(c1) + letterIndex(c2)) % 10;
}

export function makeShareCode(code: PersonaCode): string {
  return `MP1-${code}-${checksum(code)}`;
}

export type ParseShareCodeResult =
  | { ok: true; code: PersonaCode }
  | { ok: false; reason: "format" | "checksum" };

export function parseShareCode(input: string): ParseShareCodeResult {
  const normalized = input.replace(/-/g, "");
  const match = SHARE_CODE_PATTERN.exec(normalized);

  if (!match) {
    return { ok: false, reason: "format" };
  }

  const code = match[1].toUpperCase() as PersonaCode;
  const given = Number(match[2]);

  if (given !== checksum(code)) {
    return { ok: false, reason: "checksum" };
  }

  return { ok: true, code };
}

// [highLetter, lowLetter] per axis — scoring.ts의 AXIS_LETTERS와 동일한 매핑
const AXIS_LETTERS: Record<"A1" | "A2" | "A3", [AxisLetter, AxisLetter]> = {
  A1: ["F", "S"],
  A2: ["P", "I"],
  A3: ["C", "R"],
};

export function generateShareCode(result: QuizResult): string {
  return result.shareCode || makeShareCode(result.personaCode);
}
