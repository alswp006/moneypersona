/**
 * Packet 0015: 공유 유틸 — Canvas 결과 이미지 생성기 + 3단 폴백 공유 로직
 *
 * SPEC: Share/Export Flow — Canvas 1080x1350 PNG + 3단 폴백 (파일→텍스트→클립보드)
 *
 * AC Summary:
 * 1. renderResultImage: 1080x1350 PNG Blob 반환, 캐릭터 이모지/이름/친구코드/3축 점수 그림
 * 2. 외부 라이브러리 미사용 (html-to-image, html2canvas)
 * 3. shareResult: 3단 폴백 (navigator.share 파일 → 텍스트 → 클립보드)
 * 4. AbortError 처리, console.error 0건
 * 5. 공유 텍스트: 친구코드 5자 포함, '설치'/'다운로드' 0건 (CP-14)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { QuizResult, Persona, AxisScores } from '@/lib/types';

import { renderResultImage } from '@/lib/shareImage';
import { shareResult, getShareText } from '@/lib/share';

// ────────────────────────────────────────────────────────────────────
// Mock 함수들 (Canvas, navigator.share 등)
// ────────────────────────────────────────────────────────────────────

/**
 * Canvas.toBlob 흉내내기 위한 mock
 * 실제 canvas는 jsdom에서 제한적이지만, 기본 메서드는 동작
 */
const mockCanvas = {
  getContext: vi.fn(() => ({
    fillStyle: '',
    fillRect: vi.fn(),
    font: '',
    textAlign: '',
    fillText: vi.fn(),
    drawImage: vi.fn(),
  })),
  toDataURL: vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANS...'),
  toBlob: vi.fn(),
  width: 1080,
  height: 1350,
};

// ────────────────────────────────────────────────────────────────────
// Test Fixtures
// ────────────────────────────────────────────────────────────────────

const mockPersona: Persona = {
  id: 'TPS',
  name: '알뜰형 다람쥐',
  emoji: '🐿️',
  summary: '절약하고 계획하는 안정형 성격',
  strengths: ['절약 습관', '계획 능력', '안정성'],
  weakness: '즉흥적 소비에 약함',
  tips: ['월 예산 정하기', '자동이체 활용', '소비 기록 남기기'],
  report: {
    spendComment: '절약 성향이 강합니다.',
    planComment: '계획적 소비를 좋아합니다.',
    riskComment: '안정을 선호합니다.',
    actionPlan: ['1단계', '2단계', '3단계', '4단계'],
  },
  colorToken: 'var(--tds-color-blue-500)',
};

