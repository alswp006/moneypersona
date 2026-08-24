import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { mockTds, mockAppsInToss, mockTossRewardAd, mockRouter, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import { QUESTIONS } from "@/data/questions";

mockTds();
mockAppsInToss();
mockTossRewardAd();
mockRouter();

import Quiz from "@/pages/Quiz";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";

const PROGRESS_KEY = "mp:progress:v1";
const RESULT_KEY = "mp:result:v1";

/** 선택지 라벨 텍스트로 실제 클릭 가능한 버튼 요소를 찾는다(TDS Button/Chip/커스텀 어느 쪽이든). */
function getChoiceButton(label: string): HTMLElement {
  const el = screen.getByText(label);
  const btn = el.closest("button");
  if (!btn) throw new Error(`선택지 "${label}"에 대응하는 <button> 조상을 찾지 못했습니다`);
  return btn as HTMLElement;
}

function renderQuiz() {
  return renderWithRouter(React.createElement(Quiz), { initialEntries: ["/quiz"] });
}

describe("퀴즈 화면 `/quiz`", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("AC-1[P0]: 진입 시 '1 / 12'와 MiniBar 진행률 8%를 표시한다", () => {
    renderQuiz();

    expect(screen.getByText("1 / 12")).toBeInTheDocument();

    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe(String(Math.round((1 / 12) * 100)));
    expect(bar.getAttribute("aria-valuenow")).toBe("8");
  });

  it("AC-1[P0]: 1번 문항 선택 후 '2 / 12'와 진행률 17%로 갱신된다", () => {
    renderQuiz();

    const q1 = QUESTIONS[0];
    fireEvent.click(getChoiceButton(q1.choices[0].label));

    expect(screen.getByText("2 / 12")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe(String(Math.round((2 / 12) * 100)));
    expect(bar.getAttribute("aria-valuenow")).toBe("17");
  });

  it("AC-2[P0]: 선택지 2개는 <button>(display=block)이며 탭 시 tickWeak 햅틱 후 다음 문항으로 전환된다", () => {
    renderQuiz();

    const q1 = QUESTIONS[0];
    const btnA = getChoiceButton(q1.choices[0].label);
    const btnB = getChoiceButton(q1.choices[1].label);

    expect(btnA.tagName).toBe("BUTTON");
    expect(btnB.tagName).toBe("BUTTON");
    expect(btnA.getAttribute("display")).toBe("block");
    expect(btnB.getAttribute("display")).toBe("block");

    fireEvent.click(btnA);

    expect(generateHapticFeedback).toHaveBeenCalledWith({ type: "tickWeak" });
    expect(generateHapticFeedback).toHaveBeenCalledTimes(1);
    expect(screen.getByText(QUESTIONS[1].text)).toBeInTheDocument();
  });

  it("AC-2[P0]: 선택 즉시 진행 상태가 mp:progress:v1에 저장된다", () => {
    renderQuiz();

    const q1 = QUESTIONS[0];
    fireEvent.click(getChoiceButton(q1.choices[0].label));

    const raw = localStorage.getItem(PROGRESS_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string);
    const progress = stored.data ?? stored;
    expect(progress.currentIndex).toBe(1);
    expect(progress.answers[0]).toBe(1);
  });

  it("AC-3[P0]: 이전 버튼으로 직전 문항으로 돌아가면 기존 선택이 강조 표시되고, 1번 문항에서는 이전 버튼이 비활성이다", () => {
    renderQuiz();

    const q1 = QUESTIONS[0];
    fireEvent.click(getChoiceButton(q1.choices[0].label));
    expect(screen.getByText("2 / 12")).toBeInTheDocument();

    const backButton = screen.getByRole("button", { name: /이전|뒤로/ });
    fireEvent.click(backButton);

    expect(screen.getByText("1 / 12")).toBeInTheDocument();
    const chosenBtn = getChoiceButton(q1.choices[0].label);
    expect(chosenBtn.getAttribute("aria-pressed")).toBe("true");

    const backButtonAtStart = screen.getByRole("button", { name: /이전|뒤로/ });
    expect(backButtonAtStart).toBeDisabled();
  });

  it("AC-4[P0]: 12번째 선택 직후 채점하여 /result로 replace 이동하고 resultId를 state로 전달한다", () => {
    renderQuiz();

    QUESTIONS.forEach((q) => {
      fireEvent.click(getChoiceButton(q.choices[0].label));
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const [path, options, navOpts] = mockNavigate.mock.calls[0];
    expect(path).toBe("/result");
    // 12문항 모두 choices[0](score:1)을 선택 → scoreQuiz([1,...,1]) === 'FPC' (결정론적)
    expect(options.state.resultId).toMatch(/^r_\d+_FPC$/);
    expect(navOpts).toEqual({ replace: true });

    const raw = localStorage.getItem(RESULT_KEY);
    expect(raw).not.toBeNull();
    expect(raw as string).toContain(options.state.resultId);
  });

  it("AC-5[P1]: 저장된 진행 상태(currentIndex)부터 이어서 표시되고, 광고 배너는 렌더링되지 않는다", () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        v: 1,
        data: {
          answers: [1, 0, 1, null, null, null, null, null, null, null, null, null],
          currentIndex: 3,
          updatedAt: 1700000000000,
        },
      }),
    );

    const { container } = renderQuiz();

    expect(screen.getByText("4 / 12")).toBeInTheDocument();
    expect(screen.getByText(QUESTIONS[3].text)).toBeInTheDocument();
    expect(container.querySelector("[data-ad-group-id]")).toBeNull();
  });
});
