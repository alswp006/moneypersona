# TASK — MoneyPersona

> SPEC 기준 28개 작업 패킷. 각 패킷은 10분 이내 완료 가능하며, 완료 시점마다 `tsc --noEmit` + `vite build`가 통과해야 한다.
> 템플릿 제공(신규 구현 금지): `ScreenScaffold`, `SubmitFooter`, `FloatingTabBar`, `AdSlot`, `TossRewardAd`, `SummaryHero`, `MiniBar`, `Sparkline`, `Asset.ContentIcon`
> **파일 소유 규칙**: 하나의 파일은 정확히 하나의 Task만 생성·수정한다. 화면은 "부품 패킷 → 컨테이너 패킷" 순서로 분리되어 있으며, 컨테이너 패킷이 화면 파일(`*Screen.tsx`)을 단독 소유한다.

---

## Epic 1. TypeScript 타입 · 인터페이스

Risk Assessment
- Complexity: Low
- Risk factors: (1) `PersonaId` 템플릿 리터럴 타입(`${AxisSpend}${AxisPlan}${AxisRisk}`)이 8종 유니온으로 전개되지 않으면 `Record<PersonaId, Persona>` 완결성 검사가 무력화된다. (2) 페이지별로 `location.state` 타입을 각자 정의하면 송신/수신 불일치가 발생한다(2026-08-03 SplitMate 실사고 재현 위험). (3) 튜플 길이(strengths 3 / tips 3 / actionPlan 4)를 `string[]`로 느슨하게 두면 상수 테이블 결손이 런타임까지 통과한다.
- Mitigation: 타입 전용 패킷을 최우선 배치해 `RouteState` 단일 소스를 먼저 고정한다. 이후 모든 도메인·페이지 패킷이 이 파일만 import하므로 계약 이탈이 컴파일 타임에 잡힌다. 고정 길이 튜플로 선언해 Epic 2의 상수 결손을 `tsc`가 먼저 막는다.

### Task 1.1 엔티티 타입 + RouteState 계약 정의
- Description: SPEC Data Models의 모든 타입을 런타임 코드 0줄로 선언한다. `AxisSpend`/`AxisPlan`/`AxisRisk`/`PersonaId`, `Persona`, `Question`, `QuizDraft`, `AxisScores`, `QuizResult`, `CompatRecord`, `AppPref`, 스토리지 결과 타입 `SaveOutcome`, 네비게이션 계약 `ResultNavState`/`CompatNavState`/`AppNavState`/`RouteState`를 정의한다. `src/routes/navState.ts`는 `src/lib/types.ts`의 네비 타입을 re-export만 한다(단일 소스 유지).
- DoD:
  - `src/lib/types.ts`에 위 타입이 모두 `export`되고 `tsc --noEmit` 통과
  - `PersonaId` 유니온이 정확히 8개 리터럴로 전개됨 — 타입 테스트 `const _c: Record<PersonaId, 0> = { TPS:0,TPR:0,TIS:0,TIR:0,FPS:0,FPR:0,FIS:0,FIR:0 }`가 컴파일되고, 키 1개를 지우면 컴파일 에러 발생
  - `Persona.strengths` = `[string,string,string]`, `Persona.tips` = `[string,string,string]`, `Persona.report.actionPlan` = `[string,string,string,string]` 고정 길이 튜플
  - `QuizDraft.answers` = `Array<0|1|null>`, `QuizResult.answers` = `Array<0|1>`로 구분됨
  - `SaveOutcome = { ok: true } | { ok: false; reason: 'QUOTA' | 'PARSE' }` 정의
  - `RouteState`가 아래와 정확히 동일하게 정의되고 8개 라우트를 모두 포함:
    `export type RouteState = { "/": null; "/quiz/:step": null; "/quiz/calculating": null; "/result": ResultNavState | null; "/report": ResultNavState | null; "/share": ResultNavState | null; "/compat": CompatNavState | null; "/history": null; }`
  - 모든 저장 모델(`QuizDraft`, `QuizResult`, `CompatRecord`, `AppPref`)이 `version: 1` 리터럴 필드를 가짐 (CP-13)
  - 파일에 런타임 값 선언 0개(순수 타입 모듈), HEX 리터럴 0건
- Covers: [F1-AC-1]
- Files: [src/lib/types.ts, src/routes/navState.ts]
- Depends on: none

---

## Epic 2. 데이터 계층 (상수 · 순수 함수 · 스토리지 · 상태)

Risk Assessment
- Complexity: Medium
- Risk factors: (1) 체크섬 규칙을 잘못 구현하면 `makeCode('TPS') !== 'TPSON'`이 되어 F1-AC-3, F4-AC-1, F6-AC-1~4, F7-AC-1이 연쇄 실패한다. (2) `JSON.parse` 실패·`QuotaExceededError`를 잡지 못하면 CP-8(console.error 0건) 위반으로 검수 반려된다. (3) 상수 테이블(8캐릭터 × 12필드)을 순수 함수와 한 패킷에 묶으면 10분을 반드시 초과한다. (4) `mp.result.history` 20건 절삭이 정렬과 뒤섞이면 오래된 항목이 아니라 최신 항목이 잘린다.
- Mitigation: 상수 2패킷 / 순수 함수 2패킷 / 스토리지 2패킷 / 상태 1패킷으로 분해한다. 체크섬은 8종 전수 라운드트립 테스트를 순수 함수 패킷의 DoD로 못박아 화면 패킷 이전에 검증한다. 저수준 safe wrapper(2.5)를 엔티티 CRUD(2.6)보다 먼저 완성해 try-catch가 단 한 곳에만 존재하도록 강제한다.

### Task 2.1 12문항 상수 테이블
- Description: `QUESTIONS: Question[]` 12개를 작성한다. id 1~4=`spend`, 5~8=`plan`, 9~12=`risk`. 각 문항 `text`는 20~60자, 선택지는 A/B 2개이며 `value: 1`이 축 앞 글자(T/P/S), `value: 0`이 뒷 글자(F/I/R)에 대응하도록 카피를 작성한다.
- DoD:
  - `QUESTIONS.length === 12`이고 `new Set(QUESTIONS.map(q=>q.id)).size === 12`, id 집합이 `{1..12}`와 일치
  - `QUESTIONS.filter(q=>q.axis==='spend').length === 4`, `plan === 4`, `risk === 4`
  - 모든 `text.length`가 20 이상 60 이하
  - 모든 문항의 `options`가 정확히 2개, key는 `['A','B']`, value 집합은 `{0,1}`
  - `src/domain/questions.test.ts`의 4개 단언 전부 green
  - HEX 색상 리터럴 0건, `src/lib/types.ts` 외 import 0건
- Covers: [F1-AC-1]
- Files: [src/domain/questions.ts, src/domain/questions.test.ts]
- Depends on: Task 1.1

### Task 2.2 8캐릭터 상수 테이블
- Description: `PERSONAS: Record<PersonaId, Persona>` 8종을 SPEC 확정 테이블(이름/이모지)대로 작성한다. 각 캐릭터에 `summary`(60~120자), `strengths` 3개, `weakness`, `tips` 3개, `report`(spendComment/planComment/riskComment 각 40~100자 + actionPlan 4단계), `colorToken`을 채운다.
- DoD:
  - `Object.keys(PERSONAS).length === 8`이고 키 집합이 `['TPS','TPR','TIS','TIR','FPS','FPR','FIS','FIR']`와 정확히 일치
  - 8종 각각 `name`/`emoji`가 SPEC 표와 문자열 일치 (예: `PERSONAS.TPS.name === '알뜰형 다람쥐'`, `PERSONAS.TPS.emoji === '🐿️'`)
  - 8종 각각 `strengths.length === 3 && tips.length === 3 && report.actionPlan.length === 4`
  - 8종 각각 `summary.length >= 60 && summary.length <= 120`, `report.spendComment/planComment/riskComment` 각 길이 40 이상 100 이하
  - 8종 각각 `colorToken`이 `/^var\(--tds-color-[a-z]+-\d{3}\)$/` 매치 → HEX 0건 (CP-3)
  - `src/domain/personas.test.ts`의 5개 단언 전부 green
