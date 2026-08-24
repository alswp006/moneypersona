import { Top } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { ButtonStack } from '../components/BottomCTA';
import { EmptyState } from '../components/StateView';

/**
 * 라우팅 배선용 최소 화면 — 캐릭터 카드·축 지표·절약 팁은 결과 패킷이 이 파일을 교체하며 구현한다.
 */
export default function Result() {
  const navigate = useNavigate();

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>내 소비 캐릭터</Top.TitleParagraph>} />}
      bottom={
        <ButtonStack
          primary={{ label: '상세 리포트 보기', onClick: () => navigate('/report') }}
          secondary={{ label: '결과 공유하기', onClick: () => navigate('/share') }}
        />
      }
    >
      <Card testId="persona-card">
        <EmptyState
          title="아직 진단 결과가 없어요"
          description="12문항을 마치면 캐릭터와 3개 축 점수가 여기에 표시돼요"
        />
      </Card>
    </ScreenScaffold>
  );
}
