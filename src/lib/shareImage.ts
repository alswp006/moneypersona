/**
 * 결과 카드 이미지 생성 — 네이티브 Canvas 2D (외부 캡처 라이브러리 미사용)
 *
 * SPEC: Share/Export Flow — Canvas 1080x1350 PNG
 */

import type { QuizResult, Persona } from '@/lib/types';

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

const COLOR_BG = '#F2F4F6';
const COLOR_TITLE = '#191F28';
const COLOR_SUB = '#4E5968';
const COLOR_MUTED = '#8B95A1';
const COLOR_ACCENT = '#3182F6';

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
  const response = await fetch(dataUrl);
  return response.blob();
}
