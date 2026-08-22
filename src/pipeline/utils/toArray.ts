/**
 * 어떤 값이든 안전하게 배열로 정규화한다.
 * 파이프라인 단계 경계에서 undefined/null/객체/원시값이 넘어와도
 * `.length`/`.map`/`.filter` 호출이 TypeError 없이 동작하도록 보장한다.
 */
export function toArray<T = unknown>(input: unknown): T[] {
  return Array.isArray(input) ? (input as T[]) : [];
}
