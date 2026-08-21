import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Top, Paragraph, Spacing, Skeleton } from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { getItem, setItem, removeItem } from '@/lib/storage';
import { computeScores, toPersonaId } from '@/domain/scoring';
import { makeCode } from '@/domain/code';
import type { QuizDraft, QuizResult } from '@/lib/types';

const DRAFT_KEY = 'mp.quiz.draft';
const RESULT_LATEST_KEY = 'mp.result.latest';
const RESULT_HISTORY_KEY = 'mp.result.history';
const CALCULATING_DELAY_MS = 1200;
const RESULT_HISTORY_LIMIT = 20;

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function generateResultId(createdAt: number): string {
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return `r_${createdAt}_${suffix}`;
}

/**
 * 계산 화면 — draft.answers 12개로 QuizResult를 계산·저장하고 1,200ms 연출 후 /result로 이동한다.
 * 미완성 draft(answers에 null 포함)면 결과를 만들지 않고 첫 미응답 문항으로 즉시 되돌린다.
 */
export default function Calculating() {
  const navigate = useNavigate();
  const redirectedRef = useRef(false);
  const savedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;

    const draft = getItem<QuizDraft>(DRAFT_KEY);
    const answers = draft?.answers ?? (Array(12).fill(null) as Array<0 | 1 | null>);
    const firstNullIndex = answers.findIndex((a) => a === null);

    if (firstNullIndex !== -1) {
      redirectedRef.current = true;
      navigate(`/quiz/${firstNullIndex + 1}`, { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      if (savedRef.current) return;
      savedRef.current = true;

      const completeAnswers = answers as Array<0 | 1>;
      const scores = computeScores(completeAnswers);
      const personaId = toPersonaId(scores);
      const code = makeCode(personaId);
      const createdAt = Date.now();
      const id = generateResultId(createdAt);

      const result: QuizResult = {
        version: 1,
        id,
        personaId,
        scores,
        answers: completeAnswers,
        code,
        createdAt,
        reportUnlocked: false,
      };

      setItem(RESULT_LATEST_KEY, result);
      const history = getItem<QuizResult[]>(RESULT_HISTORY_KEY) ?? [];
      setItem(RESULT_HISTORY_KEY, [result, ...history].slice(0, RESULT_HISTORY_LIMIT));
      removeItem(DRAFT_KEY);

      try {
        generateHapticFeedback({ type: 'success' });
      } catch {
        // WebView 밖(브라우저/jsdom)에서는 SDK 호출이 throw할 수 있다 — 무시
      }

      navigate('/result', { replace: true, state: { resultId: id } });
    }, CALCULATING_DELAY_MS);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>결과 계산 중</Top.TitleParagraph>} />}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
        <Spacing size={16} />
        <Paragraph.Text typography="t4">소비 성향을 분석하고 있어요</Paragraph.Text>
        <Spacing size={8} />
        <Paragraph.Text typography="st11" color="secondary">
          잠시만 기다려 주세요
        </Paragraph.Text>
      </div>
    </ScreenScaffold>
  );
}
