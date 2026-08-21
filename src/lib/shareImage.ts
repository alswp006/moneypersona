/**
 * 결과 카드 이미지 생성 — 네이티브 Canvas 2D (외부 캡처 라이브러리 미사용)
 *
 * SPEC: Share/Export Flow — Canvas 1080x1350 PNG
 */

import type { QuizResult, Persona } from '@/lib/types';

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

// Canvas 2D의 fillStyle은 CSS 변수를 못 읽는다(var(--adaptive*) → 무시되고 검정으로 그려짐).
// 게다가 이 결과물은 화면이 아니라 **내보내는 PNG**라 다크모드가 적용되지 않는다 —
// 라이트 톤 고정이 맞다. 화면(.tsx/.css)의 하드코딩 색은 여전히 금지다.
const COLOR_BG = '#F2F4F6'; // compliance-allow: no-hardcoded-hex — Canvas fillStyle은 CSS 변수 미지원
const COLOR_TITLE = '#191F28'; // compliance-allow: no-hardcoded-hex — 동일
const COLOR_SUB = '#4E5968'; // compliance-allow: no-hardcoded-hex — 동일
const COLOR_MUTED = '#8B95A1'; // compliance-allow: no-hardcoded-hex — 동일
const COLOR_ACCENT = '#3182F6'; // compliance-allow: no-hardcoded-hex — 동일

export async function renderResultImage(result: QuizResult, persona: Persona): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context를 생성할 수 없습니다.');
  }

  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';

  ctx.font = '220px sans-serif';
  ctx.fillStyle = COLOR_TITLE;
  ctx.fillText(persona.emoji, CANVAS_WIDTH / 2, 420);

  ctx.font = 'bold 76px sans-serif';
  ctx.fillStyle = COLOR_TITLE;
  ctx.fillText(persona.name, CANVAS_WIDTH / 2, 560);

  ctx.font = '38px sans-serif';
  ctx.fillStyle = COLOR_ACCENT;
  ctx.fillText('머니 페르소나', CANVAS_WIDTH / 2, 630);

  ctx.font = '36px sans-serif';
  ctx.fillStyle = COLOR_SUB;
  ctx.fillText(`소비 ${result.scores.spend} · 계획 ${result.scores.plan} · 위험 ${result.scores.risk}`, CANVAS_WIDTH / 2, 900);

  ctx.font = '32px sans-serif';
  ctx.fillStyle = COLOR_MUTED;
  ctx.fillText(`친구 코드 ${result.code}`, CANVAS_WIDTH / 2, 1000);

  return canvasToPngBlob(canvas);
}

async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  if (typeof canvas.toBlob === 'function') {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/png');
    });
    if (blob) return blob;
  }

  const dataUrl = canvas.toDataURL('image/png');
  // compliance-allow: no-network-request — data: URL → Blob 변환(toBlob 미지원 폴백). 네트워크 미발생
  const response = await fetch(dataUrl);
  return response.blob();
}
