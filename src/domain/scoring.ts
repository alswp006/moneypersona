import type { AxisScores, PersonaId } from '@/lib/types';

/**
 * 12문항 응답 → 3축 점수(각 0..4). index 0~3=spend, 4~7=plan, 8~11=risk 합산.
 * 입력 배열은 변형하지 않는다.
 */
export function computeScores(answers: Array<0 | 1>): AxisScores {
  let spend = 0;
  let plan = 0;
  let risk = 0;

  for (let i = 0; i < 4; i++) spend += answers[i];
  for (let i = 4; i < 8; i++) plan += answers[i];
  for (let i = 8; i < 12; i++) risk += answers[i];

  return { spend, plan, risk };
}

/**
 * 3축 점수 → PersonaId. 각 축 값 >= 2면 앞 글자(T/P/S), < 2면 뒷 글자(F/I/R).
 */
export function toPersonaId(scores: AxisScores): PersonaId {
  const spendLetter = scores.spend >= 2 ? 'T' : 'F';
  const planLetter = scores.plan >= 2 ? 'P' : 'I';
  const riskLetter = scores.risk >= 2 ? 'S' : 'R';
  return `${spendLetter}${planLetter}${riskLetter}` as PersonaId;
}