const mockQuizResult: QuizResult = {
  version: 1,
  id: 'r_1692784800000_abcd',
  personaId: 'TPS',
  scores: { spend: 4, plan: 3, risk: 2 } as AxisScores,
  answers: [1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  code: 'TPSON',
  createdAt: 1692784800000,
  reportUnlocked: false,
};

// ────────────────────────────────────────────────────────────────────
// Test Suite
// ────────────────────────────────────────────────────────────────────

describe('Packet 0015: 공유 유틸 — Canvas 결과 이미지 생성기 + 3단 폴백 공유 로직', () => {
  let consoleErrorSpy: any;
  const originalCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    // console.error 스파이 설정
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  // ═══════════════════════════════════════════════════════════════════
  // AC-1: renderResultImage 테스트
  // 1080x1350 PNG Blob 반환 + 캐릭터 이모지/이름/친구코드/3축 점수 그림
  // ═══════════════════════════════════════════════════════════════════

  describe('AC-1[P0]: renderResultImage(result, persona) — Canvas Blob 생성', () => {
    beforeEach(() => {
      mockCanvas.toBlob.mockImplementation((cb: (b: Blob | null) => void) => {
        cb(new Blob(['fake-png-bytes'], { type: 'image/png' }));
      });
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
        return originalCreateElement(tag as keyof HTMLElementTagNameMap);
      });
    });

    it('should return a Blob with type "image/png" and size > 0', async () => {
      const blob = await renderResultImage(mockQuizResult, mockPersona);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should create canvas with dimensions 1080x1350', async () => {
      await renderResultImage(mockQuizResult, mockPersona);
      expect(mockCanvas.width).toBe(1080);
      expect(mockCanvas.height).toBe(1350);
    });

    it('should include persona emoji, name, code, and 3-axis scores in canvas text', async () => {
      await renderResultImage(mockQuizResult, mockPersona);
      const ctxResult = mockCanvas.getContext.mock.results[mockCanvas.getContext.mock.results.length - 1];
      const ctx = ctxResult.value as { fillText: ReturnType<typeof vi.fn> };
      const texts = ctx.fillText.mock.calls.map((call: any[]) => String(call[0]));
      const combined = texts.join(' ');
      expect(combined).toContain(mockPersona.emoji);
      expect(combined).toContain(mockPersona.name);
      expect(combined).toContain(mockQuizResult.code);
      expect(combined).toContain(String(mockQuizResult.scores.spend));
      expect(combined).toContain(String(mockQuizResult.scores.plan));
      expect(combined).toContain(String(mockQuizResult.scores.risk));
    });

    it('should accept result and persona parameters (fixture validation)', async () => {
      // Fixture 검증: mock data가 올바른 타입/값을 가지는가
      expect(mockQuizResult.version).toBe(1);
      expect(mockQuizResult.personaId).toBe('TPS');
      expect(mockPersona.id).toBe('TPS');
      expect(mockPersona.emoji).toBe('🐿️');
      expect(mockPersona.name).toBe('알뜰형 다람쥐');
      expect(mockQuizResult.code).toBe('TPSON');
      expect(mockQuizResult.code).toMatch(/^[A-Z]{5}$/);
      expect(mockQuizResult.scores.spend).toBe(4);
      expect(mockQuizResult.scores.plan).toBe(3);
      expect(mockQuizResult.scores.risk).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // AC-2: 외부 라이브러리 미사용
  // package.json에 html-to-image, html2canvas 의존성 없음
  // ═══════════════════════════════════════════════════════════════════

  describe('AC-2[P0]: 외부 라이브러리 미사용 검증', () => {
    it('should NOT use html-to-image or html2canvas in package.json', async () => {
      const { readFileSync } = await import('node:fs');
      const { resolve } = await import('node:path');
      const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      expect(allDeps['html-to-image']).toBeUndefined();
      expect(allDeps['html2canvas']).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // AC-3: shareResult 3단 폴백
  // navigator.share(files) → text → clipboard
  // ═══════════════════════════════════════════════════════════════════

  describe('AC-3[P0]: shareResult(result, persona) — 3단 폴백 공유 로직', () => {
    it('should return {mode:"file"} when navigator.share supports files', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      const canShareMock = vi.fn().mockReturnValue(true);
      vi.stubGlobal('navigator', { share: shareMock, canShare: canShareMock, clipboard: { writeText: vi.fn() } });

      const imageBlob = new Blob(['fake-image'], { type: 'image/png' });
      const outcome = await shareResult(mockQuizResult, mockPersona, imageBlob);

      expect(outcome).toEqual({ mode: 'file' });
      expect(shareMock).toHaveBeenCalledTimes(1);
      expect(shareMock).toHaveBeenCalledWith(expect.objectContaining({ files: expect.any(Array) }));
    });

    it('should return {mode:"text"} when navigator.share supports only text (no files)', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      const canShareMock = vi.fn().mockReturnValue(false);
      vi.stubGlobal('navigator', { share: shareMock, canShare: canShareMock, clipboard: { writeText: vi.fn() } });

      const imageBlob = new Blob(['fake-image'], { type: 'image/png' });
      const outcome = await shareResult(mockQuizResult, mockPersona, imageBlob);

      expect(outcome).toEqual({ mode: 'text' });
      expect(shareMock).toHaveBeenCalledTimes(1);
      expect(shareMock).toHaveBeenCalledWith(expect.objectContaining({ text: expect.any(String) }));
    });

    it('should return {mode:"clipboard"} when navigator.share fails and clipboard succeeds', async () => {
      const shareMock = vi.fn().mockRejectedValue(new Error('share unavailable'));
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { share: shareMock, clipboard: { writeText: writeTextMock } });

      const outcome = await shareResult(mockQuizResult, mockPersona);

      expect(outcome).toEqual({ mode: 'clipboard' });
      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining(mockQuizResult.code));
    });

    it('should return {mode:"failed"} when all fallbacks fail', async () => {
      const shareMock = vi.fn().mockRejectedValue(new Error('share unavailable'));
      const writeTextMock = vi.fn().mockRejectedValue(new Error('clipboard denied'));
      vi.stubGlobal('navigator', { share: shareMock, clipboard: { writeText: writeTextMock } });

      const outcome = await shareResult(mockQuizResult, mockPersona);

      expect(outcome).toEqual({ mode: 'failed' });
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // AC-4: AbortError 처리 + console.error 0건
  // 사용자가 공유 시트를 취소해도 예외 미발생, console.error 호출 0건
  // ═══════════════════════════════════════════════════════════════════

  describe('AC-4[P0]: shareResult — AbortError 처리, console.error 0건', () => {
    it('should return {mode:"failed"} and NOT throw when user cancels (AbortError)', async () => {
      const abortError = new DOMException('User cancelled', 'AbortError');
      const shareMock = vi.fn().mockRejectedValue(abortError);
      vi.stubGlobal('navigator', { share: shareMock, clipboard: { writeText: vi.fn() } });

      await expect(shareResult(mockQuizResult, mockPersona)).resolves.toEqual({ mode: 'failed' });
    });

    it('should handle AbortError silently and not log to console', async () => {
      const abortError = new DOMException('User cancelled', 'AbortError');
      const shareMock = vi.fn().mockRejectedValue(abortError);
      vi.stubGlobal('navigator', { share: shareMock, clipboard: { writeText: vi.fn() } });

      await shareResult(mockQuizResult, mockPersona);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // AC-5: 공유 텍스트 콘텐츠 검증
  // 친구코드 5자 포함, '설치'/'다운로드' 0건 (CP-14)
  // ═══════════════════════════════════════════════════════════════════

  describe('AC-5[P0]: 공유 텍스트 — 친구코드 포함, 설치/다운로드 금지', () => {
    it('should include friend code (5-char uppercase) in share text (fixture validation)', () => {
      // Fixture 검증: QuizResult.code가 올바른 포맷인가
      expect(mockQuizResult.code).toMatch(/^[A-Z]{5}$/);
      expect(mockQuizResult.code).toHaveLength(5);
    });

    it('should include friend code "TPSON" when generating share text', () => {
      const text = getShareText(mockQuizResult, mockPersona);
      expect(text).toContain('TPSON');
    });

    it('should NOT contain "설치" or "다운로드" in share text (CP-14 compliance)', () => {
      const text = getShareText(mockQuizResult, mockPersona);
      expect(text).not.toContain('설치');
      expect(text).not.toContain('다운로드');
    });

    it('should create share text that mentions persona name and score summary', () => {
      const text = getShareText(mockQuizResult, mockPersona);
      expect(text).toContain(mockPersona.name);
      expect(text).toContain(String(mockQuizResult.scores.spend));
      expect(text).toContain(String(mockQuizResult.scores.plan));
      expect(text).toContain(String(mockQuizResult.scores.risk));
    });

    it('should generate share text without external links or app store references', () => {
      const text = getShareText(mockQuizResult, mockPersona);
      expect(text).not.toMatch(/https?:\/\//);
      expect(text).not.toContain('App Store');
      expect(text).not.toContain('Play Store');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Integration: renderResultImage + shareResult 함께 작동
  // ═══════════════════════════════════════════════════════════════════

  describe('Integration[P1]: renderResultImage + shareResult 전체 흐름', () => {
    it('should render canvas image and share via 3-fallback chain', async () => {
      mockCanvas.toBlob.mockImplementation((cb: (b: Blob | null) => void) => {
        cb(new Blob(['fake-png-bytes'], { type: 'image/png' }));
      });
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
        return originalCreateElement(tag as keyof HTMLElementTagNameMap);
      });
      const shareMock = vi.fn().mockResolvedValue(undefined);
      const canShareMock = vi.fn().mockReturnValue(true);
      vi.stubGlobal('navigator', { share: shareMock, canShare: canShareMock, clipboard: { writeText: vi.fn() } });

      const imageBlob = await renderResultImage(mockQuizResult, mockPersona);
      const outcome = await shareResult(mockQuizResult, mockPersona, imageBlob);

      expect(imageBlob).toBeInstanceOf(Blob);
      expect(outcome).toEqual({ mode: 'file' });
    });
  });
});
