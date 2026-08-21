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
// Domain types — add your app-specific types here
export {};

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
    Home.tsx
    __TdsGallery.tsx
  styles/
    globals.css
    reward-ad.css
  types/
  vite-env.d.ts

### Exports (src/lib/)
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void
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