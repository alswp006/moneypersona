/**
 * 결과 공유 — 3단 폴백 (navigator.share 파일 → 텍스트 → 클립보드)
 *
 * SPEC: Share/Export Flow — 모든 실패는 예외 없이 결과 코드로 반환한다 (CP-14: 설치 유도 금지)
 */

import type { QuizResult, Persona } from '@/lib/types';

export interface ShareResultOutcome {
  mode: 'file' | 'text' | 'clipboard' | 'failed';
}

export function getShareText(result: QuizResult, persona?: Persona): string {
  const name = persona?.name ?? result.personaId;
  const { spend, plan, risk } = result.scores;
  return `나는 ${name}! 소비 ${spend} · 계획 ${plan} · 위험 ${risk}\n친구 코드로 궁합을 확인해보세요: ${result.code}`;
}

export async function shareResult(
  result: QuizResult,
  persona: Persona,
  imageBlob?: Blob
): Promise<ShareResultOutcome> {
  const text = getShareText(result, persona);
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;

  if (imageBlob && nav && typeof nav.share === 'function') {
    try {
      const file = new File([imageBlob], `money-persona-${result.code}.png`, { type: 'image/png' });
      const canShareFiles =
        typeof nav.canShare === 'function' ? nav.canShare({ files: [file] }) : true;

      if (canShareFiles) {
        await nav.share({ files: [file], text });
        return { mode: 'file' };
      }
    } catch (error) {
      if (isAbortError(error)) {
        return { mode: 'failed' };
      }
      // 파일 공유 실패(미지원 등) → 텍스트 공유로 폴백
    }
  }

  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share({ text });
      return { mode: 'text' };
    } catch (error) {
      if (isAbortError(error)) {
        return { mode: 'failed' };
      }
      // 텍스트 공유 실패 → 클립보드로 폴백
    }
  }

  try {
    if (nav?.clipboard && typeof nav.clipboard.writeText === 'function') {
      await nav.clipboard.writeText(text);
      return { mode: 'clipboard' };
    }
  } catch {
    // 클립보드 실패 → 최종 실패
  }

  return { mode: 'failed' };
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'AbortError';
  }
  return typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError';
}
