import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { PipelineStage } from "../lib/contract";
import {
  decidePipelineExit,
  runPipelineCli,
  type PipelineResult,
} from "../pipeline/runPipeline";

/**
 * 단계 경계 배열 정규화 — 종료코드 계약 검증
 *
 * packet-heal-2-02가 runPipeline/toArray 레벨을 덮는 반면, 이 파일은
 * AC-3/AC-4가 요구하는 "exit code 1로 종료" + "'EMPTY_PACKETS' 사유"
 * 계약 자체(decidePipelineExit / runPipelineCli)를 고정한다.
 *
 * AC-3: 단계 반환값이 배열이 아닐 때 최대 2회 재시도 후 실패 리포트를 출력하고 exit code 1로 종료한다
 * AC-4: 패킷 배열이 빈 상태로 끝나면 'EMPTY_PACKETS' 사유와 함께 실패로 표시되며 '성공' 종료되지 않는다
 * AC-5: undefined/null/{}/[] 4가지 단계 반환값에 대한 단위 테스트가 모두 통과한다
 */

/** 콘솔 로그를 삼키되 내용은 검증할 수 있게 캡처한다. */
function captureConsole() {
  const messages: string[] = [];
  const errorSpy = vi
    .spyOn(console, "error")
    .mockImplementation((msg: unknown) => void messages.push(String(msg)));
  const warnSpy = vi
    .spyOn(console, "warn")
    .mockImplementation((msg: unknown) => void messages.push(String(msg)));
  return {
    messages,
    restore: () => {
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    },
  };
}

describe("AC-4: decidePipelineExit — EMPTY_PACKETS 사유와 exit code", () => {
  it("패킷이 0개면 에러가 없어도 exit code 1 + 'EMPTY_PACKETS'로 판정한다", () => {
    const result: PipelineResult = { packets: [], errors: [], warnings: [] };

    expect(decidePipelineExit(result)).toEqual({
      exitCode: 1,
      reason: "EMPTY_PACKETS",
    });
  });

  it("패킷이 0개면 '성공'(exit code 0)으로 종료하지 않는다", () => {
    const decision = decidePipelineExit({ packets: [], errors: [], warnings: [] });

    expect(decision.exitCode).not.toBe(0);
    expect(decision.reason).toBe("EMPTY_PACKETS");
  });

  it("패킷이 있고 에러가 없으면 exit code 0 + 사유 없음으로 판정한다", () => {
    const decision = decidePipelineExit({
      packets: [{ id: "packet-1" }],
      errors: [],
      warnings: [],
    });

    expect(decision.exitCode).toBe(0);
    expect(decision.reason).toBeUndefined();
  });

  it("패킷이 있어도 스테이지 에러가 있으면 exit code 1 + 'STAGE_ERRORS'로 판정한다", () => {
    const decision = decidePipelineExit({
      packets: [{ id: "packet-1" }],
      errors: [{ stage: "broken", reason: "non-array" }],
      warnings: [],
    });

    expect(decision).toEqual({ exitCode: 1, reason: "STAGE_ERRORS" });
  });

  it("packets/errors가 배열이 아닌 손상된 결과에도 TypeError 없이 EMPTY_PACKETS로 판정한다", () => {
    const malformed = [undefined, null, {}, "not-an-array", 42];

    for (const packets of malformed) {
      const decision = decidePipelineExit({
        packets,
        errors: packets,
      } as unknown as PipelineResult);

      expect(decision).toEqual({ exitCode: 1, reason: "EMPTY_PACKETS" });
    }
  });
});