- Covers: [F1-AC-1]
- Files: [src/domain/personas.ts, src/domain/personas.test.ts]
- Depends on: Task 1.1

### Task 2.3 채점 · 캐릭터 판정 순수 함수
- Description: `computeScores(answers)`와 `toPersonaId(scores)`를 구현한다. `computeScores`는 index 0~3을 spend, 4~7을 plan, 8~11을 risk로 합산한다(각 0~4). `toPersonaId`는 축 값 `>= 2`면 앞 글자(T/P/S), `< 2`면 뒷 글자(F/I/R)를 반환한다.
- DoD:
  - `computeScores([1,1,1,1,1,1,1,1,1,1,1,1])` → `{spend:4,plan:4,risk:4}`이고 `toPersonaId` → `'TPS'`
  - `computeScores([1,1,0,0,0,0,0,1,1,1,1,0])` → `{spend:2,plan:1,risk:3}`이고 `toPersonaId` → `'TIS'`
  - `toPersonaId({spend:1,plan:1,risk:1}) === 'FIR'`, `toPersonaId({spend:2,plan:2,risk:2}) === 'TPS'` (경계값 2는 앞 글자)
  - 입력 배열을 변형하지 않음(호출 전후 `answers` deep equal)
  - `Array.prototype.at` / `Object.groupBy` / `structuredClone` 미사용 (CP-9)
  - `src/domain/scoring.test.ts`의 6개 단언 green
- Covers: [F1-AC-2]
- Files: [src/domain/scoring.ts, src/domain/scoring.test.ts]
- Depends on: Task 1.1

### Task 2.4 친구코드 · 궁합 순수 함수
- Description: `makeCode(personaId)`, `parseCode(code)`, `computeCompat(a,b)`를 구현한다. 체크섬: `n = (charCodeSum(personaId) * 7) % 676` → `String.fromCharCode(65+Math.floor(n/26)) + String.fromCharCode(65+(n%26))`. 궁합: `score = 10 + (소비축 동일 ? 30 : 0) + (계획축 상이 ? 30 : 0) + (위험축 동일 ? 30 : 0)`, 등급 100→S / 70→A / 40→B / 10→C.
- DoD:
  - `makeCode('TPS') === 'TPSON'` (정확 일치), 8종 모두 `/^[A-Z]{5}$/` 매치
  - `parseCode('TPSON') === 'TPS'`, 8종 전수 `parseCode(makeCode(id)) === id`
  - `parseCode('TPSAA') === null`(체크섬), `parseCode('TPS') === null`(길이), `parseCode('tpson') === null`(소문자), `parseCode('XYZAB') === null`(미존재 personaId)
  - `computeCompat('TPS','TIS')` → `{score:100,grade:'S'}`
  - `computeCompat('TPS','TPS')` → `{score:70,grade:'A'}`
  - `computeCompat('TPS','FPR')` → `{score:10,grade:'C'}`
  - 두 함수 모두 동기·순수이며 어떤 입력에도 예외를 던지지 않음
  - `src/domain/code.test.ts`와 `src/domain/compat.test.ts` 전 단언 green
- Covers: [F1-AC-3, F1-AC-4]
- Files: [src/domain/code.ts, src/domain/compat.ts, src/domain/code.test.ts, src/domain/compat.test.ts]
- Depends on: Task 1.1

### Task 2.5 안전 스토리지 저수준 래퍼 (파싱 실패 · 용량 초과 · 버전 검증)
- Description: `readJson<T>(key, guard, fallback)`, `writeJson(key, value): SaveOutcome`, `removeKey(key)`를 구현한다. `readJson`은 `JSON.parse` 실패 또는 `guard(parsed) === false` 또는 `parsed.version !== 1`이면 해당 key를 `removeItem`하고 `fallback`을 반환한다. `writeJson`은 `QuotaExceededError`를 잡아 `{ok:false, reason:'QUOTA'}`를 반환한다. 모든 catch 블록에서 `console.error`/`console.warn`를 호출하지 않는다.
- DoD:
  - `localStorage['k'] = '{not-json'` 상태에서 `readJson('k', g, [])` → `[]` 반환, 예외 0건, 이후 `localStorage.getItem('k') === null`
  - `localStorage['k'] = '{"version":0,"a":1}'` → fallback 반환 + key 삭제
  - `setItem`이 `QuotaExceededError`를 던지도록 stub한 환경에서 `writeJson` → `{ok:false,reason:'QUOTA'}` 반환, throw 0건
  - `localStorage` 접근 자체가 throw하는 환경(getter 예외)에서도 `readJson`이 fallback 반환
  - 테스트 실행 중 `console.error` 스파이 호출 횟수 0 (CP-8)
  - `fetch` / `XMLHttpRequest` 사용 0건
  - `src/lib/storage.test.ts`의 5개 단언 green
- Covers: [F1-AC-6, F1-AC-8]
- Files: [src/lib/storage.ts, src/lib/storage.test.ts]
- Depends on: Task 1.1

### Task 2.6 엔티티별 CRUD 리포지토리
- Description: 2.5의 래퍼 위에 엔티티 CRUD를 구현한다. `loadDraft/saveDraft/clearDraft`(`mp.quiz.draft`, answers 길이 12 검증 실패 시 삭제 + null), `loadLatestResult/loadResultHistory/saveResult/deleteResult/setReportUnlocked`(`mp.result.latest`, `mp.result.history`), `loadCompatHistory/saveCompat`(`mp.compat.history`), `loadPref/savePref`(`mp.pref`). 기록 배열은 저장 시 `createdAt` 내림차순 정렬 후 앞 20건만 유지한다. id 생성기 `makeResultId()`(`"r_"+createdAt+"_"+4자리[a-z0-9]`), `makeCompatId()`(`"c_"+…`)를 포함한다.
- DoD:
  - history 20건 상태에서 `saveResult(new)` → `mp.result.latest`가 `new`로 갱신, `history.length === 20`, 제거된 항목은 기존 최소 `createdAt` 1건, 저장 배열이 `createdAt` 내림차순
  - `saveResult`가 QUOTA 상황에서 `{ok:false,reason:'QUOTA'}` 반환, 예외 전파 0건
  - `loadResultHistory()`가 손상 JSON에서 `[]` 반환 + 해당 key 삭제 (2.5 위임 확인)
  - `loadPref()`가 `{"version":0,"onboardingSeen":true}` 입력에서 `{version:1,onboardingSeen:false,lastVisitedAt:0}` 반환 + `mp.pref` 삭제
  - `loadDraft()`가 `answers.length === 7`인 값에서 `null` 반환 + `mp.quiz.draft` 삭제
  - `deleteResult(id)`가 history에서 제거하고, `id === latest.id`면 `mp.result.latest`를 `null`로 설정
  - `setReportUnlocked(id, true)`가 `mp.result.history`의 해당 레코드와 `mp.result.latest`(동일 id일 때) 양쪽을 갱신
  - `saveCompat` 21회 호출 후 `mp.compat.history.length === 20`
  - `makeResultId()`가 `/^r_\d+_[a-z0-9]{4}$/`, `makeCompatId()`가 `/^c_\d+_[a-z0-9]{4}$/` 매치
  - `src/lib/repository.test.ts`의 9개 단언 green, `console.error` 0건
- Covers: [F1-AC-5, F1-AC-6, F1-AC-7, F1-AC-8]
- Files: [src/lib/repository.ts, src/lib/ids.ts, src/lib/repository.test.ts]
- Depends on: Task 2.5

