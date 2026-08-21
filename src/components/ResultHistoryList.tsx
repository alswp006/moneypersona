import type { MouseEvent } from 'react';
import { ListRow, Paragraph, Button, Asset } from '@toss/tds-mobile';
import type { QuizResult } from '@/lib/types';
import { EmptyState } from './StateView';
import { Sparkline } from './Sparkline';

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 진단 기록 리스트 — 최신순 ListRow(캐릭터·날짜·코드) + 삭제 버튼.
 * 정렬은 상위(History)에서 처리된 배열을 그대로 렌더한다.
 */
export function ResultHistoryList({
  items,
  onSelect,
  onDeleteRequest,
  onEmptyCta,
}: {
  items: QuizResult[];
  onSelect: (id: string) => void;
  onDeleteRequest: (item: QuizResult) => void;
  onEmptyCta: () => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Asset.ContentIcon name="iconClockRegular" alt="진단 기록 없음" />}
        title="아직 기록이 없어요"
        description="12개 질문에 답하면 소비 성향을 진단해 드려요"
        action={
          <Button variant="weak" onClick={onEmptyCta}>
            테스트 시작하기
          </Button>
        }
      />
    );
  }

  // 소비축 점수 추이는 3건 이상일 때만 의미가 있다 — 시간순(오래된→최신)으로 정렬해 표시.
  const spendTrend =
    items.length >= 3
      ? [...items].sort((a, b) => a.createdAt - b.createdAt).map((r) => r.scores.spend)
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {spendTrend ? (
        <div style={{ padding: '8px 4px 16px' }}>
          <Paragraph.Text typography="st13" color="secondary">
            소비축 점수 추이
          </Paragraph.Text>
          <Sparkline data={spendTrend} testId="history-spend-sparkline" />
        </div>
      ) : null}

      {items.map((item) => {
        const texts = (
          <ListRow.Texts
            type="2RowTypeA"
            top={item.personaId}
            bottom={`${formatDate(item.createdAt)} · ${item.code}`}
          />
        );
        const deleteButton = (
          <Button
            variant="weak"
            size="small"
            data-testid="history-delete-button"
            aria-label="기록 삭제"
            style={{ minWidth: 44, minHeight: 44 }}
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onDeleteRequest(item);
            }}
          >
            삭제
          </Button>
        );

        return (
          <ListRow
            key={item.id}
            data-testid="history-result-row"
            onClick={() => onSelect(item.id)}
            contents={texts}
            right={deleteButton}
            style={{
              minHeight: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {texts}
            {deleteButton}
          </ListRow>
        );
      })}
    </div>
  );
}
