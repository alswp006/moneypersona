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
export type useQuizFlowFn = () => { currentIdx: number; answers: string[]; setAnswer(idx: number, val: string): void; next(): void; back(): void; submit(): Promise<QuizResult>; restore(): Promise<void> };

/** 미니 바 차트 컴포넌트; 0014-0017(결과/호환성 화면)에서 재사용 (구현: 패킷 0010) */
export type MiniBarProps = { label: string; value: number; maxValue: number; color?: string };

/** 결과를 이미지로 생성; 0016(Share)에서 사용 (구현: 패킷 0016) */
export type generateShareImageFn = (result: QuizResult, personas: Persona[]) => Promise<Blob>;
