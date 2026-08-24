import {
  Component,
  Suspense,
  lazy,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useMatch,
} from 'react-router-dom';
import { Asset, Button, Paragraph, Top } from '@toss/tds-mobile';
import { Analytics, TossAds } from '@apps-in-toss/web-framework';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Result from './pages/Result';
import Report from './pages/Report';
import Share from './pages/Share';
import Compat from './pages/Compat';
import History from './pages/History';
import { FloatingTabBar, type TabItem } from './components/FloatingTabBar';
import { ScreenScaffold } from './components/ScreenScaffold';
import { EmptyState } from './components/StateView';

// Dev-only TDS Gallery route — `import.meta.env.DEV` is statically replaced
// (true in dev, false in prod) so the entire import + Route is tree-shaken
// from production builds. Verify with: `grep -r "TdsGallery" dist/` → empty.
const DevTdsGallery = import.meta.env.DEV
  ? lazy(() => import('./pages/__TdsGallery'))
  : null;

/**
 * 24px 아이콘 박스. 토스 아이콘 CDN이 응답하지 않아도 깨진 이미지가 탭바에 남지
 * 않도록 고정 크기 + overflow hidden으로 감싼다(아이콘 없이 라벨만 보임).
 */
function TabIcon({ name, alt }: { name: string; alt: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        width: 24,
        height: 24,
        overflow: 'hidden',
        color: 'inherit',
      }}
    >
      <Asset.ContentIcon name={name} alt={alt} color="currentColor" />
    </span>
  );
}

const TAB_ITEMS: TabItem[] = [
  { label: '홈', path: '/', icon: <TabIcon name="icon-home-mono" alt="홈" /> },
  { label: '궁합', path: '/compat', icon: <TabIcon name="icon-heart-mono" alt="궁합" /> },
  { label: '기록', path: '/history', icon: <TabIcon name="icon-clock-mono" alt="기록" /> },
];

/** SDK는 WebView 밖에서 예외를 던진다 — 전역 배선은 전부 가드한다. */
function initAdSdk() {
  try {
    if (TossAds.initialize.isSupported?.() !== true) return;
    TossAds.initialize({});
  } catch {
    /* 앱인토스 WebView 밖 — 광고 없이 계속 동작 */
  }
}

function logScreen(pathname: string) {
  try {
    Promise.resolve(Analytics.screen({ log_name: pathname })).catch(() => {});
  } catch {
    /* 브릿지 없음 — 무시 */
  }
}

// jsdom에서 window.scrollTo가 "Not implemented" 에러를 던지므로 scrollTop을 직접 조작
// 라우트 변경 시 스크롤 초기화 + 화면 진입 로그
function useRouteEffects(pathname: string) {
  useEffect(() => {
    initAdSdk();
  }, []);

  useEffect(() => {
    try {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch {
      /* 스크롤 컨테이너 없음 — 무시 */
    }
    logScreen(pathname);
  }, [pathname]);
}

/** 페이지가 렌더 중 예외를 던져도 흰 화면 대신 복구 경로를 보여준다. */
class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // 검수 기준상 console 출력 금지 — 상태로만 복구한다.
    this.setState({ failed: true });
  }

  render() {
    if (this.state.failed) {
      return <RouteErrorFallback onRetry={() => this.setState({ failed: false })} />;
    }
    return this.props.children;
  }
}

function RouteErrorFallback({ onRetry }: { onRetry: () => void }) {
  const navigate = useNavigate();

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>MoneyPersona</Top.TitleParagraph>} />}>
      <EmptyState
        title="화면을 여는 데 실패했어요"
        description="잠시 후 다시 시도하거나 홈에서 처음부터 진행해 주세요"
        action={
          <Button
            variant="weak"
            display="block"
            onClick={() => {
              onRetry();
              navigate('/');
            }}
          >
            홈으로 가기
          </Button>
        }
        testId="route-error"
      />
      <Paragraph.Text typography="st13">기록한 결과는 그대로 남아 있어요</Paragraph.Text>
    </ScreenScaffold>
  );
}

export default function App() {
  // 탭 루트 판정은 useMatch로 한다(useLocation 대신).
  // 훅 호출 순서가 고정돼야 하므로 탭 개수만큼 무조건 호출한다 — TAB_ITEMS 순서와 1:1.
  const tabMatches = [useMatch('/'), useMatch('/compat'), useMatch('/history')];
  const activeTabIndex = tabMatches.findIndex((match) => match !== null);
  const showTabBar = activeTabIndex >= 0;
  const activePath = showTabBar ? TAB_ITEMS[activeTabIndex].path : undefined;

  const { pathname } = useLocation();
  useRouteEffects(pathname);

  return (
    <RouteErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/result" element={<Result />} />
        <Route path="/report" element={<Report />} />
        <Route path="/share" element={<Share />} />
        <Route path="/compat" element={<Compat />} />
        <Route path="/history" element={<History />} />
        {DevTdsGallery && (
          <Route
            path="/__tds-gallery"
            element={
              <Suspense fallback={null}>
                <DevTdsGallery />
              </Suspense>
            }
          />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showTabBar && (
        <>
          {/* 고정 탭바에 콘텐츠 마지막 줄이 가리지 않도록 여백 확보 */}
          <div
            aria-hidden="true"
            style={{ height: 'calc(64px + var(--toss-safe-area-bottom, 0px))' }}
          />
          <FloatingTabBar items={TAB_ITEMS} activePath={activePath} />
        </>
      )}
    </RouteErrorBoundary>
  );
}
