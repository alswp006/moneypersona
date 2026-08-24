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

/** 12문항 콘텐츠에서 정의; 0009(useQuizFlow), 0012(Quiz)에서 사용 (구현: 패킷 0002) */
export type Question = { id: string; text: string; options: string[]; axis: string };

/** 정적 질문 배열 내보내기 (구현: 패킷 0002) */
export type questionsFn = () => Question[];

/** 8캐릭터 페르소나 콘텐츠; 0005(scoring), 0007(compatibility), 0013-0014(result)에서 사용 (구현: 패킷 0003) */
export type Persona = { id: string; name: string; description: string; traits: string[] };

/** 정적 페르소나 배열 내보내기 (구현: 패킷 0003) */
export type personasFn = () => Persona[];

/** 축별 스코어; 0005, 0008(useResult), 0014(Result)에서 공유 (구현: 패킷 0001) */
export type AxisScores = { [axisId: string]: number };

/** 시험 결과 엔티티; 0006(resultRepo), 0008(useResult), 0014(Result), 0016(shareImage)에서 사용 (구현: 패킷 0001) */
export type QuizResult = { id: string; timestamp: number; answers: string[]; scores: AxisScores; personaId: string; code?: string };

/** 선택지 배열로부터 축별 스코어 계산 (구현: 패킷 0005) */
export type calculateScoresFn = (answers: string[]) => AxisScores;

/** 결과를 공유 코드로 압축 (구현: 패킷 0005) */
export type generateShareCodeFn = (result: QuizResult) => string;

/** 공유 코드를 결과로 복원 (0017 호환성 비교에서 필요) (구현: 패킷 0005) */
export type parseShareCodeFn = (code: string) => QuizResult | null;

/** 두 결과 간 궁합도 계산 (0-100) (구현: 패킷 0007) */
export type calculateCompatibilityFn = (result1: QuizResult, result2: QuizResult) => number;

/** 결과 영속성; 0008(useResult)에서 사용 (구현: 패킷 0006) */
export type ResultRepository = { save(result: QuizResult): Promise<void>; get(id: string): Promise<QuizResult | null>; list(): Promise<QuizResult[]> };

/** 진행 상태 저장; 0009(useQuizFlow)에서 사용 (구현: 패킷 0006) */
export type ProgressRepository = { save(progress: { answers: string[] }): Promise<void>; get(): Promise<{ answers: string[] } | null>; clear(): Promise<void> };

/** 기능 플래그/게이트 (0020 컴플라이언스 등); 0008(useFlags)에서 사용 (구현: 패킷 0006) */
export type FlagsRepository = { get(key: string): Promise<boolean>; set(key: string, value: boolean): Promise<void> };

/** 궁합 기록 저장; 0017(Compat)에서 사용 (구현: 패킷 0007) */
export type CompatibilityRepository = { save(compat: { persona1Id: string; persona2Id: string; score: number }): Promise<void>; list(): Promise<{ persona1Id: string; persona2Id: string; score: number }[]> };

/** 현재 결과 상태 훅; 0011-0018 페이지들에서 사용 (구현: 패킷 0008) */
export type useResultFn = () => { result: QuizResult | null; save(r: QuizResult): Promise<void>; clear(): Promise<void> };

/** 결과 이력 훅; 0018(History) 등에서 사용 (구현: 패킷 0008) */
export type useHistoryFn = () => { history: QuizResult[]; reload(): Promise<void> };

/** 플래그 상태 훅; 0020(compliance) 등에서 사용 (구현: 패킷 0008) */
export type useFlagsFn = () => { get(key: string): Promise<boolean>; set(key: string, value: boolean): Promise<void> };

/** 퀴즈 진행 상태 훅; 0012(Quiz)에서 사용 (구현: 패킷 0009) */
export type useQuizFlowFn = () => { currentIdx: number; answers: string[]; setAnswer(idx: number, va
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
  data/
    __tests__/
    personas.ts
    questions.ts
  hooks/
    useDisclaimerGate.ts
  lib/
    __tests__/
    contract.ts
    scoring.ts
    shareCode.ts
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
    testing-library.d.ts
  vite-env.d.ts

### Exports (src/lib/)
- contract.ts: export type Question =; export type questionsFn = () => Question[]; export type Persona =; export type personasFn = () => Persona[]; export type AxisScores =; export type QuizResult =; export type calculateScoresFn = (answers: string[]) => AxisScores; export type generateShareCodeFn = (result: QuizResult) => string
- scoring.ts: export type ScoreQuizResult = |; export function scoreQuiz(answers: (0 | 1)[]): ScoreQuizResult; export function getPersona(code: PersonaCode): Persona | null; export const calculateScore: calculateScoreFn = (answers: Answer[], questionIds: string[]) =>
- shareCode.ts: export function makeShareCode(code: PersonaCode): string; export type ParseShareCodeResult = |; export function parseShareCode(input: string): ParseShareCodeResult; export const generateShareCode: generateShareCodeFn = (result: Result) =>
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

### Module Dependencies (import graph)
  lib/scoring.ts → imports: lib/types, lib/contract, data/personas
  lib/shareCode.ts → imports: lib/types, lib/contract
  pages/Quiz.tsx → imports: components/ScreenScaffold, components/MiniBar, data/questions, lib/scoring, lib/shareCode, lib/storage, hooks/useDisclaimerGate, lib/types
  pages/Result.tsx → imports: components/ScreenScaffold, components/Card, components/BottomCTA, components/StateView, components/MiniBar, components/AdSlot, components/DisclaimerNotice, lib/storage, hooks/useDisclaimerGate, data/personas, lib/types
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- 0002: 12문항 정적 콘텐츠 + 무결성 테스트 (files: src/data/questions.ts, src/data/__tests__/questions.test.ts)
- 0003: 8캐릭터 페르소나 콘텐츠 + 무결성 테스트 (files: src/data/personas.ts, src/data/__tests__/personas.test.ts)
- 0005: 스코어링 엔진 + 공유 코드 생성·파싱 (files: src/lib/scoring.ts, src/lib/shareCode.ts, src/lib/__tests__/scoring.test.ts, src/lib/__tests__/shareCode.test.ts)
- 0012: 퀴즈 화면 `/quiz` (files: src/pages/Quiz.tsx)
- 0014: 결과 화면 `/result` 조립 (files: src/pages/Result.tsx)
- heal-1-02: 코딩 에이전트 실행 가드레일 + 라우팅/홈 최소 배선 복구 (files: .claude/settings.json, CLAUDE.md, src/App.tsx, src/pages/HomePage.tsx)
- heal-1-03: 품질 게이트 로컬 재현 스크립트 + 컴플라이언스 정적 검사 통과 (files: package.json, scripts/compliance-check.mjs, src/components/DisclaimerNotice.tsx)