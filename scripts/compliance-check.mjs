#!/usr/bin/env node
// 토스 검수 반려 요인 정적 검사 — 외부 의존성 없이 node 표준 모듈(fs/path)만 사용.
// 사용법: node scripts/compliance-check.mjs [targetRoot]  (기본값: process.cwd())
//
// src/ 전체를 재귀 스캔해 5개 규칙을 검사한다:
//   1. HEX 색상 하드코딩 (var(--token, #hex) 폴백은 다크모드 대응 정석이라 제외)
//   2. 외부 URL (https?://) — 아웃링크는 검수 반려 사유
//   3. 설치/다운로드/스토어 유도 문구 — 미니앱은 토스 안에서만 동작
//   4. className 안의 Tailwind 간격 클래스(p-/m-/gap-) — TDS Spacing 사용
//   5. src/pages 하위 파일의 console.* 호출
//
// __tests__ 디렉터리는 스캔에서 제외한다(금지 문자열을 리터럴로 든 테스트 데이터가
// 자기 자신을 위반으로 잡는 것을 막기 위해서).
//
// 위반 1건 이상이면 file:line을 stdout에 출력하고 exit 1, 위반 0건이면 exit 0.
import fs from "node:fs";
import path from "node:path";

const targetRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const srcDir = path.join(targetRoot, "src");

const SKIP_DIRS = new Set(["node_modules", "dist", "__tests__"]);
const SCAN_EXT = new Set([".ts", ".tsx", ".css"]);
const INDUCEMENT_WORDS = ["설치", "다운로드", "스토어"];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walk(full, out);
    } else if (SCAN_EXT.has(path.extname(name))) {
      out.push(full);
    }
  }
  return out;
}

function stripVarFallback(line) {
  return line.replace(/var\(\s*--[\w-]+\s*,[^)]*\)/g, "var(--x)");
}

function extractClassNameValue(line) {
  const m = line.match(/className\s*=\s*(?:\{`([^`]*)`\}|\{["']([^"']*)["']\}|"([^"]*)")/);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? "";
}

const violations = [];

for (const file of walk(srcDir)) {
  const rel = path.relative(targetRoot, file).split(path.sep).join("/");
  const isPage = rel.startsWith("src/pages/");
  const lines = fs.readFileSync(file, "utf8").split("\n");

  lines.forEach((line, i) => {
    const lineNo = i + 1;

    if (/#[0-9a-fA-F]{6}\b/.test(stripVarFallback(line))) {
      violations.push({ rel, lineNo, message: "하드코딩 HEX 색상 — var(--tds-color-*)/var(--adaptive*) 사용" });
    }

    if (/https?:\/\//.test(line)) {
      violations.push({ rel, lineNo, message: "외부 URL — 외부 도메인 이탈 금지" });
    }

    const inducement = INDUCEMENT_WORDS.find((w) => line.includes(w));
    if (inducement) {
      violations.push({ rel, lineNo, message: `앱 설치 유도 문구("${inducement}") 금지` });
    }

    const classNameValue = extractClassNameValue(line);
    if (classNameValue && classNameValue.split(/\s+/).some((token) => /^(p|m|gap)-/.test(token))) {
      violations.push({ rel, lineNo, message: "className에 Tailwind 간격 클래스(p-/m-/gap-) — TDS Spacing 사용" });
    }

    if (isPage && /console\.\w+\s*\(/.test(line)) {
      violations.push({ rel, lineNo, message: "src/pages에서 console.* 호출 금지" });
    }
  });
}

if (violations.length === 0) {
  process.exit(0);
}

for (const v of violations) {
  console.log(`${v.rel}:${v.lineNo} — ${v.message}`);
}
process.exit(1);
