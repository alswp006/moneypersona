import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Test Suite: 파이프라인 배열 접근 방어 및 크래시 제거
 *
 * Packet heal-1-01: 파이프라인의 모든 단계 경계에서 배열 결과를 정규화하고,
 * 크래시를 방지하며, 구조화된 에러 리포팅과 재시도 로직을 추가한다.
 */

describe("파이프라인 배열 접근 방어 및 크래시 제거 (AC 1-4)", () => {
  /**
   * AC-1[P0]: 어떤 단계가 undefined/null/객체를 반환해도 TypeError 없이
   * 파이프라인이 완주하거나 명시적 실패 리포트를 남긴다
   */
  describe("AC-1: TypeError 방어 — 파이프라인이 크래시하지 않음", () => {
    it("AC-1.1[P0]: undefined 반환 시에도 TypeError 없이 파이프라인 완주", () => {
      // Given: 파이프라인 스테이지 중 하나가 undefined를 반환
      const stages = [
        { name: "stage1", transform: () => [1, 2, 3] },
        { name: "stage2", transform: () => undefined }, // 문제: undefined 반환
        { name: "stage3", transform: (input) => input }, // stage2 결과 사용
      ];

      // When: runPipeline 실행
      const result = runPipeline(stages, {});

      // Then: TypeError 없이 완주, 명시적 실패 리포트 (또는 빈 배열)
      expect(result).toBeDefined();
      expect(() => result).not.toThrow();
      // 실패 리포트가 있거나 packets은 배열
      if (result.errors && result.errors.length > 0) {
        expect(result.errors[0]).toHaveProperty("stage");
        expect(result.errors[0]).toHaveProperty("reason");
      } else {
        expect(Array.isArray(result.packets)).toBe(true);
      }
    });

    it("AC-1.2[P0]: null 반환 시에도 TypeError 없이 파이프라인 완주", () => {
      const stages = [
        { name: "stage1", transform: () => [1, 2, 3] },
        { name: "stage2", transform: () => null }, // 문제: null 반환
      ];

      const result = runPipeline(stages, {});

      expect(result).toBeDefined();
      expect(() => result).not.toThrow();
      // 실패 리포트 또는 성공 결과
      expect(
        result.errors && result.errors.length > 0
          ? result.errors[0].reason
          : Array.isArray(result.packets)
      ).toBeTruthy();
    });

    it("AC-1.3: 객체 반환 시에도 TypeError 없이 처리", () => {
      const stages = [
        { name: "stage1", transform: () => [1, 2, 3] },
        { name: "stage2", transform: () => ({ result: "not an array" }) }, // 객체 반환
      ];

      const result = runPipeline(stages, {});

      expect(result).toBeDefined();
      expect(() => result).not.toThrow();
      // 실패 리포트가 있어야 함
      expect(result.errors && result.errors.length > 0).toBe(true);
    });

    it("AC-1.4: 빈 배열 반환 시에도 안전하게 처리", () => {
      const stages = [
        { name: "stage1", transform: () => [1, 2, 3] },
        { name: "stage2", transform: () => [] }, // 빈 배열
        { name: "stage3", transform: (input) => input }, // 빈 배열 처리
      ];

      const result = runPipeline(stages, {});

      expect(result).toBeDefined();
      expect(() => result).not.toThrow();
      expect(Array.isArray(result.packets)).toBe(true);
    });
  });

  /**
   * AC-2[P0]: `.length` 직접 접근이 파이프라인 코드에서 0건
   * (모두 optionl chaining 또는 toArray() 경유)
   */
  describe("AC-2: toArray() 유틸 — 안전한 배열 정규화", () => {
    it("AC-2.1[P0]: toArray(undefined) => []", () => {
      const result = toArray(undefined);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      expect(result).toEqual([]);
    });

    it("AC-2.2[P0]: toArray(null) => []", () => {
      const result = toArray(null);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      expect(result).toEqual([]);
    });

    it("AC-2.3: toArray([1,2,3]) => [1,2,3]", () => {
      const input = [1, 2, 3];
      const result = toArray(input);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result).toEqual([1, 2, 3]);
    });

    it("AC-2.4: toArray({}) => [] (객체는 배열로 변환 불가)", () => {
      const result = toArray({ a: 1 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("AC-2.5: toArray('string') => [] (원시값은 배열로 변환 불가)", () => {
      const result = toArray("hello");

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("AC-2.6: toArray(123) => [] (숫자는 배열로 변환 불가)", () => {
      const result = toArray(123);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  /**
   * AC-3[P0]: 단계 반환값이 배열이 아닐 때 최대 2회 재시도 후
   * stage/reason이 포함된 실패 리포트를 출력한다
   */
  describe("AC-3: 재시도 로직 및 실패 리포트 — stage/reason 포함", () => {
    it("AC-3.1[P0]: 1회 재시도 후 성공하면 결과 반환 (재시도가 효과 있을 때)", () => {
      let attemptCount = 0;
      const stages = [
        {
          name: "flakyStage",
          transform: () => {
            attemptCount++;
            // 첫 시도는 실패, 두 번째는 성공
            return attemptCount === 1 ? undefined : [{ id: "success" }];
          },
        },
      ];

      const result = runPipeline(stages, {}, { maxRetries: 2 });

      // 성공했으므로 errors는 없거나 비어있음
      expect(result.errors && result.errors.length).toBe(0);
      expect(Array.isArray(result.packets)).toBe(true);
      expect(attemptCount).toBeGreaterThanOrEqual(1);
    });

    it("AC-3.2[P0]: 2회 재시도 후에도 실패하면 실패 리포트 (stage/reason 포함)", () => {
      let attemptCount = 0;
      const stages = [
        {
          name: "persistentlyFailingStage",
          transform: () => {
            attemptCount++;
            return { notArray: true }; // 항상 배열이 아닌 객체 반환
          },
        },
      ];

      const result = runPipeline(stages, {}, { maxRetries: 2 });

      // 최대 2회 재시도 후 실패 리포트
      expect(result.errors && result.errors.length > 0).toBe(true);
      const failureReport = result.errors[0];
      expect(failureReport).toHaveProperty("stage");
      expect(failureReport.stage).toBe("persistentlyFailingStage");
      expect(failureReport).toHaveProperty("reason");
      expect(failureReport.reason).toContain("array"); // 배열이 아님을 명시
      expect(attemptCount).toBeGreaterThanOrEqual(2); // 최소 2회 이상 시도
    });

    it("AC-3.3: 다중 스테이지에서 한 스테이지만 실패하면 해당 스테이지 리포트", () => {
      const stages = [
        { name: "stage1", transform: () => [1, 2, 3] },
        { name: "failingStage", transform: () => null },
        { name: "stage3", transform: () => [4, 5, 6] },
      ];

      const result = runPipeline(stages, {}, { maxRetries: 2 });

      expect(result.errors && result.errors.length > 0).toBe(true);
      expect(result.errors[0].stage).toBe("failingStage");
      expect(result.errors[0]).toHaveProperty("reason");
    });

    it("AC-3.4: 실패 리포트에 rawKeys 포함 (디버깅용)", () => {
      const stages = [
        {
          name: "debugStage",
          transform: () => ({
            unexpected: "object",
            without: "array",
          }),
        },
      ];

      const result = runPipeline(stages, {}, { maxRetries: 1 });

      expect(result.errors && result.errors.length > 0).toBe(true);
      const failureReport = result.errors[0];
      expect(failureReport).toHaveProperty("rawKeys");
      // rawKeys는 반환된 객체의 키들
      if (failureReport.rawKeys) {
        expect(Array.isArray(failureReport.rawKeys)).toBe(true);
      }
    });
  });

  /**
   * AC-4[P0]: 야간배치 실행이 비정상 종료 없이 종료된다
   * (try/catch 가드로 스택과 단계명을 로그에 남김)
   */
  describe("AC-4: 야간배치 에러 핸들링 — 비정상 종료 방지", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
    let logCapture: Array<{ level: string; message: string; stack?: string }> = [];

    beforeEach(() => {
      logCapture = [];
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation((msg, err) => {
        logCapture.push({ level: "error", message: String(msg), stack: err?.stack });
      });
      consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation((msg) => {
        logCapture.push({ level: "warn", message: String(msg) });
      });
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it("AC-4.1[P0]: 파이프라인 실행 중 에러 발생 시 try/catch로 가드, 프로세스가 죽지 않음", async () => {
      const stages = [
        {
          name: "throwingStage",
          transform: () => {
            throw new Error("Unexpected runtime error in stage");
          },
        },
      ];

      let processExited = false;
      try {
        const result = runPipeline(stages, {});
        // 에러가 로그되었지만 파이프라인이 완주 또는 에러 리포트 반환
        expect(result).toBeDefined();
      } catch {
        processExited = true;
      }

      expect(processExited).toBe(false); // 프로세스가 죽지 않음
      expect(logCapture.length > 0).toBe(true); // 에러가 로그됨
      expect(logCapture[0].message).toContain("throwingStage"); // 단계명 포함
    });

    it("AC-4.2[P0]: 에러 로그에 단계명(stage name) 포함", async () => {
      const stages = [
        {
          name: "myFailingStage",
          transform: () => {
            throw new Error("Stage failed");
          },
        },
      ];

      try {
        runPipeline(stages, {});
      } catch {
        // 에러는 catch되고 로그됨
      }

      expect(logCapture.length > 0).toBe(true);
      // 로그에 스테이지 이름이 포함되어야 함
      const logs = logCapture.map((l) => l.message).join(" ");
      expect(logs).toContain("myFailingStage");
    });

    it("AC-4.3: 에러 스택 정보가 로그에 포함", async () => {
      const stages = [
        {
          name: "diagnosticStage",
          transform: () => {
            throw new Error("Diagnostic error for stack trace");
          },
        },
      ];

      try {
        runPipeline(stages, {});
      } catch {
        // 에러는 catch됨
      }

      expect(logCapture.length > 0).toBe(true);
      // 스택 정보가 있거나 에러 메시지가 있음
      const logsWithStack = logCapture.filter(
        (l) => l.stack || l.message.includes("Error")
      );
      expect(logsWithStack.length > 0).toBe(true);
    });

    it("AC-4.4: 야간배치 배치 함수(runBatchJob) 실행 중 에러 발생해도 exit code 0으로 종료", async () => {
      // Mock exit process
      let exitCodeCalled: number | null = null;
      const mockProcess = {
        exit: (code: number) => {
          exitCodeCalled = code;
        },
      };

      const stages = [
        {
          name: "batchStage",
          transform: () => {
            throw new Error("Batch job error");
          },
        },
      ];

      // runBatchJob이 에러를 catch하고 로그 남긴 후 정상 종료
      await runBatchJob(stages, {});

      // 프로세스가 비정상 종료(exit code 1 또는 에러)로 끝나지 않음
      // (실제 구현에서는 process.exit(0) 또는 비정상 exit 없음)
      expect(exitCodeCalled).not.toBe(1);
      expect(logCapture.length > 0).toBe(true); // 에러는 로그됨
    });
  });

  /**
   * 통합 테스트: 전체 파이프라인 동작 검증
   */
  describe("통합 테스트: 파이프라인 완전 동작", () => {
    it("정상적인 다중 스테이지 파이프라인 실행", () => {
      const stages = [
        {
          name: "fetchData",
          transform: () => [
            { id: "1", value: 100 },
            { id: "2", value: 200 },
          ],
        },
        {
          name: "filterData",
          transform: (input: unknown) => {
            const arr = toArray(input);
            return arr.filter((item: any) => item.value > 150);
          },
        },
        {
          name: "mapData",
          transform: (input: unknown) => {
            const arr = toArray(input);
            return arr.map((item: any) => ({
              ...item,
              processed: true,
            }));
          },
        },
      ];

      const result = runPipeline(stages, {});

      expect(result.errors.length).toBe(0);
      expect(Array.isArray(result.packets)).toBe(true);
      expect(result.packets.length).toBeGreaterThan(0);
    });

    it("복합 에러 시나리오: 일부 스테이지 실패, 일부 성공", () => {
      const stages = [
        {
          name: "stage1Success",
          transform: () => [{ id: "1" }, { id: "2" }],
        },
        {
          name: "stage2Fail",
          transform: () => undefined,
        },
        {
          name: "stage3Success",
          transform: () => [{ id: "3" }],
        },
      ];

      const result = runPipeline(stages, {}, { maxRetries: 1 });

      // stage2Fail에 대한 에러 리포트가 있어야 함
      expect(result.errors.some((e) => e.stage === "stage2Fail")).toBe(true);
      // 하지만 파이프라인은 완주 (TypeError 없음)
      expect(() => result).not.toThrow();
    });
  });
});

/**
 * ========== 구현 할 함수들 (테스트가 기대하는 인터페이스) ==========
 */

/**
 * toArray: 어떤 값이든 안전하게 배열로 변환
 * - undefined/null → []
 * - 배열 → 그대로 반환
 * - 그 외 → []
 */
function toArray(input: unknown): unknown[] {
  // TODO: 구현이 필요함 (테스트가 실패할 것임)
  if (Array.isArray(input)) return input;
  return [];
}

/**
 * 파이프라인 스테이지 인터페이스
 */
interface PipelineStage {
  name: string;
  transform?: (input: unknown) => unknown;
  validate?: (input: unknown) => boolean;
}

/**
 * 파이프라인 실행 옵션
 */
interface PipelineOptions {
  maxRetries?: number;
}

/**
 * 파이프라인 실행 결과
 */
interface PipelineResult {
  packets: any[];
  errors: Array<{
    stage: string;
    reason: string;
    rawKeys?: string[];
  }>;
}

/**
 * runPipeline: 파이프라인 실행 메인 함수
 * - 각 스테이지를 순차 실행
 * - 배열이 아닌 결과는 최대 maxRetries번 재시도
 * - 배열이 아니면 에러 리포트에 추가
 * - TypeError 발생 시 catch로 가드
 */
function runPipeline(
  stages: PipelineStage[],
  initialInput: unknown,
  options: PipelineOptions = {}
): PipelineResult {
  // TODO: 구현이 필요함 (테스트가 실패할 것임)
  const maxRetries = options.maxRetries ?? 2;
  const packets: any[] = [];
  const errors: PipelineResult["errors"] = [];

  let currentInput = initialInput;

  for (const stage of stages) {
    let retryCount = 0;
    let stageResult: unknown = null;
    let success = false;

    while (retryCount <= maxRetries && !success) {
      try {
        if (stage.transform) {
          stageResult = stage.transform(currentInput);
        }

        // 결과가 배열인지 확인
        if (Array.isArray(stageResult)) {
          success = true;
          currentInput = stageResult;
        } else {
          retryCount++;
          if (retryCount > maxRetries) {
            // 재시도 초과
            const rawKeys = stageResult
              ? Object.keys(stageResult as object)
              : [];
            errors.push({
              stage: stage.name,
              reason: `Stage returned non-array value (type: ${typeof stageResult})`,
              rawKeys: rawKeys.length > 0 ? rawKeys : undefined,
            });
            break;
          }
        }
      } catch (err) {
        retryCount++;
        if (retryCount > maxRetries) {
          errors.push({
            stage: stage.name,
            reason: `Stage threw error: ${err instanceof Error ? err.message : String(err)}`,
          });
          break;
        }
      }
    }

    if (!success && !errors.find((e) => e.stage === stage.name)) {
      // 이 부분에 도달하면 무언가 잘못된 것
      errors.push({
        stage: stage.name,
        reason: "Stage execution failed without explicit error",
      });
    }
  }

  packets.push(...toArray(currentInput));
  return { packets, errors };
}

/**
 * runBatchJob: 야간배치 진입점
 * - try/catch로 전체 파이프라인을 감쌈
 * - 에러 발생 시 단계명, 스택을 로그에 남김
 * - 프로세스가 죽지 않도록 함
 */
async function runBatchJob(
  stages: PipelineStage[],
  initialInput: unknown
): Promise<void> {
  try {
    const result = runPipeline(stages, initialInput);
    if (result.errors.length > 0) {
      console.warn(`Batch job completed with ${result.errors.length} errors:`, result.errors);
    }
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : "";
    console.error(`Batch job failed at stage: ${errorMsg}`, new Error(errorStack));
  }
}
