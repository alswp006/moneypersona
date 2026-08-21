import { ListRow, Chip, Button, Asset } from '@toss/tds-mobile';
import type { CompatRecord } from '@/lib/types';
import { EmptyState } from './StateView';

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 궁합 기록 리스트 — 최신순 ListRow(친구 캐릭터·날짜·코드) + 등급 Chip.
 * 정렬은 상위(History)에서 처리된 배열을 그대로 렌더한다.
 */
export function CompatHistoryList({
  items,
  onSelect,
  onEmptyCta,
}: {
  items: CompatRecord[];
  onSelect: (item: CompatRecord) => void;
  onEmptyCta: () => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Asset.ContentIcon name="iconHeartRegular" alt="궁합 기록 없음" />}
        title="아직 비교한 친구가 없어요"
        description="친구 코드를 입력하면 궁합을 바로 확인할 수 있어요"
        action={
          <Button variant="weak" onClick={onEmptyCta}>
            궁합 보러가기
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map((item) => {
        const texts = (
          <ListRow.Texts
            type="2RowTypeA"
            top={`${item.friendPersonaId} 친구`}
            bottom={`${formatDate(item.createdAt)} · ${item.friendCode}`}
          />
        );
        const chip = (
          <Chip kind="action" variant="weak">
            {`${item.grade} ${item.score}점`}
          </Chip>
        );

        return (
          <ListRow
            key={item.id}
            data-testid="history-compat-row"
            onClick={() => onSelect(item)}
            contents={texts}
            right={chip}
            style={{
              minHeight: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {texts}
            {chip}
          </ListRow>
        );
      })}
    </div>
  );
}
