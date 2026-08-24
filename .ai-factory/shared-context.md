# Shared Context (auto-generated — do NOT modify)


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
  lib/
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
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void
- types.ts: export type AxisId = "A1" | "A2" | "A3"; export type AxisLetter = "F" | "S" | "P" | "I" | "C" | "R"; export type PersonaCode = | "FPC" | "FPR" | "FIC" | "FIR" | "SPC" | "SPR" | "SIC" | "SIR"; export interface Choice; export interface Question; export interface Persona; export interface AxisScore; export interface QuizResult
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

// src/lib/storage.ts
export function getItem<T>(key: string): T | null {
export function setItem<T>(key: string, value: T): void {
export function removeItem(key: string): void {

// src/lib/types.ts
export type AxisId = "A1" | "A2" | "A3";
export type AxisLetter = "F" | "S" | "P" | "I" | "C" | "R";
export type PersonaCode =
export interface Choice {
export interface Question {
export interface Persona {
export interface AxisScore {
export interface QuizResult {
export interface QuizProgress {
export interface CompatibilityRecord {

// src/lib/utils.ts
export function cn(...classes: (string | boolean | undefined | null)[]): string {
export function formatNumber(n: number): string {
export function formatCurrency(n: number, currency = 'KRW'): string {

## Memory Index (자동 학습 — 힌트로만 사용, 실제 코드 확인 필수)

Available topics: deploy(1), general(7)

Key lessons (verify against actual code before applying):
- [deploy] 파이프라인이 쓰는 CLI·의존성을 작업 시작 전에 존재 검증하고, 라우터가 정적 import하는 화면·공용 모듈은 스텁이라도 먼저 존재시켜라 — 파일 하나의 공백이 번들 해석을 깨서 전 라우트 스모크 타임아웃으로 번진다. (60% · 타 앱 1회 — 맹신 금지)
- [general] 영속 저장소에서 읽은 값은 항상 스키마 기본값으로 정규화해 배열·객체 타입을 보장한 뒤 반환하고, 화면은 빈/손상/부분 데이터에서도 렌더되도록 방어하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 정책·기능 제거형 리팩터링은 화면과 도메인 로직 레이어에서만 수행하고, package.json의 플랫폼 필수 의존성(디자인 시스템·플랫폼 SDK·프레임워크 코어)은 어떤 경우에도 삭제하지 말 것 — 필수 패키지 화이트리스트를 빌드 전 가드로 검증하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 공용 기반 모듈(상수·저장소·계산 유틸)이 실제로 머지되기 전에는 이를 import하는 화면·훅 패킷을 머지하지 말고, 모든 머지 게이트에 타입체크와 프로덕션 빌드 통과(미해결 import 0건)를 필수로 걸어라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 라우팅·Provider·전역 레이아웃 같은 단일 통합 배선 책임은 하나의 워크패킷에만 할당하고, 다른 패킷은 그 위에 페이지 내부 요소만 얹도록 경계를 명확히 나눠라. (60% · 타 앱 1회 — 맹신 금지)