### Task 2.7 화면용 상태 훅 (draft / result / pref)
- Description: 리포지토리를 감싸는 React 훅을 만든다. `useQuizDraft()`(draft state + `answer(index, value)` + `resetDraft()` + `firstUnansweredStep` 계산), `useLatestResult()`, `useAppPref()`(`markOnboardingSeen()`). 모든 훅은 마운트 시 동기 읽기로 초기값을 세팅하고, 변경 시 즉시 localStorage에 반영하며, 저장 실패(`{ok:false}`)를 호출부에 그대로 반환한다.
- DoD:
  - `useQuizDraft().firstUnansweredStep`이 앞 5개만 채워진 draft에서 `6`, 전부 채워진 draft에서 `null` 반환
  - `answer(2, 1)` 호출 후 `localStorage['mp.quiz.draft']`의 `answers[2] === 1`이고 `updatedAt`이 갱신됨
  - `resetDraft()` 호출 후 저장값이 `{version:1, answers:[null×12], updatedAt:<now>}`
  - draft가 없거나 손상된 경우 훅이 크래시하지 않고 `draft === null`을 노출
  - `useAppPref().markOnboardingSeen()` 호출 후 `mp.pref.onboardingSeen === true`
  - `saveResult` QUOTA 상황에서 훅 반환값이 `{ok:false,reason:'QUOTA'}`로 그대로 전달됨
  - 훅 내부에 `fetch`·타이머 폴링 0건, React StrictMode 이중 마운트에서 무한 렌더 0건
  - `src/state/hooks.test.ts`의 6개 단언 green
- Covers: [F1-AC-5, F1-AC-7]
- Files: [src/state/useQuizDraft.ts, src/state/useLatestResult.ts, src/state/useAppPref.ts, src/state/hooks.test.ts]
- Depends on: Task 2.6

---

## Epic 3. 코어 UI 페이지

Risk Assessment
- Complexity: High
- Risk factors: (1) `location.state` 미검증 캐스팅 → 새로고침/직접 진입 시 `undefined.map()` 크래시(2026-08-03 SplitMate 실사고: 가상 사용자 3인 전원이 결과 화면에서 막혀 완주율 0%). (2) TDS 컴포넌트에 Tailwind/인라인 padding을 덮어쓰면 검수 즉시 반려. (3) 리워드 광고 콜백 3분기(성공/실패/중도이탈)와 리포트 콘텐츠 레이아웃을 한 패킷에 넣으면 10분 초과. (4) Canvas 이모지 렌더링과 공유 3단 폴백을 묶으면 디버깅 시간이 폭증. (5) 퀴즈 step 가드가 없으면 URL 직접 진입 시 흰 화면.
- Mitigation: 화면마다 "부품 패킷 → 컨테이너 패킷"으로 분리해 파일 소유권을 겹치지 않게 하고 각 패킷을 10분 이내로 유지한다. state를 받는 4개 화면(`/result`, `/report`, `/share`, `/compat`)의 컨테이너 패킷 DoD에 **"state 없이 직접 진입/새로고침해도 크래시 없이 Empty 또는 `/` replace"** 항목을 개별 명시한다. Epic 2 완료 후에만 착수하므로 모든 화면은 검증된 순수 함수·스토리지만 호출한다.

### Task 3.1 홈 부품 — 캐릭터 프리뷰 · 온보딩 다이얼로그 · 이어하기 · Empty
- Description: 홈 화면을 구성하는 독립 컴포넌트 4종을 만든다. `PersonaPreviewGrid`(8종 Chip, 2열 CSS grid), `OnboardingDialog`(TDS `AlertDialog`, 최초 1회 노출 로직), `ResumeButton`(진행 중 draft 이어하기, 손상 draft는 미표시), `HomeEmptyState`(`Asset.ContentIcon` + 문구). 각 컴포넌트는 props로 콜백을 받으며 라우팅은 하지 않는다(조립은 Task 3.2).
- DoD:
  - `data-testid="persona-preview-grid"` 하위에 TDS `Chip`이 정확히 8개 렌더링되고 각 Chip 높이 `>= 44`, 배치는 custom CSS grid 2열
  - `onboardingSeen === false` prop일 때 `AlertDialog`가 1회 표시되고 본문에 `"진단 결과는 이 기기에만 저장돼요."` 문자열이 정확히 포함됨
  - `"확인"` 탭 시 `onConfirm` 콜백이 1회 호출되고 `mp.pref = {version:1, onboardingSeen:true, lastVisitedAt:<now±5s>}`로 저장됨, 재마운트 시 다이얼로그 미표시
  - `answers`에 non-null 5개 + index 5가 null인 draft에서 `data-testid="home-resume-button"` 텍스트가 정확히 `"6번 문항부터 이어하기"`이고 탭 시 `onResume(6)` 호출, 버튼 높이 `>= 48`
  - `answers.length === 7`인 손상 draft에서 `home-resume-button`이 DOM에 존재하지 않고 `mp.quiz.draft` key가 삭제되며 크래시 0건
  - `latestResult === null` prop일 때 `HomeEmptyState`가 `Asset.ContentIcon` + `"아직 진단 결과가 없어요"`를 표시하고 `data-testid="home-result-entry"`는 DOM에 없음
  - TDS 컴포넌트에 `style={{padding` / `className="p-` / `className="m-` 오버라이드 0건, 간격은 `Spacing size=...`만 사용 (CP-2)
  - HEX 색상 리터럴 0건, `console.error` 0건
- Covers: [F2-AC-3, F2-AC-4, F2-AC-5, F2-AC-7]
- Files: [src/pages/home/PersonaPreviewGrid.tsx, src/pages/home/OnboardingDialog.tsx, src/pages/home/ResumeButton.tsx, src/pages/home/HomeEmptyState.tsx, src/pages/home/home.module.css]
- Depends on: Task 2.2, Task 2.7

### Task 3.2 홈 화면 컨테이너 (`/`) — 골격 조립 · 시작 버튼 · 광고
- Description: `HomeScreen.tsx`를 만들어 3.1의 부품을 조립한다. `ScreenScaffold` + TDS `Top`(title `"MoneyPersona"`) 골격, `SubmitFooter` 안 `display="block"` 시작 버튼, `FloatingTabBar` 위 `AdSlot`, 내 결과 진입점을 배치하고 모든 네비게이션을 연결한다.
- DoD:
  - 화면 최상위가 `ScreenScaffold`(raw `div` 골격 0건, CP-11)이고 `data-testid="home-start-button"`이 `SubmitFooter` 내부에 `display="block"`으로 렌더링되며 높이 `>= 48`
  - `home-start-button` 탭 → `mp.quiz.draft`가 `{version:1, answers:[null,null,null,null,null,null,null,null,null,null,null,null], updatedAt:<now>}`로 덮어써지고 `navigate('/quiz/1')` 호출
  - `mp.result.latest`가 존재하면 `data-testid="home-result-entry"`가 표시되고 탭 시 `navigate('/result', { state: { resultId } })` — state 타입이 `RouteState["/result"]`와 일치
  - `import.meta.env.VITE_TOSS_AD_GROUP_ID === undefined`일 때 `AdSlot`이 렌더링되지 않고 해당 위치의 `offsetHeight === 0`, 나머지 요소는 정상 표시, `console.error` 0건
  - 소스 내 `window.open` / `window.location.href` 0건이고 화면 텍스트에 `"설치"`, `"다운로드"` 문자열 0건
  - `AdSlot`이 `FloatingTabBar`·`SubmitFooter`와 `getBoundingClientRect()` 교차 영역 0
  - TDS padding 오버라이드 0건, HEX 리터럴 0건
- Covers: [F2-AC-1, F2-AC-2, F2-AC-6, F2-AC-8]
- Files: [src/pages/HomeScreen.tsx]
- Depends on: Task 3.1

