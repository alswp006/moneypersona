import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * 검수 반려 요인 정적 검사 — src/** 전체를 문자열로 훑는다.
 *
 * 테스트 디렉터리(__tests__)는 스캔에서 제외한다: 금지 문자열을 리터럴로
 * 들고 있는 검사 코드 자신이 오탐되는 것을 막기 위해서다.
 */
const SRC_ROOT = path.resolve(__dirname, "..", "..");

interface SourceFile {
  file: string;
  content: string;
}

function collectSourceFiles(): SourceFile[] {
  const results: SourceFile[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__tests__" || entry.name === "node_modules") continue;
        walk(full);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        results.push({ file: path.relative(SRC_ROOT, full), content: fs.readFileSync(full, "utf-8") });
      }
    }
  }

  walk(SRC_ROOT);
  return results;
}

const FILES = collectSourceFiles();

function hits(predicate: (f: SourceFile) => string | null): string[] {
  return FILES.map(predicate).filter((v): v is string => v !== null);
}

describe("컴플라이언스 정적 검사", () => {
  it("스캔 대상 소스 파일이 실제로 수집된다", () => {
    expect(FILES.length).toBeGreaterThan(0);
    expect(FILES.some((f) => f.file.endsWith("App.tsx"))).toBe(true);
  });

  it("금지된 결제·광고·로그인·프레임워크 문자열이 0건이다", () => {
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

    const found = hits(({ file, content }) => {
      const lower = content.toLowerCase();
      const term = forbidden.find((t) => lower.includes(t));
      return term ? `${term} in ${file}` : null;
    });

    expect(found).toEqual([]);
  });

  it("SDK에 없는 환각 훅(useTossLogin/useTossAd/useTossPayment/useTossPromotion)이 0건이다", () => {
    const hallucinated = /\buseToss(Login|Ad|Payment|Promotion)\b/;

    const found = hits(({ file, content }) => (hallucinated.test(content) ? file : null));

    expect(found).toEqual([]);
  });

  it("TDS가 아닌 UI 라이브러리(shadcn/mui/antd/chakra) import가 0건이다", () => {
    const banned = /\bfrom\s+['"](shadcn(?:\/ui)?|@mui\/[^'"]*|antd|@chakra-ui\/[^'"]*)['"]/i;

    const found = hits(({ file, content }) => (banned.test(content) ? file : null));

    expect(found).toEqual([]);
  });

  it("'#rrggbb' 형태 HEX 색상 하드코딩이 0건이다 (다크모드 대응 — CSS 변수만 사용)", () => {
    const hex = /#[0-9a-fA-F]{6}\b/g;

    const found = hits(({ file, content }) => {
      const matches = content.match(hex);
      return matches ? `${matches.join(",")} in ${file}` : null;
    });

    expect(found).toEqual([]);
  });

  it("앱 설치 유도 문구가 0건이다", () => {
    // 유도 문구 3종 — 미니앱은 토스 안에서만 동작하므로 노출 자체가 반려 사유다.
    const inducements = ["설치", "다운로드", "스토어"];

    const found = hits(({ file, content }) => {
      const word = inducements.find((w) => content.includes(w));
      return word ? `${word} in ${file}` : null;
    });

    expect(found).toEqual([]);
  });

  it("console.log / console.error 호출이 0건이다 (검수 시 콘솔 에러 0개)", () => {
    const consoleCall = /console\.(log|error)\s*\(/;

    const found = hits(({ file, content }) => (consoleCall.test(content) ? file : null));

    expect(found).toEqual([]);
  });

  it("외부 도메인 이탈(window.location.href / window.open)이 0건이다", () => {
    const outlink = /window\.(open\s*\(|location\.href\s*=)/;

    const found = hits(({ file, content }) => (outlink.test(content) ? file : null));

    expect(found).toEqual([]);
  });
});
