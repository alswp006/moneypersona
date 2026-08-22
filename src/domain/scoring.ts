import { QUESTIONS } from "../constants/questions";
import { CHARACTERS } from "../constants/characters";

export type Responses = Record<string, unknown>;

export interface ValidationResult {
  valid: boolean;
  hasInvalid: boolean;
  invalidKeys: string[];
  missingKeys: string[];
}

const AXES = ["spend-save", "plan-impulse", "risk-safety"] as const;
type Axis = (typeof AXES)[number];

/** 축별 [낮은 점수 문자, 높은 점수 문자] — CHARACTERS id의 자리별 문자와 일치해야 한다. */
const AXIS_LETTERS: Record<Axis, [string, string]> = {
  "spend-save": ["S", "V"],
  "plan-impulse": ["I", "P"],
  "risk-safety": ["R", "F"],
};

function toSafeResponses(responses: Responses): Record<string, unknown> {
  return responses && typeof responses === "object" ? responses : {};
}

function isValidOptionValue(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 3;
}

/**
 * 응답 객체의 유효성을 검사한다. 미응답 문항은 missingKeys에만 기록하고 예외를 던지지 않는다.
 * 0-3 범위를 벗어난 값만 invalidKeys에 기록한다.
 */
export function validateResponses(responses: Responses): ValidationResult {
  const safeResponses = toSafeResponses(responses);
  const invalidKeys: string[] = [];
  const missingKeys: string[] = [];

  QUESTIONS.forEach((q) => {
    const value = safeResponses[q.id];
    if (value === undefined) {
      missingKeys.push(q.id);
      return;
    }
    if (!isValidOptionValue(value)) {
      invalidKeys.push(q.id);
    }
  });

  return {
    valid: invalidKeys.length === 0,
    hasInvalid: invalidKeys.length > 0,
    invalidKeys,
    missingKeys,
  };
}

/**
 * 축별 점수를 계산한다(각 축 0..12). 미응답·범위 밖 값은 0으로 취급해 무시한다.
 */
export function calculateAxisScores(responses: Responses): Record<Axis, number> {
  const safeResponses = toSafeResponses(responses);
  const scores: Record<Axis, number> = {
    "spend-save": 0,
    "plan-impulse": 0,
    "risk-safety": 0,
  };

  QUESTIONS.forEach((q) => {
    const value = safeResponses[q.id];
    if (isValidOptionValue(value)) {
      scores[q.type as Axis] += value;
    }
  });

  return scores;
}

/** 축별 백분율 = Math.round(score/12*100) */
export function calculateAxisPercents(responses: Responses): Record<Axis, number> {
  const scores = calculateAxisScores(responses);
  return AXES.reduce(
    (acc, axis) => {
      acc[axis] = Math.round((scores[axis] / 12) * 100);
      return acc;
    },
    {} as Record<Axis, number>
  );
}

/**
 * 축 점수를 3글자 캐릭터 코드로 변환한다. 동일 입력에는 항상 동일 코드를 반환한다(결정론).
 * 응답이 비어 있거나 부분적이어도 예외 없이 코드를 반환한다.
 */
export function determineCharacter(responses: Responses): string {
  const scores = calculateAxisScores(responses);
  const code = AXES.map((axis) => {
    const [lowLetter, highLetter] = AXIS_LETTERS[axis];
    return scores[axis] >= 6 ? highLetter : lowLetter;
  }).join("");

  const match = CHARACTERS.find((c) => c.id === code);
  return match ? match.id : code;
}

/**
 * 응답이 주어진 캐릭터와 얼마나 일치하는지 0..100으로 반환한다(계약: calculateScoreFn).
 * 축 3개 중 일치하는 자리 수 비율로 계산한다.
 */
export function calculateScore(
  responses: Record<string, unknown>,
  character: { id: string; traits: string[] }
): number {
  const code = determineCharacter(responses);
  let matches = 0;
  for (let i = 0; i < 3; i++) {
    if (code[i] === character.id[i]) matches++;
  }
  return Math.round((matches / 3) * 100);
}
