#!/usr/bin/env node
/**
 * 검수 컴플라이언스 정적 검증 (CP rules) — 의존성 0, 순수 node ESM.
 *
 * 토스 검수에서 반려되는 8가지를 src/** 에서 grep해 위반 시 exit 1로 죽인다.
 * 사람이 매번 체크리스트를 훑는 대신 `npm run verify:compliance` 한 줄로 끝낸다.
 *
 *   1. no-hardcoded-hex     HEX 색상 리터럴 → 다크모드에서 글자가 배경에 묻힌다 (CP-8)
 *   2. no-network-request   fetch / XMLHttpRequest → CORS 에러 = 반려 (CP-5)
 *   3. no-outlink           window.open / location.href → 외부 도메인 이탈 금지 (CP-2)
 *   4. no-console-error     console.error → 검수 시 콘솔 에러 0개여야 한다 (CP-3)
 *   5. no-install-copy      '설치' / '다운로드' → 앱 설치 유도 금지 (CP-14)
 *   6. no-monetization      TossPurchase / grantPromotionReward → 이 앱은 비수익화 (CP-13)
 *   7. no-forbidden-ui-lib  shadcn / @mui / antd / @chakra-ui → TDS 외 UI 라이브러리 금지 (CP-1)
 *   8. no-modern-js-api     .at( / Object.groupBy / structuredClone → Android 7·iOS 16에 없다 (CP-9)
 *
 * 추가로 vite.config.ts의 build.target이 es2020으로 고정됐는지 확인한다(CP-9).
 * esbuild는 문법만 다운레벨하고 빌트인은 폴리필하지 않으므로, 문법 타깃(es2020)과
 * 빌트인 검사(규칙 8)가 **둘 다** 있어야 구형 OS에서 흰 화면이 안 난다.
 *
 * 예외 표기(위반이 정당한 경우에만):
 *   const C = '#191F28'; // compliance-allow: no-hardcoded-hex — 이유
 *   윗줄에 단독 주석으로 써도 된다.
 *
 * 사용법: node scripts/verify-compliance.mjs [스캔할 디렉터리=src]
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const TARGET_DIR = process.argv[2] ?? "src";

const SCAN_EXT = /\.(tsx?|jsx?|css)$/;
/** 테스트는 금지 패턴을 **일부러** 문자열로 들고 있다(정확히 그걸 검증하니까) → 스캔 제외. */
const EXCLUDE_DIR = /(^|[\\/])(__tests__|node_modules|dist|coverage)([\\/]|$)/;

// ─────────────────────────────────────────────────────────────
// 줄 단위 헬퍼
// ─────────────────────────────────────────────────────────────

/** 주석 줄 — 규칙을 **설명하는 문장**이 규칙 위반으로 잡히는 걸 막는다. */
function isCommentLine(line) {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.startsWith("<!--");
}

/**
 * 줄 끝 주석 제거. 문자열 안의 `//`(예: 'https://')는 건드리지 않는다.
 */
function stripTrailingComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === "`") {
      quote = c;
      continue;
    }
    if (c === "/" && (line[i + 1] === "/" || line[i + 1] === "*")) return line.slice(0, i);
  }
  return line;
}

/** `var(--tds-color-grey500, #6B7684)`의 hex는 CSS 변수 **폴백**이라 정석 사용법이다. */
function stripVarFallbacks(line) {
  return line.replace(/var\(\s*--[\w-]+\s*,[^)]*\)/g, "var(--x)");
}

function hasAllowMarker(ruleId, lines, idx) {
  const marker = new RegExp(`compliance-allow:\\s*${ruleId}\\b`);
  return marker.test(lines[idx] ?? "") || marker.test(lines[idx - 1] ?? "");
}

// ─────────────────────────────────────────────────────────────
// 규칙 정의 (8개)
// ─────────────────────────────────────────────────────────────

const isCode = (f) => /\.(tsx?|jsx?)$/.test(f);
const isStyleable = (f) => /\.(tsx?|jsx?|css)$/.test(f);

