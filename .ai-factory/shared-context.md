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

export type Question = { id: number; text: string; options: string[] };

export type Persona = { id: string; name: string; emoji?: string; description: string };

export type QuizDraft = { answers: Record<number, number>; startedAt: number };

export type Result = { id: string; personaId: string; scores: Record<string, number>; completedAt: number; version: number };

export type CompatMatch = { id: string; myPersonaId: string; theirCode: string; score: number; recordedAt: number };

export type RouteState = { pathname: string; step?: number; resultId?: string };

export type AppPreference = { locale?: string; adConsent?: boolean; reportUnlocked?: boolean };

export type ROUTE_PATHS = { HOME: "/"; QUIZ: "/quiz/:step"; CALCULATING: "/quiz/calculating"; RESULT: "/result"; REPORT: "/report"; SHARE: "/share"; COMPAT: "/compat"; HISTORY: "/history" };

/** Constant export: 12 quiz items (id 0~11, each with 4 options) (구현: 패킷 0002) */
export type QUESTIONSFn = Question[];

/** Constant export: 8 characters (id p0~p7) (구현: 패킷 0003) */
export type PERSONASFn = Persona[];

export type calculateScoresFn = (answers: Record<number, number>) => Record<string, number>;

export type determinePersonaFn = (scores: Record<string, number>) => string;

export type getPersonaByIdFn = (id: string) => Persona | null;

export type generateFriendCodeFn = (personaId: string) => string;

export type validateFriendCodeFn = (code: string) => boolean;

export type calculateCompatibilityFn = (myScores: Record<string, number>, theirScores: Record<string, number>) => number;

export type getQuizDraftFn = () => Promise<QuizDraft | null>;

export type setQuizDraftFn = (draft: QuizDraft) => Promise<void>;

export type clearQuizDraftFn = () => Promise<void>;

export type getResultByIdFn = (id: string) => Promise<Result | null>;

export type getLatestResultFn = () => Promise<Result | null>;

export type getAllResultsFn = () => Promise<Result[]>;

export type saveResultFn = (result: Result) => Promise<void>;

export type deleteResultFn = (id: string) => Promise<void>;

export type getCompatMatchesFn = () => Promise<CompatMatch[]>;

export type saveCompatMatchFn = (match: CompatMatch) => Promise<void>;

export type deleteCompatMatchFn = (id: string) => Promise<void>;

export type getAppPreferenceFn = () => Promise<AppPreference>;

export type setAppPreferenceFn = (pref: Partial<AppPreference>) => Promise<void>;

export type useQuizDraftFn = () => { draft: QuizDraft | null; updateAnswer: (qid: number, idx: number) => void; clear: () => void };

export type useLatestResultFn = () => { result: Result | null; loading: boolean };

export type useAppPrefFn = () => { pref: AppPreference; update: (partial: Partial<AppPreference>) => void };

```

## Shared Types Contract (IMPORT these, do NOT redefine)
```typescript
/**
 * MoneyPersona 도메인 타입 정의 (SPEC § Data Models)
 *
 * 원칙:
 * - 이 파일은 **순수 타입 정의만**. 런타임 값 선언 0개
 * - HEX 색상 리터럴 0개 (var(--tds-color-*) CSS 변수만)
 * - 모든 저장 모델은 version: 1 리터럴 필드 (마이그레이션 정책)
 *
 * SPEC 소스:
 * - SPEC § Data Models → Persona, Question, QuizDraft, QuizResult, CompatRecord, AppPref
 * - SPEC § Screen Definitions § 라우트 · 네비게이션 state 타입 계약 → RouteState, ResultNavState, CompatNavState
 */

/**
 * 3-축 지표 (Persona 카테고리 기본축)
 */
export type AxisSpend = 'T' | 'F'; // T=티끌모아(절약), F=플렉스(소비)
export type AxisPlan = 'P' | 'I'; // P=플랜(계획), I=임프로(즉흥)
export type AxisRisk = 'S' | 'R'; // S=세이프(안정), R=리스크(도전)

/**
 * Persona ID: 3-축 조합 → 정확히 8종
 * (T|F) × (P|I) × (S|R) = 2³ = 8
 */
export type PersonaId = `${AxisSpend}${AxisPlan}${AxisRisk}`;

/**
 * 캐릭터 정의 (정적 상수 테이블, 코드에 내장)
 *
 * SPEC: Persona — 캐릭터 정적 상수
 */
