import type { WorkPacket } from "../../lib/contract";
import { toArray } from "../utils/toArray";

export interface GenerateWorkPacketsInput {
  stageIndex?: number;
  items?: unknown;
}

/**
 * 스테이지 산출물을 WorkPacket[]으로 정규화한다.
 * items가 undefined/null/객체 등 배열이 아니어도 toArray로 흡수해
 * 빈 목록을 반환할 뿐 크래시하지 않는다.
 */
export function generateWorkPackets(input: unknown): WorkPacket[] {
  const { stageIndex = 0, items } = (input && typeof input === "object"
    ? (input as GenerateWorkPacketsInput)
    : {}) as GenerateWorkPacketsInput;

  return toArray(items).map((item, index) => ({
    id: `packet-${stageIndex}-${index}`,
    stageIndex,
    input: item,
  }));
}
