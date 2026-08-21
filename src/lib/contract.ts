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
