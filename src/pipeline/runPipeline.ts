import type { PipelineStage } from "../lib/contract";
import { toArray } from "./utils/toArray";
import { validateStageSchema } from "./validation/stageSchema";

export interface PipelineOptions {
  /** 스테이지 결과가 배열이 아닐 때 재시도할 최대 횟수 (기본 2회) */
  maxRetries?: number;
}

export interface PipelineError {
  stage: string;
  reason: string;
  rawKeys?: string[];
}

export interface PipelineResult {
  packets: unknown[];
  errors: PipelineError[];
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

  const rawKeys =
    lastRawResult && typeof lastRawResult === "object"
      ? Object.keys(lastRawResult as object)
      : undefined;

  return {
    error: {
      stage: stage.name,
      reason: `Stage "${stage.name}" returned a non-array value (type: ${typeof lastRawResult})`,
      rawKeys: rawKeys && rawKeys.length > 0 ? rawKeys : undefined,
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

  for (const stage of toArray(stages) as PipelineStage[]) {
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
  };
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
    const result = runPipeline(stages, initialInput, options);
    if (result.errors.length > 0) {
      console.warn(
        `Batch job completed with ${result.errors.length} error(s):`,
        result.errors
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
    };
  }
}
