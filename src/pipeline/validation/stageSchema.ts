import type { PipelineStage } from "../../lib/contract";

export interface StageSchemaResult {
  valid: boolean;
  error?: string;
}

/**
 * 스테이지 결과를 검증한다.
 * - 배열이 아니면 무조건 invalid (크래시 방어의 1차 관문)
 * - stage.validate가 있으면 추가로 호출해 커스텀 규칙도 통과해야 valid
 */
export function validateStageSchema(
  stage: PipelineStage,
  input: unknown
): StageSchemaResult {
  if (!Array.isArray(input)) {
    return {
      valid: false,
      error: `Stage "${stage.name}" expects an array but received ${typeof input}`,
    };
  }

  if (stage.validate) {
    let passed = false;
    try {
      passed = stage.validate(input);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        valid: false,
        error: `Stage "${stage.name}" validate() threw: ${message}`,
      };
    }

    if (!passed) {
      return {
        valid: false,
        error: `Stage "${stage.name}" failed custom validation`,
      };
    }
  }

  return { valid: true };
}
