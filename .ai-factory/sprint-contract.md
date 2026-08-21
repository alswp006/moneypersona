# Sprint Contract — Packet 0019: 라우터 배선 · 전역 Provider 통합

## 목표
App.tsx에서 react-router-dom 8개 라우트 배선 + TDS 테마/광고 SDK 전역 Provider 통합. 정의되지 않은 경로는 '/'로 replace.

## 파일 변경
- **src/App.tsx**: BrowserRouter + 8개 Route + catch-all + 전역 Provider 계층
- **src/routes/routes.tsx** (신규): 라우트 상수 export (경로, element 매핑)

## 사용 타입 (types.ts import)
- `RouteState` — 라우트별 state 타입 계약 (ResultNavState|CompatNavState|null 분기)

## 라우트 목록 (8개)
`'/' | '/quiz/:step' | '/quiz/calculating' | '/result' | '/report' | '/share' | '/compat' | '/history'`

## 검증 (before PR)
- `npx tsc --noEmit` 무조건 통과 (RouteState 분기 타입 에러 포함)
- FloatingTabBar 노출 규칙 미정의 라우트에서 숨김 ← 패킷 후속 규칙(이 PR 다음)
- React Router useNavigate() 호출 화면에서 navigate(path, {state: ...}) 인자가 RouteState 타입과 일치

## 금지
- ❌ main.tsx 수정 (TDSMobileAITProvider/BrowserRouter 이미 설정됨)
- ❌ App.tsx 외부에서 BrowserRouter 중첩
- ❌ 라우트 element lazy loading (동기 import 만)
