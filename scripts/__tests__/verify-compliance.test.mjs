// 실행: node --test scripts/__tests__   (npm run test:scripts)
//
// "위반 0건 통과"만 확인하면 규칙이 **아무것도 안 잡아도** 초록불이다.
// 그래서 규칙마다 잡아야 하는 샘플 / 잡으면 안 되는 샘플을 쌍으로 고정한다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { RULES, scanSource } from "../verify-compliance.mjs";

const ids = (content, file) => scanSource(content, file).map((h) => h.ruleId);

test("규칙은 정확히 8개다", () => {
  assert.equal(RULES.length, 8);
});

test("no-hardcoded-hex: 하드코딩 색 탐지 (다크모드)", () => {
  assert.ok(ids('const s = { color: "#3182F6" };', "src/pages/Home.tsx").includes("no-hardcoded-hex"));
  assert.ok(ids("background: #fff;", "src/styles/globals.css").includes("no-hardcoded-hex"));
});

test("no-hardcoded-hex: CSS 변수 · var() 폴백은 통과", () => {
  assert.deepEqual(ids('color: "var(--adaptiveGrey700)"', "src/pages/Home.tsx"), []);
  assert.deepEqual(ids("color: var(--tds-color-grey500, #6B7684);", "src/styles/x.css"), []);
});

test("no-network-request: fetch / XMLHttpRequest 탐지", () => {
  assert.ok(ids("const r = await fetch(url);", "src/lib/api.ts").includes("no-network-request"));
  assert.ok(ids("const x = new XMLHttpRequest();", "src/lib/api.ts").includes("no-network-request"));
});

test("no-outlink: window.open / location.href 탐지", () => {
  assert.ok(ids('window.open("https://toss.im");', "src/pages/Home.tsx").includes("no-outlink"));
  assert.ok(ids('window.location.href = "https://toss.im";', "src/pages/Home.tsx").includes("no-outlink"));
});

test("no-console-error: 탐지", () => {
  assert.ok(ids('console.error("실패");', "src/lib/storage.ts").includes("no-console-error"));
  assert.deepEqual(ids('console.warn("실패");', "src/lib/storage.ts"), []);
});

test("no-install-copy: 설치 · 다운로드 문구 탐지 (CP-14)", () => {
  assert.ok(ids('<Text>앱 설치하고 결과 보기</Text>', "src/pages/Home.tsx").includes("no-install-copy"));
  assert.ok(ids('const copy = "지금 다운로드";', "src/lib/share.ts").includes("no-install-copy"));
});

test("no-monetization: 결제·프로모션 사용 탐지", () => {
  assert.ok(ids("await grantPromotionReward({ amount: 1000 });", "src/pages/Home.tsx").includes("no-monetization"));
  assert.ok(ids('<TossPurchase sku="premium" />', "src/pages/Result.tsx").includes("no-monetization"));
  assert.ok(
    ids('import { TossPurchase } from "@/components/TossPurchase";', "src/pages/Result.tsx").includes("no-monetization"),
  );
});

test("no-monetization: 결제 래퍼 정의부는 예외 (화면이 쓰는지가 기준)", () => {
  const line = "cleanupRef.current = IAP.createOneTimePurchaseOrder({";
  assert.deepEqual(ids(line, "src/components/TossPurchase.tsx"), []);
  assert.ok(ids(line, "src/pages/Result.tsx").includes("no-monetization"));
});

test("no-forbidden-ui-lib: TDS 외 UI 라이브러리 탐지", () => {
  assert.ok(ids('import { Button } from "@mui/material";', "src/pages/Home.tsx").includes("no-forbidden-ui-lib"));
  assert.ok(ids('import { Button } from "antd";', "src/pages/Home.tsx").includes("no-forbidden-ui-lib"));
  assert.ok(ids('import { Box } from "@chakra-ui/react";', "src/pages/Home.tsx").includes("no-forbidden-ui-lib"));
  assert.deepEqual(ids('import { Button } from "@toss/tds-mobile";', "src/pages/Home.tsx"), []);
});

test("no-modern-js-api: 구형 OS에 없는 빌트인 탐지 (CP-9)", () => {
  assert.ok(ids("const last = list.at(-1);", "src/lib/utils.ts").includes("no-modern-js-api"));
  assert.ok(ids("const g = Object.groupBy(rows, fn);", "src/lib/utils.ts").includes("no-modern-js-api"));
  assert.ok(ids("const copy = structuredClone(draft);", "src/lib/utils.ts").includes("no-modern-js-api"));
  assert.deepEqual(ids("const last = list[list.length - 1];", "src/lib/utils.ts"), []);
});

test("주석은 규칙을 설명해도 위반이 아니다", () => {
  assert.deepEqual(ids("// window.open은 외부 이탈이라 금지 — #3182F6도 마찬가지", "src/pages/Home.tsx"), []);
  assert.deepEqual(ids("const ok = true; // console.error 대신 조용히 degrade", "src/lib/storage.ts"), []);
});

test("compliance-allow 마커는 해당 줄만 면제한다", () => {
  assert.deepEqual(
    ids("const C = '#191F28'; // compliance-allow: no-hardcoded-hex — Canvas는 CSS 변수 미지원", "src/lib/shareImage.ts"),
    [],
  );
  // 다른 규칙 id의 마커로는 면제되지 않는다
  assert.ok(
    ids("const C = '#191F28'; // compliance-allow: no-outlink", "src/lib/shareImage.ts").includes("no-hardcoded-hex"),
  );
});

test("문자열 안의 //는 주석이 아니다 (잘라내서 놓치면 안 됨)", () => {
  assert.ok(ids('window.open("https://toss.im");', "src/pages/Home.tsx").includes("no-outlink"));
});

test("위반 결과는 파일·라인을 담는다", () => {
  const hits = scanSource('const a = 1;\nconsole.error("x");', "src/lib/storage.ts");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].file, "src/lib/storage.ts");
  assert.equal(hits[0].line, 2);
});
