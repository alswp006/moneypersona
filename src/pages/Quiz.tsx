import { Top, Paragraph, Spacing } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { SubmitFooter } from '../components/BottomCTA';

/**
 * 라우팅 배선용 최소 화면 — 12문항 진단 로직은 퀴즈 패킷이 이 파일을 교체하며 구현한다.
 * (라우터가 정적 import하는 화면은 비어 있으면 번들 해석이 깨지므로 먼저 존재시킨다.)
 */
export default function Quiz() {
  const navigate = useNavigate();

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>1 / 12</Top.TitleParagraph>} />}
      bottom={<SubmitFooter label="결과 보기" onClick={() => navigate('/result')} />}
    >
      <Card testId="quiz-question">
        <Paragraph.Text typography="t3">돈이 생기면 먼저 무엇을 하나요</Paragraph.Text>
        <Spacing size={8} />
        <Paragraph.Text typography="t6">
          12개 문항에 답하면 8가지 소비 캐릭터 중 하나가 나와요
        </Paragraph.Text>
      </Card>
    </ScreenScaffold>
  );
}
