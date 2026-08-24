import type { Question } from "@/lib/types";

export const QUESTIONS: readonly Question[] = [
  {
    id: 1,
    axis: "A1",
    text: "월급날 가장 먼저 하는 일은?",
    choices: [
      { id: "a", label: "저축·투자 계좌로 이체한다", score: 1 },
      { id: "b", label: "사고 싶던 걸 결제한다", score: 0 },
    ],
  },
  {
    id: 2,
    axis: "A1",
    text: "평일 커피값은?",
    choices: [
      { id: "a", label: "회사 탕비실이나 편의점", score: 1 },
      { id: "b", label: "매일 카페에서 사 마신다", score: 0 },
    ],
  },
  {
    id: 3,
    axis: "A1",
    text: "세일 알림을 봤다",
    choices: [
      { id: "a", label: "필요 없으면 안 산다", score: 1 },
      { id: "b", label: "일단 장바구니에 담는다", score: 0 },
    ],
  },
  {
    id: 4,
    axis: "A1",
    text: "20분 더 걸리지만 요금은 1/5",
    choices: [
      { id: "a", label: "지하철을 탄다", score: 1 },
      { id: "b", label: "택시를 탄다", score: 0 },
    ],
  },
  {
    id: 5,
    axis: "A2",
    text: "여행을 갈 때 나는",
    choices: [
      { id: "a", label: "일정표를 미리 만든다", score: 1 },
      { id: "b", label: "가서 그때그때 정한다", score: 0 },
    ],
  },
  {
    id: 6,
    axis: "A2",
    text: "가계부는?",
    choices: [
      { id: "a", label: "매달 기록하고 점검한다", score: 1 },
      { id: "b", label: "쓰지 않는다", score: 0 },
    ],
  },
  {
    id: 7,
    axis: "A2",
    text: "큰 지출을 앞두고",
    choices: [
      { id: "a", label: "최소 3곳을 비교한다", score: 1 },
      { id: "b", label: "마음에 들면 바로 산다", score: 0 },
    ],
  },
  {
    id: 8,
    axis: "A2",
    text: "다음 달 고정지출 금액을",
    choices: [
      { id: "a", label: "대략 알고 있다", score: 1 },
      { id: "b", label: "모른다", score: 0 },
    ],
  },
  {
    id: 9,
    axis: "A3",
    text: "여윳돈 100만 원이 생기면",
    choices: [
      { id: "a", label: "예적금·파킹통장에 넣는다", score: 1 },
      { id: "b", label: "주식·코인 등에 투자한다", score: 0 },
    ],
  },
  {
    id: 10,
    axis: "A3",
    text: "투자 원금이 20% 하락하면",
    choices: [
      { id: "a", label: "정리하고 예금으로 옮긴다", score: 1 },
      { id: "b", label: "추가로 더 매수한다", score: 0 },
    ],
  },
  {
    id: 11,
    axis: "A3",
    text: "새로 나온 금융상품을 보면",
    choices: [
      { id: "a", label: "검증된 뒤에 가입한다", score: 1 },
      { id: "b", label: "먼저 써보고 판단한다", score: 0 },
    ],
  },
  {
    id: 12,
    axis: "A3",
    text: "수입을 늘릴 기회가 있다면",
    choices: [
      { id: "a", label: "안정적인 월급이 최고다", score: 1 },
      { id: "b", label: "리스크가 있어도 도전한다", score: 0 },
    ],
  },
];

export function getQuestion(index: number): Question | null {
  if (typeof index !== "number" || !Number.isInteger(index)) return null;
  if (index < 0 || index >= QUESTIONS.length) return null;
  return QUESTIONS[index];
}
