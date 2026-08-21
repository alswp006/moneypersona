/**
 * Packet 0019: 라우터 배선 · FloatingTabBar 노출 규칙 · catch-all 가드
 *
 * SPEC 소스:
 * - .ai-factory/spec.md § Screen Definitions § 라우트 · 네비게이션 state 타입 계약
 * - Sprint Contract: App.tsx에서 8개 Route 배선 + 전역 Provider 통합, catch-all → '/' replace
 *
 * 의존 모듈(아직 미구현 — 이 패킷 소관):
 * - src/App.tsx (default export)
 * - src/routes/routes.tsx
 *
 * 이 패킷은 다른 화면 패킷(/result, /report, /share, /compat)이 이미 병합되었다고
 * 가정하고 App.tsx를 블랙박스로 통합 테스트한다. 개별 페이지 컴포넌트는 mock하지 않는다
 * (testing.md INTEGRATION TESTS 패턴 — `render(<MemoryRouter><App /></MemoryRouter>)`).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { screen } from "@testing-library/react";

import { mockAll } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import type { RouteState } from "@/lib/types";

mockAll();

import App from "@/App";

// 직접 URL 진입 시 렌더되어야 하는 8개 라우트 (동적 세그먼트는 구체값으로 치환)
const CONCRETE_ROUTES: Array<{ path: string; routeKey: keyof RouteState }> = [
  { path: "/", routeKey: "/" },
  { path: "/quiz/1", routeKey: "/quiz/:step" },
  { path: "/quiz/calculating", routeKey: "/quiz/calculating" },
  { path: "/result", routeKey: "/result" },
  { path: "/report", routeKey: "/report" },
  { path: "/share", routeKey: "/share" },
  { path: "/compat", routeKey: "/compat" },
  { path: "/history", routeKey: "/history" },
];

const TAB_ROOT_PATHS = ["/", "/compat", "/history"];
const NON_TAB_ROOT_PATHS = ["/quiz/1", "/quiz/calculating", "/result", "/report", "/share"];

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe("라우터 배선 · FloatingTabBar 노출 규칙 · catch-all 가드", () => {
  it("AC-1[P0]: 8개 라우트 전부가 직접 URL 진입 시 흰 화면·콘솔 에러 없이 렌더된다", () => {
    for (const { path: url } of CONCRETE_ROUTES) {
      const { unmount, container } = renderWithRouter(React.createElement(App), {
        initialEntries: [url],
      });

      // 흰 화면 방지: root 컨테이너가 비어있지 않다 (텍스트 콘텐츠 존재)
      expect(container.textContent, `route ${url} should not render a blank screen`).not.toBe("");
      unmount();
    }

    expect(consoleErrorSpy).not.toHaveBeenCalled();

    // 알려진 화면(Home)은 구체적인 앵커 콘텐츠까지 검증
    const { unmount: unmountHome } = renderWithRouter(React.createElement(App), {
      initialEntries: ["/"],
    });
    expect(screen.getByTestId("home-hero")).toBeInTheDocument();
    unmountHome();

    // 기록 화면
    const { unmount: unmountHistory } = renderWithRouter(React.createElement(App), {
      initialEntries: ["/history"],
    });
    expect(screen.getByText("내 기록")).toBeInTheDocument();
    unmountHistory();
  });

  it("AC-1[P0] error case: 범위 밖 퀴즈 step(/quiz/99) 직접 진입에도 크래시·콘솔 에러가 없다", () => {
    expect(() =>
      renderWithRouter(React.createElement(App), { initialEntries: ["/quiz/99"] }),
    ).not.toThrow();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("AC-2[P0]: /quiz/calculating은 /quiz/:step보다 먼저 매칭되어 계산 화면이 렌더된다", () => {
    const { unmount } = renderWithRouter(React.createElement(App), {
      initialEntries: ["/quiz/calculating"],
    });

    // Calculating 화면 고유 타이틀 — Quiz 화면이라면 이 텍스트 대신 "N / 12"가 나온다
    expect(screen.getByText("결과 계산 중")).toBeInTheDocument();
    expect(screen.queryByText(/calculating\s*\/\s*12/)).not.toBeInTheDocument();

    unmount();
  });

  it("AC-3: 정의되지 않은 경로는 '/'로 replace 이동하고 App.tsx는 Navigate replace로 구현한다", () => {
    for (const undefinedPath of ["/foo", "/quiz"]) {
      const { unmount } = renderWithRouter(React.createElement(App), {
        initialEntries: [undefinedPath],
      });
      // 최종적으로 Home 화면(홈 앵커 카드)이 렌더된다 — '/'로 리다이렉트됨
      expect(screen.getByTestId("home-hero")).toBeInTheDocument();
      unmount();
    }

    // "replace" 시맨틱은 히스토리 스택에 남지 않아 DOM만으로 검증 불가 — 소스에서 확인
    const appSource = fs.readFileSync(path.resolve(process.cwd(), "src/App.tsx"), "utf-8");
    const catchAllBlockMatch = appSource.match(/path=["']\*["'][\s\S]{0,200}/);
    expect(catchAllBlockMatch, "App.tsx must define a catch-all Route (path=\"*\")").not.toBeNull();
    const catchAllBlock = catchAllBlockMatch![0];
    expect(catchAllBlock).toMatch(/Navigate/);
    expect(catchAllBlock).toMatch(/replace/);
  });

  it("AC-4: FloatingTabBar는 탭 루트 3경로에서만 렌더되고 그 외 경로에서는 렌더되지 않는다", () => {
    for (const tabRootPath of TAB_ROOT_PATHS) {
      const { unmount } = renderWithRouter(React.createElement(App), {
        initialEntries: [tabRootPath],
      });
      expect(
        screen.getByRole("tablist"),
        `expected FloatingTabBar (role=tablist) to render at ${tabRootPath}`,
      ).toBeInTheDocument();
      unmount();
    }

    for (const nonTabRootPath of NON_TAB_ROOT_PATHS) {
      const { unmount } = renderWithRouter(React.createElement(App), {
        initialEntries: [nonTabRootPath],
      });
      expect(
        screen.queryByRole("tablist"),
        `expected NO FloatingTabBar at ${nonTabRootPath}`,
      ).not.toBeInTheDocument();
      unmount();
    }
  });

  it("AC-5: main.tsx(@AI:ANCHOR)는 변경되지 않고 App.tsx는 BrowserRouter를 중첩하지 않는다", () => {
    const mainSource = fs.readFileSync(path.resolve(process.cwd(), "src/main.tsx"), "utf-8");
    expect(mainSource).toMatch(/@AI:ANCHOR/);
    expect(mainSource).toMatch(/TDSMobileAITProvider/);
    expect(mainSource).toMatch(/BrowserRouter/);

    const appSource = fs.readFileSync(path.resolve(process.cwd(), "src/App.tsx"), "utf-8");
    expect(appSource).not.toMatch(/BrowserRouter/);
  });

  it("AC-6: /result·/compat 진입 state가 RouteState 타입과 일치하고 정상 렌더된다", () => {
    const resultState: RouteState["/result"] = { resultId: "r_1700000000000_ab12" };
    const compatState: RouteState["/compat"] = { prefillCode: "TPSAB" };

    const { unmount: unmountResult, container: resultContainer } = renderWithRouter(
      React.createElement(App),
      { initialEntries: [{ pathname: "/result", state: resultState }] },
    );
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(resultContainer.textContent, "/result must render, not blank").not.toBe("");
    unmountResult();

    const { unmount: unmountCompat, container: compatContainer } = renderWithRouter(
      React.createElement(App),
      { initialEntries: [{ pathname: "/compat", state: compatState }] },
    );
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(compatContainer.textContent, "/compat must render, not blank").not.toBe("");
    unmountCompat();
  });
});
