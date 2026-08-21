import type { PersonaId } from '@/lib/types';

const AXIS1 = ['T', 'F'];
const AXIS2 = ['P', 'I'];
const AXIS3 = ['S', 'R'];

function charCodeSum(s: string): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return sum;
}

function isValidPersonaId(s: string): s is PersonaId {
  return s.length === 3 && AXIS1.includes(s[0]) && AXIS2.includes(s[1]) && AXIS3.includes(s[2]);
}

/**
 * PersonaId → 친구코드(5자 [A-Z]{5}) = personaId + 체크섬 2자.
 * n = (charCodeSum(personaId) * 7) % 676
 */
export function makeCode(personaId: PersonaId): string {
  const n = (charCodeSum(personaId) * 7) % 676;
  const c1 = String.fromCharCode(65 + Math.floor(n / 26));
  const c2 = String.fromCharCode(65 + (n % 26));
  return `${personaId}${c1}${c2}`;
}

/**
 * 친구코드 → PersonaId. 형식/체크섬이 맞지 않으면 null(예외를 던지지 않음).
 */
export function parseCode(code: string): PersonaId | null {
  if (typeof code !== 'string' || !/^[A-Z]{5}$/.test(code)) return null;
  const personaId = code.slice(0, 3);
  if (!isValidPersonaId(personaId)) return null;
  return makeCode(personaId) === code ? personaId : null;
}
