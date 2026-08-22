import { describe, it, expect } from "vitest";
import { parseTscOutput } from "../parseTscOutput";

describe("parseTscOutput", () => {
  it("표준 tsc 에러 형식을 line/column/message로 파싱한다", () => {
    const output = [
      "src/index.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.",
      "src/component.ts(25,1): error TS1005: Invalid syntax",
    ].join("\n");

    const errors = parseTscOutput(output);

    expect(errors).toEqual([
      { line: 10, column: 5, message: "Type 'string' is not assignable to type 'number'." },
      { line: 25, column: 1, message: "Invalid syntax" },
    ]);
  });

  it("error TS 마커가 없는 출력은 빈 배열을 반환한다 (크래시 로그 등)", () => {
    const output = [
      "Internal error: Cannot read properties of undefined",
      "    at Object.<anonymous> (/usr/lib/node_modules/typescript/lib/tsc.js:123:45)",
    ].join("\n");

    expect(parseTscOutput(output)).toEqual([]);
  });

  it("빈 문자열은 빈 배열을 반환한다", () => {
    expect(parseTscOutput("")).toEqual([]);
  });
});
