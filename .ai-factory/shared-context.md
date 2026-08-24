# Shared Context (auto-generated — do NOT modify)


## 패킷 간 계약 (src/lib/contract.ts — 자동 생성, 수정 금지)
여기 선언된 이름·인자·반환 타입은 확정이다. 기반 패킷은 이대로 구현하고,
화면 패킷은 이대로 호출하라. 다르게 만들지 마라.

```typescript
/**
 * 패킷 간 인터페이스 계약 — 자동 생성. **수정하지 마라.**
 *
 * 기반 패킷은 여기 선언된 모양 그대로 구현하고, 화면 패킷은 여기 적힌 이름·인자·반환
 * 타입을 그대로 가정해도 된다. 추측이 어긋나 병합에서 무너지는 것을 막기 위한 파일이다.
 */

/** 12문항 정적 콘텐츠 구조 (구현: 패킷 0002) */
export type Question = { id: string; text: string; options: { value: number; label: string }[] };

/** 8캐릭터 페르소나 구조 (구현: 패킷 0003) */
export type Persona = { id: string; name: string; description: string; emoji: string };

/** 사용자 답변 원자 단위 (구현: 패킷 0001) */
export type Answer = { questionId: string; value: number };

/** 스코어링 결과 최종 형식 (구현: 패킷 0005) */
export type Result = { id: string; timestamp: number; answers: Answer[]; scores: Record<string, number>; shareCode: string };

/** 궁합 계산 결과 (구현: 패킷 0007) */
export type CompatResult = { id: string; timestamp: number; persona1Id: string; persona2Id: string; score: number };

/** 스코어링 엔진 공개 함수 (구현: 패킷 0005) */
export type calculateScoreFn = (answers: Answer[], questionIds: string[]) => Record<string, number>;

/** 공유 코드 생성 (구현: 패킷 0005) */
export type generateShareCodeFn = (result: Result) => string;

/** 공유 코드 파싱 (구현: 패킷 0005) */
export type parseShareCodeFn = (code: string) => Result | null;

/** 결과 리포지토리 저장 (구현: 패킷 0006) */
export type saveResultFn = (result: Result) => Promise<void>;

/** 결과 리포지토리 조회 (구현: 패킷 0006) */
export type getResultFn = (id: string) => Promise<Result | null>;

/** 진행 상태 조회 (구현: 패킷 0006) */
export type getProgressFn = () => Promise<{ currentQuestionIndex: number; answers: Answer[] } | null>;

/** 결과 훅 공개 인터페이스 (구현: 패킷 0008) */
export type useResultFn = () => { result: Result | null; saveResult: (r: Result) => Promise<void>; clear: () => Promise<void> };

/** 히스토리 훅 공개 인터페이스 (구현: 패킷 0008) */
export type useHistoryFn = () => { history: Result[]; clear: () => Promise<void> };

/** 플래그 훅 공개 인터페이스 (구현: 패킷 0008) */
export type useFlagsFn = () => { hasCompletedDisclaimer: boolean; setDisclaimerSeen: () => Promise<void> };

/** 퀴즈 진행 훅 공개 인터페이스 (구현: 패킷 0009) */
export type useQuizFlowFn = () => { currentIndex: number; answers: Answer[]; next: (value: number) => void; finish: () => Promise<Result> };

/** 컴플라이언스 게이트 훅 (구현: 패킷 0020) */
export type useDisclaimerGateFn = () => { isGated: boolean; acknowledge: () => void };

/** 궁합 계산 엔진 (구현: 패킷 0007) */
export type calculateCompatibilityFn = (persona1Id: string, persona2Id: string) => number;

/** 공용 시각화 컴포넌트 props (구현: 패킷 0010) */
export type MiniBarProps = { label: string; value: number; max: number; color?: string };

/** 라우팅 상태 계약 (구현: 패킷 0001) */
export type RouteState = { path: string; params?: Record<string, string | number> };

/** 안전 저장소 공개 인터페이스 (구현: 패킷 0004) */
export type SafeStorageApi = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void>; removeItem: (key: string) => Promise<void> };

```

