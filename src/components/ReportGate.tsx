import { useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Asset, Button, Paragraph, Spacing, Toast } from "@toss/tds-mobile";
import { generateHapticFeedback, loadFullScreenAd, showFullScreenAd } from "@apps-in-toss/web-framework";

interface ReportGateProps {
  /** 저장된 해제 상태(QuizResult.reportUnlocked). true면 게이트 없이 children 즉시 노출 */
  reportUnlocked: boolean;
  /** 광고 시청 완료 시 1회 호출 — 호출부가 QuizResult.reportUnlocked를 true로 영속화 */
  onUnlock: () => void;
  /** 해제 후 보여줄 콘텐츠(ReportContent) */
  children: ReactNode;
}

type Status = "loading" | "ready" | "showing" | "error";

function fireHaptic() {
  try {
    Promise.resolve(generateHapticFeedback({ type: "success" })).catch(() => {});
  } catch {
    /* WebView 밖(브라우저/검수자 PC/jsdom) — 무시 */
  }
}

/**
 * 리워드 광고로 상세 리포트를 게이팅.
 * 광고 로드/시청은 loadFullScreenAd/showFullScreenAd(imperative SDK)를 직접 호출한다.
 * 실패·중도 이탈 시 자동 해제하지 않고 Toast + '다시 시도'로 재시도만 제공한다
 * (템플릿 TossRewardAd의 자동-언락 정책과 달리, 상세 리포트는 시청 완료 시에만 해제).
 */
export function ReportGate({ reportUnlocked, onUnlock, children }: ReportGateProps) {
  const [unlocked, setUnlocked] = useState(reportUnlocked);
  const [status, setStatus] = useState<Status>("loading");
  const slotId = import.meta.env.VITE_TOSS_AD_SLOT_ID;

  useEffect(() => {
    if (unlocked) return;
    loadAd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadAd() {
    setStatus("loading");
    console.log("DEBUG loadAd() invoked, loadFullScreenAd=", loadFullScreenAd);
    try {
      loadFullScreenAd({
        slotId,
        onEvent: () => { console.log("DEBUG onEvent(loaded) fired"); setStatus("ready"); },
        onError: () => { console.log("DEBUG onError fired"); setStatus("error"); },
      } as Parameters<typeof loadFullScreenAd>[0]);
    } catch (e) {
      console.log("DEBUG loadAd threw", e);
      setStatus("error");
    }
  }

  function handleWatch() {
    fireHaptic();
    setStatus("showing");
    try {
      showFullScreenAd({
        slotId,
        onEvent: (event: { type?: string }) => {
          if (event?.type === "rewarded" || event?.type === "completed") {
            setUnlocked(true);
            onUnlock();
          } else {
            setStatus("error");
          }
        },
        onError: () => setStatus("error"),
      } as Parameters<typeof showFullScreenAd>[0]);
    } catch {
      setStatus("error");
    }
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px" }}>
      <Asset.ContentIcon name="iconLockFilled" alt="잠금" />
      <Spacing size={16} />
      <Paragraph.Text typography="t4">짧은 광고를 보면 상세 리포트가 열려요</Paragraph.Text>
      <Spacing size={16} />
      {status === "error" ? (
        <Button variant="weak" size="large" display="block" onClick={loadAd}>
          다시 시도
        </Button>
      ) : (
        <Button
          variant="fill"
          size="large"
          display="block"
          loading={status === "loading" || status === "showing"}
          onClick={handleWatch}
        >
          광고 보고 리포트 열기
        </Button>
      )}
      <Toast open={status === "error"} text="광고를 불러오지 못했어요" position="bottom" />
    </div>
  );
}
