/**
 * jest-dom 매처(toBeInTheDocument 등)의 타입 증강을 tsc에 알린다.
 *
 * 런타임 등록은 vitest.setup.ts가 하지만, tsconfig의 include는 "src"뿐이라 setup 파일이
 * 타입 프로그램에 들어오지 않는다 → 테스트에서 toBeInTheDocument를 쓰면 `npx tsc --noEmit`이
 * TS2339로 깨진다. src 안의 이 선언 파일이 그 증강을 대신 끌어온다(테스트 파일 수정 불필요).
 */
import "@testing-library/jest-dom/vitest";
