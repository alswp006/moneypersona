import { Top, Paragraph, Spacing, Button } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';

/**
 * 라우팅 배선용 최소 화면 — 진단 기록 목록과 절약 지수 추이는 기록 패킷이 구현한다.
 * 탭 루트라 하단 고정 CTA(SubmitFooter)를 두지 않는다(탭바와 겹침).
 */
export default function History() {
  const navigate = useNavigate();

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>내 진단 기록</Top.TitleParagraph>} />}>
      <Card testId="history-empty">
        <Paragraph.Text typography="t3">아직 기록이 없어요</Paragraph.Text>
        <Spacing size={8} />
        <Paragraph.Text typography="t6">
          진단을 마치면 날짜별 캐릭터와 절약 지수 추이가 쌓여요
        </Paragraph.Text>
        <Spacing size={16} />
        <Button variant="fill" display="block" onClick={() => navigate('/quiz')}>
          테스트 시작하기
        </Button>
      </Card>
    </ScreenScaffold>
  );
}