## Shared Types Contract (IMPORT these, do NOT redefine)
```typescript
// CRITICAL: Pure type file — 0 imports, 0 runtime exports, only type/interface definitions

export type AxisId = "A1" | "A2" | "A3";
export type AxisLetter = "F" | "S" | "P" | "I" | "C" | "R";
export type PersonaCode =
  | "FPC"
  | "FPR"
  | "FIC"
  | "FIR"
  | "SPC"
  | "SPR"
  | "SIC"
  | "SIR";

export interface Choice {
  id: "a" | "b";
  label: string;
  score: 0 | 1;
}

export interface Question {
  id: number;
  axis: AxisId;
  text: string;
  choices: [Choice, Choice];
}

export interface Persona {
  code: PersonaCode;
  name: string;
  emoji: string;
  tagline: string;
  summary: string;
  tips: [string, string, string];
  strengths: [string, string];
  cautions: [string, string];
  plan30d: [string, string, string];
  bestMatch: PersonaCode;
}

export interface AxisScore {
  axis: AxisId;
  score: 0 | 1 | 2 | 3 | 4;
  letter: AxisLetter;
  percent: 0 | 25 | 50 | 75 | 100;
}

export interface QuizResult {
  id: string;
  createdAt: number;
  answers: (0 | 1)[];
  axisScores: [AxisScore, AxisScore, AxisScore];
  personaCode: PersonaCode;
  shareCode: string;
  reportUnlocked: boolean;
}

export interface QuizProgress {
  answers: (0 | 1 | null)[];
  currentIndex: number;
  updatedAt: number;
}

export interface CompatibilityRecord {
  id: string;
  createdAt: number;
  myCode: PersonaCode;
  friendCode: PersonaCode;
  friendShareCode: string;
  score: number;
  grade:
    | "최고의 짝"
    | "좋은 궁합"
    | "무난한 궁합"
    | "서로 배우는 궁합";
  matchedAxes: AxisId[];
}

export interface AppFlags {
  onboardingSeen: boolean;
  lastResultId: string | null;
  disclaimerSeen: boolean;
}

export type ScoreResult =
  | { success: true; score: number }
  | { success: false; error: string };

export type StorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type RouteState = {
  "/": undefined;
  "/quiz": undefined;
  "/result": { resultId: string } | undefined;
  "/report": { resultId: string } | undefined;
  "/share": { resultId: string } | undefined;
  "/compat": { prefillCode?: string } | undefined;
  "/history": undefined;
};

```

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  App.tsx
  components/
    AdSlot.tsx
    Amount.tsx
    BottomCTA.tsx
    Card.tsx
    CountUp.tsx
    DisclaimerNotice.tsx
    FloatingTabBar.tsx
    MiniBar.tsx
    PageShell.tsx
    ScreenScaffold.tsx
    Sparkline.tsx
    StateView.tsx
    SummaryHero.tsx
    TossPurchase.tsx
    TossRewardAd.tsx
  hooks/
    useDisclaimerGate.ts
  lib/
    __tests__/
    contract.ts
    storage.ts
    types.ts
    utils.ts
  main.tsx
  pages/
    Compat.tsx
    History.tsx
    Home.tsx
    Quiz.tsx
    Report.tsx
    Result.tsx
    Share.tsx
    __TdsGallery.tsx
  styles/
    globals.css
    reward-ad.css
  types/
  vite-env.d.ts

### Exports (src/lib/)
- contract.ts: export type Question =; export type Persona =; export type Answer =; export type Result =; export type CompatResult =; export type calculateScoreFn = (answers: Answer[], questionIds: string[]) => Record<string, number>; export type generateShareCodeFn = (result: Result) => string; export type parseShareCodeFn = (code: string) => Result | null
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void
- types.ts: export type AxisId = "A1" | "A2" | "A3"; export type AxisLetter = "F" | "S" | "P" | "I" | "C" | "R"; export type PersonaCode = | "FPC" | "FPR" | "FIC" | "FIR" | "SPC" | "SPR" | "SIC" | "SIR"; export interface Choice; export interface Question; export interface Persona; export interface AxisScore; export interface QuizResult
- utils.ts: export function cn(...classes: (string | boolean | undefined | null)[]): string; export function formatNumber(n: number): string; export function formatCurrency(n: number, currency = 'KRW'): string

