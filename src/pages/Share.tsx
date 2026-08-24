import { Top, Paragraph, Spacing } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { SubmitFooter } from '../components/BottomCTA';

/**
 * 라우팅 배선용 최소 화면 — 결과 이미지 생성·공유 코드 복사는 공유 패킷이 구현한다.
 */
export default function Share() {
  const navigate = useNavigate();

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>결과 공유</Top.TitleParagraph>} />}
      bottom={<SubmitFooter label="결과로 돌아가기" onClick={() => navigate('/result')} />}
    >
      <Card testId="share-preview">
        <Paragraph.Text typography="t3">공유 카드를 만드는 중이에요</Paragraph.Text>
        <Spacing size={8} />
        <Paragraph.Text typography="t6">
          진단을 마치면 캐릭터 카드와 공유 코드가 여기에 표시돼요
        </Paragraph.Text>
      </Card>
    </ScreenScaffold>
  );
}
