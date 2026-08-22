import { describe, it, expect, vi } from "vitest";

/**
 * 라우트가 추가됐는데 SCREEN_CONTENT에 대응 항목을 빠뜨린 상황을 재현한다.
 * 예전 구현은 여기서 TypeError를 던졌고, runBatchJob이 그 예외를 흡수해
 * packets: []를 반환했다 — heal-1-02가 없애려던 "패킷 0개" 상태 그 자체다.
 */
vi.mock("../../../routes/index", () => ({
  ROUTES: [
    { name: "home", path: "/" },
    { name: "quiz", path: "/quiz" },
    { name: "result", path: "/result" },
    { name: "report", path: "/report" },
    { name: "compatibility", path: "/compatibility" },
    { name: "settings", path: "/settings" },
  ],
}));

const { generateWorkPackets } = await import("../generateWorkPackets");

describe("generateWorkPackets — SCREEN_CONTENT 미등록 라우트 방어", () => {
  it("명세가 없는 라우트가 섞여 있어도 던지지 않고 전 라우트를 패킷으로 만든다", () => {
    expect(() => generateWorkPackets()).not.toThrow();

    const packets = generateWorkPackets();
    expect(packets.length).toBe(6);
    expect(packets.map((p) => p.metadata?.route)).toContain("/settings");
  });

  it("대체 콘텐츠로 만든 패킷도 title/description/files/acceptanceCriteria가 비어있지 않다", () => {
    const packets = generateWorkPackets();

    for (const packet of packets) {
      const meta = packet.metadata as {
        title: string;
        description: string;
        files: string[];
        acceptanceCriteria: string[];
      };

      expect(meta.title.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
      expect(meta.files.length).toBeGreaterThan(0);
      expect(meta.acceptanceCriteria.length).toBeGreaterThan(0);
    }
  });
});
