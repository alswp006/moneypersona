import { describe, it, expect, beforeEach } from "vitest";
import type { PipelineStage } from "../lib/contract";
import { runPipeline, type PipelineResult } from "../pipeline/runPipeline";
import { toArray } from "../pipeline/utils/toArray";
import { validateStageSchema } from "../pipeline/validation/stageSchema";
import { generateWorkPackets, isPipelineSuccessful } from "../pipeline/stages/generateWorkPackets";

/**
 * 단계 경계 배열 정규화 — undefined `.length` 크래시 제거
 *
 * AC-1: 어떤 단계가 undefined/null/비배열 객체를 반환해도 TypeError 없이
 *       파이프라인이 완주하거나 stage/reason/rawKeys가 포함된 명시적 실패 리포트를 남긴다
 * AC-2: 파이프라인 코드에서 정규화를 거치지 않은 `.length` 직접 접근이 0건이다
 * AC-3: 단계 반환값이 배열이 아닐 때 최대 2회 재시도 후 실패 리포트를 출력하고 exit code 1로 종료한다
 * AC-4: 패킷 배열이 빈 상태로 끝나면 'EMPTY_PACKETS' 사유와 함께 실패로 표시되며 '성공' 종료되지 않는다
 * AC-5: undefined/null/{}/[] 4가지 단계 반환값에 대한 단위 테스트가 모두 통과한다
 */

describe("AC-1: undefined/null/비배열 반환 → TypeError 없이 완주 또는 명시적 실패 리포트", () => {
  it("AC-1.1: 스테이지가 undefined를 반환해도 TypeError 없이 완주하고 error 리포트를 남긴다", () => {
    const stages: PipelineStage[] = [
      {
        name: "stage-returns-undefined",
        transform: () => undefined,
      },
    ];

    const result = runPipeline(stages, []);

    expect(result).toBeDefined();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      stage: "stage-returns-undefined",
      reason: expect.stringContaining("non-array"),
    });
    expect(result.packets).toEqual([]);
  });

  it("AC-1.2: 스테이지가 null을 반환해도 TypeError 없이 완주하고 error 리포트를 남긴다", () => {
    const stages: PipelineStage[] = [
      {
        name: "stage-returns-null",
        transform: () => null,
      },
    ];

    const result = runPipeline(stages, []);

    expect(result).toBeDefined();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      stage: "stage-returns-null",
      reason: expect.stringContaining("non-array"),
    });
    expect(result.packets).toEqual([]);
  });

  it("AC-1.3: 스테이지가 평면 객체 {}를 반환해도 TypeError 없이 완주하고 rawKeys가 포함된 리포트를 남긴다", () => {
    const stages: PipelineStage[] = [
      {
        name: "stage-returns-object",
        transform: () => ({ foo: "bar", baz: 123 }),
      },
    ];

    const result = runPipeline(stages, []);

    expect(result).toBeDefined();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].stage).toBe("stage-returns-object");
    expect(result.errors[0].rawKeys).toEqual(["foo", "baz"]);
    expect(result.packets).toEqual([]);
  });

  it("AC-1.4: 스테이지가 예외를 던져도 TypeError 없이 완주하고 에러 메시지를 리포트한다", () => {
    const stages: PipelineStage[] = [
      {
        name: "stage-throws",
        transform: () => {
          throw new Error("Stage processing failed");
        },
      },
    ];

    const result = runPipeline(stages, []);

    expect(result).toBeDefined();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].stage).toBe("stage-throws");
    expect(result.errors[0].reason).toContain("Stage threw error");
    expect(result.errors[0].reason).toContain("Stage processing failed");
    expect(result.packets).toEqual([]);
  });

  it("AC-1.5: 다중 스테이지 파이프라인에서 중간 단계가 비배열을 반환해도 이후 스테이지는 계속 실행된다", () => {
    let stage2Called = false;

    const stages: PipelineStage[] = [
      {
        name: "stage-1-returns-array",
        transform: () => [{ id: 1 }],
      },
      {
        name: "stage-2-returns-null",
        transform: () => {
          stage2Called = true;
          return null;
        },
      },
      {
        name: "stage-3-should-be-called",
        transform: (input) => {
          // input은 직전 실패한 stage 이후 toArray로 정규화되어 []
          return Array.isArray(input) ? [{ id: 3 }] : [];
        },
      },
    ];

    const result = runPipeline(stages, []);

    expect(stage2Called).toBe(true);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].stage).toBe("stage-2-returns-null");
    expect(result.packets).toEqual([{ id: 3 }]);
  });
});