### Task 3.3 퀴즈 화면 (`/quiz/:step`) — 문항 렌더 · 진행률 · 진입 가드
- Description: `/quiz/:step`을 구현한다. 문항 1개/화면, 선택지 2개를 TDS `ListRow`로 표시하고 탭 시 draft 저장 후 다음 step으로 자동 이동한다. 진행률 텍스트·바, `Top` 뒤로가기, 잘못된 step 및 건너뛰기 가드(`src/pages/quiz/quizGuard.ts`)를 포함한다.
- DoD:
  - `/quiz/3`에서 `data-testid="quiz-option-A"`(value 1) 탭 → `mp.quiz.draft.answers[2] === 1` 저장 후 300ms 이내 `navigate('/quiz/4')` 호출
  - `/quiz/7`에서 `data-testid="quiz-progress-text"`의 textContent가 정확히 `"7 / 12"`
  - `data-testid="quiz-progress-bar"`가 `role="progressbar"`이고 `aria-valuenow === "58"`, `aria-valuemin="0"`, `aria-valuemax="100"`
  - `/quiz/5`에서 `data-testid="quiz-back-button"` 탭 → `navigate('/quiz/4')`, `/quiz/4`에서 기존 선택 ListRow가 `selected` 상태로 하이라이트됨
  - `/quiz/0`, `/quiz/13`, `/quiz/abc` 진입 시 각각 `navigate('/quiz/1', {replace:true})` 호출, 흰 화면·에러 바운더리 노출 0건
  - `answers` index 0~2만 채워진 상태에서 `/quiz/9` 직접 진입 → `navigate('/quiz/4', {replace:true})`
  - 선택지 ListRow 높이 각 `>= 64`, 뒤로가기 버튼 터치 타겟 `>= 44`
  - 화면 내 `AdSlot` 렌더링 0건(몰입 구간), `FloatingTabBar` 렌더링 0건
  - 최상위 `ScreenScaffold`, TDS padding 오버라이드 0건, HEX 0건, `console.error` 0건
- Covers: [F3-AC-1, F3-AC-2, F3-AC-5, F3-AC-6, F3-AC-7]
- Files: [src/pages/QuizScreen.tsx, src/pages/quiz/quizGuard.ts, src/pages/quiz/quiz.module.css]
- Depends on: Task 2.1, Task 2.7

### Task 3.4 계산 화면 (`/quiz/calculating`) — 1,200ms 연출 · 결과 생성 및 저장
- Description: 마운트 시 draft 완결성을 검사하고, 1,200ms 로딩 연출 후 `computeScores` → `toPersonaId` → `makeCode`로 `QuizResult`를 만들어 저장한 뒤 `/result`로 replace 이동한다. 저장은 `useRef` 가드로 정확히 1회만 실행한다.
- DoD:
  - `data-testid="calculating-indicator"`가 표시되고 문구 `"소비 성향을 분석하고 있어요"`가 렌더링됨
  - 12문항 완료 draft에서 1,200ms(±100ms) 후 `mp.result.latest`와 `mp.result.history[0]`에 동일 id의 `QuizResult`가 저장되고 `navigate('/result', { state: { resultId }, replace: true })` 호출 — state 타입이 `RouteState["/result"]`와 일치
  - 저장 실행 횟수가 정확히 1회 — StrictMode 이중 마운트 및 1,200ms 내 뒤로가기→재진입 시나리오에서 `mp.result.history.length` 증가분이 1
  - 언마운트 시 `clearTimeout`으로 타이머 정리, 언마운트 후 setState 경고 0건
  - `mp.quiz.draft === null`이거나 미완성(null 포함) 상태로 직접 진입 시 `navigate('/', {replace:true})` 호출, `console.error` 0건
  - `saveResult`가 `{ok:false,reason:'QUOTA'}`를 반환하면 Toast `"저장 공간이 부족해요. 기록을 삭제해주세요"` 표시 후 `navigate('/', {replace:true})`
  - 인터랙티브 요소 0개, `Top` 미사용 전체 화면 연출, `FloatingTabBar` 렌더링 0건
- Covers: [F3-AC-3, F3-AC-4, F3-AC-8]
- Files: [src/pages/CalculatingScreen.tsx, src/pages/quiz/buildResult.ts]
- Depends on: Task 2.3, Task 2.4, Task 2.6, Task 3.3

### Task 3.5 결과 부품 — 히어로 카드 · 팁 카드 · 3축 MiniBar
- Description: 결과 화면의 표시 전용 컴포넌트 3종을 만든다. `PersonaHeroCard`(TDS `Card`, 이모지·이름·요약·코드 Chip), `TipCard`(ListRow 3개), `AxisBars`(MiniBar 3개). 모두 props로 `Persona`와 `AxisScores`를 받고 스토리지·라우팅에 접근하지 않는다.
- DoD:
  - `personaId === 'TPS'` prop에서 `data-testid="persona-hero-card"`(TDS `Card`) 안에 `"알뜰형 다람쥐"`와 `"🐿️"`가 표시되고 캐릭터명이 t2 이상 강조 타이포로 렌더링됨
  - `data-testid="persona-summary"`의 textContent가 `PERSONAS.TPS.summary`와 문자열 완전 일치
  - `data-testid="persona-code-chip"`(TDS `Chip`)의 textContent가 정확히 `"TPSON"`
  - `data-testid="tip-card"` 안에 `data-testid="tip-row"` ListRow가 정확히 3개이고 각 textContent가 `PERSONAS[personaId].tips[0..2]`와 완전 일치, 각 행 높이 `>= 56`
  - `scores = {spend:4,plan:3,risk:2}`일 때 `data-testid="axis-minibar"`가 정확히 3개, `aria-valuenow`가 순서대로 `"4"`,`"3"`,`"2"`이고 모두 `aria-valuemax="4"`
  - 색상은 `Persona.colorToken`(CSS 변수)만 사용, HEX 리터럴 0건
  - TDS padding 오버라이드 0건, 컴포넌트 내부 `fetch`·localStorage 접근 0건
- Covers: [F4-AC-1, F4-AC-2, F4-AC-3]
- Files: [src/pages/result/PersonaHeroCard.tsx, src/pages/result/TipCard.tsx, src/pages/result/AxisBars.tsx]
- Depends on: Task 2.2

### Task 3.6 결과 화면 컨테이너 (`/result`) — 결과 해석 · 액션 · 광고 · Empty/폴백
- Description: `ResultScreen.tsx`와 결과 해석 함수 `resolveResult.ts`를 만든다. 조회 우선순위는 `location.state.resultId` → history 조회 → `mp.result.latest` 폴백이며, **캐스팅 전 null 체크가 반드시 선행**된다. 3.5 부품을 조립하고 `SubmitFooter` 3버튼, `tip-card` 아래 `AdSlot`, Empty·데이터 이상 폴백을 붙인다.
- DoD:
  - state 수신 코드가 `const nav = (useLocation().state as RouteState["/result"]) ?? null;` 형태이며, 구조분해 캐스팅(`const { resultId } = useLocation().state as X`)이나 캐스팅 직후 프로퍼티 접근이 소스 내 0건
  - **`location.state === null`로 `/result` 직접 진입 및 새로고침 시 크래시 0건** — `latest`가 있으면 그 결과를 렌더, 없으면 Empty
  - `data-testid="result-report-button"` 탭 → `navigate('/report', { state: { resultId } })`, `result-share-button` → `navigate('/share', { state: { resultId } })`, `result-compat-button` → `navigate('/compat')`(state 미전달), 3버튼 각 높이 `>= 48`
  - `AdSlot`이 `data-testid="tip-card"` 다음 형제이자 `SubmitFooter` 이전에 위치하고, 히어로 카드·팁 카드·버튼과 `getBoundingClientRect()` 교차 영역 0
  - Empty 시 `Asset.ContentIcon` + `"아직 진단 결과가 없어요"` + `data-testid="result-empty-cta"`(텍스트 `"테스트 시작하기"`) 표시, 탭 시 `navigate('/quiz/1')`
  - `state.resultId = "r_9999_zzzz"`(history 미존재)일 때 `mp.result.latest`로 폴백 렌더, latest도 없으면 Empty, throw 0건
  - 저장된 결과의 `personaId`가 `'XYZ'`(PERSONAS 키 아님)이면 해당 레코드를 `mp.result.history`에서 제거하고 Empty 표시, `console.error` 0건
  - 최상위 `ScreenScaffold` + `Top`(title `"내 소비 성향"`), HEX 0건, TDS padding 오버라이드 0건
