import { Paragraph, Spacing } from "@toss/tds-mobile";

/** 고지 문구 — 결과·궁합 등 해석이 오해될 수 있는 화면 하단에 붙인다. */
export const DISCLAIMER_TEXT = "재미로 보는 성향 테스트이며 금융 투자 자문이 아닙니다";

/**
 * 오해 방지 고지 — 문항 응답 기반 결과가 투자 자문으로 읽히지 않도록 한 줄로 알린다.
 *
 * 고지 전용이라 링크·버튼을 넣지 않는다(외부 도메인 이탈은 검수 반려 사유).
 * 결과/궁합 카드 아래에 그대로 얹으면 위아래 여백까지 포함된다.
 */
export default function DisclaimerNotice() {
  return (
    <div style={{ textAlign: "center" }}>
      <Spacing size={12} />
      <Paragraph.Text typography="st13" color="var(--adaptiveGrey600)">
        {DISCLAIMER_TEXT}
      </Paragraph.Text>
      <Spacing size={12} />
    </div>
  );
}
