import { Top, Paragraph, Spacing } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { ButtonStack } from '../components/BottomCTA';

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
        <Paragraph.Text typography="t2">진단 결과를 불러오는 중이에요</Paragraph.Text>
        <Spacing size={8} />
        <Paragraph.Text typography="t6">
          12문항을 마치면 캐릭터와 3개 축 점수가 여기에 표시돼요
        </Paragraph.Text>
      </Card>
    </ScreenScaffold>
  );
}