/**
 * TossPurchase.tsx는 결제 래퍼의 **정의부**다(템플릿 제공). 정의가 있는 것과
 * 화면이 그걸 쓰는 것은 다른 일이므로, 정의부만 IAP.* 호출 검사에서 뺀다.
 * "실제로 쓰는가"는 <TossPurchase> JSX·import 매치로 전 파일에서 검사하므로
 * 이 예외가 규칙에 구멍을 내지 않는다.
 */
const IAP_WRAPPER_DEF = path.join("src", "components", "TossPurchase.tsx");

export const RULES = [
  {
    id: "no-hardcoded-hex",
    title: "HEX 색상 리터럴 (다크모드)",
    hint: "var(--adaptive*) / var(--tds-color-*) 사용 — 하드코딩 색은 다크모드에서 글자가 묻힌다",
    appliesTo: isStyleable,
    match: (line) => /#[0-9a-fA-F]{3,8}\b/.test(stripVarFallbacks(line)),
  },
  {
    id: "no-network-request",
    title: "네트워크 요청 (fetch / XMLHttpRequest)",
    hint: "외부 API 호출은 CORS 에러 = 즉시 반려. 데이터는 localStorage로",
    appliesTo: isCode,
    match: (line) => /\bfetch\s*\(|\bXMLHttpRequest\b|\baxios\b/.test(line),
  },
  {
    id: "no-outlink",
    title: "외부 도메인 이탈 (window.open / location.href)",
    hint: "미니앱은 앱 내부에서만 이동한다 — 외부 링크는 SDK 네비게이션 API로",
    appliesTo: isCode,
    match: (line) =>
      /window\s*\.\s*open\s*\(|(?:^|[^\w$.])(?:(?:window|self|top|parent|globalThis|document)\s*\.\s*)?location\s*\.\s*(?:href\s*=|assign\s*\(|replace\s*\()/.test(
        line,
      ),
  },
  {
    id: "no-console-error",
    title: "console.error 호출",
    hint: "검수 시 콘솔 에러가 1건이라도 있으면 반려 — 조용히 degrade하라",
    appliesTo: isCode,
    match: (line) => /console\s*\.\s*error\s*\(/.test(line),
  },
  {
    id: "no-install-copy",
    title: "'설치' / '다운로드' 문구",
    hint: "앱 설치 유도 금지 — 공유 문구는 결과 자체를 말하게 하라",
    appliesTo: isCode,
    match: (line) => /설치|다운로드/.test(line),
  },
  {
    id: "no-monetization",
    title: "결제 · 프로모션 API (TossPurchase / grantPromotionReward)",
    hint: "이 앱은 비수익화 — 결제·리워드 지급 API를 화면에서 호출하지 않는다",
    appliesTo: isCode,
    match: (line, file) => {
      if (/\bgrantPromotionReward\b/.test(line)) return true;
      if (/<TossPurchase[\s/>]/.test(line)) return true;
      if (/from\s+['"][^'"]*TossPurchase['"]/.test(line)) return true;
      if (file === IAP_WRAPPER_DEF) return false;
      return /\bIAP\s*\.\s*create\w*PurchaseOrder\s*\(/.test(line);
    },
  },
  {
    id: "no-forbidden-ui-lib",
    title: "금지 UI 라이브러리 (shadcn / @mui / antd / @chakra-ui)",
    hint: "TDS(@toss/tds-mobile) 외 UI 라이브러리는 검수 즉시 반려",
    appliesTo: (f) => isCode(f) || /\.css$/.test(f),
    match: (line) => /shadcn|@mui\b|@chakra-ui\b|(?:^|['"\s/])antd(?:\/|['"]|$)|tailwindcss/i.test(line),
  },
  {
    id: "no-modern-js-api",
    title: "최신 JS 빌트인 (.at( / Object.groupBy / structuredClone)",
    hint: "Android 7 · iOS 16에 없다 — 폴리필 없이 쓰면 그 기기에서 흰 화면",
    appliesTo: isCode,
    match: (line) =>
      /\.at\(|\b(?:Object|Map)\.groupBy\b|\bstructuredClone\s*\(|\.replaceAll\s*\(|\bObject\.hasOwn\s*\(|\.findLast(?:Index)?\s*\(|\bPromise\.any\s*\(/.test(
        line,
      ),
  },
];

// ─────────────────────────────────────────────────────────────
// 스캔
// ─────────────────────────────────────────────────────────────

function collectFiles(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (EXCLUDE_DIR.test(full)) continue;
    if (entry.isDirectory()) collectFiles(full, out);
    else if (SCAN_EXT.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * 문자열 하나를 8개 규칙으로 검사한다(파일 IO 없음 — 단위 테스트에서 직접 호출).
 *
 * @param {string} content
 * @param {string} rel  레포 기준 상대 경로(확장자로 appliesTo 판정)
 * @returns {Array<{ruleId:string,file:string,line:number,text:string}>}
 */
export function scanSource(content, rel) {
  const lines = content.split("\n");
  const hits = [];

  lines.forEach((raw, i) => {
    if (isCommentLine(raw)) return;
    const line = stripTrailingComment(raw);
    if (!line.trim()) return;

    for (const rule of RULES) {
      if (!rule.appliesTo(rel)) continue;
      if (!rule.match(line, rel)) continue;
      if (hasAllowMarker(rule.id, lines, i)) continue;
      hits.push({ ruleId: rule.id, file: rel, line: i + 1, text: raw.trim().slice(0, 100) });
    }
  });

  return hits;
}

function checkViteTarget() {
  const file = path.join(ROOT, "vite.config.ts");
  let source;
  try {
    source = readFileSync(file, "utf-8");
  } catch {
    return { ok: false, detail: "vite.config.ts를 찾을 수 없습니다" };
  }
  return /target\s*:\s*['"]es2020['"]/.test(source)
    ? { ok: true, detail: "build.target = 'es2020' (Android 7+ · iOS 16+)" }
    : { ok: false, detail: "build.target이 'es2020'이 아닙니다 — 구형 OS에서 문법 에러로 흰 화면" };
}

// ─────────────────────────────────────────────────────────────
// 실행 + 리포트
// ─────────────────────────────────────────────────────────────

function main() {
  const files = collectFiles(path.resolve(ROOT, TARGET_DIR));
  const hits = files.flatMap((file) =>
    scanSource(readFileSync(file, "utf-8"), path.relative(ROOT, path.resolve(file)) || file),
  );
  const byRule = new Map(RULES.map((r) => [r.id, []]));
  for (const hit of hits) byRule.get(hit.ruleId).push(hit);

  const viteTarget = checkViteTarget();

  console.log(`검수 컴플라이언스 정적 검증 — scanned ${files.length} files in ${TARGET_DIR}/\n`);

  RULES.forEach((rule, i) => {
    const found = byRule.get(rule.id);
    const mark = found.length === 0 ? "  PASS" : "  FAIL";
    console.log(`${mark}  [${i + 1}/${RULES.length}] ${rule.id} — ${rule.title} (hits: ${found.length})`);
    for (const hit of found) {
      console.log(`          ${hit.file}:${hit.line}  ${hit.text}`);
    }
    if (found.length > 0) console.log(`          ↳ ${rule.hint}`);
  });

  console.log(`${viteTarget.ok ? "  PASS" : "  FAIL"}  [config] vite-build-target — ${viteTarget.detail}`);
  console.log(`\nchecked ${RULES.length} rules + vite build target`);

  if (hits.length === 0 && viteTarget.ok) {
    console.log("violations: 0");
    console.log("COMPLIANCE PASS");
    return 0;
  }

  console.log(`violations: ${hits.length}${viteTarget.ok ? "" : " (+ vite build target)"}`);
  console.log("COMPLIANCE FAIL — 위 파일·라인을 고친 뒤 다시 실행하세요.");
  return 1;
}

// 단위 테스트(scripts/__tests__)에서 import할 때는 실행하지 않는다.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
