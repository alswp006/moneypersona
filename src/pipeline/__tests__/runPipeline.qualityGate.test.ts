import { describe, it, expect, vi } from "vitest";
import type { PipelineStage } from "../../lib/contract";
import { attachQualityGateWarning, type PipelineResult } from "../runPipeline";
import type { QualityGateResult } from "../quality/qualityGate";

vi.mock("../quality/qualityGate", () => ({
  runQualityGate: vi.fn(),
}));

function emptyResult(): PipelineResult {
  return { packets: [{ id: "packet-1" }], errors: [], warnings: [] };
}

describe("attachQualityGateWarning", () => {
  it("pass 상태는 결과를 그대로 반환한다 (warnings 추가 없음)", () => {
    const gate: QualityGateResult = {
      status: "pass",
      errors: [],
      rawOutput: "",
      command: "npx tsc --noEmit -p tsconfig.json",
    };

    const result = attachQualityGateWarning(emptyResult(), gate);

    expect(result.warnings).toEqual([]);
    expect(result.packets.length).toBe(1);
  });

  it("tool_crash 상태는 packets/errors를 건드리지 않고 warnings에만 기록한다", () => {
    const gate: QualityGateResult = {
      status: "tool_crash",
      errors: [],
      rawOutput: "TOOL_CRASH\nCommand: npx tsc --noEmit -p tsconfig.json\n...",
      command: "npx tsc --noEmit -p tsconfig.json",
    };

    const before = emptyResult();
    const result = attachQualityGateWarning(before, gate);

    expect(result.packets).toEqual(before.packets);
    expect(result.errors).toEqual([]);
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0].stage).toBe("qualityGate:typecheck");
    expect(result.warnings[0].rawOutput).toContain("TOOL_CRASH");
  });

  it("fail 상태는 게이트 결함이 아니므로 warnings로 격하시키지 않는다", () => {
    const gate: QualityGateResult = {
      status: "fail",
      errors: [{ line: 1, column: 1, message: "boom" }],
      rawOutput: "src/x.ts(1,1): error TS1: boom",
      command: "npx tsc --noEmit -p tsconfig.json",
    };

    const result = attachQualityGateWarning(emptyResult(), gate);

    expect(result.warnings).toEqual([]);
  });
});

describe("runPipeline은 항상 warnings 필드를 포함한다", () => {
  it("빈 stages를 실행해도 warnings: []를 반환한다", async () => {
    const { runPipeline } = await import("../runPipeline");
    const stages: PipelineStage[] = [];

    const result = runPipeline(stages, []);

    expect(result.warnings).toEqual([]);
  });
});