### Components (src/components/)
- AdSlot.tsx: AdSlot
- Amount.tsx: Amount
- BottomCTA.tsx: SubmitFooter, ButtonStack
- Card.tsx: Card
- CountUp.tsx: CountUp
- DisclaimerNotice.tsx: DisclaimerNotice
- FloatingTabBar.tsx: FloatingTabBar
- MiniBar.tsx: MiniBar
- PageShell.tsx: PageShell
- ScreenScaffold.tsx: ScreenScaffold
- Sparkline.tsx: Sparkline
- StateView.tsx: EmptyState, LoadingState
- SummaryHero.tsx: SummaryHero
- TossPurchase.tsx: TossPurchase
- TossRewardAd.tsx: TossRewardAd
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Available exports from existing files
// src/App.tsx
export default function App() {

// src/components/AdSlot.tsx
export function AdSlot({ adGroupId, className, variant, theme }: AdSlotProps) {

// src/components/Amount.tsx
export function Amount({

// src/components/BottomCTA.tsx
export function SubmitFooter({
export function ButtonStack({

// src/components/Card.tsx
export function Card({

// src/components/CountUp.tsx
export function CountUp({

// src/components/FloatingTabBar.tsx
export type TabItem = {
export function FloatingTabBar({

// src/components/MiniBar.tsx
export function MiniBar({

// src/components/PageShell.tsx
export function PageShell({ children, style }: { children: ReactNode; style?: CSSProperties }) {

// src/components/ScreenScaffold.tsx
export function ScreenScaffold({

// src/components/Sparkline.tsx
export function Sparkline({

// src/components/StateView.tsx
export function EmptyState({
export function LoadingState({

// src/components/SummaryHero.tsx
export function SummaryHero({

// src/components/TossPurchase.tsx
export interface TossPurchaseResult {
export function TossPurchase({

// src/components/TossRewardAd.tsx
export function TossRewardAd({

// src/hooks/useDisclaimerGate.ts
export const FLAGS_KEY = "mp:flags:v1";
export function readFlags(): AppFlags {
export function markDisclaimerSeen(): void {
export interface DisclaimerGate {
export function useDisclaimerGate(): DisclaimerGate {

// src/lib/contract.ts
export type Question = { id: string; text: string; options: { value: number; label: string }[] };
export type Persona = { id: string; name: string; description: string; emoji: string };
export type Answer = { questionId: string; value: number };
export type Result = { id: string; timestamp: number; answers: Answer[]; scores: Record<string, number>; shareCode: string };
export type CompatResult = { id: string; timestamp: number; persona1Id: string; persona2Id: string; score: number };
export type calculateScoreFn = (answers: Answer[], questionIds: string[]) => Reco

## Memory Index (자동 학습 — 힌트로만 사용, 실제 코드 확인 필수)

Available topics: general(7)

Key lessons (verify against actual code before applying):
- [general] 영속 저장소에서 읽은 값은 항상 스키마 기본값으로 정규화해 배열·객체 타입을 보장한 뒤 반환하고, 화면은 빈/손상/부분 데이터에서도 렌더되도록 방어하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 정책·기능 제거형 리팩터링은 화면과 도메인 로직 레이어에서만 수행하고, package.json의 플랫폼 필수 의존성(디자인 시스템·플랫폼 SDK·프레임워크 코어)은 어떤 경우에도 삭제하지 말 것 — 필수 패키지 화이트리스트를 빌드 전 가드로 검증하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 공용 기반 모듈(상수·저장소·계산 유틸)이 실제로 머지되기 전에는 이를 import하는 화면·훅 패킷을 머지하지 말고, 모든 머지 게이트에 타입체크와 프로덕션 빌드 통과(미해결 import 0건)를 필수로 걸어라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 라우팅·Provider·전역 레이아웃 같은 단일 통합 배선 책임은 하나의 워크패킷에만 할당하고, 다른 패킷은 그 위에 페이지 내부 요소만 얹도록 경계를 명확히 나눠라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 여러 페이지 패킷을 병렬로 내보내기 전에, 라우팅·Provider·공유 UI 스캐폴드 계약을 하나의 앱셸 패킷에서 먼저 확정하고 빌드로 스모크 검증하라. (60% · 타 앱 1회 — 맹신 금지)