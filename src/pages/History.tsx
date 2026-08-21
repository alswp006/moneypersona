import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Top, Tab, Spacing, AlertDialog, Toast } from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { AdSlot } from '@/components/AdSlot';
import { ResultHistoryList } from '@/components/ResultHistoryList';
import { CompatHistoryList } from '@/components/CompatHistoryList';
import { getItem, setItem, removeItem } from '@/lib/storage';
import type { QuizResult, CompatRecord } from '@/lib/types';

const RESULT_HISTORY_KEY = 'mp.result.history';
const RESULT_LATEST_KEY = 'mp.result.latest';
const COMPAT_HISTORY_KEY = 'mp.compat.history';

const TAB_ITEMS = [
  { label: '홈', path: '/' },
  { label: '궁합', path: '/compat' },
  { label: '기록', path: '/history' },
];

// 배열이어야 할 저장값이 손상(비배열·잘못된 JSON)됐으면 예외 없이 빈 배열로 복구하고
// 해당 key를 삭제한다 — console.error 없이 조용히 정상 상태로 되돌린다.
function loadArray<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as T[];
  } catch {
    /* 잘못된 JSON — 아래에서 정리 */
  }
  removeItem(key);
  return [];
}

function safeHaptic(type: 'success' | 'tickWeak') {
  try {
    Promise.resolve(generateHapticFeedback({ type })).catch(() => {});
  } catch {
    /* WebView 밖에서는 throw — 무시 */
  }
}

export default function History() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>(() => loadArray<QuizResult>(RESULT_HISTORY_KEY));
  const [compats] = useState<CompatRecord[]>(() => loadArray<CompatRecord>(COMPAT_HISTORY_KEY));
  const [deleteTarget, setDeleteTarget] = useState<QuizResult | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) return;
    const timer = setTimeout(() => setToastOpen(false), 2000);
    return () => clearTimeout(timer);
  }, [toastOpen]);

  const sortedResults = [...results].sort((a, b) => b.createdAt - a.createdAt);
  const sortedCompats = [...compats].sort((a, b) => b.createdAt - a.createdAt);

  function selectTab(index: number) {
    if (index === tabIndex) return;
    safeHaptic('tickWeak');
    setTabIndex(index);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const next = results.filter((r) => r.id !== deleteTarget.id);
    setResults(next);
    setItem(RESULT_HISTORY_KEY, next);

    const latest = getItem<QuizResult>(RESULT_LATEST_KEY);
    if (latest?.id === deleteTarget.id) {
      removeItem(RESULT_LATEST_KEY);
    }

    setDeleteTarget(null);
    safeHaptic('success');
    setToastOpen(true);
  }

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>내 기록</Top.TitleParagraph>} />}
      bottom={<FloatingTabBar items={TAB_ITEMS} />}
    >
      <Tab onChange={(index: number) => selectTab(index)}>
        <Tab.Item selected={tabIndex === 0} onClick={() => selectTab(0)}>
          진단 기록
        </Tab.Item>
        <Tab.Item selected={tabIndex === 1} onClick={() => selectTab(1)}>
          궁합 기록
        </Tab.Item>
      </Tab>

      <Spacing size={16} />

      {tabIndex === 0 ? (
        <ResultHistoryList
          items={sortedResults}
          onSelect={(id) => {
            safeHaptic('tickWeak');
            navigate('/result', { state: { resultId: id } });
          }}
          onDeleteRequest={(item) => setDeleteTarget(item)}
          onEmptyCta={() => navigate('/quiz/1')}
        />
      ) : (
        <CompatHistoryList
          items={sortedCompats}
          onSelect={(item) => {
            safeHaptic('tickWeak');
            navigate('/compat', { state: { prefillCode: item.friendCode } });
          }}
          onEmptyCta={() => navigate('/compat')}
        />
      )}

      <Spacing size={24} />

      <AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID ?? ''} />

      <Spacing size={80} />

      <AlertDialog
        open={!!deleteTarget}
        title="이 기록을 지울까요?"
        description="지운 기록은 되돌릴 수 없어요."
        alertButton={<AlertDialog.AlertButton onClick={confirmDelete}>삭제</AlertDialog.AlertButton>}
        onClose={() => setDeleteTarget(null)}
      />

      <Toast open={toastOpen} text="기록을 삭제했어요" position="bottom" />
    </ScreenScaffold>
  );
}
