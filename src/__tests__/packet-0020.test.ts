import { describe, it, expect } from "vitest";
import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { mockTds, mockAppsInToss } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";

mockTds();
mockAppsInToss();

const FLAGS_KEY = "mp:flags:v1";

describe("컴플라이언스 가드 + 고지 컴포넌트 + 정적 검사", () => {
  describe("AC-1: DisclaimerNotice", () => {
    it("AC-1[P0]: '재미로 보는 성향 테스트이며 금융 투자 자문이 아닙니다' 문구를 작은 Paragraph.Text로 렌더한다", async () => {
      const { default: DisclaimerNotice } = await import("@/components/DisclaimerNotice");
      const { container } = renderWithRouter(React.createElement(DisclaimerNotice));

      const notice = screen.getByText("재미로 보는 성향 테스트이며 금융 투자 자문이 아닙니다");
      expect(notice.tagName).toBe("SPAN");
      // 작은 크기 typography (st1~st13 계열) — 본문 크기(t1~t4)가 아니어야 한다
      expect(notice.getAttribute("data-typography")).toMatch(/^st1[0-3]$/);
      // 외부 링크 없음
      expect(container.querySelectorAll("a").length).toBe(0);
    });

    it("AC-1[P0]: 외부 도메인 링크(href, onClick의 window.open/location.href)를 포함하지 않는다", async () => {
      const { default: DisclaimerNotice } = await import("@/components/DisclaimerNotice");
      const { container } = renderWithRouter(React.createElement(DisclaimerNotice));

      expect(container.innerHTML).not.toMatch(/href=/);
      expect(container.querySelectorAll("button").length).toBe(0);
    });
  });

  describe("AC-2: useDisclaimerGate", () => {
    async function buildHost() {
      const { AlertDialog } = await import("@toss/tds-mobile");
      const { useDisclaimerGate } = await import("@/hooks/useDisclaimerGate");

      function DisclaimerHost() {
        const { open, onConfirm } = useDisclaimerGate();
        return React.createElement(AlertDialog, {
          open,
          title: "안내",
          description: "재미로 보는 성향 테스트이며 금융 투자 자문이 아닙니다",
          onClose: () => {},
          alertButton: React.createElement(
            AlertDialog.AlertButton,
            { onClick: onConfirm },
            "확인",
          ),
        });
      }

      return DisclaimerHost;
    }

    it("AC-2[P0]: flags.disclaimerSeen===false(최초 방문)면 AlertDialog가 '닫기' 버튼과 함께 1회 노출된다", async () => {
      const DisclaimerHost = await buildHost();
      renderWithRouter(React.createElement(DisclaimerHost));

      const dialog = screen.getByRole("alertdialog");
      expect(dialog.getAttribute("aria-label")).toBe("안내");
      expect(screen.getByRole("button", { name: "닫기" }).textContent).toBe("닫기");
      expect(screen.getByRole("button", { name: "확인" }).textContent).toBe("확인");
    });

    it("AC-2[P0]: 확인 클릭 시 markDisclaimerSeen()으로 'mp:flags:v1'에 disclaimerSeen:true가 저장되고 다이얼로그가 닫힌다", async () => {
      const DisclaimerHost = await buildHost();
      renderWithRouter(React.createElement(DisclaimerHost));

      fireEvent.click(screen.getByRole("button", { name: "확인" }));

      expect(screen.queryByRole("alertdialog")).toBeNull();
      const stored = JSON.parse(localStorage.getItem(FLAGS_KEY) ?? "{}");
      expect(stored.disclaimerSeen).toBe(true);
    });

    it("AC-2: flags.disclaimerSeen===true(재방문)이면 AlertDialog가 다시 뜨지 않는다", async () => {
      localStorage.setItem(
        FLAGS_KEY,
        JSON.stringify({ onboardingSeen: false, lastResultId: null, disclaimerSeen: true }),
      );

      const DisclaimerHost = await buildHost();
      renderWithRouter(React.createElement(DisclaimerHost));

      expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    it("AC-2: markDisclaimerSeen()이 exported되어 단독으로 호출 가능하다", async () => {
      const { markDisclaimerSeen } = await import("@/hooks/useDisclaimerGate");
      expect(typeof markDisclaimerSeen).toBe("function");

      markDisclaimerSeen();

      const stored = JSON.parse(localStorage.getItem(FLAGS_KEY) ?? "{}");
      expect(stored.disclaimerSeen).toBe(true);
    });
  });

  describe("AC-3/AC-4: 정적 검사 (src/** 전체 소스 스캔)", () => {
    // __tests__ 디렉터리(이 파일 자신 포함)는 스캔 대상에서 제외한다 —
    // 금지 문자열을 리터럴로 검사하는 테스트 코드 자체가 오탐되는 것을 방지.
    async function collectSourceFiles(): Promise<Array<{ file: string; content: string }>> {
      const fs = await import("fs");
      const path = await import("path");
      const srcRoot = path.resolve(__dirname, "..");
      const results: Array<{ file: string; content: string }> = [];

      function walk(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === "__tests__" || entry.name === "node_modules") continue;
            walk(full);
          } else if (/\.(ts|tsx)$/.test(entry.name)) {
            results.push({ file: full, content: fs.readFileSync(full, "utf-8") });
          }
        }
      }

      walk(srcRoot);
      return results;
    }

    it("AC-3[P0]: 금지된 결제/광고/로그인/Next.js 문자열이 src/** 전체에서 0건이다", async () => {
      const files = await collectSourceFiles();
      const forbidden = [
        "stripe",
        "iamport",
        "bootpay",
        "tosspayments",
        "admob",
        "adsense",
        "kakao",
        "firebase/auth",
        "next/",
      ];

      const hits: string[] = [];
      for (const { file, content } of files) {
        const lower = content.toLowerCase();
        for (const term of forbidden) {
          if (lower.includes(term)) hits.push(`${term} in ${file}`);
        }
      }

      expect(hits).toEqual([]);
      expect(hits.length).toBe(0);
    });

    it("AC-3[P0]: shadcn/mui/antd/chakra import가 src/** 전체에서 0건이다", async () => {
      const files = await collectSourceFiles();
      const bannedImportPattern = /\bfrom\s+['"](shadcn(?:\/ui)?|@mui\/[^'"]*|antd|@chakra-ui\/[^'"]*)['"]/i;

      const hits: string[] = [];
      for (const { file, content } of files) {
        if (bannedImportPattern.test(content)) hits.push(file);
      }

      expect(hits).toEqual([]);
      expect(hits.length).toBe(0);
    });

    it("AC-4[P0]: '#rrggbb' 형태 HEX 색상 하드코딩이 src/** 전체에서 0건이다", async () => {
      const files = await collectSourceFiles();
      const hexPattern = /#[0-9a-fA-F]{6}\b/g;

      const hits: string[] = [];
      for (const { file, content } of files) {
        const matches = content.match(hexPattern);
        if (matches) hits.push(`${matches.join(",")} in ${file}`);
      }

      expect(hits).toEqual([]);
      expect(hits.length).toBe(0);
    });

    it("AC-4[P0]: 설치/다운로드/스토어 유도 문구와 console.log/console.error 호출이 src/** 전체에서 0건이다", async () => {
      const files = await collectSourceFiles();
      const bannedWords = ["설치", "다운로드", "스토어"];
      const consoleCallPattern = /console\.(log|error)\s*\(/;

      const wordHits: string[] = [];
      const consoleHits: string[] = [];
      for (const { file, content } of files) {
        for (const word of bannedWords) {
          if (content.includes(word)) wordHits.push(`${word} in ${file}`);
        }
        if (consoleCallPattern.test(content)) consoleHits.push(file);
      }

      expect(wordHits).toEqual([]);
      expect(consoleHits).toEqual([]);
    });
  });
});