export interface Persona {
  /** 캐릭터 ID: TPS | TPR | TIS | TIR | FPS | FPR | FIS | FIR */
  id: PersonaId;

  /** 캐릭터명: "알뜰형 다람쥐", "전략가 여우" 등 */
  name: string;

  /** 이모지: "🐿️", "🦊" 등 */
  emoji: string;

  /** 캐릭터 설명: 60~120자 */
  summary: string;

  /** 강점 3가지 (고정 길이) */
  strengths: [string, string, string];

  /** 약점 (1개) */
  weakness: string;

  /** 절약 팁 3가지 (고정 길이) */
  tips: [string, string, string];

  /** 상세 리포트 섹션 */
  report: {
    /** 소비축 코멘트: 40~100자 */
    spendComment: string;

    /** 계획축 코멘트 */
    planComment: string;

    /** 위험축 코멘트 */
    riskComment: string;

    /** 액션플랜 4단계 (고정 길이) */
    actionPlan: [string, string, string, string];
  };

  /** CSS 변수 토큰: 'var(--tds-color-blue-500)' 형태만 허용 (HEX 금지) */
  colorToken: string;
}

/**
 * 진단 문항 정의 (정적 상수, 12문항)
 *
 * SPEC: Question — 문항 정적 상수
 */
export interface Question {
  /** 문항 번호: 1..12 (고정) */
  id: number;

  /** 축 분류: 1~4=spend, 5~8=plan, 9~12=risk */
  axis: 'spend' | 'plan' | 'risk';

  /** 문항 텍스트: 20~60자 */
  text: string;

  /** 선택지 2개 (고정) */
  options: [
    { key: 'A'; label: string; value: 0 | 1 },
    { key: 'B'; label: string; value: 0 | 1 }
  ];
}

/**
 * 진행 중 응답 (localStorage `mp.quiz.draft`)
 *
 * SPEC: QuizDraft — 진행 중 응답
 * key: `mp.quiz.draft` · 크기 ≈ 120 bytes
 */
export interface QuizDraft {
  /** 스키마 버전 (마이그레이션 정책: version !== 1이면 삭제 후 기본값으로 시작) */
  version: 1;

  /** 12문항 응답: 미응답은 null, 선택은 0|1 */
  answers: Array<0 | 1 | null>;

  /** 마지막 업데이트 시각 (epoch ms) */
  updatedAt: number;
}

/**
 * 3-축 점수 (0~4 범위 정수)
 *
 * SPEC: AxisScores (QuizResult 내 nested)
 */
export interface AxisScores {
  /** 소비축 점수: 0..4 (1점씩 4문항) */
  spend: number;

  /** 계획축 점수: 0..4 */
  plan: number;

  /** 위험축 점수: 0..4 */
  risk: number;
}

/**
 * 진단 결과 (localStorage `mp.result.latest` / `mp.result.history`)
 *
 * SPEC: QuizResult — 진단 결과
 * key: `mp.result.latest` → QuizResult | null (약 300 bytes)
 * key: `mp.result.history` → QuizResult[] (최대 20건, 약 6 KB)
 */
export interface QuizResult {
  /** 스키마 버전 */
  version: 1;

  /** 결과 ID: "r_" + createdAt + "_" + 4자리 [a-z0-9] */
  id: string;

  /** 진단된 캐릭터 ID */
  personaId: PersonaId;