- Covers: [F4-AC-4, F4-AC-5, F4-AC-6, F4-AC-7, F4-AC-8]
- Files: [src/pages/ResultScreen.tsx, src/pages/result/resolveResult.ts]
- Depends on: Task 2.6, Task 3.5

### Task 3.7 리포트 게이트 — 리워드 광고 연동 · 로딩/실패/중도이탈 분기
- Description: `ReportGate.tsx`와 `useRewardGate.ts`를 만든다. `TossRewardAd`(slotId = `import.meta.env.VITE_TOSS_AD_SLOT_ID`)로 콘텐츠를 게이팅하고, 시청 완료 시 `setReportUnlocked(resultId, true)`를 저장한 뒤 `onUnlocked` 콜백을 호출한다. 로딩·실패·중도이탈 3분기를 처리한다(화면 조립은 Task 3.9).
- DoD:
  - `unlocked === false` prop에서 `data-testid="report-locked-gate"`가 표시되고 `data-testid="report-content"`가 DOM에 존재하지 않음
  - 게이트 버튼 텍스트가 정확히 `"광고 보고 상세 리포트 열기"`이고 `display="block"`, 높이 `>= 48`
  - `TossRewardAd`의 `slotId`가 `import.meta.env.VITE_TOSS_AD_SLOT_ID`에서 주입됨(하드코딩 문자열 0건)
  - 시청 완료 콜백 후 `mp.result.history`의 해당 레코드와 `mp.result.latest` 양쪽에서 `reportUnlocked === true`이고 `onUnlocked`가 1회 호출됨
  - 버튼 탭 직후 버튼이 `loading` 상태로 전환되어 연속 3회 탭 시 광고 로드 호출 횟수가 1회, `data-testid="report-ad-loading"`에 `"광고를 불러오는 중이에요"` 표시
  - 로드 실패 콜백 시 Toast `"광고를 불러오지 못했어요. 잠시 후 다시 시도해주세요"` 표시, 게이트 유지, `reportUnlocked === false`, `console.error` 0건
  - 중도 이탈 콜백 시 Toast `"광고를 끝까지 봐야 리포트가 열려요"` 표시, `report-content` 미표시, `reportUnlocked === false`
  - 컴포넌트 내 배너 `AdSlot` 사용 0건, HEX 0건
- Covers: [F5-AC-1, F5-AC-2, F5-AC-4, F5-AC-6, F5-AC-7]
- Files: [src/pages/report/ReportGate.tsx, src/pages/report/useRewardGate.ts]
- Depends on: Task 2.6

### Task 3.8 리포트 콘텐츠 — 3축 코멘트 · 액션플랜 · 매칭도 히어로
- Description: 해제된 리포트 본문 컴포넌트 `ReportContent.tsx`를 만든다. 3축 코멘트 Card 3개, 액션플랜 Card 1개(ListRow 4개), `SummaryHero` CountUp 매칭도를 렌더링한다. props로 `Persona`와 `AxisScores`만 받는다.
- DoD:
  - `data-testid="report-content"` 안에 `data-testid="report-axis-card"` Card가 정확히 3개이며 각각 `report.spendComment`, `report.planComment`, `report.riskComment`와 문자열 완전 일치
  - `data-testid="report-action-card"` Card가 정확히 1개이고 내부 액션플랜 ListRow가 정확히 4개, 각 텍스트가 `report.actionPlan[0..3]`과 일치, 각 행 높이 `>= 56`
  - `SummaryHero`의 CountUp 최종값이 `(scores.spend + scores.plan + scores.risk) * 8`이고 0~96 범위 정수, t2 이상 강조 타이포로 표시
  - 컴포넌트 내부에서 광고 API 호출 0건, localStorage 접근 0건
  - HEX 0건, TDS padding 오버라이드 0건, 간격은 `Spacing size=...`만 사용
- Covers: [F5-AC-5]
- Files: [src/pages/report/ReportContent.tsx]
- Depends on: Task 2.2

### Task 3.9 리포트 화면 컨테이너 (`/report`) — 진입 가드 · 해제 상태 재진입
- Description: `ReportScreen.tsx`를 만들어 3.7 게이트와 3.8 콘텐츠를 조립한다. `location.state`는 `?? null` 후 null 체크로 방어하고, 결과가 없으면 `/`로 replace한다. `reportUnlocked === true`면 광고 없이 즉시 콘텐츠를 노출한다.
- DoD:
  - state 수신 코드가 `const nav = (useLocation().state as RouteState["/report"]) ?? null;` 형태이고 구조분해 캐스팅 0건
  - `reportUnlocked === true`인 결과로 `/report` 진입 시 광고 로드 호출 0건, 즉시 `data-testid="report-content"` 표시, `data-testid="report-locked-gate"`가 DOM에 없음
  - **`location.state === null`이고 `mp.result.latest === null`인 상태로 `/report` 직접 진입(새로고침 포함) 시 `navigate('/', {replace:true})` 실행, 흰 화면·크래시 0건**
  - `state.resultId`가 history에 없고 `latest`가 있으면 latest로 렌더, 둘 다 없으면 `/` replace
  - `Top`(뒤로가기, title `"상세 리포트"`) 탭 시 `navigate(-1)`, 공유 진입 시 `navigate('/share', { state: { resultId } })` — state 타입 `RouteState["/share"]` 일치
  - 화면 내 배너 `AdSlot` 렌더링 0건, `FloatingTabBar` 렌더링 0건
  - 최상위 `ScreenScaffold`, HEX 0건, `console.error` 0건
- Covers: [F5-AC-3, F5-AC-8]
- Files: [src/pages/ReportScreen.tsx]
- Depends on: Task 3.7, Task 3.8

### Task 3.10 공유 — Canvas 결과 이미지 생성기
- Description: `renderResultCanvas(canvas, result, persona)`를 Canvas 2D API로 구현한다(1080×1350). 외부 라이브러리 추가 금지. 색상은 `getComputedStyle(document.documentElement).getPropertyValue`로 `colorToken` CSS 변수를 읽어 사용한다.
- DoD:
  - 호출 후 캔버스의 `width === 1080 && height === 1350`이고 완료 Promise가 1,000ms 이내 resolve
  - 캔버스에 이모지, 캐릭터명, `summary` 첫 40자, 코드(`/^[A-Z]{5}$/`)가 그려짐 — `toDataURL()` 길이가 빈 캔버스 대비 증가함으로 검증
  - 소스 내 `#RRGGBB`/`#RGB` 리터럴 0건이며 색상 획득 경로가 `getPropertyValue('--tds-color-…')`만 사용
  - `package.json`에 `html2canvas`/`html-to-image` 등 신규 의존성 추가 0건
  - `fetch`·외부 폰트 로드 0건 (이모지는 시스템 폰트 의존)
  - 취소 토큰(`AbortSignal` 또는 cancelled 플래그)을 지원해 중단 시 이후 draw 호출 0건
  - `src/pages/share/renderResultCanvas.test.ts`의 4개 단언 green, `console.error` 0건
- Covers: [F6-AC-1]
- Files: [src/pages/share/renderResultCanvas.ts, src/pages/share/renderResultCanvas.test.ts]
- Depends on: Task 2.2

