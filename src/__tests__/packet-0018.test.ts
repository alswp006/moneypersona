/**
 * Packet 0018: 기록 화면 (`/history`) — 진단/궁합 Tab 전환 · 삭제 · 빈 상태 · 손상 복구
 *
 * SPEC 소스:
 * - .ai-factory/spec.md § F8. 기록 관리 & 검수 컴플라이언스 (AC-1~AC-6)
 * - .ai-factory/spec.md § S8. 기록 (`/history`)
 *
 * 의존 모듈(아직 미구현 — 이 패킷 소관):
 * - src/pages/History.tsx (default export)
 * - src/components/ResultHistoryList.tsx / CompatHistoryList.tsx (History 내부에서 사용, 직접 테스트하지 않음)
 *
 * 데이터는 mp.result.history / mp.result.latest / mp.compat.history localStorage 키를
 * 직접 읽고 쓴다 (0007 기반 계층은 src/lib/storage.ts의 getItem/setItem/removeItem).
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { screen, fireEvent, within } from "@testing-library/react";
import { mockTds, mockAppsInToss, mockTossRewardAd, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter, seedLocalStorage } from "@/__tests__/__helpers__/test-utils";
import type { QuizResult, CompatRecord } from "@/lib/types";

mockTds();
mockAppsInToss();
mockTossRewardAd();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

import History from "@/pages/History";

const RESULT_HISTORY_KEY = "mp.result.history";
const RESULT_LATEST_KEY = "mp.result.latest";
const COMPAT_HISTORY_KEY = "mp.compat.history";

function makeResult(overrides: Partial<QuizResult> = {}): QuizResult {
  return {
    version: 1,
    id: "r_1000_aaaa",
    personaId: "TPS",
    scores: { spend: 3, plan: 2, risk: 1 },
    answers: [1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    code: "TPSAB",
    createdAt: 1000,
    reportUnlocked: false,
    ...overrides,
  };
}

function makeCompat(overrides: Partial<CompatRecord> = {}): CompatRecord {
  return {
    version: 1,
    id: "c_1000_aaaa",
    myPersonaId: "TPS",
    friendPersonaId: "TIS",
    friendCode: "TISON",
    score: 100,
    grade: "S",
    createdAt: 1000,
    ...overrides,
  };
}

function renderHistory() {
  return renderWithRouter(React.createElement(History), { initialEntries: ["/history"] });
}

describe("기록 화면 (`/history`) — 진단/궁합 Tab 전환 · 삭제 · 빈 상태 · 손상 복구", () => {
  it("AC-1[P0]: 진단 탭이 기본 표시되며 3건이 createdAt 내림차순(최신 상단)으로 정렬된다", () => {
    const r1 = makeResult({ id: "r_1000_aaaa", code: "TPSAA", createdAt: 1000 });
    const r2 = makeResult({ id: "r_2000_bbbb", code: "TIRBB", createdAt: 2000, personaId: "TIR" });
    const r3 = makeResult({ id: "r_3000_cccc", code: "FPSCC", createdAt: 3000, personaId: "FPS" });
    seedLocalStorage({ [RESULT_HISTORY_KEY]: [r1, r2, r3] });

    renderHistory();

    const rows = screen.getAllByTestId("history-result-row");
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText(/FPSCC/)).toBeInTheDocument();
    expect(within(rows[1]).getByText(/TIRBB/)).toBeInTheDocument();
    expect(within(rows[2]).getByText(/TPSAA/)).toBeInTheDocument();
    expect(screen.queryAllByTestId("history-compat-row")).toHaveLength(0);
  });

  it("AC-1[P0]: 궁합 기록 탭으로 전환하면 진단 리스트가 사라지고 궁합 리스트가 내림차순으로 표시된다", () => {
    const c1 = makeCompat({ id: "c_1000_aaaa", friendCode: "TISON", createdAt: 1000 });
    const c2 = makeCompat({ id: "c_2000_bbbb", friendCode: "FPRXY", createdAt: 2000, grade: "A", score: 70 });
    seedLocalStorage({
      [RESULT_HISTORY_KEY]: [makeResult({ id: "r_only", createdAt: 500 })],
      [COMPAT_HISTORY_KEY]: [c1, c2],
    });

    renderHistory();
    fireEvent.click(screen.getByRole("tab", { name: "궁합 기록" }));

    expect(screen.queryAllByTestId("history-result-row")).toHaveLength(0);
    const rows = screen.getAllByTestId("history-compat-row");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText(/FPRXY/)).toBeInTheDocument();
    expect(within(rows[1]).getByText(/TISON/)).toBeInTheDocument();
  });

  it("AC-2[P0]: 진단 기록 행을 탭하면 resultId를 state로 담아 /result로 이동한다", () => {
    const r1 = makeResult({ id: "r_target_0001", createdAt: 5000 });
    seedLocalStorage({ [RESULT_HISTORY_KEY]: [r1] });

    renderHistory();
    fireEvent.click(screen.getByTestId("history-result-row"));

    expect(mockNavigate).toHaveBeenCalledWith("/result", { state: { resultId: "r_target_0001" } });
  });

  it("AC-2[P0]: 삭제 아이콘 → AlertDialog '삭제' 탭 시 항목이 리스트·저장소에서 제거되고 최신 결과였다면 latest도 null이 된다", () => {
    const r1 = makeResult({ id: "r_1000_aaaa", createdAt: 1000 });
    const r2 = makeResult({ id: "r_2000_bbbb", createdAt: 2000 });
    const r3 = makeResult({ id: "r_3000_cccc", createdAt: 3000 });
    seedLocalStorage({
      [RESULT_HISTORY_KEY]: [r1, r2, r3],
      [RESULT_LATEST_KEY]: r3,
    });

    renderHistory();

    // 최신순 정렬이므로 첫 삭제 버튼 = r3 (createdAt 3000)
    const deleteButtons = screen.getAllByTestId("history-delete-button");
    fireEvent.click(deleteButtons[0]);

    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByText("삭제"));

    expect(screen.getAllByTestId("history-result-row")).toHaveLength(2);

    const stored = JSON.parse(localStorage.getItem(RESULT_HISTORY_KEY) ?? "[]") as QuizResult[];
    expect(stored).toHaveLength(2);
    expect(stored.find((r) => r.id === "r_3000_cccc")).toBeUndefined();

    const latest = JSON.parse(localStorage.getItem(RESULT_LATEST_KEY) ?? "null");
    expect(latest).toBeNull();

    expect(screen.getByText("기록을 삭제했어요")).toBeInTheDocument();
  });

  it("AC-2[P0] edge: AlertDialog에서 '닫기'를 탭하면 삭제가 취소되고 목록·저장소가 그대로 유지된다", () => {
    const r1 = makeResult({ id: "r_1", createdAt: 1000 });
    const r2 = makeResult({ id: "r_2", createdAt: 2000 });
    seedLocalStorage({ [RESULT_HISTORY_KEY]: [r1, r2] });

    renderHistory();
    fireEvent.click(screen.getAllByTestId("history-delete-button")[0]);

    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByText("닫기"));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("history-result-row")).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem(RESULT_HISTORY_KEY) ?? "[]")).toHaveLength(2);
    expect(screen.queryByText("기록을 삭제했어요")).not.toBeInTheDocument();
  });

  it("AC-3[P1]: 손상된 배열(잘못된 JSON·비배열)은 예외 없이 빈 리스트로 복구되고 해당 key가 삭제되며 console.error 호출 0건이다", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(RESULT_HISTORY_KEY, "{not-json");
    localStorage.setItem(COMPAT_HISTORY_KEY, JSON.stringify({ not: "an-array" }));

    renderHistory();

    expect(screen.queryAllByTestId("history-result-row")).toHaveLength(0);
    expect(localStorage.getItem(RESULT_HISTORY_KEY)).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "궁합 기록" }));
    expect(screen.queryAllByTestId("history-compat-row")).toHaveLength(0);
    expect(localStorage.getItem(COMPAT_HISTORY_KEY)).toBeNull();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("AC-4[P1]: 각 탭이 비어 있으면 아이콘·안내 문구·CTA가 표시되고 CTA가 지정된 경로로 이동시킨다", () => {
    renderHistory();

    expect(screen.getByText("아직 기록이 없어요")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "테스트 시작하기" }));
    expect(mockNavigate).toHaveBeenCalledWith("/quiz/1");
    expect(screen.queryAllByTestId("history-delete-button")).toHaveLength(0);

    fireEvent.click(screen.getByRole("tab", { name: "궁합 기록" }));
    expect(screen.getByText("아직 비교한 친구가 없어요")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "궁합 보러가기" }));
    expect(mockNavigate).toHaveBeenCalledWith("/compat");
  });

  it("AC-5[P1]: 리스트 행 높이가 56px 이상이고 하단에 FloatingTabBar(기록 활성)와 AdSlot이 렌더된다", () => {
    seedLocalStorage({ [RESULT_HISTORY_KEY]: [makeResult({ id: "r_1", createdAt: 1000 })] });
    const { container } = renderHistory();

    const row = screen.getByTestId("history-result-row");
    const style = getComputedStyle(row);
    const height = Number.parseInt(style.minHeight || style.height || "0", 10);
    expect(height).toBeGreaterThanOrEqual(56);

    const recordTab = screen.getByRole("tab", { name: "기록" });
    expect(recordTab).toHaveAttribute("aria-selected", "true");

    expect(container.querySelector('[data-ad-group-id], .ad-slot')).not.toBeNull();
  });
});
