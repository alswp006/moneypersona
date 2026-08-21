import { ListRow, Paragraph, Spacing } from "@toss/tds-mobile";
import { SummaryHero } from "./SummaryHero";
import type { Persona } from "@/lib/types";

interface ReportContentProps {
  /** 캐릭터명 (예: "알뜰형 다람쥐") */
  personaName: string;
  /** 캐릭터 이모지 */
  emoji?: string;
  /** 나와의 매칭도 (0~100) */
  matchScore: number;
  /** 캐릭터의 상세 리포트 섹션 */
  report: Persona["report"];
}

const AXIS_LABELS = ["소비 성향", "계획 성향", "위험 성향"] as const;

/**
 * 상세 리포트 콘텐츠 — 매칭도 히어로 + 3축 코멘트 + 4주 액션플랜.
 * ReportGate 해제 후에만 렌더된다.
 */
export function ReportContent({ personaName, emoji, matchScore, report }: ReportContentProps) {
  const axisComments = [report.spendComment, report.planComment, report.riskComment];

  return (
    <div>
      <SummaryHero
        label="나와의 매칭도"
        value={
          <Paragraph.Text typography="t2">
            {emoji ? `${emoji} ` : ""}
            {personaName}
          </Paragraph.Text>
        }
        caption={`매칭도 ${matchScore}%`}
      />

      <Spacing size={24} />

      {AXIS_LABELS.map((label, idx) => (
        <div key={label}>
          <Paragraph.Text typography="t4">{label}</Paragraph.Text>
          <Spacing size={8} />
          <Paragraph.Text typography="st11" color="secondary">
            {axisComments[idx]}
          </Paragraph.Text>
          <Spacing size={24} />
        </div>
      ))}

      <Paragraph.Text typography="t4">4주 액션플랜</Paragraph.Text>
      <Spacing size={8} />
      {report.actionPlan.map((step, idx) => {
        const texts = <ListRow.Texts type="2RowTypeA" top={`${idx + 1}주차`} bottom={step} />;
        return (
          <ListRow key={step} contents={texts}>
            {texts}
          </ListRow>
        );
      })}
    </div>
  );
}
