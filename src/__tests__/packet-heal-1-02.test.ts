import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { screen } from "@testing-library/react";
import { mockAll, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";

mockAll();

// Home/App은 목킹된 모듈(react-router-dom/@toss/tds-mobile) 위에서 동작해야 하므로
// 반드시 mockAll() 호출 이후에 동적/정적 import 되어야 한다(vi.mock은 호이스팅됨).
import Home from "@/pages/Home";
import App from "@/App";

const PROJECT_ROOT = process.cwd();

function readFile(relPath: string) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf-8");
}

const REQUIRED_ROUTES = ["/", "/quiz", "/result", "/report", "/share", "/compat", "/history"];

describe("packet-heal-1-02: 코딩 에이전트 실행 가드레일 + 라우팅/홈 최소 배선 복구", () => {
  describe("AC-1: .claude/settings.json permissions.allow는 npm/npx/git/ls/grep 계열만 허용", () => {
    it("AC-1[P0]: permissions.allow에 필수 8개 항목이 등록되어 있다", () => {
      const settings = JSON.parse(readFile(".claude/settings.json"));

      expect(Array.isArray(settings.permissions?.allow)).toBe(true);

      const required = [
        "Bash(npm run:*)",
        "Bash(npx tsc:*)",
        "Bash(npx vitest:*)",
        "Bash(npx eslint:*)",
        "Bash(git status:*)",
        "Bash(git diff:*)",
        "Bash(ls:*)",
        "Bash(grep:*)",
      ];

      for (const entry of required) {
        expect(settings.permissions.allow).toContain(entry);
      }
    });

    it("AC-1[P0]: curl/wget/python3/sed 계열 항목이 0건이다", () => {
      const settings = JSON.parse(readFile(".claude/settings.json"));
      const allow: string[] = settings.permissions?.allow ?? [];

      const forbidden = allow.filter((entry) => /curl|wget|python3?|sed|awk/i.test(entry));
      expect(forbidden).toHaveLength(0);
      expect(allow.length).toBeGreaterThan(0);
    });
  });

  describe("AC-2: CLAUDE.md에 도구 사용 가드레일이 명문화되어 있다", () => {
    it("AC-2[P0]: 네트워크 호출·python3 인라인·sed/awk 일괄치환 금지 문구가 있다", () => {
      const claudeMd = readFile("CLAUDE.md");

      expect(claudeMd).toMatch(/curl/i);
      expect(claudeMd).toMatch(/wget/i);
      expect(claudeMd).toMatch(/python3/i);
      expect(claudeMd).toMatch(/sed[\s/]*[/&]?awk|sed\s*\/\s*awk|sed.*awk/i);
    });

    it("AC-2[P0]: 파일 수정은 Read/Edit/Write 도구로만 하고 아이콘은 Asset.ContentIcon만 쓰라는 규칙이 있다", () => {
      const claudeMd = readFile("CLAUDE.md");

      expect(claudeMd).toMatch(/Read\s*\/\s*Edit\s*\/\s*Write/);
      expect(claudeMd).toMatch(/Asset\.ContentIcon/);
    });
  });

  describe("AC-3: 라우터에 7개 라우트가 선언되고 미구현 화면도 플레이스홀더로 연결된다", () => {
    it("AC-3[P0]: src/App.tsx가 7개 경로 모두에 대해 <Route path=...> 를 선언한다", () => {
      const appSource = readFile("src/App.tsx");

      for (const routePath of REQUIRED_ROUTES) {
        const pattern = new RegExp(`path=["']${routePath.replace("/", "\\/")}["']`);
        expect(appSource).toMatch(pattern);
      }
    });

    it("AC-3[P0]: 7개 경로에 대응하는 페이지 파일이 모두 존재한다(플레이스홀더 포함)", () => {
      const pageFiles = ["Home.tsx", "Quiz.tsx", "Result.tsx", "Report.tsx", "Share.tsx", "Compat.tsx", "History.tsx"];

      for (const file of pageFiles) {
        const exists = fs.existsSync(path.join(PROJECT_ROOT, "src/pages", file));
        expect(exists).toBe(true);
      }
    });

    it("AC-3[P0]: npx tsc --noEmit 통과는 Coder가 구현 완료 후 별도 실행으로 확인한다(문서화)", () => {
      // 개별 vitest 테스트에서 전체 tsc 프로세스를 스폰하면 기본 타임아웃(5s)을 초과할 수 있어
      // 여기서는 타입 계약이 존재함만 확인하고, 실제 통과 여부는 CLAUDE.md 체크리스트 1번을 따른다.
      const appSource = readFile("src/App.tsx");
      expect(appSource).toMatch(/import\s+Home\s+from/);
      expect(appSource).toContain("Routes");
    });
  });

  describe("AC-4: 홈 '/'의 CTA가 '/quiz'로 이동하고 전체폭 버튼이다", () => {
    it("AC-4[P0]: 홈 CTA 버튼 클릭 시 navigate('/quiz')가 호출된다", () => {
      renderWithRouter(React.createElement(Home));

      const cta = screen.getByRole("button", { name: /테스트 시작|결과 보기|시작/ });
      cta.click();

      expect(mockNavigate).toHaveBeenCalledWith("/quiz");
    });

    it("AC-4[P0]: 홈 CTA 버튼은 display=\"block\" 전체폭이다(좌측 글자폭 금지)", () => {
      const homeSource = readFile("src/pages/Home.tsx");

      // navigate('/quiz')를 호출하는 버튼 근처에 display="block"이 선언되어 있어야 한다
      expect(homeSource).toMatch(/display=["']block["']/);
      expect(homeSource).toMatch(/navigate\(['"]\/quiz['"]\)/);
    });
  });

  describe("AC-5: FloatingTabBar는 탭-루트 3개 경로에서만 노출된다", () => {
    it("AC-5[P0]: '/quiz'에서는 하단 탭바(role=tablist)가 렌더되지 않는다", () => {
      renderWithRouter(React.createElement(App), { initialEntries: ["/quiz"] });
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });

    it("AC-5[P0]: '/', '/history', '/compat'에서는 하단 탭바(role=tablist)가 렌더된다", () => {
      for (const entry of ["/", "/history", "/compat"]) {
        const { unmount } = renderWithRouter(React.createElement(App), { initialEntries: [entry] });
        expect(screen.getByRole("tablist")).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe("AC-6: 소스 전체에 외부 URL 하드코딩이 없다", () => {
    it("AC-6[P0]: src/ 아래 .ts/.tsx 파일에 http(s):// 하드코딩이 0건이다", () => {
      const offenders: string[] = [];

      function walk(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.name === "__tests__") continue;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(full);
          } else if (/\.(ts|tsx)$/.test(entry.name)) {
            const content = fs.readFileSync(full, "utf-8");
            if (/https?:\/\//.test(content)) {
              offenders.push(full);
            }
          }
        }
      }

      walk(path.join(PROJECT_ROOT, "src"));
      expect(offenders).toEqual([]);
    });
  });
});
