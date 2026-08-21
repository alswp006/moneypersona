/**
 * Packet 0010: 퀴즈 화면 (`/quiz/:step`) — 문항 렌더 · 진행률 · 진입 가드
 *
 * SPEC 소스:
 * - .ai-factory/spec.md § S2. 퀴즈 (`/quiz/:step`)
 * - .ai-factory/task.md § Task 3.3 퀴즈 화면
 *
 * 의존 모듈(아직 미구현 — 다른 패킷 소관)은 모두 mock:
 * - QUESTIONS 상수: @/domain/questions
 * - useQuizDraft 훅: @/state/useQuizDraft (draft + answer(index,value) + resetDraft + firstUnansweredStep)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { screen, fireEvent, within } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { mockTds, mockAppsInToss, mockTossRewardAd, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import type { Question, QuizDraft } from "@/lib/types";

mockTds();
mockAppsInToss();
mockTossRewardAd();

// ── react-router-dom: useNavigate mock (실제 Routes/Route/useParams는 그대로) ──
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── QUESTIONS 상수 mock (12문항, axis 4/4/4, options A/B) ──
// vi.hoisted: vi.mock 팩토리는 import보다 먼저 평가되므로, 팩토리가 즉시 참조하는
// 값은 vi.hoisted로 감싸야 TDZ("Cannot access before initialization") 없이 안전하다.
const MOCK_QUESTIONS: Question[] = vi.hoisted(() =>
  Array.from({ length: 12 }, (_, i) => {
    const id = i + 1;
    const axis = id <= 4 ? "spend" : id <= 8 ? "plan" : "risk";
    return {
      id,
      axis,
      text: `문항 ${id}번 — 이 상황에서 나는 어떻게 행동할까 고민한다`,
      options: [
        { key: "A", label: `A안 선택지 ${id}`, value: 1 },
        { key: "B", label: `B안 선택지 ${id}`, value: 0 },
      ],
    };
  }),
);

vi.mock("@/domain/questions", () => ({ QUESTIONS: MOCK_QUESTIONS }));

// ── useQuizDraft 훅 mock — 테스트별로 draft를 다르게 세팅 ──
const mockAnswer = vi.fn();
const mockResetDraft = vi.fn();
let mockDraftState: { draft: QuizDraft | null; firstUnansweredStep: number | null } = {
  draft: { version: 1, answers: Array(12).fill(null), updatedAt: 0 },
  firstUnansweredStep: 1,
};

vi.mock("@/state/useQuizDraft", () => ({
  useQuizDraft: () => ({
    draft: mockDraftState.draft,
    answer: mockAnswer,
    resetDraft: mockResetDraft,
    firstUnansweredStep: mockDraftState.firstUnansweredStep,
  }),
}));

import Quiz from "@/pages/Quiz";

function setDraft(answers: Array<0 | 1 | null>, firstUnansweredStep: number | null) {
  mockDraftState = {
    draft: { version: 1, answers, updatedAt: 0 },
    firstUnansweredStep,
  };
}

function renderQuizAt(path: string) {
  return renderWithRouter(
    React.createElement(Routes, null, React.createElement(Route, { path: "/quiz/:step", element: React.createElement(Quiz) })),
    { initialEntries: [path] },
  );
}

describe("퀴즈 화면 (`/quiz/:step`) — 문항 렌더 · 진행률 · 진입 가드", () => {
  beforeEach(() => {
    mockAnswer.mockClear();
    mockResetDraft.mockClear();
    mockNavigate.mockClear();
    setDraft(Array(12).fill(null), 1);
  });

  // AC-1[P0]: /quiz/5 진입 시 QUESTIONS[4]의 text/A,B 라벨 렌더 + Top 타이틀 '5 / 12'
  it("AC-1[P0]: /quiz/5 진입 시 5번 문항 text·선택지 A/B 라벨과 진행률 텍스트가 정확히 렌더된다", () => {
    renderQuizAt("/quiz/5");

    expect(screen.getByText(MOCK_QUESTIONS[4].text)).toBeInTheDocument();
    expect(screen.getByText("A안 선택지 5")).toBeInTheDocument();
    expect(screen.getByText("B안 선택지 5")).toBeInTheDocument();
    expect(screen.getByTestId("quiz-progress-text")).toHaveTextContent("5 / 12");
  });

  // AC-2[P0]: 진행률 게이지 flex 값 = step / (12-step), 색상은 var(--tds-color-*)만 사용
  it("AC-2[P0]: 진행률 게이지 채움/잔여 flex 값이 step과 12-step이고 var(--tds-color-*)만 사용한다", () => {
    renderQuizAt("/quiz/5");

    const bar = screen.getByTestId("quiz-progress-bar");
    const [filled, remaining] = Array.from(bar.children) as HTMLElement[];

    expect(filled.style.flex).toBe("5");
    expect(remaining.style.flex).toBe("7");

    const filledColor = filled.style.backgroundColor;
    const remainingColor = remaining.style.backgroundColor;
    expect(filledColor.startsWith("var(--tds-color-")).toBe(true);
    expect(remainingColor.startsWith("var(--tds-color-")).toBe(true);
    // HEX 리터럴 사용 금지
    expect(filledColor).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    expect(remainingColor).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });

  // AC-3[P0]: A/B 선택 시 draft.answers[step-1]에 value(0|1) 저장, step<12면 다음 step, step===12면 calculating
  it("AC-3[P0]: A 탭 시 answer(step-1, 1) 호출 후 다음 step으로 이동한다 (step<12)", () => {
    setDraft([1, 0, null, null, null, null, null, null, null, null, null, null], 3);
    renderQuizAt("/quiz/3");

    fireEvent.click(screen.getByText("A안 선택지 3"));

    expect(mockAnswer).toHaveBeenCalledWith(2, 1);
    expect(mockNavigate).toHaveBeenCalledWith("/quiz/4");
  });

  it("AC-3[P0]: step===12에서 B 탭 시 answer(11, 0) 호출 후 /quiz/calculating으로 이동한다", () => {
    setDraft([1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, null], 12);
    renderQuizAt("/quiz/12");

    fireEvent.click(screen.getByText("B안 선택지 12"));

    expect(mockAnswer).toHaveBeenCalledWith(11, 0);
    expect(mockNavigate).toHaveBeenCalledWith("/quiz/calculating");
  });

  // AC-4[P0]: step이 1~12 정수가 아니면 첫 미응답 스텝으로 replace 이동
  it("AC-4[P0]: /quiz/0, /quiz/13, /quiz/abc 진입 시 첫 미응답 step(1)으로 replace 이동한다", () => {
    for (const bad of ["/quiz/0", "/quiz/13", "/quiz/abc"]) {
      mockNavigate.mockClear();
      setDraft(Array(12).fill(null), 1);
      renderQuizAt(bad);
      expect(mockNavigate).toHaveBeenCalledWith("/quiz/1", { replace: true });
    }
  });

  it("AC-4[P0]: 앞 3문항만 응답된 상태로 /quiz/9 직접 진입 시 첫 미응답 step(4)으로 replace 이동한다", () => {
    setDraft([1, 0, 1, null, null, null, null, null, null, null, null, null], 4);
    renderQuizAt("/quiz/9");
    expect(mockNavigate).toHaveBeenCalledWith("/quiz/4", { replace: true });
  });

  // AC-5[P1]: '그만하기' 탭 → AlertDialog(왼쪽 '닫기'), 확인 시 draft 유지한 채 '/'로 이동
  it("AC-5[P1]: 그만하기 탭 시 AlertDialog가 열리고 확인하면 draft를 지우지 않고 '/'로 이동한다", () => {
    renderQuizAt("/quiz/5");

    fireEvent.click(screen.getByText("그만하기"));

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("닫기")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByText("그만두기"));

    expect(mockResetDraft).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  // AC-6[P1]: AdSlot/FloatingTabBar 미렌더 (몰입 플로우, 오탭 방지)
  it("AC-6[P1]: 퀴즈 화면에는 AdSlot(.ad-slot)과 FloatingTabBar(role=tablist)가 렌더되지 않는다", () => {
    const { container } = renderQuizAt("/quiz/5");

    expect(container.querySelector(".ad-slot")).toBeNull();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
});
