import { describe, it, expect } from 'vitest';
import { QUESTIONS } from '@/domain/questions';

describe('QUESTIONS', () => {
  it('AC-1: 12문항이며 id 집합이 {1..12}와 일치한다', () => {
    expect(QUESTIONS).toHaveLength(12);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(12);
    expect(QUESTIONS.map((q) => q.id).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
  });

  it('AC-2: axis별 개수가 spend 4 / plan 4 / risk 4로 나뉜다', () => {
    expect(QUESTIONS.filter((q) => q.axis === 'spend')).toHaveLength(4);
    expect(QUESTIONS.filter((q) => q.axis === 'plan')).toHaveLength(4);
    expect(QUESTIONS.filter((q) => q.axis === 'risk')).toHaveLength(4);
  });

  it('AC-3: 모든 text 길이가 20~60자다', () => {
    QUESTIONS.forEach((q) => {
      expect(q.text.length).toBeGreaterThanOrEqual(20);
      expect(q.text.length).toBeLessThanOrEqual(60);
    });
  });

  it('AC-3: 모든 options가 정확히 2개이며 key ["A","B"], value 집합 {0,1}이다', () => {
    QUESTIONS.forEach((q) => {
      expect(q.options).toHaveLength(2);
      expect(q.options.map((o) => o.key)).toEqual(['A', 'B']);
      expect(new Set(q.options.map((o) => o.value))).toEqual(new Set([0, 1]));
    });
  });
});
