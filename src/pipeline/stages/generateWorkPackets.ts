import type { WorkPacket } from "../../lib/contract";
import { toArray } from "../utils/toArray";
import { ROUTES, type RouteDefinition } from "../../routes/index";

export interface GenerateWorkPacketsInput {
  stageIndex?: number;
  items?: unknown;
}

interface ScreenPacketContent {
  title: string;
  description: string;
  files: string[];
  acceptanceCriteria: string[];
}

/** 화면 이름(ROUTES.name) → 워크패킷 메타데이터. SPEC 전 화면 커버리지 복구용. */
const SCREEN_CONTENT: Record<string, ScreenPacketContent> = {
  quiz: {
    title: "진단 퀴즈 화면",
    description:
      "QUESTIONS 12문항을 문항당 선택지 4개로 보여주고 진행률을 표시하는 퀴즈 화면",
    files: ["src/pages/Quiz.tsx", "src/constants/questions.ts"],
    acceptanceCriteria: [
      "12문항이 순서대로 출제되고 문항당 선택지 4개를 제공한다",
      "진행률(예: 3/12)이 화면에 표시된다",
      "모든 문항 응답 후 결과 화면으로 이동한다",
    ],
  },
  result: {
    title: "결과 화면",
    description:
      "응답을 바탕으로 8개 머니 페르소나 코드 중 하나를 산출해 요약과 팁 3개를 보여주는 결과 화면",
    files: ["src/pages/Result.tsx", "src/constants/characters.ts"],
    acceptanceCriteria: [
      "8개 캐릭터 코드 중 하나가 산출되어 이름과 요약이 표시된다",
      "절약·소비 팁 3개가 리스트로 표시된다",
      "리포트 화면과 궁합 화면으로 이동하는 액션을 제공한다",
    ],
  },
  report: {
    title: "리포트 화면",
    description: "축별 점수와 퍼센트, 강점·리스크를 보여주는 상세 리포트 화면",
    files: ["src/pages/Report.tsx"],
    acceptanceCriteria: [
      "3개 축(소비-저축, 계획-즉흥, 위험-안정)별 점수와 퍼센트를 표시한다",
      "강점과 리스크 요약을 구분해 보여준다",
    ],
  },
  compatibility: {
    title: "궁합 화면",
    description: "내 캐릭터와 다른 캐릭터 간의 궁합을 비교해 보여주는 화면",
    files: ["src/pages/Compatibility.tsx"],
    acceptanceCriteria: [
      "8개 캐릭터 중 비교 대상을 선택할 수 있다",
      "궁합 점수와 설명이 표시된다",
    ],
  },
  home: {
    title: "홈/기록 화면",
    description:
      "localStorage 기반 QuizDraft와 과거 결과 이력을 보여주는 홈 화면",
    files: ["src/pages/Home.tsx", "src/lib/storage.ts"],
    acceptanceCriteria: [
      "진행 중인 QuizDraft가 있으면 이어하기 CTA를 보여준다",
      "과거 결과 이력을 리스트로 보여주고 비어있으면 빈 상태 UI를 보여준다",
      "퀴즈 시작하기 CTA로 quiz 라우트로 이동한다",
    ],
  },
};

/**
 * SCREEN_CONTENT에 아직 항목이 없는 라우트를 위한 대체 콘텐츠.
 * 라우트가 추가됐는데 콘텐츠를 빠뜨려도 크래시 대신 비어있지 않은 패킷을 만든다 —
 * 여기서 던지면 runBatchJob이 예외를 흡수해 packets: []가 되고,
 * 이 패킷이 없애려던 "패킷 0개" 상태로 되돌아간다.
 */
function fallbackContent(route: RouteDefinition): ScreenPacketContent {
  return {
    title: `${route.name} 화면`,
    description: `${route.path} 라우트 화면 — 상세 명세 미작성(SCREEN_CONTENT에 항목 추가 필요)`,
    files: [`src/pages/${route.name}.tsx`],
    acceptanceCriteria: [`${route.path} 라우트가 렌더되고 홈으로 돌아갈 경로가 있다`],
  };
}

/**
 * SPEC의 5개 화면(퀴즈/결과/리포트/궁합/홈)을 각 1개 이상의 워크패킷으로 생성한다.
 * ROUTES를 그대로 순회하므로 라우트 커버리지가 항상 보장된다.
 */
function generateSpecScreenPackets(): WorkPacket[] {
  // ROUTES는 모듈 경계를 넘어온 값이다 — 순환 import 등으로 undefined가 되어도
  // 여기서 TypeError로 죽지 않도록 toArray를 거친다.
  return toArray<RouteDefinition>(ROUTES).map((route, index) => {
    const content = SCREEN_CONTENT[route.name] ?? fallbackContent(route);
    return {
      id: `packet-route-${route.name}`,
      stageIndex: index,
      input: { route: route.path, name: route.name },
      metadata: {
        route: route.path,
        title: content.title,
        description: content.description,
        files: content.files,
        acceptanceCriteria: content.acceptanceCriteria,
      },
    };
  });
}

/**
 * 워크패킷을 생성한다.
 * - 인자 없이 호출하면 SPEC 5개 화면 커버리지 패킷을 생성한다.
 * - { items } 형태로 호출하면(파이프라인 스테이지 체이닝용) items를 WorkPacket[]으로 정규화한다.
 *   items가 undefined/null/객체 등 배열이 아니어도 toArray로 흡수해 크래시하지 않는다.
 */
export function generateWorkPackets(input?: unknown): WorkPacket[] {
  const { stageIndex = 0, items } = (input && typeof input === "object"
    ? (input as GenerateWorkPacketsInput)
    : {}) as GenerateWorkPacketsInput;

  if (items === undefined) {
    return generateSpecScreenPackets();
  }

  return toArray(items).map((item, index) => ({
    id: `packet-${stageIndex}-${index}`,
    stageIndex,
    input: item,
  }));
}

/**
 * 파이프라인 결과가 성공인지 판정한다.
 * 패킷 배열이 비었거나 에러가 하나라도 있으면 성공으로 마킹하지 않는다.
 */
export function isPipelineSuccessful(result: {
  packets: unknown[];
  errors?: unknown[];
}): boolean {
  const packets = toArray(result?.packets);
  const errors = toArray(result?.errors);
  return packets.length > 0 && errors.length === 0;
}
