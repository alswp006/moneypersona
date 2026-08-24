import { useState } from 'react';
import { Top, Paragraph, Spacing, Button } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { MiniBar } from '@/components/MiniBar';
import { QUESTIONS } from '@/data/questions';
import { scoreQuiz } from '@/lib/scoring';
import { makeShareCode } from '@/lib/shareCode';
import { getItem, setItem, removeItem } from '@/lib/storage';
import type { Choice, QuizProgress, QuizResult, RouteState } from '@/lib/types';

const PROGRESS_KEY = 'mp:progress:v1';
const RESULT_KEY = 'mp:result:v1';
const HISTORY_KEY = 'mp:history:v1';

type Envelope<T> = { v: 1; data: T };

/** navigate('/result', { state }, { replace: true }) — react-router 표준 2-인자 시그니처를 넘어서는
 *  이 화면 고유의 3-인자 호출 계약(AC-4)이라 캐스팅으로 통과시킨다. */
type NavigateWithReplace = (
  to: string,
  options: { state: RouteState['/result'] },
  extra: { replace: true },
) => void;

function fireHaptic() {
  try {
    Promise.resolve(generateHapticFeedback({ type: 'tickWeak' })).catch(() => {});
  } catch {
    /* WebView 밖(브라우저/jsdom)에서는 throw — 무시 */
  }
}

function isValidProgress(data: QuizProgress): boolean {
  return (
    Array.isArray(data.answers) &&
    data.answers.length === QUESTIONS.length &&
    typeof data.currentIndex === 'number' &&
    data.currentIndex >= 0 &&
    data.currentIndex < QUESTIONS.length
  );
}

function readProgress(): QuizProgress | null {
  const stored = getItem<Envelope<QuizProgress> | QuizProgress>(PROGRESS_KEY);
  if (!stored) return null;
  const data: QuizProgress = 'data' in stored ? stored.data : stored;
  return isValidProgress(data) ? data : null;
}

function writeProgress(progress: QuizProgress): void {
  const envelope: Envelope<QuizProgress> = { v: 1, data: progress };
  setItem(PROGRESS_KEY, envelope);
}

function appendHistory(result: QuizResult): void {
  const stored = getItem<Envelope<QuizResult[]> | QuizResult[]>(HISTORY_KEY);
  const list: QuizResult[] = stored ? ('data' in stored ? stored.data : stored) : [];
  const envelope: Envelope<QuizResult[]> = { v: 1, data: [...list, result] };
  setItem(HISTORY_KEY, envelope);
}

export default function Quiz() {
  const navigate = useNavigate();
  const [savedProgress] = useState<QuizProgress | null>(() => readProgress());
  const [currentIndex, setCurrentIndex] = useState(() => savedProgress?.currentIndex ?? 0);
  const [answers, setAnswers] = useState<(0 | 1 | null)[]>(
    () => savedProgress?.answers ?? Array(QUESTIONS.length).fill(null),
  );

  const question = QUESTIONS[currentIndex];
  const questionNumber = currentIndex + 1;

  function submit(finalAnswers: (0 | 1)[]) {
    const scored = scoreQuiz(finalAnswers);
    if (!scored.ok) return;

    const createdAt = Date.now();
    const result: QuizResult = {
      id: `r_${createdAt}_${scored.personaCode}`,
      createdAt,
      answers: finalAnswers,
      axisScores: scored.axisScores,
      personaCode: scored.personaCode,
      shareCode: makeShareCode(scored.personaCode),
      reportUnlocked: false,
    };

    setItem(RESULT_KEY, { v: 1, data: result } satisfies Envelope<QuizResult>);
    appendHistory(result);
    removeItem(PROGRESS_KEY);

    (navigate as unknown as NavigateWithReplace)(
      '/result',
      { state: { resultId: result.id } as RouteState['/result'] },
      { replace: true },
    );
  }

  function handleChoice(choice: Choice) {
    fireHaptic();
    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = choice.score;
    setAnswers(nextAnswers);

    if (currentIndex < QUESTIONS.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      writeProgress({ answers: nextAnswers, currentIndex: nextIndex, updatedAt: Date.now() });
      return;
    }

    submit(nextAnswers as (0 | 1)[]);
  }

  function handleBack() {
    if (currentIndex === 0) return;
    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    writeProgress({ answers, currentIndex: prevIndex, updatedAt: Date.now() });
  }

  return (
    <ScreenScaffold
      top={
        <Top
          title={<Top.TitleParagraph>{`${questionNumber} / ${QUESTIONS.length}`}</Top.TitleParagraph>}
        />
      }
    >
      <MiniBar ratio={questionNumber / QUESTIONS.length} testId="quiz-progress" />
      <Spacing size={24} />
      <Paragraph.Text typography="t2">{question.text}</Paragraph.Text>
      <Spacing size={24} />
      {question.choices.map((choice) => {
        const isSelected = answers[currentIndex] === choice.score;
        return (
          <div key={choice.id}>
            <Button
              variant={isSelected ? 'fill' : 'weak'}
              display="block"
              aria-pressed={isSelected}
              onClick={() => handleChoice(choice)}
            >
              {choice.label}
            </Button>
            <Spacing size={12} />
          </div>
        );
      })}
      <Button variant="weak" disabled={currentIndex === 0} onClick={handleBack}>
        이전
      </Button>
    </ScreenScaffold>
  );
}
