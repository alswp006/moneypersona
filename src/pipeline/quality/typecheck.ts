import { spawnSync } from "node:child_process";
import path from "node:path";

/** tsc 실행 1회의 원시 결과 — exitCode/stdout/stderr를 손실 없이 보존한다 */
export interface TypeCheckResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  command: string;
  cwd: string;
  tsconfigPath: string;
}

export interface RunTypecheckOptions {
  cwd?: string;
  tsconfigPath?: string;
}

const DEFAULT_TSCONFIG_FILENAME = "tsconfig.json";

/**
 * `npx tsc --noEmit -p <tsconfigPath>`를 실행하고 exitCode/stdout/stderr를
 * 그대로 캡처한다. 프로세스 자체를 띄우지 못한 경우(spawn 실패)도 exitCode
 * 0이 아닌 결과로 정규화해 호출부가 항상 동일한 형태를 받도록 한다.
 */
export function runTypecheck(options: RunTypecheckOptions = {}): TypeCheckResult {
  const cwd = options.cwd ?? process.cwd();
  const tsconfigPath = options.tsconfigPath ?? path.join(cwd, DEFAULT_TSCONFIG_FILENAME);
  const args = ["tsc", "--noEmit", "-p", tsconfigPath];
  const command = `npx ${args.join(" ")}`;

  const proc = spawnSync("npx", args, { cwd, encoding: "utf-8" });

  if (proc.error) {
    return {
      exitCode: 1,
      stdout: proc.stdout ?? "",
      stderr: [proc.error.message, proc.stderr ?? ""].filter(Boolean).join("\n"),
      command,
      cwd,
      tsconfigPath,
    };
  }

  return {
    exitCode: proc.status ?? 1,
    stdout: proc.stdout ?? "",
    stderr: proc.stderr ?? "",
    command,
    cwd,
    tsconfigPath,
  };
}
