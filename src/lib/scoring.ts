import type { AxisId, AxisLetter, AxisScore, Persona, PersonaCode } from "@/lib/types";
import { PERSONAS } from "@/data/personas";

export type ScoreQuizResult =
  | { ok: true; personaCode: PersonaCode; axisScores: [AxisScore, AxisScore, AxisScore] }
  | { ok: false; reason: "invalid_answers" };

const AXIS_IDS: [AxisId, AxisId, AxisId] = ["A1", "A2", "A3"];
// [highLetter, lowLetter] per axis — score>=2 → highLetter, score<2 → lowLetter
const AXIS_LETTERS: [AxisLetter, AxisLetter][] = [
  ["F", "S"],
  ["P", "I"],
  ["C", "R"],
];

function isValidAnswers(answers: unknown): answers is (0 | 1)[] {
  return (
    Array.isArray(answers) &&
    answers.length === 12 &&
    answers.every((a) => a === 0 || a === 1)
  );
}

export function scoreQuiz(answers: (0 | 1)[]): ScoreQuizResult {
  if (!isValidAnswers(answers)) {
    return { ok: false, reason: "invalid_answers" };
  }

  const axisScores = AXIS_IDS.map((axis, i) => {
    const slice = answers.slice(i * 4, i * 4 + 4);
    const score = slice.reduce<number>((sum, v) => sum + v, 0) as 0 | 1 | 2 | 3 | 4;
    const [highLetter, lowLetter] = AXIS_LETTERS[i];
    const letter: AxisLetter = score >= 2 ? highLetter : lowLetter;
    const percent = (score * 25) as 0 | 25 | 50 | 75 | 100;
    return { axis, score, letter, percent };
  }) as [AxisScore, AxisScore, AxisScore];

  const personaCode = axisScores.map((a) => a.letter).join("") as PersonaCode;

  return { ok: true, personaCode, axisScores };
}

export function getPersona(code: PersonaCode): Persona | null {
  return PERSONAS[code] ?? null;
}

