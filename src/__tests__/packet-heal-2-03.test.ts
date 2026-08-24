import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { screen, within } from "@testing-library/react";
import { mockAll } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import type { AxisScore } from "@/lib/types";

mockAll();

// 목킹 이후에 정적 import 되어야 한다(vi.mock은 호이스팅됨).
import { MiniBar } from "@/components/MiniBar";
import { AxisScoreCard } from "@/components/result/AxisScoreCard";
import { TipsCard } from "@/components/result/TipsCard";
import App from "@/App";

const PROJECT_ROOT = process.cwd();
const COMPLIANCE_SCRIPT = path.join(PROJECT_ROOT, "scripts", "compliance-check.mjs");

// 이 패킷이 복구/생성하는 6개 표현 전용 파일 — 전부 저장소·라우터·상태 접근 0건이어야 한다.
const TARGET_FILES = [
  "src/components/MiniBar.tsx",
  "src/components/SummaryHero.tsx",
  "src/components/EmptyState.tsx",
  "src/components/result/PersonaCard.tsx",
  "src/components/result/AxisScoreCard.tsx",
  "src/components/result/TipsCard.tsx",
];

function readTarget(rel: string) {
  return fs.readFileSync(path.join(PROJECT_ROOT, rel), "utf8");
}

function runComplianceCheck() {
  return spawnSync(process.execPath, [COMPLIANCE_SCRIPT], { encoding: "utf8" });
}

