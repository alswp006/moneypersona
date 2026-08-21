/**
 * Packet 0011: 계산 화면 (`/quiz/calculating`) — 1,200ms 연출 · 결과 생성 및 저장
 *
 * SPEC: F3(계산 연출) AC-3/AC-4, S3 화면 정의
 *
 * draft.answers 12개를 computeScores → toPersonaId → makeCode로 계산해 QuizResult를
 * 만들어 저장한 뒤 1,200ms 연출 후 /result로 replace 이동한다. 미완성 draft(answers에
 * null 포함)면 결과를 만들지 않고 첫 미응답 문항으로 되돌린다.
 *
 * AC Summary:
 * 1. 마운트 후 1,200ms(±150ms) 시점에 navigate('/result', {replace:true, state}) 정확히 1회
 * 2. 저장된 QuizResult가 순수 함수(computeScores/toPersonaId/makeCode) 결과와 일치
 * 3. mp.result.latest 갱신 + mp.result.history 맨 앞 추가 + mp.quiz.draft 삭제
 * 4. answers에 null 포함 → 결과 미생성 + 첫 null 인덱스+1 스텝으로 replace 이동
 * 5. StrictMode 이중 마운트에도 결과 중복 저장 없음(history 증가량 1건) + 언마운트 시 타이머 정리
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { mockAll, mockNavigate } from "@/__tests__/__helpers__/mocks";
import type { QuizDraft, QuizResult } from "@/lib/types";
import { computeScores, toPersonaId } from "@/domain/scoring";
import { makeCode } from "@/domain/code";

mockAll();

import Calculating from "@/pages/Calculating";

const DRAFT_KEY = "mp.quiz.draft";
const RESULT_LATEST_KEY = "mp.result.latest";
const RESULT_HISTORY_KEY = "mp.result.history";

function seedFullDraft(answers: Array<0 | 1> = Array(12).fill(1) as Array<0 | 1>) {
  const draft: QuizDraft = {
    version: 1,
    answers: answers as Array<0 | 1 | null>,
    updatedAt: 1_700_000_000_000,
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  return draft;
}

function renderCalculating() {
  return render(
    React.createElement(MemoryRouter, null, React.createElement(Calculating)),
  );
}

describe("계산 화면 (`/quiz/calculating`) — 1,200ms 연출 · 결과 생성 및 저장", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("AC-1[P0]: 마운트 1,200ms 후 navigate('/result', {replace:true, state:{resultId}})가 정확히 1회 호출된다", () => {
    seedFullDraft();
    renderCalculating();

    vi.advanceTimersByTime(1050);
    expect(mockNavigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      "/result",
      expect.objectContaining({
        replace: true,
        state: expect.objectContaining({ resultId: expect.any(String) }),
      }),
    );
  });

  it("AC-2[P0]: 저장된 QuizResult가 computeScores/toPersonaId/makeCode 결과와 일치하고 id·reportUnlocked가 규격을 만족한다", () => {
    const answers = seedFullDraft().answers as Array<0 | 1>;
    renderCalculating();
    vi.advanceTimersByTime(1200);

    const expectedScores = computeScores(answers);
    const expectedPersonaId = toPersonaId(expectedScores);
    const expectedCode = makeCode(expectedPersonaId);

    const saved = JSON.parse(localStorage.getItem(RESULT_LATEST_KEY) ?? "null") as QuizResult;
    expect(saved).not.toBeNull();
    expect(saved.personaId).toBe(expectedPersonaId);
    expect(saved.scores).toEqual(expectedScores);
    expect(saved.code).toBe(expectedCode);
    expect(saved.answers).toEqual(answers);
    expect(saved.reportUnlocked).toBe(false);
    expect(saved.id).toMatch(/^r_\d+_[a-z0-9]{4}$/);
  });

  it("AC-3[P0]: 저장 후 mp.result.latest 갱신, mp.result.history 맨 앞 추가, mp.quiz.draft는 삭제된다", () => {
    seedFullDraft();
    localStorage.setItem(
      RESULT_HISTORY_KEY,
      JSON.stringify([
        {
          version: 1,
          id: "r_1690000000000_ab12",
          personaId: "FIR",
          scores: { spend: 0, plan: 0, risk: 0 },
          answers: Array(12).fill(0),
          code: "FIRZZ",
          createdAt: 1_690_000_000_000,
          reportUnlocked: false,
        },
      ]),
    );

    renderCalculating();
    vi.advanceTimersByTime(1200);

    const latest = JSON.parse(localStorage.getItem(RESULT_LATEST_KEY) ?? "null") as QuizResult;
    const history = JSON.parse(localStorage.getItem(RESULT_HISTORY_KEY) ?? "[]") as QuizResult[];

    expect(latest.personaId).toBe("TPS");
    expect(history).toHaveLength(2);
    expect(history[0].id).toBe(latest.id);
    expect(history[1].personaId).toBe("FIR");
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("AC-4[P0]: answers에 null이 있으면 결과를 만들지 않고 첫 null 인덱스+1 스텝으로 replace 이동한다", () => {
    const answers: Array<0 | 1 | null> = [1, 1, 0, null, null, null, null, null, null, null, null, null];
    const draft: QuizDraft = { version: 1, answers, updatedAt: 1_700_000_000_000 };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

    renderCalculating();
    vi.advanceTimersByTime(1200);

    expect(mockNavigate).toHaveBeenCalledWith("/quiz/4", { replace: true });
    expect(localStorage.getItem(RESULT_LATEST_KEY)).toBeNull();
    expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();
  });

  it("AC-5[P1]: StrictMode 이중 마운트에서도 mp.result.history 증가량은 정확히 1건이다", () => {
    seedFullDraft();
    localStorage.setItem(RESULT_HISTORY_KEY, JSON.stringify([]));

    render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(MemoryRouter, null, React.createElement(Calculating)),
      ),
    );

    vi.advanceTimersByTime(1200);

    const history = JSON.parse(localStorage.getItem(RESULT_HISTORY_KEY) ?? "[]") as QuizResult[];
    expect(history).toHaveLength(1);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("AC-5[P1]: 1,200ms 이전에 언마운트되면 타이머가 정리되어 결과 저장·navigate가 실행되지 않는다", () => {
    seedFullDraft();
    const { unmount } = renderCalculating();

    vi.advanceTimersByTime(600);
    unmount();
    vi.advanceTimersByTime(1200);

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(localStorage.getItem(RESULT_LATEST_KEY)).toBeNull();
  });
});
