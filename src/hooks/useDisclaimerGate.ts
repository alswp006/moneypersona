import { useCallback, useState } from "react";
import { getItem, setItem } from "@/lib/storage";
import type { AppFlags } from "@/lib/types";

/** 앱 플래그 저장 키 — 온보딩·마지막 결과·고지 확인 여부를 한 덩어리로 보관한다. */
export const FLAGS_KEY = "mp:flags:v1";

const DEFAULT_FLAGS: AppFlags = {
  onboardingSeen: false,
  lastResultId: null,
  disclaimerSeen: false,
};

/**
 * 저장소 값을 스키마 기본값으로 정규화해서 돌려준다.
 * 부분 저장·손상된 JSON·구버전 데이터에서도 항상 완전한 AppFlags가 나온다.
 */
export function readFlags(): AppFlags {
  const raw = getItem<Partial<AppFlags>>(FLAGS_KEY);
  if (raw == null || typeof raw !== "object") return { ...DEFAULT_FLAGS };
  return {
    onboardingSeen: raw.onboardingSeen === true,
    lastResultId: typeof raw.lastResultId === "string" ? raw.lastResultId : null,
    disclaimerSeen: raw.disclaimerSeen === true,
  };
}

/** 고지를 확인했다고 기록한다 — 다른 플래그는 그대로 둔다. */
export function markDisclaimerSeen(): void {
  setItem<AppFlags>(FLAGS_KEY, { ...readFlags(), disclaimerSeen: true });
}

export interface DisclaimerGate {
  /** 최초 방문(고지 미확인)일 때만 true — AlertDialog의 open에 그대로 연결한다. */
  open: boolean;
  /** '확인했어요'에 연결 — 저장 후 다이얼로그를 닫는다. */
  onConfirm: () => void;
}

/**
 * 최초 1회 안내 다이얼로그 게이트.
 *
 * 사용 예:
 *   const { open, onConfirm } = useDisclaimerGate();
 *   <AlertDialog
 *     open={open}
 *     title="결과는 참고용이에요"
 *     description="문항 응답을 규칙에 따라 계산한 결과이며 금융 투자 자문이 아니에요"
 *     onClose={onConfirm}
 *     alertButton={<AlertDialog.AlertButton onClick={onConfirm}>확인했어요</AlertDialog.AlertButton>}
 *   />
 *
 * 초기값을 렌더 시점에 한 번만 읽으므로(useState 초기화 함수) 재방문에는 뜨지 않는다.
 */
export function useDisclaimerGate(): DisclaimerGate {
  const [open, setOpen] = useState<boolean>(() => !readFlags().disclaimerSeen);

  const onConfirm = useCallback(() => {
    markDisclaimerSeen();
    setOpen(false);
  }, []);

  return { open, onConfirm };
}
