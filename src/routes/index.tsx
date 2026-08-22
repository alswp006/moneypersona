export interface RouteDefinition {
  name: string;
  path: string;
}

/**
 * 라우팅 진입점 — 퀴즈·결과·리포트·궁합·홈 5개 화면을 등록한다.
 * 각 화면 패킷의 metadata.route는 이 배열의 path와 일치해야 한다.
 */
export const ROUTES: RouteDefinition[] = [
  { name: "home", path: "/" },
  { name: "quiz", path: "/quiz" },
  { name: "result", path: "/result" },
  { name: "report", path: "/report" },
  { name: "compatibility", path: "/compatibility" },
];
