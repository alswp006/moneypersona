/**
 * 네비게이션 state 타입 (단일 소스)
 *
 * 모든 화면이 이 파일에서 네비게이션 상태 타입을 import한다.
 * 소스 코드는 `src/lib/types.ts`에서만 정의하고, 이 파일은 re-export만 한다.
 * 이렇게 하면 추후 타입 변경 시 types.ts 한 곳만 수정하면 된다.
 *
 * SPEC § Screen Definitions § 라우트 · 네비게이션 state 타입 계약
 */

export type { ResultNavState, CompatNavState, AppNavState, RouteState } from '@/lib/types';