### Task 3.11 공유 — 3단 폴백 공유 로직
- Description: `shareResult(file, text)`를 구현한다. `navigator.share`(파일) → `navigator.share`(텍스트) → `navigator.clipboard.writeText` 3단 폴백이며, 공유 텍스트는 `나는 {name}! 내 코드는 {code}` 고정 포맷이다. 결과는 `{ kind: 'file' | 'text' | 'clipboard' | 'aborted' }`로 반환해 호출부가 Toast를 결정한다.
- DoD:
  - `navigator.canShare({files:[file]}) === true` 환경에서 `navigator.share`가 `{files:[File(type:'image/png')], text:"나는 알뜰형 다람쥐! 내 코드는 TPSON"}` 인자로 1회 호출되고 반환값 `{kind:'file'}`
  - `navigator.canShare === undefined`이고 `navigator.share`만 있는 환경 → `navigator.share({text:"나는 알뜰형 다람쥐! 내 코드는 TPSON"})` 호출, 반환 `{kind:'text'}`, throw 0건, `console.error` 0건
  - `navigator.share`와 `canShare` 둘 다 `undefined` → `navigator.clipboard.writeText("나는 알뜰형 다람쥐! 내 코드는 TPSON")` 호출, 반환 `{kind:'clipboard'}`
  - `navigator.share`가 `AbortError`로 reject → 반환 `{kind:'aborted'}`, 예외 전파 0건, `console.error` 0건
  - 소스에 `window.open` / `window.location.href` / `target="_blank"` 0건
  - 공유 텍스트에 `http` URL·`"설치"`·`"다운로드"` 문자열 0건
  - `src/pages/share/shareResult.test.ts`의 4개 폴백 시나리오 green
- Covers: [F6-AC-2, F6-AC-3, F6-AC-4, F6-AC-5, F6-AC-7]
- Files: [src/pages/share/shareResult.ts, src/pages/share/shareResult.test.ts]
- Depends on: Task 2.2

### Task 3.12 공유 화면 컨테이너 (`/share`) — 미리보기 · 로딩 · Toast · 진입 가드
- Description: `ShareScreen.tsx`를 만들어 3.10 생성기와 3.11 공유 로직을 조립한다. `ScreenScaffold` + `Top`(뒤로가기, title `"결과 공유"`), Card로 감싼 캔버스 미리보기, `SubmitFooter` 공유 버튼, 로딩 상태와 결과별 Toast, 진입 가드를 구현한다.
- DoD:
  - state 수신 코드가 `const nav = (useLocation().state as RouteState["/share"]) ?? null;` 형태이고 구조분해 캐스팅 0건
  - **`location.state === null`이고 `mp.result.latest === null`이면 `navigate('/', {replace:true})` 실행, 흰 화면·크래시 0건**
  - 생성 중 `data-testid="share-loading"`에 `"이미지를 만들고 있어요"` 표시되고 `data-testid="share-button"`이 `disabled`(연속 탭 시 공유 호출 0건), 완료 후 로딩 제거 + 버튼 활성화
  - `data-testid="share-preview-canvas"`가 TDS `Card`로 감싸이고 CSS `aspect-ratio: 4/5`로 화면 폭에 맞춰 표시됨
  - 공유 결과 `{kind:'file'|'text'}` → Toast `"공유했어요"`, `{kind:'clipboard'}` → Toast `"결과를 클립보드에 복사했어요"`, `{kind:'aborted'}` → Toast 표시 0건·다이얼로그 0건·`/share` 화면 유지
  - `share-button` 높이 `>= 48`, `display="block"`
  - 언마운트 시 진행 중 캔버스 작업 취소, 언마운트 후 setState 경고 0건, `console.error` 0건
  - 화면 내 광고 렌더링 0건(공유 전환 방해 방지), `FloatingTabBar` 렌더링 0건
- Covers: [F6-AC-6, F6-AC-8]
- Files: [src/pages/ShareScreen.tsx, src/pages/share/share.module.css]
- Depends on: Task 2.6, Task 3.10, Task 3.11

### Task 3.13 궁합 부품 — 입력 폼 · 코드 검증 · 키보드 처리
- Description: `CompatForm.tsx`와 `validateFriendCode.ts`를 만든다. TDS `TextField` + 제출 버튼, 3종 검증(빈 입력 / 체크섬 오류 / 자기 코드), 모바일 키보드 속성, 포커스 스크롤을 구현한다. 검증 통과 시 `onSubmit(personaId, code)` 콜백을 호출하고 저장은 하지 않는다.
- DoD:
  - 빈 입력 제출 → TextField 하단 에러 `"친구 코드를 입력해주세요"` 표시, `onSubmit` 호출 0건
  - `"TPSAA"` 제출(`parseCode === null`) → 하단 에러 `"올바른 코드가 아니에요"`, `onSubmit` 호출 0건
  - `myCode === "TPSON"` prop에서 `"TPSON"` 제출 → Toast `"내 코드예요. 친구 코드를 입력해주세요"`, `onSubmit` 호출 0건
  - TextField DOM에 `maxLength={5}`, `autoCapitalize="characters"`, `enterKeyHint="done"`, `inputMode="text"` 속성이 적용됨
  - `"tison"` 입력 시 표시값이 `"TISON"` (항상 `toUpperCase()` 정규화)
  - 포커스 시 `scrollIntoView({block:'center'})`가 1회 호출되고 `SubmitFooter`가 `position: static`으로 전환되어 키보드에 가려지지 않음
  - `prefillCode` prop이 주어지면 TextField 초기값으로 채워지고, `undefined`여도 크래시 0건
  - TextField 높이 `>= 48`, `data-testid="compat-submit-button"` 높이 `>= 48`(`display="block"`)
  - `src/pages/compat/validateFriendCode.test.ts`의 4개 단언 green
- Covers: [F7-AC-3, F7-AC-4, F7-AC-5, F7-AC-7]
- Files: [src/pages/compat/CompatForm.tsx, src/pages/compat/validateFriendCode.ts, src/pages/compat/validateFriendCode.test.ts]
- Depends on: Task 2.4

### Task 3.14 궁합 부품 — 결과 카드 (양측 캐릭터 · CountUp 점수 · 등급 Chip)
- Description: `CompatResultCard.tsx`를 만든다. 내 캐릭터/친구 캐릭터 2블록 flex 배치, `SummaryHero` CountUp 점수, 등급 TDS `Chip`, 등급 문구를 표시한다. props로 두 `PersonaId`와 `{score, grade}`만 받는다.
- DoD:
  - `data-testid="compat-result-card"`(TDS `Card`) 안에 `data-testid="compat-persona-me"`와 `data-testid="compat-persona-friend"` 2블록이 존재하고 부모의 `getComputedStyle().display === 'flex'`
  - `SummaryHero`가 점수를 0 → 최종값으로 CountUp 애니메이션하며 t2 이상 강조 타이포로 표시
  - 등급이 TDS `Chip`으로 렌더링되고 textContent가 `'S'|'A'|'B'|'C'` 중 하나, 문구 매핑이 `100→"환상의 짝꿍"`, `70→"잘 맞는 사이"`, `40→"노력이 필요한 사이"`, `10→"정반대 성향"`과 정확히 일치
  - 컴포넌트 내부 localStorage 접근·라우팅 호출 0건
  - 색상은 각 Persona의 `colorToken`만 사용, HEX 0건
  - TDS padding 오버라이드 0건, 간격은 `Spacing size=...`만 사용
- Covers: [F7-AC-2]
- Files: [src/pages/compat/CompatResultCard.tsx]
- Depends on: Task 2.2

### Task 3.15 궁합 화면 컨테이너 (`/compat`) — 계산 · 기록 저장 · 광고 · Empty
- Description: `CompatScreen.tsx`를 만들어 3.13 폼과 3.14 카드를 조립한다. 유효 코드 제출 시 `computeCompat`을 실행해 카드를 렌더링하고 `mp.compat.history`에 저장하며, 결과 카드 아래 `AdSlot`을 배치한다. `mp.result.latest`가 없으면 Empty 상태를 노출한다.
- DoD:
  - state 수신 코드가 `const nav = (useLocation().state as RouteState["/compat"]) ?? null;` 형태이며 `nav?.prefillCode`만 폼에 전달 — state 없이 진입해도 크래시 0건
  - `mp.result.latest.personaId === 'TPS'`에서 `"TISON"` 제출 → 200ms 이내 `data-testid="compat-result-card"` 표시, 점수 `100`, 등급 Chip `"S"`, 문구 `"환상의 짝꿍"` 표시
  - `mp.compat.history[0]`이 `{version:1, myPersonaId:'TPS', friendPersonaId:'TIS', friendCode:'TISON', score:100, grade:'S'}`를 만족하고 `id`가 `/^c_\d+_[a-z0-9]{4}$/` 매치
  - 궁합 기록 21건째 저장 시 `mp.compat.history.length === 20` 유지
  - `mp.result.latest === null`일 때 `Asset.ContentIcon` + `"먼저 내 소비 성향을 진단해주세요"` 표시, TextField와 `data-testid="compat-submit-button"`이 DOM에 존재하지 않으며 `data-testid="compat-empty-cta"` 탭 시 `navigate('/quiz/1')`
  - `AdSlot`이 `compat-result-card` 다음 형제로 배치되고 카드와 `getBoundingClientRect()` 교차 영역 0, 광고 ID 미주입 시 미렌더링
  - `"내 결과 보기"` 탭 시 `navigate('/result', { state: { resultId } })` — state 타입 `RouteState["/result"]` 일치
  - 최상위 `ScreenScaffold` + `Top`(title `"친구와 궁합"`), HEX 0건, `fetch` 0건, `console.error` 0건
