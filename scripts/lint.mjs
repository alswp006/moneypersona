#!/usr/bin/env node
// npm run lint — src/ 전체에 forbidden-patterns 전수 스캔을 돌리는 CLI 래퍼.
// finish-gate.mjs(Stop hook)와 같은 scanSrc를 공유한다 — 규칙 소스는 forbidden-patterns.mjs 하나.
import { scanSrc } from "./forbidden-patterns.mjs";

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const violations = scanSrc(root);

if (violations.length === 0) {
  process.exit(0);
}

process.stderr.write(
  "🛑 lint 실패 — 금지 패턴 발견:\n\n" +
    violations.map((v) => `  ✗ [${v.patternId}] ${v.file}:${v.line} — ${v.message}`).join("\n") +
    "\n",
);
process.exit(1);
