import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Top, Paragraph, Spacing, Button, Badge, AlertDialog } from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { QUESTIONS } from '@/domain/questions';
import { useQuizDraft } from '@/state/useQuizDraft';
import type { Question } from '@/lib/types';

const AXIS_LABEL: Record<Question['axis'], string> = {
  spend: '소비 성향',
  plan: '계획 성향',
  risk: '위험 성향',
};

const AXIS_BADGE_COLOR: Record<Question['axis'], 'blue' | 'teal' | 'green'> = {
  spend: 'blue',
  plan: 'teal',
  risk: 'green',
};

/** SDK는 WebView 밖(브라우저/jsdom)에서 throw하므로 가드 필수 — 흰 화면 방지 */
function fireHaptic(type: 'tickWeak') {
  try {
    Promise.resolve(generateHapticFeedback({ type })).catch(() => {});
  } catch {
    /* WebView 밖 — 무시 */
  }
}

export default function Quiz() {
  const navigate = useNavigate();
  const { step } = useParams<{ step: string }>();
  const { draft, answer, firstUnansweredStep } = useQuizDraft();
  const [exitOpen, setExitOpen] = useState(false);

  const parsedStep = Number(step);
  const isValidStep = Number.isInteger(parsedStep) && parsedStep >= 1 && parsedStep <= 12;
  const redirectTarget = firstUnansweredStep ?? 1;
  // 이미 진행 중인 응답이 있을 때만 앞지르기 방지 — 진행 이력이 없으면(firstUnansweredStep===1)
  // 딥링크로 임의 step에 바로 진입할 수 있게 허용한다.
  const needsRedirect =
    !isValidStep || (firstUnansweredStep != null && firstUnansweredStep > 1 && parsedStep > firstUnansweredStep);

  useEffect(() => {
    if (needsRedirect) {
      navigate(`/quiz/${redirectTarget}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsRedirect, redirectTarget]);

  if (needsRedirect) {
    return null;
  }

  const stepNum = parsedStep;
  const question: Question = QUESTIONS[stepNum - 1];
  const existingAnswer = draft?.answers[stepNum - 1] ?? null;

  function choose(value: 0 | 1) {
    fireHaptic('tickWeak');
    answer(stepNum - 1, value);
    if (stepNum < 12) {
      navigate(`/quiz/${stepNum + 1}`);
    } else {
      navigate('/quiz/calculating');
    }
  }

  function askExit() {
    setExitOpen(true);
  }

  function confirmExit() {
    setExitOpen(false);
    navigate('/');
  }

  return (
    <ScreenScaffold
      top={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Top title={<Top.TitleParagraph>{stepNum} / 12</Top.TitleParagraph>} />
          </div>
          <Button variant="weak" size="small" onClick={askExit}>
            그만하기
          </Button>
        </div>
      }
    >
      <div
        data-testid="quiz-progress-bar"
        style={{
          display: 'flex',
          height: 4,
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'var(--tds-color-grey100)',
        }}
      >
        <div style={{ flexGrow: stepNum, backgroundColor: 'var(--tds-color-blue500)' }} />
        <div style={{ flexGrow: 12 - stepNum, backgroundColor: 'var(--tds-color-grey100)' }} />
      </div>

      <Spacing size={4} />
      <Paragraph.Text typography="st13" data-testid="quiz-progress-text">
        {stepNum} / 12
      </Paragraph.Text>

      <Spacing size={20} />
      <Badge size="medium" variant="weak" color={AXIS_BADGE_COLOR[question.axis]}>
        {AXIS_LABEL[question.axis]}
      </Badge>

      <Spacing size={12} />
      <Paragraph.Text typography="t3">{question.text}</Paragraph.Text>

      <Spacing size={24} />
      <Button
        variant={existingAnswer === question.options[0].value ? 'fill' : 'weak'}
        size="large"
        display="block"
        onClick={() => choose(question.options[0].value)}
      >
        {question.options[0].label}
      </Button>
      <Spacing size={12} />
      <Button
        variant={existingAnswer === question.options[1].value ? 'fill' : 'weak'}
        size="large"
        display="block"
        onClick={() => choose(question.options[1].value)}
      >
        {question.options[1].label}
      </Button>

      <Spacing size={24} />

      <AlertDialog
        open={exitOpen}
        title="진단을 그만할까요?"
        description="지금까지 답변한 내용은 그대로 남아있어요."
        alertButton={<AlertDialog.AlertButton onClick={confirmExit}>그만두기</AlertDialog.AlertButton>}
        onClose={() => setExitOpen(false)}
      />
    </ScreenScaffold>
  );
}
