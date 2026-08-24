import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { screen, within, fireEvent } from "@testing-library/react";
import {
  mockTds,
  mockAppsInToss,
  mockTossRewardAd,
  mockRouter,
  mockNavigate,
} from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import { scoreQuiz } from "@/lib/scoring";
import { makeShareCode } from "@/lib/shareCode";
import { PERSONAS } from "@/data/personas";
import { DISCLAIMER_TEXT } from "@/components/DisclaimerNotice";
import type { AppFlags, QuizResult } from "@/lib/types";

mockTds();
mockAppsInToss();
mockTossRewardAd();
mockRouter();

import Result from "@/pages/Result";

const RESULT_KEY = "mp:result:v1";
const FLAGS_KEY = "mp:flags:v1";

// A1 sum=3(75%,F) / A2 sum=2(50%,P) / A3 sum=4(100%,C) → personaCode FPC
const ANSWERS: (0 | 1)[] = [1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1];

function buildResult(id: string): QuizResult {
  const scored = scoreQuiz(ANSWERS);
  if (!scored.ok) throw new Error("fixture answers must be valid");
  return {
    id,
    createdAt: 1,
    answers: ANSWERS,
    axisScores: scored.axisScores,
    personaCode: scored.personaCode,
    shareCode: makeShareCode(scored.personaCode),
    reportUnlocked: false,
  };
}

function seedResult(result: QuizResult) {
  localStorage.setItem(RESULT_KEY, JSON.stringify({ v: 1, data: result }));
  const flags: AppFlags = { onboardingSeen: true, lastResultId: result.id, disclaimerSeen: true };
  localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
}

function renderResult(state?: { resultId: string }) {
  return renderWithRouter(React.createElement(Result), {
    initialEntries: [state ? { pathname: "/result", state } : "/result"],
  });
}

describe("결과 화면 `/result` 조립", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("AC-1[P0]: resultId도 저장된 결과도 없으면 EmptyState가 크래시 없이 렌더되고 CTA로 퀴즈로 이동한다", () => {
    renderResult();

    expect(screen.getByText("아직 진단 결과가 없어요")).toBeInTheDocument();
    const cta = screen.getByRole("button", { name: /진단 시작하기/ });
    expect(cta).toBeInTheDocument();

    fireEvent.click(cta);
    expect(mockNavigate).toHaveBeenCalledWith("/quiz");
  });

  it("AC-2[P0]: 결과가 있으면 PersonaCard·AxisScoreCard·TipsCard가 순서대로 렌더되고 캐릭터 이름이 SPEC 값과 일치한다", () => {
    const result = buildResult("r_1_FPC");
    seedResult(result);

    const { container } = renderResult({ resultId: result.id });

    expect(result.personaCode).toBe("FPC");
    expect(PERSONAS.FPC.name).toBe("알뜰형 다람쥐");

    expect(screen.getByTestId("persona-card")).toBeInTheDocument();
    expect(screen.getByTestId("axis-metrics")).toBeInTheDocument();
    expect(screen.getByTestId("tips-card")).toBeInTheDocument();

    const orderedTestIds = Array.from(container.querySelectorAll("[data-testid]"))
      .map((el) => el.getAttribute("data-testid"))
      .filter((id) => id === "persona-card" || id === "axis-metrics" || id === "tips-card");
    expect(orderedTestIds).toEqual(["persona-card", "axis-metrics", "tips-card"]);

    expect(
      within(screen.getByTestId("persona-card")).getByText(PERSONAS.FPC.name),
    ).toBeInTheDocument();

    const tipRows = within(screen.getByTestId("tips-card")).getAllByRole("listitem");
    expect(tipRows).toHaveLength(3);
    for (const tip of PERSONAS.FPC.tips) {
      expect(screen.getByText(tip)).toBeInTheDocument();
    }
  });

  it("AC-2[P0]: 3축 MiniBar 채움 비율이 각 축 percent(75/50/100)와 일치한다", () => {
    const result = buildResult("r_1_FPC");
    seedResult(result);
    renderResult({ resultId: result.id });

    expect(result.axisScores.map((a) => a.percent)).toEqual([75, 50, 100]);
    expect(screen.getByTestId("axis-bar-A1").getAttribute("aria-valuenow")).toBe("75");
    expect(screen.getByTestId("axis-bar-A2").getAttribute("aria-valuenow")).toBe("50");
    expect(screen.getByTestId("axis-bar-A3").getAttribute("aria-valuenow")).toBe("100");
  });

  it("AC-3[P1]: 화면 하단에 오해 방지 고지 문구가 Paragraph.Text로 표시된다", () => {
    const result = buildResult("r_1_FPC");
    seedResult(result);
    renderResult({ resultId: result.id });

    const notice = screen.getByText(DISCLAIMER_TEXT);
    expect(notice).toBeInTheDocument();
    expect(notice.tagName).toBe("SPAN");
  });

  it("AC-4[P0]: 상세 리포트 보기/공유하기/친구와 궁합 보기 탭 시 resultId state와 함께 각각 이동한다", () => {
    const result = buildResult("r_1_FPC");
    seedResult(result);
    renderResult({ resultId: result.id });

    fireEvent.click(screen.getByRole("button", { name: /상세 리포트 보기/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/report", { state: { resultId: "r_1_FPC" } });

    fireEvent.click(screen.getByRole("button", { name: /공유하기/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/share", { state: { resultId: "r_1_FPC" } });

    fireEvent.click(screen.getByRole("button", { name: /친구와 궁합 보기/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/compat", { state: { resultId: "r_1_FPC" } });
  });

  it("AC-5[P1]: 팁 카드 아래에 AdSlot 배너가 정확히 1개 렌더된다", () => {
    const result = buildResult("r_1_FPC");
    seedResult(result);
    const { container } = renderResult({ resultId: result.id });

    const ads = container.querySelectorAll("[data-ad-group-id]");
    expect(ads).toHaveLength(1);

    const tipsCard = screen.getByTestId("tips-card");
    const position = tipsCard.compareDocumentPosition(ads[0]);
    expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });

  it("AC-5[P1]: location.state 없이(새로고침) 진입해도 localStorage에 저장된 결과가 동일하게 복원된다", () => {
    const result = buildResult("r_1_FPC");
    seedResult(result);

    renderResult();

    expect(screen.getByTestId("persona-card")).toBeInTheDocument();
    expect(within(screen.getByTestId("persona-card")).getByText(PERSONAS.FPC.name)).toBeInTheDocument();
    expect(screen.queryByText("아직 진단 결과가 없어요")).not.toBeInTheDocument();
  });
});