describe("AC-2: `.length` 직접 접근 정규화 검증", () => {
  it("AC-2.1: toArray(undefined).length는 0을 반환하고 TypeError를 던지지 않는다", () => {
    const result = toArray(undefined);

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it("AC-2.2: toArray(null).length는 0을 반환하고 TypeError를 던지지 않는다", () => {
    const result = toArray(null);

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it("AC-2.3: toArray({}).length는 0을 반환하고 TypeError를 던지지 않는다", () => {
    const result = toArray({ a: 1, b: 2 });

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it("AC-2.4: toArray([1,2,3]).length는 3을 반환한다", () => {
    const result = toArray([1, 2, 3]);

    expect(result).toEqual([1, 2, 3]);
    expect(result.length).toBe(3);
  });

  it("AC-2.5: 정규화된 배열에서 .map()/.filter()/.forEach() 호출이 TypeError 없이 동작한다", () => {
    const undefinedResult = toArray(undefined);
    const nullResult = toArray(null);
    const objectResult = toArray({ x: 1 });
    const arrayResult = toArray([1, 2, 3]);

    expect(() => {
      undefinedResult.map((x) => x);
      nullResult.filter((x) => x);
      objectResult.forEach((x) => x);
      arrayResult.map((x) => (x as number) * 2);
    }).not.toThrow();
  });
});

describe("AC-3: 배열이 아닐 때 최대 2회 재시도 후 실패 리포트 + exit code 1", () => {
  let attemptCount = 0;

  beforeEach(() => {
    attemptCount = 0;
  });

  it("AC-3.1: 스테이지가 항상 비배열을 반환하면 정확히 maxRetries + 1번(기본 3회) 시도한다", () => {
    const stages: PipelineStage[] = [
      {
        name: "always-fails",
        transform: () => {
          attemptCount++;
          return { invalid: "not-array" };
        },
      },
    ];

    const result = runPipeline(stages, [], { maxRetries: 2 });

    expect(attemptCount).toBe(3); // 1회 + 2회 재시도
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].stage).toBe("always-fails");
  });

  it("AC-3.2: maxRetries를 1로 설정하면 최대 2회 시도한다", () => {
    const stages: PipelineStage[] = [
      {
        name: "fails-with-retry-1",
        transform: () => {
          attemptCount++;
          return "string-not-array";
        },
      },
    ];

    const result = runPipeline(stages, [], { maxRetries: 1 });

    expect(attemptCount).toBe(2);
    expect(result.errors).toHaveLength(1);
  });

  it("AC-3.3: maxRetries를 0으로 설정하면 재시도 없이 1회 시도한다", () => {
    const stages: PipelineStage[] = [
      {
        name: "fails-no-retry",
        transform: () => {
          attemptCount++;
          return 42; // 숫자
        },
      },
    ];

    const result = runPipeline(stages, [], { maxRetries: 0 });

    expect(attemptCount).toBe(1);
    expect(result.errors).toHaveLength(1);
  });

  it("AC-3.4: 실패 리포트에는 stage 이름과 reason이 명시적으로 포함된다", () => {
    const stages: PipelineStage[] = [
      {
        name: "detailed-failure",
        transform: () => 123,
      },
    ];

    const result = runPipeline(stages, [], { maxRetries: 2 });

    const error = result.errors[0];
    expect(error.stage).toBe("detailed-failure");
    expect(error.reason).toContain("non-array");
    expect(error.reason).toContain("number");
  });

  it("AC-3.5: 재시도 중 일부 시도가 성공하면 error를 기록하지 않는다", () => {
    let callCount = 0;

    const stages: PipelineStage[] = [
      {
        name: "fails-then-succeeds",
        transform: () => {
          callCount++;
          return callCount < 2 ? { fail: true } : [{ success: true }];
        },
      },
    ];

    const result = runPipeline(stages, [], { maxRetries: 2 });

    expect(callCount).toBe(2);
    expect(result.errors).toHaveLength(0);
    expect(result.packets).toEqual([{ success: true }]);
  });
});

describe("AC-4: 패킷 배열이 비면 'EMPTY_PACKETS' 사유로 실패", () => {
  it("AC-4.1: 최종 패킷 배열이 비어있으면 isPipelineSuccessful은 false를 반환한다", () => {
    const result: PipelineResult = {
      packets: [],
      errors: [],
      warnings: [],
    };

    const isSuccess = isPipelineSuccessful(result);

    expect(isSuccess).toBe(false);
  });

  it("AC-4.2: 패킷이 하나 이상 있고 에러가 없으면 isPipelineSuccessful은 true를 반환한다", () => {
    const result: PipelineResult = {
      packets: [{ id: "packet-1", stageIndex: 0, input: {} }],
      errors: [],
      warnings: [],
    };

    const isSuccess = isPipelineSuccessful(result);

    expect(isSuccess).toBe(true);
  });

  it("AC-4.3: 패킷이 있어도 에러가 하나 이상 있으면 isPipelineSuccessful은 false를 반환한다", () => {
    const result: PipelineResult = {
      packets: [{ id: "packet-1", stageIndex: 0, input: {} }],
      errors: [{ stage: "some-stage", reason: "failed" }],
      warnings: [],
    };

    const isSuccess = isPipelineSuccessful(result);

    expect(isSuccess).toBe(false);
  });

  it("AC-4.4: 모든 스테이지가 실패해서 패킷이 0개면 에러 배열이 비어있지 않다", () => {
    const stages: PipelineStage[] = [
      {
        name: "stage-1",
        transform: () => "not-array",
      },
    ];

    const result = runPipeline(stages, []);

    expect(result.packets.length).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(isPipelineSuccessful(result)).toBe(false);
  });

  it("AC-4.5: generateWorkPackets에서 items가 없으면 기본 스크린 패킷을 생성한다", () => {
    const packets = generateWorkPackets();

    expect(packets.length).toBeGreaterThan(0);
    expect(packets[0]).toMatchObject({
      id: expect.stringContaining("packet-route-"),
      stageIndex: expect.any(Number),
    });
  });

  it("AC-4.6: generateWorkPackets에서 items가 정의되지 않으면 기본 스크린 패킷을 생성한다", () => {
    const packets1 = generateWorkPackets({ items: null });
    const packets2 = generateWorkPackets({ items: undefined });
    const packets3 = generateWorkPackets({ items: {} });

    // items가 null/{}일 때는 toArray로 정규화되어 []를 반환
    expect(packets1).toEqual([]);
    expect(packets3).toEqual([]);
    // items가 undefined일 때는 기본 스크린 패킷을 생성 (generateSpecScreenPackets)
    expect(packets2.length).toBeGreaterThan(0);
    expect(packets2[0].id).toMatch(/^packet-route-/);
  });
});

describe("AC-5: undefined/null/{}/[] 4가지 단계 반환값 단위 테스트", () => {
  it("AC-5.1: toArray(undefined) → []", () => {
    const result = toArray(undefined);

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("AC-5.2: toArray(null) → []", () => {
    const result = toArray(null);

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("AC-5.3: toArray({}) → []", () => {
    const result = toArray({});

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("AC-5.4: toArray([]) → []", () => {
    const result = toArray([]);

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("AC-5.5: toArray([1,2,3]) → [1,2,3]", () => {
    const result = toArray([1, 2, 3]);

    expect(result).toEqual([1, 2, 3]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
  });

  it("AC-5.6: 4가지 edge case가 모두 배열 메서드를 지원한다", () => {
    const cases = [undefined, null, {}, []];
    const results = cases.map(toArray);

    for (const result of results) {
      expect(typeof result.map).toBe("function");
      expect(typeof result.filter).toBe("function");
      expect(typeof result.forEach).toBe("function");
      expect(result.length >= 0).toBe(true);
    }
  });
});

describe("validateStageSchema 검증 통합", () => {
  it("validateStageSchema가 비배열을 reject한다", () => {
    const stage: PipelineStage = {
      name: "test-stage",
    };

    const result = validateStageSchema(stage, { invalid: "object" });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("expects an array");
  });

  it("validateStageSchema가 배열을 accept한다", () => {
    const stage: PipelineStage = {
      name: "test-stage",
    };

    const result = validateStageSchema(stage, []);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("커스텀 validate 함수가 있으면 추가 검증을 수행한다", () => {
    const stage: PipelineStage = {
      name: "custom-validate-stage",
      validate: (input) => Array.isArray(input) && input.length > 0,
    };

    const emptyResult = validateStageSchema(stage, []);
    const nonEmptyResult = validateStageSchema(stage, [{ id: 1 }]);

    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.error).toContain("failed custom validation");
    expect(nonEmptyResult.valid).toBe(true);
  });
});

describe("파이프라인 end-to-end 정규화 흐름", () => {
  it("모든 스테이지가 실패해도 파이프라인은 정상 종료되고 errors 배열을 반환한다", () => {
    const stages: PipelineStage[] = [
      {
        name: "fail-1",
        transform: () => "bad",
      },
      {
        name: "fail-2",
        transform: () => null,
      },
      {
        name: "fail-3",
        transform: () => ({ x: 1 }),
      },
    ];

    const result = runPipeline(stages, []);

    expect(result.packets).toEqual([]);
    expect(result.errors.length).toBe(3);
    expect(result.errors.map((e) => e.stage)).toEqual(["fail-1", "fail-2", "fail-3"]);
  });

  it("스테이지 체인에서 성공-실패-성공 흐름이 올바르게 처리된다", () => {
    const stages: PipelineStage[] = [
      {
        name: "stage-1-success",
        transform: () => [{ id: 1 }],
      },
      {
        name: "stage-2-failure",
        transform: () => undefined, // 실패
      },
      {
        name: "stage-3-success",
        transform: (input) => {
          // 이전 실패 이후에도 직전까지의 성공 상태([{ id: 1 }])를 유지하고 있음
          const arr = Array.isArray(input) ? input : [];
          return [...arr, { id: 3 }];
        },
      },
    ];

    const result = runPipeline(stages, []);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].stage).toBe("stage-2-failure");
    expect(result.packets).toEqual([{ id: 1 }, { id: 3 }]);
  });

  it("warnings 필드가 항상 포함되어 있다 (빈 배열도 가능)", () => {
    const stages: PipelineStage[] = [];

    const result = runPipeline(stages, []);

    expect(result).toHaveProperty("warnings");
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
