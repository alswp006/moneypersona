/** tsc가 표준 형식으로 출력한 진단 한 건 */
export interface TypeCheckError {
  line: number;
  column: number;
  message: string;
}

const TSC_ERROR_PATTERN = /\((\d+),(\d+)\):\s*error\s*\S+:\s*(.+)/;

/**
 * tsc stdout/stderr 원문에서 "error TS..." 형식의 진단만 추출한다.
 * 파싱 불가능한 크래시 로그(스택 트레이스 등)는 빈 배열을 반환하며,
 * 이 빈 배열이 곧 qualityGate가 tool_crash로 분류하는 근거가 된다.
 */
export function parseTscOutput(output: string): TypeCheckError[] {
  return output
    .split("\n")
    .filter((line) => line.includes("error TS"))
    .map((line) => {
      const match = line.match(TSC_ERROR_PATTERN);
      return {
        line: match ? parseInt(match[1], 10) : 0,
        column: match ? parseInt(match[2], 10) : 0,
        message: match ? match[3] : line,
      };
    });
}
