import { useCallback, useState } from 'react';
import { getItem, setItem, removeItem } from '@/lib/storage';
import type { QuizDraft } from '@/lib/types';

const DRAFT_KEY = 'mp.quiz.draft';

function emptyDraft(): QuizDraft {
  return { version: 1, answers: Array(12).fill(null), updatedAt: 0 };
}

function readDraft(): QuizDraft {
  const stored = getItem<QuizDraft>(DRAFT_KEY);
  if (!stored || stored.version !== 1 || !Array.isArray(stored.answers) || stored.answers.length !== 12) {
    return emptyDraft();
  }
  return stored;
}

/**
 * 진행 중 퀴즈 응답(`mp.quiz.draft`) 리포지토리 훅.
 *
 * SPEC: .ai-factory/task.md § Task 3.2 상태 훅
 */
export function useQuizDraft() {
  const [draft, setDraft] = useState<QuizDraft>(readDraft);

  const answer = useCallback((index: number, value: 0 | 1) => {
    setDraft((prev) => {
      const answers = [...prev.answers];
      answers[index] = value;
      const next: QuizDraft = { version: 1, answers, updatedAt: Date.now() };
      setItem(DRAFT_KEY, next);
      return next;
    });
  }, []);

  const resetDraft = useCallback(() => {
    removeItem(DRAFT_KEY);
    setDraft(emptyDraft());
  }, []);

  const firstUnansweredStep = (() => {
    const idx = draft.answers.findIndex((a) => a === null);
    return idx === -1 ? null : idx + 1;
  })();

  return { draft, answer, resetDraft, firstUnansweredStep };
}
