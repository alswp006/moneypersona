import { Top, Paragraph, Spacing } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { ButtonStack } from '../components/BottomCTA';

/**
 * 라우팅 배선용 최소 화면 — 리워드 광고 게이팅과 상세 분석 카드는 리포트 패킷이 구현한다.
 */
export default function Report() {
  const navigate = useNavigate();

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>상세 분석 리포트</Top.TitleParagraph>} />}
      bottom={
        <ButtonStack
          primary={{ label: '결과 공유하기', onClick: () => navigate('/share') }}
          secondary={{ label: '결과로 돌아가기', onClick: () => navigate('/result') }}
        />
      }
    >
      <Card testId="report-card">
        <Paragraph.Text typography="t3">리포트를 준비하고 있어요</Paragraph.Text>
        <Spacing size={8} />
        <Paragraph.Text typography="t6">
          진단을 마치면 위험 신호 2가지와 30일 플랜 3단계를 볼 수 있어요
        </Paragraph.Text>
      </Card>
    </ScreenScaffold>
  );
}
