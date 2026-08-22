import { describe, it, expect } from "vitest";
import { generateWorkPackets, isPipelineSuccessful } from "../pipeline/stages/generateWorkPackets";
import { QUESTIONS } from "../constants/questions";
import { CHARACTERS } from "../constants/characters";
import { ROUTES } from "../routes/index";

/**
 * Test Suite: 워크패킷 재생성 — SPEC 전 화면 커버리지 복구
 *
 * Packet heal-1-02: 패킷이 0개인 현 상태를 복구하기 위해 SPEC에서 워크패킷을
 * 다시 생성한다 (진단 퀴즈, 결과, 리포트, 궁합, 홈/기록 5개 화면 커버리지).
 */

describe("워크패킷 재생성 — SPEC 전 화면 커버리지 복구 (AC 1-4)", () => {
  describe("AC-1: 워크패킷 수 ≥ 5, SPEC의 각 라우트가 최소 1개 패킷에 매핑", () => {
    it("AC-1.1: generateWorkPackets()는 5개 이상의 워크패킷을 반환한다", () => {
      const packets = generateWorkPackets();

      expect(Array.isArray(packets)).toBe(true);
      expect(packets.length).toBeGreaterThanOrEqual(5);
    });

    it("AC-1.2: 퀴즈·결과·리포트·궁합·홈 5개 라우트가 각각 최소 1개 패킷에 매핑된다", () => {
      const packets = generateWorkPackets();
      const coveredRoutes = new Set(
        packets.map((p: any) => p.metadata?.route)
      );

      expect(ROUTES.length).toBe(5);
      for (const route of ROUTES) {
        expect(coveredRoutes.has(route.path)).toBe(true);
      }
    });
  });

  describe("AC-2: 패킷 배열이 비었을 때 파이프라인은 '성공'으로 마킹되지 않는다", () => {
    it("AC-2.1: packets가 빈 배열이면 isPipelineSuccessful은 false를 반환한다", () => {
      const result = isPipelineSuccessful({ packets: [], errors: [] });

      expect(result).toBe(false);
    });

    it("AC-2.2: packets가 비어있지 않고 errors도 없으면 isPipelineSuccessful은 true를 반환한다", () => {
      const result = isPipelineSuccessful({
        packets: [{ id: "packet-quiz-0", stageIndex: 0, input: {} }],
        errors: [],
      });

      expect(result).toBe(true);
    });
  });

  describe("AC-3: 각 패킷은 title/description/files/acceptanceCriteria가 모두 비어 있지 않다", () => {
    it("AC-3.1: 생성된 모든 패킷이 title/description/files/acceptanceCriteria를 갖춘다", () => {
      const packets = generateWorkPackets();

      expect(packets.length).toBeGreaterThan(0);
      for (const packet of packets as any[]) {
        expect(typeof packet.metadata?.title).toBe("string");
        expect(packet.metadata.title.length).toBeGreaterThan(0);

        expect(typeof packet.metadata?.description).toBe("string");
        expect(packet.metadata.description.length).toBeGreaterThan(0);

        expect(Array.isArray(packet.metadata?.files)).toBe(true);
        expect(packet.metadata.files.length).toBeGreaterThan(0);

        expect(Array.isArray(packet.metadata?.acceptanceCriteria)).toBe(true);
        expect(packet.metadata.acceptanceCriteria.length).toBeGreaterThan(0);
      }
    });
  });

  describe("AC-4: 라우팅 진입점에 퀴즈·결과·리포트·궁합·홈 라우트가 모두 등록된다", () => {
    it("AC-4.1: ROUTES가 5개 화면 이름을 모두 포함하고 경로가 고유하다", () => {
      const names = ROUTES.map((r) => r.name);

      expect(names).toContain("quiz");
      expect(names).toContain("result");
      expect(names).toContain("report");
      expect(names).toContain("compatibility");
      expect(names).toContain("home");

      const paths = ROUTES.map((r) => r.path);
      expect(new Set(paths).size).toBe(paths.length);
    });

    it("AC-4.2: 홈 라우트의 경로는 루트('/')다", () => {
      const home = ROUTES.find((r) => r.name === "home");

      expect(home).toBeDefined();
      expect(home?.path).toBe("/");
    });
  });

  describe("부가 검증: QUESTIONS(12문항)·CHARACTERS(8캐릭터) 상수 무결성", () => {
    it("QUESTIONS는 12개 문항이며 각 문항은 id/text/type을 갖는다", () => {
      expect(QUESTIONS.length).toBe(12);
      for (const q of QUESTIONS) {
        expect(typeof q.id).toBe("string");
        expect(q.id.length).toBeGreaterThan(0);
        expect(typeof q.text).toBe("string");
        expect(q.text.length).toBeGreaterThan(0);
        expect(typeof q.type).toBe("string");
        expect(q.type.length).toBeGreaterThan(0);
      }
    });

    it("CHARACTERS는 8개 캐릭터이며 각 캐릭터는 id/name/traits를 갖는다", () => {
      expect(CHARACTERS.length).toBe(8);
      for (const c of CHARACTERS) {
        expect(typeof c.id).toBe("string");
        expect(c.id.length).toBeGreaterThan(0);
        expect(typeof c.name).toBe("string");
        expect(c.name.length).toBeGreaterThan(0);
        expect(Array.isArray(c.traits)).toBe(true);
        expect(c.traits.length).toBeGreaterThan(0);
      }

      const ids = CHARACTERS.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
