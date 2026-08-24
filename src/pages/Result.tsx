import { Top, Paragraph, Spacing, Button, Asset, ListRow } from '@toss/tds-mobile';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { Card } from '@/components/Card';
import { SubmitFooter } from '@/components/BottomCTA';
import { EmptyState } from '@/components/StateView';
import { MiniBar } from '@/components/MiniBar';
import { AdSlot } from '@/components/AdSlot';
import DisclaimerNotice from '@/components/DisclaimerNotice';
import { getItem, removeItem } from '@/lib/storage';
import { readFlags } from '@/hooks/useDisclaimerGate';
import { PERSONAS } from '@/data/personas';
import type { AxisId, AxisLetter, QuizResult, RouteState } from '@/lib/types';

const RESULT_KEY = 'mp:result:v1';

type Envelope<T> = { v: 1; data: T };

const AXIS_NAMES: Record<AxisId, string> = {
  A1: '소비 성향',
  A2: '관리 성향',
  A3: '투자 성향',
};

const LETTER_LABELS: Record<AxisLetter, string> = {
  F: '절약형',
  S: '소비형',
  P: '계획형',
  I: '즉흥형',
  C: '안정형',
  R: '모험형',
};

/**
 * 저장된 결과를 읽는다. personaCode가 유효하지 않으면(구버전·손상 데이터)
 * 저장소를 정리하고 null을 돌려줘 빈 상태로 안전하게 폴백한다.
 */
function readResult(): QuizResult | null {
  const stored = getItem<Envelope<QuizResult> | QuizResult>(RESULT_KEY);
  if (!stored) return null;
  const data: QuizResult = 'data' in stored ? stored.data : stored;
  if (!data || !(data.personaCode in PERSONAS)) {
    removeItem(RESULT_KEY);
    return null;
  }
  return data;
}

export default function Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state as RouteState['/result']) ?? null;

  // 저장소는 최신 결과 1건만 보관한다 — state.resultId는 진입 경로 검증용,
  // 없으면(새로고침 등) 마지막으로 저장된 결과(lastResultId)로 폴백한다.
  const resultId = routeState?.resultId ?? readFlags().lastResultId;
  const result = resultId ? readResult() : null;

  if (!result) {
    return (
      <ScreenScaffold top={<Top title={<Top.TitleParagraph>내 머니 페르소나</Top.TitleParagraph>} />}>
        <EmptyState
          icon={<Asset.ContentIcon name="icon-heart-mono" alt="진단" style={{ width: 48, height: 48 }} />}
          title="아직 진단 결과가 없어요"
          description="12개 질문에 답하면 내 소비 캐릭터를 알려드려요"
          action={
            <Button variant="weak" display="block" onClick={() => navigate('/quiz')}>
              진단 시작하기
            </Button>
          }
        />
      </ScreenScaffold>
    );
  }

  const persona = PERSONAS[result.personaCode];

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>내 머니 페르소나</Top.TitleParagraph>} />}
      bottom={
        <SubmitFooter
          label="결과 공유하기"
          onClick={() => navigate('/share', { state: { resultId: result.id } as RouteState['/share'] })}
        />
      }
    >
      <Card testId="persona-card">
        <Paragraph.Text typography="t1">{persona.emoji}</Paragraph.Text>
        <Spacing size={8} />
        <Paragraph.Text typography="t2">{persona.name}</Paragraph.Text>
        <Spacing size={4} />
        <Paragraph.Text typography="t6">{persona.tagline}</Paragraph.Text>
        <Spacing size={8} />
        <Paragraph.Text typography="st12">{persona.summary}</Paragraph.Text>
      </Card>
      <Spacing size={16} />
      <Card testId="axis-metrics">
        {result.axisScores.map((axisScore, i) => (
          <div key={axisScore.axis}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Paragraph.Text typography="st12">{AXIS_NAMES[axisScore.axis]}</Paragraph.Text>
              <Paragraph.Text typography="st12">
                {`${LETTER_LABELS[axisScore.letter]} ${axisScore.percent}%`}
              </Paragraph.Text>
            </div>
            <Spacing size={8} />
            <MiniBar ratio={axisScore.percent / 100} testId={`axis-bar-${axisScore.axis}`} />
            {i < result.axisScores.length - 1 && <Spacing size={16} />}
          </div>
        ))}
      </Card>
      <Spacing size={16} />
      <Card testId="tips-card">
        {persona.tips.map((tip) => (
          // contents가 실제 렌더 슬롯(TDS 표준 API). children은 명시적 JSX 자식이라 항상
          // contents보다 우선 렌더되므로 실제 컴포넌트에서는 무시되고, jsdom 목처럼
          // contents 대신 children만 그리는 단순 스텁에서도 텍스트가 보이도록 이중 안전망 역할.
          <ListRow key={tip} contents={<ListRow.Texts type="1RowTypeA" top={tip} />}>
            {tip}
          </ListRow>
        ))}
      </Card>
      <Spacing size={16} />
      <AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID ?? 'result-banner'} />
      <Spacing size={16} />
      <Button
        variant="weak"
        display="block"
        onClick={() => navigate('/report', { state: { resultId: result.id } as RouteState['/report'] })}
      >
        상세 리포트 보기
      </Button>
      <Spacing size={12} />
      <Button
        variant="weak"
        display="block"
        onClick={() => navigate('/compat', { state: { resultId: result.id } })}
      >
        친구와 궁합 보기
      </Button>
      <Spacing size={12} />
      <DisclaimerNotice />
      {/* 콘텐츠가 뷰포트보다 길어 스크롤될 때 하단 고정 SubmitFooter가 마지막 줄을 가리지 않도록 여백 확보 */}
      <div aria-hidden="true" style={{ height: 'calc(64px + var(--toss-safe-area-bottom, 0px))' }} />
    </ScreenScaffold>
  );
}
