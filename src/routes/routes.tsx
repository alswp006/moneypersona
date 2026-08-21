import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Top } from '@toss/tds-mobile';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { EmptyState } from '@/components/StateView';
import { FloatingTabBar, type TabItem } from '@/components/FloatingTabBar';
import Home from '@/pages/Home';
import Quiz from '@/pages/Quiz';
import Calculating from '@/pages/Calculating';
import History from '@/pages/History';
import type { RouteState } from '@/lib/types';

/** 앱이 아는 경로는 RouteState(types.ts)의 키가 전부다 — 경로 오타를 타입으로 막는다. */
export type RoutePath = keyof RouteState;

export interface AppRoute {
  path: RoutePath;
  element: ReactElement;
}

/** 하단 탭 네비가 보이는 루트 3개. 그 외 화면(퀴즈·결과·리포트·공유)에서는 탭바를 숨긴다. */
export const TAB_ROOT_PATHS: readonly RoutePath[] = ['/', '/compat', '/history'];

/** 기록 화면(History)의 탭 목록과 동일해야 한다 — 화면마다 탭 구성이 달라지면 안 된다. */
export const TAB_ITEMS: TabItem[] = [
  { label: '홈', path: '/' },
  { label: '궁합', path: '/compat' },
  { label: '기록', path: '/history' },
];

/**
 * 탭 루트 화면 래퍼 — 하단 FloatingTabBar를 붙인다.
 *
 * 화면 패킷이 자체 FloatingTabBar를 이미 그린 경우(기록 화면)에는 탭바를 두 개
 * 그리지 않는다. 판정은 렌더된 DOM으로 한다 — 현재 경로(useLocation)로 판정하면
 * 화면 패킷의 구현 여부를 여기서 다시 외워야 하고, 그 목록이 어긋나는 순간
 * 탭바가 겹치거나 사라진다.
 */
function TabRootLayout({ children }: { children: ReactNode }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [pageOwnsTabBar, setPageOwnsTabBar] = useState(true);

  useLayoutEffect(() => {
    // 자기 자신은 ref 바깥에 있으므로 여기서 잡히지 않는다(무한 토글 없음).
    setPageOwnsTabBar(pageRef.current?.querySelector('nav[role="tablist"]') != null);
  });

  return (
    <>
      {/* display:contents — 래퍼가 페이지 레이아웃(100dvh·safe-area)에 개입하지 않는다 */}
      <div ref={pageRef} style={{ display: 'contents' }}>
        {children}
      </div>
      {!pageOwnsTabBar && <FloatingTabBar items={TAB_ITEMS} />}
    </>
  );
}

/**
 * 아직 병합되지 않은 화면 패킷(/result·/report·/share·/compat)을 자동으로 연결한다.
 *
 * import.meta.glob은 빌드 타임 정적 분석이라 파일이 없으면 빈 맵이 되고(빌드·타입체크
 * 통과), 해당 패킷이 병합돼 파일이 생기는 순간 그대로 라우트에 붙는다. 라우터 패킷이
 * 남의 파일(src/pages/Result.tsx 등)을 미리 만들어 병합 충돌을 내지 않으면서도
 * 8개 경로가 전부 살아 있게 하는 방법이다.
 */
const PENDING_PAGES = import.meta.glob<{ default?: ComponentType }>(
  ['../pages/Result.tsx', '../pages/Report.tsx', '../pages/Share.tsx', '../pages/Compat.tsx'],
  { eager: true },
);

function loadPage(name: 'Result' | 'Report' | 'Share' | 'Compat'): ComponentType | null {
  const found = Object.entries(PENDING_PAGES).find(([key]) => key.endsWith(`/${name}.tsx`));
  return found?.[1]?.default ?? null;
}

/**
 * 화면 패킷이 아직 없을 때 대신 서는 화면.
 * 막다른 길을 만들지 않도록 항상 다음 경로로 나가는 버튼을 둔다.
 */
function Placeholder({
  title,
  heading,
  message,
  actionLabel,
  actionPath,
  testId,
}: {
  /** 상단 바 제목 */
  title: string;
  /** 본문 제목 — 상단 바와 같은 문구를 반복하지 않는다 */
  heading: string;
  message: string;
  actionLabel: string;
  actionPath: RoutePath | '/quiz/1';
  testId: string;
}) {
  const navigate = useNavigate();

  // 아이콘(Asset.ContentIcon)은 넣지 않는다 — CDN 아이콘 이름이 틀리면 이미지 요청이
  // 403으로 떨어지면서 React 트리가 통째로 죽는다(흰 화면). 임시 화면에 걸 위험이 아니다.
  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>{title}</Top.TitleParagraph>} />}>
      <EmptyState
        title={heading}
        description={message}
        action={
          <Button variant="weak" display="block" onClick={() => navigate(actionPath)}>
            {actionLabel}
          </Button>
        }
        testId={testId}
      />
    </ScreenScaffold>
  );
}

function pageOrPlaceholder(
  name: 'Result' | 'Report' | 'Share' | 'Compat',
  placeholder: ReactElement,
): ReactElement {
  const Page = loadPage(name);
  return Page ? <Page /> : placeholder;
}

/**
 * 앱의 8개 경로. `/quiz/calculating`을 `/quiz/:step`보다 먼저 둬서
 * 계산 화면이 step 문항으로 잘못 매칭되지 않게 한다.
 */
export const ROUTES: AppRoute[] = [
  { path: '/', element: <TabRootLayout><Home /></TabRootLayout> },
  { path: '/quiz/calculating', element: <Calculating /> },
  { path: '/quiz/:step', element: <Quiz /> },
  {
    path: '/result',
    element: pageOrPlaceholder(
      'Result',
      <Placeholder
        title="진단 결과"
        heading="아직 진단 결과가 없어요"
        message="12개 질문에 답하면 내 캐릭터가 나와요."
        actionLabel="테스트 시작하기"
        actionPath="/quiz/1"
        testId="result-placeholder"
      />,
    ),
  },
  {
    path: '/report',
    element: pageOrPlaceholder(
      'Report',
      <Placeholder
        title="상세 리포트"
        heading="결과를 먼저 확인해 주세요"
        message="진단 결과 화면에서 상세 리포트를 열 수 있어요."
        actionLabel="결과 보기"
        actionPath="/result"
        testId="report-placeholder"
      />,
    ),
  },
  {
    path: '/share',
    element: pageOrPlaceholder(
      'Share',
      <Placeholder
        title="결과 공유"
        heading="공유할 결과가 없어요"
        message="결과 카드를 만들면 친구에게 보낼 수 있어요."
        actionLabel="결과 보기"
        actionPath="/result"
        testId="share-placeholder"
      />,
    ),
  },
  {
    path: '/compat',
    element: (
      <TabRootLayout>
        {pageOrPlaceholder(
          'Compat',
          <Placeholder
            title="궁합 보기"
            heading="친구 코드로 궁합 보기"
            message="내 진단을 마치면 친구 코드 5자리로 궁합 점수를 볼 수 있어요."
            actionLabel="테스트 시작하기"
            actionPath="/quiz/1"
            testId="compat-placeholder"
          />,
        )}
      </TabRootLayout>
    ),
  },
  { path: '/history', element: <TabRootLayout><History /></TabRootLayout> },
];
