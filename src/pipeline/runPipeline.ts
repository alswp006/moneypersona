import type { PipelineStage } from "../lib/contract";
import { toArray } from "./utils/toArray";
import { validateStageSchema } from "./validation/stageSchema";
import { runQualityGate, type QualityGateResult } from "./quality/qualityGate";
import type { RunTypecheckOptions } from "./quality/typecheck";

export interface PipelineOptions {
  /** 스테이지 결과가 배열이 아닐 때 재시도할 최대 횟수 (기본 2회) */
  maxRetries?: number;
  /**
   * 지정하면 파이프라인 실행 후 타입체크 품질 게이트를 실행한다.
   * tool_crash(게이트 자체 결함)는 packets/errors에 영향을 주지 않고
   * warnings[]에만 기록된다 — 게이트 결함만으로 최종 패킷 수가 0이 되지 않는다.
   */
  qualityGate?: RunTypecheckOptions;
}

export interface PipelineError {
  stage: string;
  reason: string;
  rawKeys?: string[];
}

export interface PipelineWarning {
  stage: string;
  reason: string;
  rawOutput?: string;
}

export interface PipelineResult {
  packets: unknown[];
  errors: PipelineError[];
  warnings: PipelineWarning[];
}

/**
 * 품질 게이트 결과를 파이프라인 요약에 반영한다.
 * tool_crash만 경고로 남기고 packets/errors는 절대 건드리지 않는다 —
 * 게이트 자체의 결함이 정상 생성된 패킷을 지워버리는 것을 구조적으로 막는다.
 */
export function attachQualityGateWarning(
  result: PipelineResult,
  gate: QualityGateResult
): PipelineResult {
  if (gate.status !== "tool_crash") {
    return result;
  }

  return {
    ...result,
    warnings: [
      ...result.warnings,
      { stage: "qualityGate:typecheck", reason: "typecheck tool crashed", rawOutput: gate.rawOutput },
    ],
  };
}

const DEFAULT_MAX_RETRIES = 2;

interface StageAttemptResult {
  value?: unknown[];
  error?: PipelineError;
}

/**
 * 단일 스테이지를 실행하고, 결과가 배열이 아니거나 스테이지가 예외를
 * 던지면 (maxRetries + 1)번까지 재시도한다. 재시도를 모두 소진해도
 * 실패하면 TypeError를 던지는 대신 구조화된 실패 리포트를 반환한다.
 */
function runStageWithRetry(
  stage: PipelineStage,
  input: unknown,
  maxRetries: number
): StageAttemptResult {
  const totalAttempts = maxRetries + 1;
  let lastRawResult: unknown;
  let lastThrownMessage: string | undefined;
  let lastValidationError: string | undefined;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      const raw = stage.transform ? stage.transform(input) : input;

      if (Array.isArray(raw)) {
        const schema = validateStageSchema(stage, raw);
        if (schema.valid) {
          return { value: raw };
        }
        lastValidationError = schema.error;
        lastRawResult = raw;
        continue;
      }

      lastRawResult = raw;
      console.warn(
        `[pipeline] Stage "${stage.name}" returned a non-array value on attempt ${attempt}/${totalAttempts} (type: ${typeof raw})`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const errorForLog = err instanceof Error ? err : new Error(message);
      lastThrownMessage = message;
      console.error(
        `[pipeline] Stage "${stage.name}" threw on attempt ${attempt}/${totalAttempts}: ${message}`,
        errorForLog
      );
    }
  }

  if (lastThrownMessage !== undefined) {
    return {
      error: {
        stage: stage.name,
        reason: `Stage threw error: ${lastThrownMessage}`,
      },
    };
  }

  if (lastValidationError !== undefined) {
    return {
      error: {
        stage: stage.name,
        reason: lastValidationError,
      },
    };
  }

  // rawKeys는 항상 배열로 남긴다 — undefined/null 반환이어도 `[]`가 되어
  // 소비하는 쪽이 `.length`/`.map`을 가드 없이 호출해도 안전하다.
  return {
    error: {
      stage: stage.name,
      reason: `Stage "${stage.name}" returned a non-array value (type: ${typeof lastRawResult})`,
      rawKeys: Object.keys((lastRawResult ?? {}) as object),
    },
  };
}

