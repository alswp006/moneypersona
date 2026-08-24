import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockTds, mockAppsInToss, mockTossRewardAd } from "@/__tests__/__helpers__/mocks";

// ── TDS + SDK mocks (no router mock — App.tsx's own routing/useLocation must run for real
// so that route matching and FloatingTabBar active-tab detection can be verified per path) ──
mockTds();
mockAppsInToss();
mockTossRewardAd();

// ── Page stand-ins ──
// App.tsx renders the real page components. We replace each with a tiny marker so this
// packet's tests verify ROUTING WIRING only, decoupled from each page's own data/hooks
// (which are covered by their own packet tests).
vi.mock("@/pages/Home", () => ({
  default: () => React.createElement("div", { "data-testid": "page-home" }, "Home"),
}));
vi.mock("@/pages/Quiz", () => ({
  default: () => React.createElement("div", { "data-testid": "page-quiz" }, "Quiz"),
}));
vi.mock("@/pages/Result", () => ({
  default: () => React.createElement("div", { "data-testid": "page-result" }, "Result"),
}));
vi.mock("@/pages/Report", () => ({
  default: () => React.createElement("div", { "data-testid": "page-report" }, "Report"),
}));
vi.mock("@/pages/Share", () => ({
  default: () => React.createElement("div", { "data-testid": "page-share" }, "Share"),
}));
vi.mock("@/pages/Compat", () => ({
  default: () => React.createElement("div", { "data-testid": "page-compat" }, "Compat"),
}));
vi.mock("@/pages/History", () => ({
  default: () => React.createElement("div", { "data-testid": "page-history" }, "History"),
}));

import App from "@/App";

function renderAt(path: string) {
  return render(
    React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App)),
  );
}

describe("라우팅 연결 + FloatingTabBar 조건부 노출", () => {
  it("AC-1[P0]: 7개 경로가 각각 대응 페이지를 흰 화면·크래시 없이 렌더한다", () => {
    const routes: Array<[string, string, string]> = [
      ["/", "page-home", "Home"],
      ["/quiz", "page-quiz", "Quiz"],
      ["/result", "page-result", "Result"],
      ["/report", "page-report", "Report"],
      ["/share", "page-share", "Share"],
      ["/compat", "page-compat", "Compat"],
      ["/history", "page-history", "History"],
    ];

    routes.forEach(([path, testId, label]) => {
      const { unmount, container } = renderAt(path);
      expect(screen.getByTestId(testId).textContent).toBe(label);
      expect(container.innerHTML.length).toBeGreaterThan(0);
      unmount();
    });
  });

  it("AC-1[P0]: 직접 딥링크 진입(예: /report, /result)에서도 크래시하지 않는다", () => {
    const { unmount } = renderAt("/report");
    expect(screen.getByTestId("page-report").textContent).toBe("Report");
    unmount();

    renderAt("/result");
    expect(screen.getByTestId("page-result").textContent).toBe("Result");
  });

  it("AC-2: 정의되지 않은 경로(/zzz)는 /로 리다이렉트된다", () => {
    renderAt("/zzz");
    expect(screen.getByTestId("page-home").textContent).toBe("Home");
    expect(screen.queryByTestId("page-quiz")).toBeNull();
  });

  it("AC-3: FloatingTabBar가 홈·궁합·기록 3탭으로 렌더되고 현재 경로 탭이 활성 표시된다", () => {
    renderAt("/");
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);

    const tabLabels = tabs.map((t) => t.getAttribute("aria-label"));
    expect(tabLabels).toEqual(expect.arrayContaining(["홈", "궁합", "기록"]));

    const homeTab = screen.getByRole("tab", { name: "홈" });
    expect(homeTab.getAttribute("aria-selected")).toBe("true");
    const compatTab = screen.getByRole("tab", { name: "궁합" });
    expect(compatTab.getAttribute("aria-selected")).toBe("false");
  });

  it("AC-3: /compat, /history 진입 시 각각 궁합·기록 탭이 활성 표시된다", () => {
    const { unmount } = renderAt("/compat");
    expect(screen.getByRole("tab", { name: "궁합" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "홈" }).getAttribute("aria-selected")).toBe("false");
    unmount();

    renderAt("/history");
    expect(screen.getByRole("tab", { name: "기록" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "홈" }).getAttribute("aria-selected")).toBe("false");
  });

  it("AC-3: 몰입 화면(/quiz, /share)에서는 FloatingTabBar가 렌더되지 않는다", () => {
    const { unmount } = renderAt("/quiz");
    expect(screen.queryByRole("tablist", { name: "메인 네비게이션" })).toBeNull();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    unmount();

    renderAt("/share");
    expect(screen.queryByRole("tablist", { name: "메인 네비게이션" })).toBeNull();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
  });

  it("AC-4: 전역 배선은 App.tsx에서만 이뤄지고 src/main.tsx의 @AI:ANCHOR/BrowserRouter는 그대로 유지된다", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const mainPath = path.resolve(__dirname, "../main.tsx");
    const content = fs.readFileSync(mainPath, "utf-8");

    expect(content).toContain("@AI:ANCHOR");
    expect(content).toContain("<BrowserRouter");
  });
});
