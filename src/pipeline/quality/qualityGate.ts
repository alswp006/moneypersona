import { parseTscOutput, type TypeCheckError } from "./parseTscOutput";
import { runTypecheck, type RunTypecheckOptions, type TypeCheckResult } from "./typecheck";

/**
 * 타입체크 게이트의 정규화된 판정 결과.
 * - pass: exitCode 0 (에러 0건도 성공, 절대 YELLOW로 만들지 않는다)
 * - fail: exitCode≠0이고 파싱된 에러가 1건 이상 — 실제 타입 에러
 * - tool_crash: exitCode≠0인데 파싱된 에러가 0건 — 게이트/툴 자체의 결함
 */
export interface QualityGateResult {
  status: "pass" | "fail" | "tool_crash";
  errors: TypeCheckError[];
  rawOutput: string;
  command: string;
}

const CRASH_LOG_TAIL_LINES = 40;

function combineOutput(result: TypeCheckResult): string {
  return [result.stdout, result.stderr].filter((chunk) => chunk.length > 0).join("\n");
}

function buildCrashReport(result: TypeCheckResult, combinedOutput: string): string {
  const tail = combinedOutput.split("\n").slice(-CRASH_LOG_TAIL_LINES).join("\n");
  return [
    "TOOL_CRASH",
    `Command: ${result.command}`,
    `Cwd: ${result.cwd}`,
    `TsconfigPath: ${result.tsconfigPath}`,
    "",
    `Stderr/stdout (last ${CRASH_LOG_TAIL_LINES} lines):`,
    tail || "(no output captured)",
  ].join("\n");
}

/**
 * exitCode/stdout/stderr → { status, errors, rawOutput, command } 판정.
 * 순수 함수라 실제 프로세스 실행 없이 단위 테스트로 3분기를 모두 고정할 수 있다.
 */
export function assessTypecheckResult(result: TypeCheckResult): QualityGateResult {
  const combinedOutput = combineOutput(result);

  // (a) exitCode === 0 → 항상 PASS. 에러 0건은 성공이며 YELLOW로 만들지 않는다.
  if (result.exitCode === 0) {
    return { status: "pass", errors: [], rawOutput: combinedOutput, command: result.command };
  }

  const parsedErrors = parseTscOutput(combinedOutput);

  // (c) exitCode !== 0 && parsedErrors.length === 0 → 게이트/툴 자체의 결함
  if (parsedErrors.length === 0) {
    return {
      status: "tool_crash",
      errors: [],
      rawOutput: buildCrashReport(result, combinedOutput),
      command: result.command,
    };
  }

  // (b) exitCode !== 0 && parsedErrors.length > 0 → FAIL, 파싱된 에러 그대로 리포트
  // 불변식: 에러 개수가 0인데 실패로 표기하는 경로는 존재할 수 없다 — rawOutput은 항상 비어있지 않다.
  if (!combinedOutput || combinedOutput.trim().length === 0) {
    throw new Error(
      "Invariant violation: fail status with parsed errors must have non-empty rawOutput"
    );
  }

  return { status: "fail", errors: parsedErrors, rawOutput: combinedOutput, command: result.command };
}

/**
 * 타입체크를 실행하고 판정한다. tool_crash로 분류되면 프로젝트 루트에서
 * 표준 커맨드로 1회 재시도한 뒤, 그 재시도 결과를 최종 판정으로 사용한다.
 */
export function runQualityGate(options: RunTypecheckOptions = {}): QualityGateResult {
  const first = assessTypecheckResult(runTypecheck(options));

  if (first.status !== "tool_crash") {
    return first;
  }

  const retryOptions: RunTypecheckOptions = {
    cwd: options.cwd ?? process.cwd(),
    tsconfigPath: undefined,
  };
  return assessTypecheckResult(runTypecheck(retryOptions));
}

/** tool_crash는 게이트 자체의 결함이지 실제 타입 에러가 아니므로 패킷 생성/머지를 막지 않는다 */
export function isPacketBlocking(gate: QualityGateResult): boolean {
  return gate.status === "fail";
}