describe("공용·결과 표현 컴포넌트 복구 + 게이트 규칙 코딩 시점 강제 (0010+0013)", () => {
  describe("AC-1: MiniBar가 percent(0~100)를 clamp하고 라벨을 Paragraph.Text로 표시한다", () => {
    it("AC-1[P0]: percent=-10 은 0%로 clamp되고 라벨이 Paragraph.Text(span[data-typography])로 렌더된다", () => {
      renderWithRouter(
        React.createElement(MiniBar, { percent: -10, label: "소비 성향", testId: "mini-under" }),
      );

      const fill = screen.getByTestId("mini-under-fill");
      expect(fill.style.width).toBe("0%");

      const label = screen.getByText("소비 성향");
      expect(label.tagName).toBe("SPAN");
      expect(label.getAttribute("data-typography")).toBeTruthy();
    });

    it("AC-1[P0]: percent=130 은 100%로 clamp된다", () => {
      renderWithRouter(
        React.createElement(MiniBar, { percent: 130, label: "투자 성향", testId: "mini-over" }),
      );

      const fill = screen.getByTestId("mini-over-fill");
      expect(fill.style.width).toBe("100%");
    });

    it("AC-1: 범위 내 percent=45는 그대로 45%로 렌더된다", () => {
      renderWithRouter(
        React.createElement(MiniBar, { percent: 45, label: "관리 성향", testId: "mini-in" }),
      );

      expect(screen.getByTestId("mini-in-fill").style.width).toBe("45%");
    });
  });

  describe("AC-2: AxisScoreCard(3축 MiniBar) + TipsCard(가변 개수)", () => {
    it("AC-2[P0]: AxisScoreCard가 axisScores 3개를 3축 라벨 + letter 표기의 MiniBar 3줄로 렌더한다", () => {
      const axisScores: [AxisScore, AxisScore, AxisScore] = [
        { axis: "A1", score: 3, letter: "F", percent: 75 },
        { axis: "A2", score: 2, letter: "P", percent: 50 },
        { axis: "A3", score: 4, letter: "C", percent: 100 },
      ];

      renderWithRouter(
        React.createElement(AxisScoreCard, { axisScores, testId: "axis-score" }),
      );

      const card = screen.getByTestId("axis-score");
      expect(within(card).getByText(/소비 성향/)).toBeInTheDocument();
      expect(within(card).getByText(/관리 성향/)).toBeInTheDocument();
      expect(within(card).getByText(/투자 성향/)).toBeInTheDocument();

      expect(screen.getByTestId("axis-score-A1-fill").style.width).toBe("75%");
      expect(screen.getByTestId("axis-score-A2-fill").style.width).toBe("50%");
      expect(screen.getByTestId("axis-score-A3-fill").style.width).toBe("100%");

      expect(within(card).getByText(/\bF\b/)).toBeInTheDocument();
      expect(within(card).getByText(/\bP\b/)).toBeInTheDocument();
      expect(within(card).getByText(/\bC\b/)).toBeInTheDocument();
    });

    it("AC-2[P0]: TipsCard는 tips 길이가 3이 아니어도 크래시 없이 받은 개수만큼 렌더한다", () => {
      const { unmount } = renderWithRouter(
        React.createElement(TipsCard, { tips: ["팁 하나", "팁 둘"], testId: "tips-two" }),
      );
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(screen.getByText("팁 하나")).toBeInTheDocument();
      expect(screen.getByText("팁 둘")).toBeInTheDocument();
      unmount();

      expect(() =>
        renderWithRouter(
          React.createElement(TipsCard, {
            tips: ["가", "나", "다", "라", "마"],
            testId: "tips-five",
          }),
        ),
      ).not.toThrow();
      expect(screen.getAllByRole("listitem")).toHaveLength(5);
    });
  });

  describe("AC-3: 여섯 파일 전부 HEX/Tailwind 간격/console.*/ListRow padding prop 0건", () => {
    it("AC-3[P0]: 프로젝트 전체 compliance-check.mjs가 exit 0 이다(HEX·외부URL·Tailwind 간격 클래스 0건)", () => {
      const result = runComplianceCheck();
      expect(result.status).toBe(0);
      expect((result.stdout ?? "").trim()).toBe("");
    });

    it("AC-3[P0]: 여섯 파일 각각에 console.* 호출과 ListRow padding prop이 0건이다", () => {
      for (const rel of TARGET_FILES) {
        expect(fs.existsSync(path.join(PROJECT_ROOT, rel))).toBe(true);
        const content = readTarget(rel);

        expect(content).not.toMatch(/console\.\w+\s*\(/);
        expect(content).not.toMatch(/<ListRow\b[^>]*\bpadding\s*=/);
      }
    });
  });

  describe("AC-4: 여섯 파일 어디에도 저장소·라우터 접근이 없다(표현 전용, props로만 데이터 수신)", () => {
    it("AC-4[P0]: localStorage·저장소 모듈·react-router 훅 import가 0건이다", () => {
      for (const rel of TARGET_FILES) {
        const content = readTarget(rel);

        expect(content).not.toMatch(/localStorage/);
        expect(content).not.toMatch(/from\s+["']@\/lib\/storage["']/);
        expect(content).not.toMatch(/from\s+["']react-router-dom["']/);
        expect(content).not.toMatch(/useNavigate|useLocation|useParams/);
      }
    });
  });

  describe("AC-5: 빌드/타입체크/테스트 통과 + 라우트 스모크('/', '/result')", () => {
    it("AC-5[P0]: '/' 와 '/result' 를 실제 App으로 렌더해도 크래시하지 않는다", () => {
      const home = renderWithRouter(React.createElement(App), { initialEntries: ["/"] });
      expect(home.container.innerHTML.length).toBeGreaterThan(0);
      home.unmount();

      const result = renderWithRouter(React.createElement(App), { initialEntries: ["/result"] });
      expect(result.container.innerHTML.length).toBeGreaterThan(0);
      result.unmount();
    });

    it("AC-5: package.json에 build/typecheck/test 스크립트가 정의되어 있다(전체 tsc/build 실행은 Coder가 구현 후 직접 실행해 확인)", () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf8"));
      expect(typeof pkg.scripts.build).toBe("string");
      expect(typeof pkg.scripts.typecheck).toBe("string");
      expect(typeof pkg.scripts.test).toBe("string");
    });
  });
});
