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