describe("AC-3: runPipelineCli — 재시도 소진 후 실패 리포트 + exit code 1", () => {
  let consoleCapture: ReturnType<typeof captureConsole>;

  beforeEach(() => {
    consoleCapture = captureConsole();
  });

  afterEach(() => {
    consoleCapture.restore();
  });

  it("비배열 반환이 반복되면 maxRetries+1번 시도 후 exit code 1로 종료한다", async () => {
    let attempts = 0;
    const stages: PipelineStage[] = [
      {
        name: "always-non-array",
        transform: () => {
          attempts++;
          return { notAnArray: true };
        },
      },
    ];

    const { exitCode, reason, result } = await runPipelineCli(stages, [], {
      maxRetries: 2,
    });

    expect(attempts).toBe(3); // 최초 1회 + 재시도 2회
    expect(exitCode).toBe(1);
    expect(reason).toBe("EMPTY_PACKETS");
    expect(result.errors).toHaveLength(1);
  });

  it("실패 리포트에 stage/reason/rawKeys가 모두 담긴다", async () => {
    const stages: PipelineStage[] = [
      {
        name: "returns-object",
        transform: () => ({ alpha: 1, beta: 2 }),
      },
    ];

    const { result } = await runPipelineCli(stages, [], { maxRetries: 2 });

    expect(result.errors[0]).toMatchObject({
      stage: "returns-object",
      reason: expect.stringContaining("non-array"),
      rawKeys: ["alpha", "beta"],
    });
  });

  it("실패 사유를 콘솔에 출력한다", async () => {
    const stages: PipelineStage[] = [
      { name: "returns-null", transform: () => null },
    ];

    await runPipelineCli(stages, [], { maxRetries: 2 });

    const combined = consoleCapture.messages.join("\n");
    expect(combined).toContain("returns-null");
    expect(combined).toContain("EMPTY_PACKETS");
  });

  it("프로세스 크래시 없이 정상 실패 종료한다 (예외를 던지지 않는다)", async () => {
    const stages: PipelineStage[] = [
      {
        name: "throws-every-time",
        transform: () => {
          throw new Error("stage exploded");
        },
      },
    ];

    await expect(runPipelineCli(stages, [], { maxRetries: 2 })).resolves.toMatchObject({
      exitCode: 1,
    });
  });

  it("정상 스테이지는 exit code 0으로 종료한다", async () => {
    const stages: PipelineStage[] = [
      { name: "ok", transform: () => [{ id: "packet-1" }] },
    ];

    const { exitCode, reason, result } = await runPipelineCli(stages, []);

    expect(exitCode).toBe(0);
    expect(reason).toBeUndefined();
    expect(result.packets).toHaveLength(1);
  });
});

describe("AC-5: undefined/null/{}/[] 4가지 단계 반환값 → 종료코드 계약", () => {
  let consoleCapture: ReturnType<typeof captureConsole>;

  beforeEach(() => {
    consoleCapture = captureConsole();
  });

  afterEach(() => {
    consoleCapture.restore();
  });

  const cases: Array<{ label: string; value: unknown; expectsError: boolean }> = [
    { label: "undefined", value: undefined, expectsError: true },
    { label: "null", value: null, expectsError: true },
    { label: "{}", value: {}, expectsError: true },
    // 빈 배열은 유효한 스키마다 — 에러는 없지만 산출물이 없으므로 성공도 아니다.
    { label: "[]", value: [], expectsError: false },
  ];

  for (const { label, value, expectsError } of cases) {
    it(`스테이지가 ${label}를 반환해도 TypeError 없이 exit code 1 + EMPTY_PACKETS로 끝난다`, async () => {
      const stages: PipelineStage[] = [
        { name: `stage-returns-${label}`, transform: () => value },
      ];

      const { exitCode, reason, result } = await runPipelineCli(stages, [], {
        maxRetries: 2,
      });

      expect(exitCode).toBe(1);
      expect(reason).toBe("EMPTY_PACKETS");
      expect(Array.isArray(result.packets)).toBe(true);
      expect(result.packets).toHaveLength(0);
      expect(result.errors.length > 0).toBe(expectsError);
    });
  }

  it("4가지 반환값 모두 rawKeys를 배열로 남긴다 (비배열 반환에 한해)", async () => {
    for (const value of [undefined, null, {}]) {
      const stages: PipelineStage[] = [
        { name: "raw-keys-check", transform: () => value },
      ];

      const { result } = await runPipelineCli(stages, [], { maxRetries: 2 });

      expect(Array.isArray(result.errors[0].rawKeys)).toBe(true);
    }
  });
});