- Covers: [F7-AC-1, F7-AC-6, F7-AC-8]
- Files: [src/pages/CompatScreen.tsx, src/pages/compat/compat.module.css]
- Depends on: Task 2.6, Task 3.13, Task 3.14

### Task 3.16 기록 부품 — 진단 기록 탭 · Sparkline · 삭제 다이얼로그
- Description: `ResultHistoryTab.tsx`와 `DeleteConfirmDialog.tsx`를 만든다. 진단 기록 목록(정렬·행 구성·재진입 콜백), 소비축 `Sparkline`, 삭제 확인 `AlertDialog`와 삭제/취소 동작을 구현한다.
- DoD:
  - `mp.result.history` 3건 상태에서 `data-testid="history-result-row"`가 3개 표시되고 `createdAt` 내림차순 정렬
  - 각 행에 캐릭터 이모지, 이름, `YYYY.MM.DD` 형식 날짜(정규식 `/^\d{4}\.\d{2}\.\d{2}$/`)가 표시되고 행 높이 `>= 56`
  - 행 탭 시 `onOpenResult(resultId)`가 호출되고 컨테이너에서 `navigate('/result', { state: { resultId } })`로 연결됨 — state 타입 `RouteState["/result"]` 일치
  - 기록 2건 이상일 때 `data-testid="history-spend-sparkline"`이 렌더링되고 데이터 포인트 개수 === 기록 건수, 값은 각 `scores.spend`(0~4)이며 오래된 순 정렬
  - `data-testid="history-delete-button"`(터치 타겟 `>= 44×44`) 탭 → `AlertDialog` 표시 → `"삭제"` 탭 시 해당 레코드가 `mp.result.history`에서 제거되어 목록 2개로 갱신되고 Toast `"기록을 삭제했어요"` 표시
  - 삭제한 id가 `mp.result.latest.id`와 같으면 `mp.result.latest === null`로 설정됨
  - `"취소"` 탭 또는 딤 영역 탭 → 목록 건수 변화 0, 저장소 변경 0건, Toast 표시 0건
  - `mp.result.history === []`일 때 `history-delete-button`이 DOM에 0개, 가상 스크롤 라이브러리 도입 0건
- Covers: [F8-AC-1, F8-AC-2, F8-AC-4, F8-AC-6]
- Files: [src/pages/history/ResultHistoryTab.tsx, src/pages/history/DeleteConfirmDialog.tsx]
- Depends on: Task 2.6

### Task 3.17 기록 부품 — 궁합 기록 탭 · 손상 배열 복구
- Description: `CompatHistoryTab.tsx`를 만든다. 궁합 기록 목록(점수·등급·양측 캐릭터·날짜), 행 탭 시 prefill 재진입 콜백, 손상된 `mp.compat.history` 복구를 처리한다.
- DoD:
  - 궁합 기록이 있을 때 `data-testid="history-compat-row"`가 건수만큼 표시되고 `createdAt` 내림차순 정렬, 각 행 높이 `>= 56`
  - 행 탭 시 `onOpenCompat(friendCode)`가 호출되고 컨테이너에서 `navigate('/compat', { state: { prefillCode } })`로 연결됨 — state 타입 `RouteState["/compat"]` 일치
  - `localStorage['mp.compat.history'] = '[{"version":1,'` 상태로 탭 진입 → 해당 key 삭제 + 빈 상태 렌더링, 크래시 0건, `console.error` 0건
  - 각 행에 점수·등급 Chip·양측 캐릭터 이모지·`YYYY.MM.DD` 날짜가 표시됨
  - `mp.compat.history === []`일 때 `Asset.ContentIcon` + `"아직 비교한 친구가 없어요"` 표시
  - 목록 상한 20건 전제로 일반 렌더링(가상 스크롤 도입 0건), HEX 0건, TDS padding 오버라이드 0건
- Covers: [F8-AC-5]
- Files: [src/pages/history/CompatHistoryTab.tsx]
- Depends on: Task 2.6

### Task 3.18 기록 화면 컨테이너 (`/history`) — Tab 전환 · 빈 상태 · 광고
- Description: `HistoryScreen.tsx`를 만들어 TDS `Tab`(`["진단 기록","궁합 기록"]`)으로 3.16/3.17 탭을 전환하고, 네비게이션 콜백을 연결하며, 리스트 하단·`FloatingTabBar` 위에 `AdSlot`을 배치한다.
- DoD:
  - `/history` 진입 시 TDS `Tab` 2개(`"진단 기록"`, `"궁합 기록"`)가 표시되고 각 Tab 아이템 높이 `>= 44`, 기본 선택은 `"진단 기록"`
  - `mp.result.history === []`일 때 진단 탭에 `Asset.ContentIcon` + `"아직 기록이 없어요"` 표시
  - `mp.compat.history === []`일 때 궁합 탭에 `Asset.ContentIcon` + `"아직 비교한 친구가 없어요"` 표시
  - 두 기록이 모두 비었을 때 `data-testid="history-delete-button"`이 DOM에 0개
  - 진단 행 콜백 → `navigate('/result', { state: { resultId } })`, 궁합 행 콜백 → `navigate('/compat', { state: { prefillCode } })`로 각각 연결됨(`tsc --noEmit` 통과)
  - `AdSlot`이 리스트 하단·`FloatingTabBar` 위에 배치되어 리스트·탭바와 `getBoundingClientRect()` 교차 0, 광고 ID 미주입 시 미렌더링
  - 최상위 `ScreenScaffold` + `Top`(title `"내 기록"`), HEX 0건, `console.error` 0건
- Covers: [F8-AC-3]
- Files: [src/pages/HistoryScreen.tsx, src/pages/history/history.module.css]
- Depends on: Task 3.16, Task 3.17

---

## Epic 4. 통합 · 라우팅 배선 · 검수 컴플라이언스

Risk Assessment
- Complexity: Medium
- Risk factors: (1) catch-all 라우트 누락 시 `/foo` 진입에서 흰 화면 → 검수 반려. (2) `FloatingTabBar`를 몰입 화면(S2/S3/S5/S6)에도 렌더링하면 SPEC 계약 위반 및 하단 버튼 가림. (3) HEX 리터럴·`fetch`·설치 유도 문구는 개별 패킷에서 슬쩍 들어와도 사람 눈으로는 놓치기 쉽다. (4) 다크모드 대비비·구형 OS API 미검증 시 출시 후 반려.
- Mitigation: 라우팅 배선을 모든 페이지 완성 이후로 배치해 실제 컴포넌트로 검증한다. 정적 검증을 자동 스크립트(`npm run compliance`)로 고정해 사람 판단을 제거하고 CI 실패 조건으로 못박는다. state 수신 4개 화면의 직접 진입·새로고침 시나리오를 라우터 패킷에서 한 번 더 회귀 검증한다.

