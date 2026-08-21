import type { Question } from '@/lib/types';

/**
 * 12문항 진단 상수 — id 1~4=spend, 5~8=plan, 9~12=risk.
 * 각 문항 A안(value:1)은 축 앞 글자(T/P/S), B안(value:0)은 뒷 글자(F/I/R)에 대응한다.
 *
 * SPEC: .ai-factory/spec.md § Question — 문항 정적 상수, task.md § Task 2.1
 */
export const QUESTIONS: Question[] = [
  {
    id: 1,
    axis: 'spend',
    text: '친구 생일 선물, 예산은 어떻게 정할까 고민된다',
    options: [
      { key: 'A', label: '예산 정해두고 그 안에서 고른다', value: 1 },
      { key: 'B', label: '마음에 드는 걸로 고민 없이 산다', value: 0 },
    ],
  },
  {
    id: 2,
    axis: 'spend',
    text: '월급 들어온 날, 가장 먼저 하는 일은',
    options: [
      { key: 'A', label: '이번 달 쓸 돈부터 계산해본다', value: 1 },
      { key: 'B', label: '먹고 싶었던 걸 바로 주문한다', value: 0 },
    ],
  },
  {
    id: 3,
    axis: 'spend',
    text: '세일 중인 옷을 발견했을 때 나는',
    options: [
      { key: 'A', label: '필요한 옷인지부터 다시 따져본다', value: 1 },
      { key: 'B', label: '이 가격이면 사야지 싶다', value: 0 },
    ],
  },
  {
    id: 4,
    axis: 'spend',
    text: '카페에서 음료를 고를 때 나는',
    options: [
      { key: 'A', label: '가장 저렴한 사이즈를 고른다', value: 1 },
      { key: 'B', label: '먹고 싶은 사이즈로 고른다', value: 0 },
    ],
  },
  {
    id: 5,
    axis: 'plan',
    text: '주말 일정은 보통 어떻게 잡는 편인가',
    options: [
      { key: 'A', label: '미리 계획을 세워두는 편이다', value: 1 },
      { key: 'B', label: '그때 기분 따라 정하는 편이다', value: 0 },
    ],
  },
  {
    id: 6,
    axis: 'plan',
    text: '여행을 갈 때 나는',
    options: [
      { key: 'A', label: '일정표를 촘촘히 짜두는 편이다', value: 1 },
      { key: 'B', label: '일단 떠나서 정하는 게 좋다', value: 0 },
    ],
  },
  {
    id: 7,
    axis: 'plan',
    text: '이번 달 지출, 기록하고 있는 편인가',
    options: [
      { key: 'A', label: '가계부에 꼬박꼬박 적는다', value: 1 },
      { key: 'B', label: '필요할 때만 얼추 확인한다', value: 0 },
    ],
  },
  {
    id: 8,
    axis: 'plan',
    text: '목표 저축액을 정할 때 나는',
    options: [
      { key: 'A', label: '매달 금액과 기한을 정해둔다', value: 1 },
      { key: 'B', label: '모이는 대로 만족하는 편이다', value: 0 },
    ],
  },
  {
    id: 9,
    axis: 'risk',
    text: '여윳돈이 생기면 나는 보통',
    options: [
      { key: 'A', label: '예금이나 적금에 넣어둔다', value: 1 },
      { key: 'B', label: '주식 같은 투자처를 찾아본다', value: 0 },
    ],
  },
  {
    id: 10,
    axis: 'risk',
    text: '투자 얘기가 나오면 나는',
    options: [
      { key: 'A', label: '원금 지키는 게 먼저라고 생각한다', value: 1 },
      { key: 'B', label: '높은 수익 쪽에 더 끌린다', value: 0 },
    ],
  },
  {
    id: 11,
    axis: 'risk',
    text: '투자한 곳에서 손실이 났을 때 나는',
    options: [
      { key: 'A', label: '바로 정리하고 안전한 곳으로 옮긴다', value: 1 },
      { key: 'B', label: '오를 때까지 좀 더 지켜본다', value: 0 },
    ],
  },
  {
    id: 12,
    axis: 'risk',
    text: '새로운 재테크 상품이 나오면 나는',
    options: [
      { key: 'A', label: '충분히 검증된 다음에 움직인다', value: 1 },
      { key: 'B', label: '남들보다 먼저 시도해보는 편이다', value: 0 },
    ],
  },
];
