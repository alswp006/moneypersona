/**
 * Packet 0013: 리포트 부품 — 리워드 광고 게이트 · 3축 코멘트/액션플랜 콘텐츠
 *
 * ReportGate: TossRewardAd(리워드 광고)로 상세 리포트를 게이팅.
 *   - 미해제 상태: 잠금 안내 + '광고 보고 리포트 열기' 버튼만 노출
 *   - 시청 완료: onUnlock 1회 호출 + children(ReportContent) 즉시 노출
 *   - 로드 실패/중도 이탈: Toast + '다시 시도' 버튼, reportUnlocked는 false 유지
 * ReportContent: 3축 코멘트(spend/plan/risk) + 액션플랜 4단계 렌더.
 *
 * @apps-in-toss/web-framework는 loadFullScreenAd/showFullScreenAd의 onEvent/onError를
 * 테스트에서 직접 제어하기 위해 이 파일에서 자체 mock을 사용한다(공용 mockAppsInToss()는
 * onEvent를 즉시 자동 발화해 실패/이탈 분기를 테스트할 수 없다).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { mockTds, mockRouter } from "@/__tests__/__helpers__/mocks";

mockTds();
mockRouter();

const loadFullScreenAd = vi.fn();
const showFullScreenAd = vi.fn();

vi.mock("@apps-in-toss/web-framework", () => ({
  loadFullScreenAd: (...args: unknown[]) => loadFullScreenAd(...args),
  showFullScreenAd: (...args: unknown[]) => showFullScreenAd(...args),
}));

import { ReportGate } from "@/components/ReportGate";
import { ReportContent } from "@/components/ReportContent";

const mockReport = {
  spendComment: "당신은 계획적으로 소비를 관리해요.",
  planComment: "장기 목표를 세우고 차근차근 실행해요.",
  riskComment: "안정적인 선택을 선호하는 편이에요.",
  actionPlan: [
    "예산 앱으로 매일 지출 기록하기",
    "비상금 300만 원 만들기",
    "적금 자동이체 설정하기",
    "3개월마다 소비 패턴 점검하기",
  ] as [string, string, string, string],
};

function LockedChildMarker() {
  return React.createElement(
    "div",
    { "data-testid": "report-content-marker" },
    "리포트 내용",
  );
}

describe("리포트 부품 — 리워드 광고 게이트 · 3축 코멘트/액션플랜 콘텐츠", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_TOSS_AD_SLOT_ID", "report-unlock-slot");
  });

  it("AC-1[P0]: reportUnlocked=false면 잠금 안내와 전체폭 버튼만 보이고 ReportContent는 렌더되지 않는다", () => {
    const onUnlock = vi.fn();
    render(
      React.createElement(
        ReportGate,
        { reportUnlocked: false, onUnlock },
        React.createElement(LockedChildMarker),
      ),
    );

    const watchButton = screen.getByRole("button", { name: "광고 보고 리포트 열기" });
    expect(watchButton).toBeInTheDocument();
    expect(watchButton.getAttribute("display")).toBe("block");
    expect(screen.queryByTestId("report-content-marker")).not.toBeInTheDocument();
  });

  it("AC-2[P0]: 광고 시청 완료 시 onUnlock이 정확히 1회 호출되고 ReportContent가 즉시 표시된다", () => {
    loadFullScreenAd.mockImplementation((opts: { onEvent?: (e: unknown) => void }) => {
      opts.onEvent?.({ type: "loaded" });
    });
    let showOpts: { onEvent?: (e: unknown) => void; onError?: (e: unknown) => void } = {};
    showFullScreenAd.mockImplementation((opts: typeof showOpts) => {
      showOpts = opts;
    });

    const onUnlock = vi.fn();
    render(
      React.createElement(
        ReportGate,
        { reportUnlocked: false, onUnlock },
        React.createElement(LockedChildMarker),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "광고 보고 리포트 열기" }));
    expect(showFullScreenAd).toHaveBeenCalledTimes(1);

    showOpts.onEvent?.({ type: "rewarded" });

    expect(onUnlock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("report-content-marker")).toBeInTheDocument();
  });

  it("AC-3[P0]: 광고 로드 실패 시 Toast와 '다시 시도' 버튼이 보이고 onUnlock은 호출되지 않는다", () => {
    loadFullScreenAd.mockImplementation((opts: { onError?: (e: unknown) => void }) => {
      opts.onError?.({ message: "load failed" });
    });

    const onUnlock = vi.fn();
    render(
      React.createElement(
        ReportGate,
        { reportUnlocked: false, onUnlock },
        React.createElement(LockedChildMarker),
      ),
    );

    expect(screen.getByText("광고를 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(onUnlock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("report-content-marker")).not.toBeInTheDocument();
  });

  it("AC-3[P0]: 광고 시청 중도 이탈 시 Toast와 '다시 시도' 버튼이 보이고 reportUnlocked는 false로 유지된다", () => {
    loadFullScreenAd.mockImplementation((opts: { onEvent?: (e: unknown) => void }) => {
      opts.onEvent?.({ type: "loaded" });
    });
    let showOpts: { onError?: (e: unknown) => void } = {};
    showFullScreenAd.mockImplementation((opts: typeof showOpts) => {
      showOpts = opts;
    });

    const onUnlock = vi.fn();
    render(
      React.createElement(
        ReportGate,
        { reportUnlocked: false, onUnlock },
        React.createElement(LockedChildMarker),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "광고 보고 리포트 열기" }));
    showOpts.onError?.({ message: "dismissed" });

    expect(screen.getByText("광고를 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(onUnlock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("report-content-marker")).not.toBeInTheDocument();
  });

  it("AC-4[P0]: ReportContent는 3축 코멘트와 액션플랜 4단계를 모두 렌더한다", () => {
    render(
      React.createElement(ReportContent, {
        personaName: "알뜰형 다람쥐",
        matchScore: 87,
        report: mockReport,
      }),
    );

    expect(screen.getByText(mockReport.spendComment)).toBeInTheDocument();
    expect(screen.getByText(mockReport.planComment)).toBeInTheDocument();
    expect(screen.getByText(mockReport.riskComment)).toBeInTheDocument();

    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    for (const step of mockReport.actionPlan) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
    expect(screen.getByText(/87/)).toBeInTheDocument();
  });

  it("AC-5[P0]: 외부 광고 SDK import가 없고 slotId는 import.meta.env.VITE_TOSS_AD_SLOT_ID에서 주입된다", () => {
    loadFullScreenAd.mockImplementation(() => {});

    render(
      React.createElement(
        ReportGate,
        { reportUnlocked: false, onUnlock: vi.fn() },
        React.createElement(LockedChildMarker),
      ),
    );

    expect(loadFullScreenAd).toHaveBeenCalledWith(
      expect.objectContaining({ slotId: "report-unlock-slot" }),
    );

    const gateSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/ReportGate.tsx"),
      "utf-8",
    );
    const contentSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/ReportContent.tsx"),
      "utf-8",
    );
    const forbidden = /admob|adsense|google-mobile-ads|react-native-ads/i;
    expect(forbidden.test(gateSource)).toBe(false);
    expect(forbidden.test(contentSource)).toBe(false);
    expect(gateSource.includes("import.meta.env.VITE_TOSS_AD_SLOT_ID")).toBe(true);
  });
});
