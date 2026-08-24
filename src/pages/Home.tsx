import { Top, Paragraph, Spacing, ListRow, Button } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { SummaryHero } from '../components/SummaryHero';
import { Card } from '../components/Card';
import DisclaimerNotice from '../components/DisclaimerNotice';

/**
 * 홈 — 앱 진입점(탭 루트).
 *
 * 진단 결과/기록 데이터에 아직 의존하지 않는 최소 배선이다. 진단 데이터가 붙는 패킷은
 * SummaryHero의 value를 <Amount typography="t1" />(최근 결과의 절약 지수 등)로 교체하고,
 * 아래 안내 Card를 '최근 진단 기록' 행으로 바꾸면 된다 — 골격(ScreenScaffold + 카드 내 CTA)은 유지.
 *
 * 탭 루트라 하단 고정 CTA(SubmitFooter)를 쓰지 않는다 — FloatingTabBar와 자리가 겹친다.
 * 1차 진입 액션은 SummaryHero 카드 안의 전체폭 버튼(display="block")이다.
 */

// 테스트가 무엇을 재는지 — 사용자가 시작 전에 실제로 궁금해하는 것만.
const TEST_FACTS = [
  { title: '문항 12개', description: '세 가지 축으로 소비 성향을 나눠요' },
  { title: '캐릭터 8종', description: '알뜰형 다람쥐부터 질러형 치타까지' },
  { title: '기록 보관', description: '결과는 이 기기에만 남아요' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>MoneyPersona</Top.TitleParagraph>} />}
    >
      <SummaryHero
        label="돈 쓰는 성향 테스트"
        value={
          <Paragraph.Text typography="t2">12문항으로 찾는 내 소비 캐릭터</Paragraph.Text>
        }
        caption="약 2분 · 로그인 없이 바로"
        action={
          <Button variant="fill" display="block" onClick={() => navigate('/quiz')}>
            테스트 시작하기
          </Button>
        }
        testId="home-hero"
      />

      <Spacing size={24} />

      <Card testId="home-facts">
        {TEST_FACTS.map((fact) => (
          <ListRow
            key={fact.title}
            contents={
              <ListRow.Texts type="2RowTypeA" top={fact.title} bottom={fact.description} />
            }
          />
        ))}
      </Card>

      <DisclaimerNotice />
    </ScreenScaffold>
  );
}
