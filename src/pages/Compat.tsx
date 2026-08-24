import { Top, Paragraph, Spacing, Button } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';

/**
 * 라우팅 배선용 최소 화면 — 공유 코드 입력과 궁합 점수 계산은 궁합 패킷이 구현한다.
 * 탭 루트라 하단 고정 CTA(SubmitFooter)를 두지 않는다(탭바와 겹침).
 */
export default function Compat() {
  const navigate = useNavigate();

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>친구와 궁합</Top.TitleParagraph>} />}>
      <Card testId="compat-intro">
        <Paragraph.Text typography="t3">먼저 내 캐릭터를 진단해 주세요</Paragraph.Text>
        <Spacing size={8} />
        <Paragraph.Text typography="t6">
          내 결과가 있어야 친구 공유 코드와 궁합을 비교할 수 있어요
        </Paragraph.Text>
        <Spacing size={16} />
        <Button variant="fill" display="block" onClick={() => navigate('/quiz')}>
          테스트 시작하기
        </Button>
      </Card>
    </ScreenScaffold>
  );
}