/**
 * 파이프라인을 순차 실행한다. 어떤 스테이지가 undefined/null/객체를
 * 반환하거나 예외를 던져도 TypeError 없이 완주하며, 실패한 스테이지는
 * errors[]에 stage/reason(선택적으로 rawKeys)으로 기록된다.
 * 한 스테이지가 실패해도 이후 스테이지는 직전 성공 입력을 이어받아 계속 실행된다.
 */
export function runPipeline(
  stages: PipelineStage[],
  initialInput: unknown,
  options: PipelineOptions = {}
): PipelineResult {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const errors: PipelineError[] = [];
  let currentInput: unknown = initialInput;

  for (const stage of toArray<PipelineStage>(stages)) {
    const result = runStageWithRetry(stage, currentInput, maxRetries);

    if (result.error) {
      errors.push(result.error);
      // 실패한 스테이지의 결과는 버리고, 직전까지의 안전한 배열 상태를 유지한다.
      currentInput = toArray(currentInput);
      continue;
    }

    currentInput = result.value;
  }

  return {
    packets: toArray(currentInput),
    errors,
    warnings: [],
  };
}

export type PipelineExitReason = "EMPTY_PACKETS" | "STAGE_ERRORS";

export interface PipelineExitDecision {
  exitCode: number;
  reason?: PipelineExitReason;
}

/**
 * 파이프라인 결과를 CLI 종료코드로 변환한다.
 * 패킷이 하나도 없으면(EMPTY_PACKETS) 스테이지 에러가 없어도 실패로 취급한다 —
 * "완주는 했지만 산출물이 없다"는 성공이 아니기 때문이다.
 */
export function decidePipelineExit(result: PipelineResult): PipelineExitDecision {
  if (toArray(result.packets).length === 0) {
    return { exitCode: 1, reason: "EMPTY_PACKETS" };
  }
  if (toArray(result.errors).length > 0) {
    return { exitCode: 1, reason: "STAGE_ERRORS" };
  }
  return { exitCode: 0 };
}

/**
 * 야간배치 CLI 진입점. runBatchJob으로 파이프라인을 실행한 뒤 종료코드를
 * 판정해 반환한다. process.exit은 호출부(실제 CLI 스크립트)의 책임으로 남겨
 * 이 함수를 테스트/재사용 가능한 순수 흐름으로 유지한다 — 프로세스 크래시 없이
 * "정상적인 실패 종료"만 신호한다.
 */
export async function runPipelineCli(
  stages: PipelineStage[],
  initialInput: unknown,
  options: PipelineOptions = {}
): Promise<{ result: PipelineResult; exitCode: number; reason?: PipelineExitReason }> {
  const result = await runBatchJob(stages, initialInput, options);
  const decision = decidePipelineExit(result);

  if (decision.reason) {
    console.error(`[pipeline] failed with reason: ${decision.reason}`);
  }

  return { result, exitCode: decision.exitCode, reason: decision.reason };
}

/**
 * 야간배치 진입점. runPipeline 자체가 스테이지 단위로 이미 방어되어 있지만,
 * stages 구성 오류 등 예기치 못한 예외까지 최종적으로 흡수해 프로세스가
 * 비정상 종료되지 않도록 한다.
 */
export async function runBatchJob(
  stages: PipelineStage[],
  initialInput: unknown,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  try {
    let result = runPipeline(stages, initialInput, options);

    if (options.qualityGate) {
      const gate = runQualityGate(options.qualityGate);
      result = attachQualityGateWarning(result, gate);
      if (gate.status === "tool_crash") {
        console.warn(`[qualityGate] typecheck tool crashed (non-blocking):`, gate.rawOutput);
      }
    }

    const reportedErrors = toArray<PipelineError>(result.errors);
    if (reportedErrors.length > 0) {
      console.warn(
        `Batch job completed with ${reportedErrors.length} error(s):`,
        reportedErrors
      );
    }
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(`Batch job failed: ${message}`, stack ? new Error(stack) : err);
    return {
      packets: [],
      errors: [{ stage: "runBatchJob", reason: `Batch job failed: ${message}` }],
      warnings: [],
    };
  }
}