### Task 4.1 라우터 배선 · FloatingTabBar 노출 규칙 · catch-all 가드
- Description: `react-router-dom` 라우트 8개 + `*` catch-all을 구성하고, `FloatingTabBar`를 S1/S4/S7/S8에서만 렌더링하는 래퍼를 만든다. 모든 `navigate` 호출부의 state 타입이 `RouteState`와 일치하는지 정리한다.
- DoD:
  - `/`, `/quiz/:step`, `/quiz/calculating`, `/result`, `/report`, `/share`, `/compat`, `/history` 8개 라우트가 각 화면 컴포넌트로 매핑되고 `vite build` 통과
  - `/foo` 진입 시 `navigate('/', {replace:true})`로 처리되어 흰 화면·에러 화면 노출 0건
  - `FloatingTabBar`가 `/`, `/result`, `/compat`, `/history`에서만 렌더링되고 `/quiz/1`, `/quiz/calculating`, `/report`, `/share`에서는 DOM에 0개
  - `FloatingTabBar` 탭 3개(홈 `/`, 궁합 `/compat`, 기록 `/history`)가 각각 해당 경로로 이동하고 현재 경로 탭이 active 표시됨
  - 전 소스에서 `navigate('/result'|'/report'|'/share'|'/compat', {state})` 호출의 state가 `RouteState`의 해당 키 타입과 일치 (`tsc --noEmit` 통과)
  - **state 수신 4개 화면(`/result`, `/report`, `/share`, `/compat`) 전부에 대해 주소창 직접 입력 + 새로고침 시나리오 실행 시 크래시 0건** — `/result`·`/compat`은 Empty 렌더, `/report`·`/share`는 `/` replace
  - `FloatingTabBar`가 `SubmitFooter` 및 `AdSlot`과 `getBoundingClientRect()` 교차 영역 0
  - `console.error` 0건
- Covers: [F8-AC-8]
- Files: [src/App.tsx, src/routes/AppRoutes.tsx, src/routes/TabBarVisibility.tsx]
- Depends on: Task 3.2, Task 3.4, Task 3.6, Task 3.9, Task 3.12, Task 3.15, Task 3.18

### Task 4.2 검수 정적 검증 스크립트 · 다크모드 · 구형 OS 호환
- Description: 앱인토스 검수 항목을 자동 검증하는 npm 스크립트를 추가하고, 다크모드 대비비와 `vite.config.ts` 빌드 타깃을 확정한다.
- DoD:
  - `npm run compliance`가 아래 위반 시 exit code 1로 실패:
    - `src/**` 내 `#[0-9a-fA-F]{3,6}` 색상 리터럴 0건 (모든 색상은 `var(--tds-color-*)` 또는 TDS 기본값)
    - `fetch(`, `XMLHttpRequest`, `window.open`, `window.location.href`, `target="_blank"` 0건
    - `"설치"`, `"다운로드"` 문자열 0건
    - `grantPromotionReward`, `IAP.createOneTimePurchaseOrder`, `TossPurchase` 0건
    - `Object.groupBy`, `.at(`, `structuredClone` 0건
    - `package.json` 의존성에 `shadcn`, `@mui/`, `antd`, `@chakra-ui/`, `ga`, `amplitude`, `html2canvas`, `html-to-image` 0건
  - `vite.config.ts`의 `build.target === 'es2020'`
  - 프로덕션 빌드 후 8개 화면 E2E 순회 중 `console.error` 캡처 0건
  - `prefers-color-scheme: dark` 강제 상태에서 8개 화면 주요 텍스트/배경 대비비가 모두 4.5:1 이상(측정 결과 리포트 산출)
  - Chrome 60 수준 에뮬레이션에서 전 화면 렌더 시 런타임 `TypeError` 0건
  - 존재하지 않는 라우트(`/foo`) E2E 진입 시 흰 화면 캡처 0건이고 최종 URL이 `/`
  - `npm run compliance`가 CI/pre-push에 연결됨
- Covers: [F8-AC-7, F8-AC-8]
- Files: [scripts/compliance.mjs, package.json, vite.config.ts, e2e/compliance.spec.ts]
- Depends on: Task 4.1

---

## AC Coverage

- Total ACs in SPEC: 64 (F1~F8 × 8)
- Covered by tasks: 64

| AC | 커버 Task |
|---|---|
| F1-AC-1 | 1.1, 2.1, 2.2 |
| F1-AC-2 | 2.3 |
| F1-AC-3 | 2.4 |
| F1-AC-4 | 2.4 |
| F1-AC-5 | 2.6, 2.7 |
| F1-AC-6 | 2.5, 2.6 |
| F1-AC-7 | 2.6, 2.7 |
| F1-AC-8 | 2.5, 2.6 |
| F2-AC-1 | 3.2 |
| F2-AC-2 | 3.2 |
| F2-AC-3 | 3.1 |
| F2-AC-4 | 3.1 |
| F2-AC-5 | 3.1 |
| F2-AC-6 | 3.2 |
| F2-AC-7 | 3.1 |
| F2-AC-8 | 3.2 |
| F3-AC-1 | 3.3 |
| F3-AC-2 | 3.3 |
| F3-AC-3 | 3.4 |
| F3-AC-4 | 3.4 |
| F3-AC-5 | 3.3 |
| F3-AC-6 | 3.3 |
| F3-AC-7 | 3.3 |
| F3-AC-8 | 3.4 |
| F4-AC-1 | 3.5 |
| F4-AC-2 | 3.5 |
| F4-AC-3 | 3.5 |
| F4-AC-4 | 3.6 |
| F4-AC-5 | 3.6 |
| F4-AC-6 | 3.6 |
| F4-AC-7 | 3.6 |
| F4-AC-8 | 3.6 |
| F5-AC-1 | 3.7 |
| F5-AC-2 | 3.7 |
| F5-AC-3 | 3.9 |
| F5-AC-4 | 3.7 |
| F5-AC-5 | 3.8 |
| F5-AC-6 | 3.7 |
| F5-AC-7 | 3.7 |
| F5-AC-8 | 3.9 |
| F6-AC-1 | 3.10 |
| F6-AC-2 | 3.11 |
| F6-AC-3 | 3.11 |
| F6-AC-4 | 3.11 |
| F6-AC-5 | 3.11 |
| F6-AC-6 | 3.12 |
| F6-AC-7 | 3.11 |
| F6-AC-8 | 3.12 |
| F7-AC-1 | 3.15 |
| F7-AC-2 | 3.14 |
| F7-AC-3 | 3.13 |
| F7-AC-4 | 3.13 |
| F7-AC-5 | 3.13 |
| F7-AC-6 | 3.15 |
| F7-AC-7 | 3.13 |
| F7-AC-8 | 3.15 |
| F8-AC-1 | 3.16 |
| F8-AC-2 | 3.16 |
| F8-AC-3 | 3.18 |
| F8-AC-4 | 3.16 |
| F8-AC-5 | 3.17 |
| F8-AC-6 | 3.16 |
| F8-AC-7 | 4.2 |
| F8-AC-8 | 4.1, 4.2 |

- Uncovered: 0 ✅

---

## 참고 — 실행 순서 요약

```
1.1 (타입)
 ├─ 2.1 문항상수
 ├─ 2.2 캐릭터상수
 ├─ 2.3 채점함수
 ├─ 2.4 코드/궁합
 └─ 2.5 storage → 2.6 repository → 2.7 hooks
                                     │
        3.1 부품 → 3.2 홈            │
        3.3 퀴즈 → 3.4 계산  ◄───────┤
        3.5 부품 → 3.6 결과          │
        3.7 게이트 ┐                 │
        3.8 콘텐츠 ┴→ 3.9 리포트     │
        3.10 캔버스 ┐                │
        3.11 공유로직┴→ 3.12 공유    │
        3.13 폼 ┐                    │
        3.14 카드┴→ 3.15 궁합        │
        3.16 진단탭 ┐                │
        3.17 궁합탭 ┴→ 3.18 기록 ◄───┘
                       │
                 4.1 라우팅 → 4.2 검수 검증
```

**파일 소유 검증**: 28개 Task의 Files 목록에 중복 경로 0건 (각 파일은 정확히 1개 Task가 생성·수정).