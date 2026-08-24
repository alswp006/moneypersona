import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { screen } from "@testing-library/react";
import { mockAll } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";

mockAll();

const PROJECT_ROOT = process.cwd();
const COMPLIANCE_SCRIPT = path.join(PROJECT_ROOT, "scripts", "compliance-check.mjs");

function runComplianceCheck(targetRoot?: string) {
  const args = [COMPLIANCE_SCRIPT];
  if (targetRoot) args.push(targetRoot);
  return spawnSync(process.execPath, args, { encoding: "utf8" });
}

function makeFixtureRoot(files: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "compliance-fixture-"));
  for (const [relPath, content] of Object.entries(files)) {
    const full = path.join(root, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  return root;
}

describe("품질 게이트 로컬 재현 스크립트 + 컴플라이언스 정적 검사 통과", () => {
  describe("AC-1: npm run verify 파이프라인", () => {
    it("AC-1[P0]: package.json verify 스크립트가 typecheck→lint→build→vitest→컴플라이언스 순서로 정의된다", () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf8"));

      expect(pkg.scripts.verify).toBe(
        "npm run typecheck && npm run lint && npm run build && npx vitest run && node scripts/compliance-check.mjs",
      );
      expect(typeof pkg.scripts.lint).toBe("string");
      expect(pkg.scripts.lint.length).toBeGreaterThan(0);
    });
  });

  describe("AC-2: scripts/compliance-check.mjs — 외부 의존성 없이 node 표준 모듈만 사용", () => {
    it("AC-2[P0]: import/require가 node 내장 모듈(fs/path/process/os/url)로만 제한된다", () => {
      const content = fs.readFileSync(COMPLIANCE_SCRIPT, "utf8");
      const specifiers: string[] = [];
      const importRe = /import\s+[\s\S]*?from\s+["']([^"']+)["']/g;
      const requireRe = /require\(\s*["']([^"']+)["']\s*\)/g;
      let m: RegExpExecArray | null;
      while ((m = importRe.exec(content)) !== null) specifiers.push(m[1]);
      while ((m = requireRe.exec(content)) !== null) specifiers.push(m[1]);

      expect(specifiers.length).toBeGreaterThan(0);
      for (const spec of specifiers) {
        expect(spec).toMatch(/^(node:)?(fs|path|process|os|url)(\/.*)?$/);
      }
    });

    it("AC-2[P0]: 위반이 없으면 exit 0, 있으면 file:line을 출력하고 exit 1 한다", () => {
      const cleanRoot = makeFixtureRoot({
        "src/components/Ok.tsx": [
          'import { Paragraph } from "@toss/tds-mobile";',
          "export function Ok() {",
          '  return <Paragraph.Text color="var(--tds-color-grey900, #191F28)">안녕하세요</Paragraph.Text>;',
          "}",
          "",
        ].join("\n"),
      });
      const clean = runComplianceCheck(cleanRoot);
      expect(clean.status).toBe(0);

      const badRoot = makeFixtureRoot({
        "src/components/BadColor.tsx": ["export const style = {", '  color: "#3182F6",', "};", ""].join("\n"),
      });
      const bad = runComplianceCheck(badRoot);
      expect(bad.status).toBe(1);
      expect(bad.stdout).toMatch(/BadColor\.tsx:2\b/);
    });
  });

  describe("AC-3: 5개 규칙(HEX/외부URL/금지단어/Tailwind 간격/pages console) 검사", () => {
    it("AC-3[P0]: HEX 색상·외부 URL·금지 단어·Tailwind 간격 클래스·pages console.* 를 각각 파일:라인으로 탐지한다", () => {
      const root = makeFixtureRoot({
        "src/components/BadColor.tsx": ["export const style = {", '  color: "#3182F6",', "};", ""].join("\n"),
        "src/lib/link.ts": ['export const homepage = "https://example.com";', ""].join("\n"),
        "src/components/Install.tsx": [
          "export function InstallBanner() {",
          '  return "지금 설치하고 시작하세요";',
          "}",
          "",
        ].join("\n"),
        "src/components/Layout.tsx": [
          "export function Layout({ children }) {",
          '  return <div className="wrap p-4 gap-2">{children}</div>;',
          "}",
          "",
        ].join("\n"),
        "src/pages/Result.tsx": [
          "export function Result() {",
          '  console.log("debug value");',
          "  return null;",
          "}",
          "",
        ].join("\n"),
        // pages 밖의 console.* 은 규칙 대상이 아니다 — 오탐 방지 확인용
        "src/components/Quiet.tsx": [
          "export function quietLog() {",
          '  console.log("not flagged - outside pages");',
          "}",
          "",
        ].join("\n"),
      });

      const result = runComplianceCheck(root);

      expect(result.status).toBe(1);
      expect(result.stdout).toMatch(/BadColor\.tsx:2\b/);
      expect(result.stdout).toMatch(/link\.ts:1\b/);
      expect(result.stdout).toMatch(/Install\.tsx:2\b/);
      expect(result.stdout).toMatch(/Layout\.tsx:2\b/);
      expect(result.stdout).toMatch(/Result\.tsx:2\b/);
      expect(result.stdout).not.toMatch(/Quiet\.tsx/);
    });

    it("AC-3: __tests__ 디렉터리와 var() HEX 폴백은 오탐되지 않는다(자기지시 회피)", () => {
      const root = makeFixtureRoot({
        // __tests__ 안의 금지 단어 리터럴은 테스트 데이터이지 실제 카피가 아니므로 제외되어야 한다
        "src/__tests__/words.test.ts": ['export const bannedWords = ["설치", "다운로드", "스토어"];', ""].join(
          "\n",
        ),
        // var(--token, #hex) 폴백은 다크모드 대응 정석 패턴이라 제외되어야 한다
        "src/styles/reward-ad.css": [".btn {", "  background-color: var(--tds-color-blue500, #3182F6);", "}", ""].join(
          "\n",
        ),
      });

      const result = runComplianceCheck(root);
      expect(result.status).toBe(0);
      expect(result.stdout ?? "").not.toMatch(/words\.test\.ts/);
    });

    it("AC-3: 현재 코드베이스(src/) 전체를 스캔했을 때 위반이 0건이다", () => {
      const result = runComplianceCheck();
      expect(result.status).toBe(0);
      expect((result.stdout ?? "").trim().length === 0 || result.status === 0).toBe(true);
    });
  });

  describe("AC-4: DisclaimerNotice", () => {
    it("AC-4[P0]: '재미로 보는 성향 테스트이며 금융 투자 자문이 아닙니다' 문구를 TDS Paragraph.Text로 렌더한다", async () => {
      const { default: DisclaimerNotice } = await import("@/components/DisclaimerNotice");
      renderWithRouter(React.createElement(DisclaimerNotice));

      const notice = screen.getByText("재미로 보는 성향 테스트이며 금융 투자 자문이 아닙니다");
      expect(notice.tagName).toBe("SPAN");
      expect(notice.getAttribute("data-typography")).toMatch(/^st1[0-3]$/);
    });

    it("AC-4[P0]: DisclaimerNotice 소스에 HEX·인라인 색상 값이 없다", () => {
      const content = fs.readFileSync(
        path.join(PROJECT_ROOT, "src/components/DisclaimerNotice.tsx"),
        "utf8",
      );
      expect(content).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(content).not.toMatch(/color:\s*["'](?!var\()/);
    });
  });

  describe("AC-5: npm run verify 전체 통과", () => {
    it("AC-5[P0]: npm run verify는 exit 0으로 통과한다(파이프라인 재귀 실행 방지를 위해 이 테스트는 문서화만 하며, Coder는 구현 후 반드시 `npm run verify`를 직접 실행해 확인해야 한다)", () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf8"));
      expect(typeof pkg.scripts.verify).toBe("string");
      expect(pkg.scripts.verify).toContain("node scripts/compliance-check.mjs");
      expect(fs.existsSync(COMPLIANCE_SCRIPT)).toBe(true);
    });
  });
});
