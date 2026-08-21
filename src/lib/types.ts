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
  scores: AxisScores;

  /** 12문항 최종 응답 (완성된 응답만, null 없음) */
  answers: Array<0 | 1>;

  /** 친구 궁합용 코드: 5자 [A-Z]{5} (PersonaId + 체크섬 2자) */
  code: string;

  /** 결과 생성 시각 (epoch ms) */
  createdAt: number;

  /** 상세 리포트 해제 플래그 (리워드 광고 시청 완료) */
  reportUnlocked: boolean;
}

/**
 * 친구 궁합 비교 기록 (localStorage `mp.compat.history`)
 *
 * SPEC: CompatRecord — 궁합 비교 기록
 * key: `mp.compat.history` → CompatRecord[] (최대 20건, 약 4 KB)
 */
export interface CompatRecord {
  /** 스키마 버전 */
  version: 1;

  /** 기록 ID: "c_" + createdAt + "_" + 4자리 [a-z0-9] */
  id: string;

  /** 내 캐릭터 ID */
  myPersonaId: PersonaId;

  /** 친구 캐릭터 ID (친구 코드로부터 파싱) */
  friendPersonaId: PersonaId;

  /** 친구 코드 (5자 [A-Z]{5}) */
  friendCode: string;

  /** 궁합 점수 (이산값 4가지) */
  score: 10 | 40 | 70 | 100;

  /** 궁합 등급: S(100) | A(70) | B(40) | C(10) */
  grade: 'S' | 'A' | 'B' | 'C';

  /** 기록 생성 시각 (epoch ms) */
  createdAt: number;
}

/**
 * 앱 설정 (localStorage `mp.pref`)
 *
 * SPEC: AppPref — 앱 설정
 * key: `mp.pref` · 크기 ≈ 90 bytes
 */
export interface AppPref {
  /** 스키마 버전 */
  version: 1;

  /** 온보딩 다이얼로그 1회 표시 플래그 */
  onboardingSeen: boolean;

  /** 마지막 방문 시각 (epoch ms) */
  lastVisitedAt: number;
}

/**
 * 저장 작업 결과 (비동기 저장 함수의 반환값)
 *
 * SPEC: AC-7 (저장 공간 초과 시)
 */
export type SaveOutcome = { ok: true } | { ok: false; reason: 'QUOTA' | 'PARSE' };

/**
 * 네비게이션 state 타입: /result, /report, /share 진입 시
 *
 * SPEC § Screen Definitions § 라우트 · 네비게이션 state 타입 계약
 */
export interface ResultNavState {
  /** 조회할 결과 ID (mp.result.history 또는 mp.result.latest 조회 키) */
  resultId: string;
}

/**
 * 네비게이션 state 타입: /compat 진입 시
 *
 * SPEC § Screen Definitions § 라우트 · 네비게이션 state 타입 계약
 */
export interface CompatNavState {
  /** 미리 입력된 친구 코드 (TextField 초기값) */
  prefillCode: string;
}

/**
 * 앱 전체 네비게이션 state 유니온
 */
export type AppNavState = ResultNavState | CompatNavState | null;

/**
 * 라우트 경로 → state 타입 매핑 (단일 소스)
 *
 * SPEC § Screen Definitions § 라우트 · 네비게이션 state 타입 계약
 * 모든 route와 각 route의 진입 state 타입을 여기서 정의.
 * src/routes/navState.ts는 이를 re-export만 한다.
 */
export type RouteState = {
  '/': null;
  '/quiz/:step': null;
  '/quiz/calculating': null;
  '/result': ResultNavState | null;
  '/report': ResultNavState | null;
  '/share': ResultNavState | null;
  '/compat': CompatNavState | null;
  '/history': null;
};