  /** 3-축 점수 */
  scores: AxisS
// ...truncated
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
    FloatingTabBar.tsx
    MiniBar.tsx
    PageShell.tsx
    ReportContent.tsx
    ReportGate.tsx
    ScreenScaffold.tsx
    Sparkline.tsx
    StateView.tsx
    SummaryHero.tsx
    TossPurchase.tsx
    TossRewardAd.tsx
  hooks/
  lib/
    contract.ts
    share.ts
    shareImage.ts
    storage.ts
    types.ts
    utils.ts
  main.tsx
  pages/
    Home.tsx
    __TdsGallery.tsx
  routes/
    navState.ts
  styles/
    globals.css
    reward-ad.css
  types/
  vite-env.d.ts

### Exports (src/lib/)
- contract.ts: export type Question =; export type Persona =; export type QuizDraft =; export type Result =; export type CompatMatch =; export type RouteState =; export type AppPreference =; export type ROUTE_PATHS =
- share.ts: export interface ShareResultOutcome; export function getShareText(result: QuizResult, persona?: Persona): string; export async function shareResult( result: QuizResult, persona: Persona, imageBlob?: Blob ): Promise<ShareResultOutcome>
- shareImage.ts: export async function renderResultImage(result: QuizResult, persona: Persona): Promise<Blob>
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void
- types.ts: export type AxisSpend = 'T' | 'F'; export type AxisPlan = 'P' | 'I'; export type AxisRisk = 'S' | 'R'; export type PersonaId = `$; export interface Persona; export interface Question; export interface QuizDraft; export interface AxisScores
- utils.ts: export function cn(...classes: (string | boolean | undefined | null)[]): string; export function formatNumber(n: number): string; export function formatCurrency(n: number, currency = 'KRW'): string

### Components (src/components/)
- AdSlot.tsx: AdSlot
- Amount.tsx: Amount
- BottomCTA.tsx: SubmitFooter, ButtonStack
- Card.tsx: Card
- CountUp.tsx: CountUp
- FloatingTabBar.tsx: FloatingTabBar
- MiniBar.tsx: MiniBar
- PageShell.tsx: PageShell
- ReportContent.tsx: ReportContent
- ReportGate.tsx: ReportGate
- ScreenScaffold.tsx: ScreenScaffold
- Sparkline.tsx: Sparkline
- StateView.tsx: EmptyState, LoadingState
- SummaryHero.tsx: SummaryHero
- TossPurchase.tsx: TossPurchase
- TossRewardAd.tsx: TossRewardAd

### Module Dependencies (import graph)
  lib/share.ts → imports: lib/types
  lib/shareImage.ts → imports: lib/types
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- 0015: 공유 유틸 — Canvas 결과 이미지 생성기 + 3단 폴백 공유 로직 (files: src/lib/shareImage.ts, src/lib/share.ts, src/lib/share.test.ts)

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
export function FloatingTabBar({ items }: { items: TabItem[] }) {

// src/components/MiniBar.tsx
export function MiniBar({

// src/components/PageShell.tsx
export function PageShell({ children, style }: { children: ReactNode; style?: CSSProperties }) {

// src/components/ReportContent.tsx
export function ReportContent({ personaName, emoji, matchScore, report }: ReportContentProps) {

// src/components/ReportGate.tsx
export function ReportGate({ reportUnlocked, onUnlock, children }: ReportGateProps) {

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

// src/lib/contract.ts
export type Question = { id: number; text: string; options: string[] };
export type Persona = { id: string; name: string; emoji?: string; description: string };
export type QuizDraft = { answers: Record<number, number>; startedAt: number };
export type Result = { id: string; personaId: string; scores: Record<string, number>; completedAt: number; version: number };
export type CompatMatch = { id: string; myPersonaId: string; theirCode: string; score: number; recordedAt: number };
export type RouteState = { pathname: string; ste

## Memory Index (자동 학습 — 힌트로만 사용, 실제 코드 확인 필수)

Available topics: deploy(1), general(7), testing(2), ui(4)

Key lessons (verify against actual code before applying):
- [deploy] 빌드 불안정 — 의존성 버전 고정, 빌드 전 typecheck 필수 (60% · 타 앱 1회 — 맹신 금지)
- [general] 영속 저장소에서 읽은 값은 항상 스키마 기본값으로 정규화해 배열·객체 타입을 보장한 뒤 반환하고, 화면은 빈/손상/부분 데이터에서도 렌더되도록 방어하라. (60% · 타 앱 1회 — 맹신 금지)
- [testing] 여러 화면이 공유하는 상태 훅·데이터 계층은 반환 시그니처와 실패 사유 코드를 먼저 테스트로 고정하고 통과시킨 뒤에야 의존 화면 작업을 시작하고, 화면은 예외 대신 결과 객체로 분기하게 하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 정책·기능 제거형 리팩터링은 화면과 도메인 로직 레이어에서만 수행하고, package.json의 플랫폼 필수 의존성(디자인 시스템·플랫폼 SDK·프레임워크 코어)은 어떤 경우에도 삭제하지 말 것 — 필수 패키지 화이트리스트를 빌드 전 가드로 검증하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 공용 기반 모듈(상수·저장소·계산 유틸)이 실제로 머지되기 전에는 이를 import하는 화면·훅 패킷을 머지하지 말고, 모든 머지 게이트에 타입체크와 프로덕션 빌드 통과(미해결 import 0건)를 필수로 걸어라. (60% · 타 앱 1회 — 맹신 금지)