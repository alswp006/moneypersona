import { describe, it, expect } from "vitest";
import { assessTypecheckResult, isPacketBlocking } from "../qualityGate";
import type { TypeCheckResult } from "../typecheck";

function tcResult(overrides: Partial<TypeCheckResult>): TypeCheckResult {
  return {
    exitCode: 0,
    stdout: "",
    stderr: "",
    command: "npx tsc --noEmit -p tsconfig.json",
    cwd: "/repo",
    tsconfigPath: "/repo/tsconfig.json",
    ...overrides,
  };
}

describe("assessTypecheckResult", () => {
  it("exitCode === 0이면 항상 pass를 반환한다 (에러 0건은 성공)", () => {
    const gate = assessTypecheckResult(tcResult({ exitCode: 0 }));

    expect(gate.status).toBe("pass");
    expect(gate.errors).toEqual([]);
    expect(isPacketBlocking(gate)).toBe(false);
  });

  it("exitCode === 0이고 stderr에 경고가 있어도 pass를 유지한다", () => {
    const gate = assessTypecheckResult(
      tcResult({ exitCode: 0, stderr: "src/index.ts:5:10 - warning TS6133: unused variable" })
    );

    expect(gate.status).toBe("pass");
  });

  it("exitCode !== 0이고 파싱된 에러가 없으면 tool_crash로 분류하고 원문을 보존한다", () => {
    const stderr = "Internal error: Cannot read properties of undefined\n    at tsc.js:123:45";
    const gate = assessTypecheckResult(
      tcResult({ exitCode: 1, stderr, command: "npx tsc --noEmit -p tsconfig.json", cwd: "/repo", tsconfigPath: "/repo/tsconfig.json" })
    );

    expect(gate.status).toBe("tool_crash");
    expect(gate.errors).toEqual([]);
    expect(gate.rawOutput).toContain("TOOL_CRASH");
    expect(gate.rawOutput).toContain("Command: npx tsc --noEmit -p tsconfig.json");
    expect(gate.rawOutput).toContain("Cwd: /repo");
    expect(gate.rawOutput).toContain("TsconfigPath: /repo/tsconfig.json");
    expect(gate.rawOutput).toContain(stderr);
    expect(isPacketBlocking(gate)).toBe(false);
  });

  it("tool_crash 리포트는 stderr 마지막 40줄 이상을 포함한다", () => {
    const stderr = Array.from({ length: 60 }, (_, i) => `Stack frame ${i}`).join("\n");
    const gate = assessTypecheckResult(tcResult({ exitCode: 1, stderr }));

    expect(gate.status).toBe("tool_crash");
    expect(gate.rawOutput).toContain("Stack frame 59");
    expect(gate.rawOutput).not.toContain("Stack frame 0\n");
  });

  it("exitCode !== 0이고 파싱된 에러가 있으면 fail이며 rawOutput이 비어있지 않다", () => {
    const stderr = "src/app.ts(10,5): error TS2322: Type mismatch";
    const gate = assessTypecheckResult(tcResult({ exitCode: 1, stderr }));

    expect(gate.status).toBe("fail");
    expect(gate.errors.length).toBe(1);
    expect(gate.errors[0]).toEqual({ line: 10, column: 5, message: "Type mismatch" });
    expect(gate.rawOutput.length).toBeGreaterThan(0);
    expect(isPacketBlocking(gate)).toBe(true);
  });
});
