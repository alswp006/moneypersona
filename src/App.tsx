import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ROUTES } from './routes/routes';

// 라우터/테마 Provider는 main.tsx(scaffold anchor 파일)가 이미 감싸고 있다 — 여기서 중첩하지 않는다.
// 광고 SDK도 전역 Provider가 없다: AdSlot이 첫 사용 시 TossAds를 1회 초기화하고
// (src/components/AdSlot.tsx) WebView 밖에서는 조용히 건너뛴다.

// Dev-only TDS Gallery route — `import.meta.env.DEV` is statically replaced
// (true in dev, false in prod) so the entire import + Route is tree-shaken
// from production builds. Verify with: `grep -r "TdsGallery" dist/` → empty.
const DevTdsGallery = import.meta.env.DEV
  ? lazy(() => import('./pages/__TdsGallery'))
  : null;

export default function App() {
  return (
    <Routes>
      {ROUTES.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
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
      {/* 정의되지 않은 경로(/foo, /quiz)는 홈으로 — 히스토리에 남기지 않도록 replace */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
