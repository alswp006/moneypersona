# TASK — MoneyPersona

> SPEC(`MoneyPersona` v1)을 코딩 세션 단위로 분해. 각 태스크는 10분 내 완료 가능하며, 완료 시점마다 앱이 컴파일된다.
> 총 24 태스크 / 4 Epic. SPEC AC 총 64개 전부 커버.
> **파일 소유권 규칙(수정판):** 한 파일은 **정확히 한 태스크만** 생성·수정한다. 화면이 큰 경우 "로직 훅/서브 컴포넌트 태스크(먼저)" → "페이지 조립 태스크(나중)"로 분할해 동일 파일 재편집을 제거했다.

---

## Epic 1. 타입 + 정적 콘텐츠

**Risk Assessment**
- **Complexity:** Low
- **Risk factors:**
  - `RouteState`가 누락되면 페이지 간 `location.state` 계약이 깨져 `/result`·`/report`·`/share` 직접 진입 시 런타임 크래시(SplitMate 사고 재현).
  - 정적 콘텐츠(12문항/8캐릭터)를 페이지 태스크에서 임의 작성하면 F1-AC-1 테스트가 즉시 실패.
  - `tips`/`plan30d` 같은 고정 길이 배열을 `string[]`으로 느슨히 선언하면 개수 오류를 컴파일 타임에 못 잡음.
- **Mitigation:** 타입을 최우선 태스크로 고정하고 `RouteState`를 Task 1.1 DoD에 명문화. 콘텐츠는 별도 데이터 태스크(1.2/1.3)에서 SPEC 표를 그대로 옮겨 테스트로 잠근다. 튜플 타입 강제.

---

### Task 1.1 도메인 타입 + RouteState 정의
- **Description:** SPEC Data Models의 모든 엔티티 타입과 라우트 state 계약을 순수 타입 파일로 선언한다. 런타임 코드(함수/상수) 0줄.
  ```ts
  export type AxisId = 'A1' | 'A2' | 'A3';
  export type AxisLetter = 'F' | 'S' | 'P' | 'I' | 'C' | 'R';
  export type PersonaCode = 'FPC'|'FPR'|'FIC'|'FIR'|'SPC'|'SPR'|'SIC'|'SIR';
  export type StorageResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' };
  export type ScoreResult =
    | { ok: true; axisScores: [AxisScore, AxisScore, AxisScore]; personaCode: PersonaCode }
    | { ok: false; reason: 'invalid_answers' };

  // 라우트 state 단일 진실 소스 — 모든 페이지는 이 타입만 캐스팅한다
  export type RouteState = {
    '/': undefined;
    '/quiz': undefined;
    '/result': { resultId: string } | undefined;
    '/report': { resultId: string } | undefined;
    '/share': { resultId: string } | undefined;
    '/compat': { prefillCode?: string } | undefined;
    '/history': undefined;
  };
  ```
- **DoD:**
  - `Choice`, `Question`, `Persona`, `AxisScore`, `QuizResult`, `QuizProgress`, `CompatibilityRecord`, `AppFlags`, `RouteState`, `ScoreResult`, `StorageResult` 전부 export.
  - `Persona.tips`/`plan30d`는 `[string,string,string]`, `cautions`/`strengths`는 `[string,string]` 튜플.
  - `QuizResult.axisScores`는 `[AxisScore,AxisScore,AxisScore]`, `answers`는 `(0|1)[]`.
  - `CompatibilityRecord.grade`는 4개 리터럴 유니온('최고의 짝'|'좋은 궁합'|'무난한 궁합'|'서로 배우는 궁합').
  - `tsc --noEmit` 통과, 파일 내 `import` 0건, 런타임 export 0건.
- **Covers:** [foundation — 후속 전 태스크의 타입 기반. 직접 AC 없음]
- **Files:** `src/lib/types.ts`
- **Depends on:** none

### Task 1.2 12문항 정적 콘텐츠
- **Description:** SPEC 12문항 표를 `Question[]` 상수로 그대로 옮긴다. 문구 한 글자도 변경 금지(테스트가 값을 검증).
- **DoD:**
  - `export const QUESTIONS: readonly Question[]`가 정확히 12개, id 1~12 오름차순.
  - 축별 개수 A1=4(Q1–4), A2=4(Q5–8), A3=4(Q9–12).
  - 각 문항 `choices`는 정확히 2개이며 `{id:'a',score:1}`, `{id:'b',score:0}`.
  - `getQuestion(index: number): Question | null` — 범위 밖 인덱스에 `null` 반환.
  - 테스트: 개수 12, 모든 `choices.length === 2`, 축별 카운트 4/4/4 검증 통과.
- **Covers:** [F1-AC-1]
- **Files:** `src/data/questions.ts`, `src/data/__tests__/questions.test.ts`
- **Depends on:** Task 1.1

### Task 1.3 8캐릭터 페르소나 콘텐츠
- **Description:** 8개 PersonaCode의 name/emoji/tagline/summary/tips3/strengths2/cautions2/plan30d3/bestMatch를 정적 상수로 작성. name·emoji·bestMatch는 SPEC 표 고정값.
- **DoD:**
  - `export const PERSONAS: Record<PersonaCode, Persona>` 키 집합이 `{FPC,FPR,FIC,FIR,SPC,SPR,SIC,SIR}`와 정확히 일치.
  - 모든 persona `tips.length === 3`, `cautions.length === 2`, `plan30d.length === 3`.
  - name/emoji/bestMatch가 SPEC 표와 1:1 일치(FPC=알뜰형 다람쥐/🐿️/SPR … SIR=플렉스 공작/🦚/FPC).
  - FPC의 `tips` 3문장은 SPEC 픽스처와 문자열 완전 일치.
  - 텍스트에 HEX 색상·외부 URL·"설치/다운로드/스토어" 단어 0건.
  - 테스트: `Object.keys(PERSONAS).length === 8` + 위 길이 검증 통과.
- **Covers:** [F1-AC-1]
- **Files:** `src/data/personas.ts`, `src/data/__tests__/personas.test.ts`
- **Depends on:** Task 1.1

---

## Epic 2. 데이터 레이어 (storage / 계산 / 상태)

**Risk Assessment**
- **Complexity:** Medium
- **Risk factors:**
  - `localStorage`가 `SecurityError`를 던지는 환경에서 모듈 최상단 접근 시 흰 화면 크래시(F8-AC-8).
  - 손상 JSON·`v !== 1`·스키마 불일치를 페이지마다 처리하면 방어 코드가 중복·누락된다.
  - `QuotaExceededError` 재시도 로직이 저장 함수마다 흩어지면 F1-AC-6 재현이 어려움.
  - `console.error` 디버깅 잔존 시 F8-AC-3(콘솔 0건) 위반 → 검수 반려.
- **Mitigation:** Task 2.1에서 저장소 접근을 단일 `safeStorage`로 봉인(try/catch + 인메모리 Map 폴백 + v래퍼 + 손상 키 삭제)하고, 그 위에 순수 계산(2.2/2.4)과 리포지토리(2.3)를 얹는다. 페이지는 저장소를 직접 호출하지 않고 Task 2.5 훅만 사용. 모든 실패는 예외 대신 `{ok:false,reason}` + 콘솔 출력 금지를 DoD에 명시.

---

### Task 2.1 안전 저장소 코어 (safeStorage)
- **Description:** localStorage 저수준 래퍼. `{v:1,data}` 직렬화, 손상 복구, quota 재시도 훅, 인메모리 폴백. 도메인 지식 없음.
- **DoD:**
  - `readWrapped<T>(key, validate)` — JSON 파싱 실패 / `v !== 1` / validate 실패 시 `removeItem` 후 `null` 반환, 예외 전파 0건.
  - `writeWrapped<T>(key, data): StorageResult` — `QuotaExceededError` 캐치 시 주입된 `onQuota` 콜백 실행 후 1회 재시도, 재실패 시 `{ok:false,reason:'quota'}`.
  - `removeKey(key)`, `isPersistent(): boolean` 제공.
  - 모듈 로드 시점에 localStorage를 만지지 않는다(지연 probe). probe 실패 시 이후 모든 호출이 인메모리 `Map`으로 동작하고 `isPersistent() === false`.
  - 파일 전체 `console.*` 0건.
  - 테스트: (a) `"{ not json"` → `null` + 키 삭제 + `console.error` 0회, (b) `{v:2,...}` → `null` + 키 삭제, (c) setItem 항상 throw → `{ok:false,reason:'quota'}`, (d) localStorage getter가 throw하는 환경에서 write→read 왕복이 인메모리로 성공.
- **Covers:** [F1-AC-5, F1-AC-6, F1-AC-8, F8-AC-8]
- **Files:** `src/lib/storage/safeStorage.ts`, `src/lib/storage/__tests__/safeStorage.test.ts`
- **Depends on:** Task 1.1

### Task 2.2 스코어링 엔진 + 공유 코드
- **Description:** 순수 함수만. 12답변 → 3축 점수 → PersonaCode 판정, persona 조회, shareCode 생성/파싱. 랜덤·시간 의존 0건.
- **DoD:**
  - `scoreQuiz(answers: unknown): ScoreResult` — 길이 ≠ 12 또는 0/1 외 값 포함 시 `{ok:false,reason:'invalid_answers'}`.
  - 축 점수 = 해당 4문항 합, `percent = score*25`, `score >= 2` → 첫 글자(F/P/C), `< 2` → 둘째 글자(S/I/R).
  - `getPersona(code: string): Persona | null` — 미정의 코드('XXX')에 `null`(throw 금지).
  - `makeShareCode(code)` → `MP1-<code>-<(charCode 합)%10>`; `makeShareCode('FPC') === 'MP1-FPC-2'`.
  - `parseShareCode(raw): {ok:true;code:PersonaCode} | {ok:false;reason:'format'|'checksum'}` — `trim().toUpperCase()` 정규화, 하이픈 없는 `MP1FPC2` 재조립 허용, 정규식 `/^MP1-(FPC|FPR|FIC|FIR|SPC|SPR|SIC|SIR)-\d$/` + checksum 검사.
  - 테스트: `[1×12]` → `FPC` + 3축 `{score:4,percent:100}`; 동일 입력 100회 deep-equal; `[1,1,0,0,1,0,0,0,0,0,0,0]` → `FIR` + `axisScores[0].percent === 50`; `[1,1,1]` → `invalid_answers`; `'mp1-spr-6'` → ok, `'ABCD'` → `format`, `'MP1-FPC-9'` → `checksum`.
  - `console.*` 0건.
- **Covers:** [F1-AC-2, F1-AC-3, F1-AC-7, F6-AC-4, F6-AC-5]
- **Files:** `src/lib/scoring.ts`, `src/lib/shareCode.ts`, `src/lib/__tests__/scoring.test.ts`, `src/lib/__tests__/shareCode.test.ts`
- **Depends on:** Task 1.2, Task 1.3

### Task 2.3 결과/히스토리/진행/플래그 리포지토리
- **Description:** `mp:result:v1`, `mp:history:v1`, `mp:progress:v1`, `mp:flags:v1` CRUD를 safeStorage 위에 구현. 스키마 가드, FIFO 상한, quota 축소 정책 포함.
- **DoD:**
  - `saveResult(r): StorageResult` — result 덮어쓰기 + history push + 21건 이상이면 `createdAt` 오래된 것부터 제거해 20건 유지 + `flags.lastResultId = r.id` 갱신.
  - quota 발생 시 history를 최신 5건으로 축소 후 1회 재시도, 재실패 시 `{ok:false,reason:'quota'}` 반환(throw 금지).
  - `loadResult()`, `loadHistory()`, `loadProgress()`, `loadFlags()`(기본값 `{onboardingSeen:false,lastResultId:null,disclaimerSeen:false}`) 제공.
  - `loadHistory()`는 `personaCode` 누락/미정의, `answers.length !== 12` 항목을 필터링하고 **정제된 배열을 즉시 재저장**한다.
  - `loadProgress()`는 `answers.length !== 12` 또는 `currentIndex` 범위 밖이면 키 삭제 후 `null` 반환.
  - `saveProgress(p)`, `clearProgress()`, `updateResultUnlocked(id)`(result + history 동일 id 모두 `reportUnlocked=true`) 제공.
  - 테스트: history 20건에서 `saveResult` → 길이 20 + 최오래 제거 + `lastResultId` 갱신; setItem throw 환경에서 `{ok:false,reason:'quota'}` + 크래시 없음; 키 전무 상태에서 `loadResult()===null`·`loadHistory().length===0`·`loadProgress()===null` 이고 `setItem` 호출 0회; 손상 1 + 정상 2 → 반환 2건 + 저장소도 2건.
  - `console.*` 0건.
- **Covers:** [F1-AC-4, F1-AC-6, F1-AC-8, F7-AC-7]
- **Files:** `src/lib/storage/resultRepo.ts`, `src/lib/storage/progressRepo.ts`, `src/lib/storage/flagsRepo.ts`, `src/lib/storage/__tests__/resultRepo.test.ts`
- **Depends on:** Task 2.1, Task 2.2

### Task 2.4 궁합 계산 + 궁합 기록 리포지토리
- **Description:** 두 PersonaCode 축 비교로 점수·등급·일치축을 계산하는 순수 함수와 `mp:compat:v1` CRUD.
- **DoD:**
  - `computeCompatibility(mine, friend): { score; grade; matchedAxes }`.
  - 공식 `100 - (A1 불일치?25:0) - (A2 불일치?15:0) - (A3 불일치?10:0)`, 항상 50~100 정수.
  - 등급 `>=90` 최고의 짝 / `75–89` 좋은 궁합 / `60–74` 무난한 궁합 / `<60` 서로 배우는 궁합.
  - `saveCompat(rec)` — 최신순 유지, 21건째부터 오래된 것 제거해 20건 상한, quota 시 최신 5건 축소 후 1회 재시도.
  - `loadCompat()` — 손상 항목 필터링, 없으면 `[]`, 최신순 정렬. `id = c_${createdAt}`(랜덤 미사용).
  - 테스트: `('FPC','SPR')` → 50/'서로 배우는 궁합'/`[]`; `('FPC','FPC')` → 100/'최고의 짝'/`['A1','A2','A3']`; `('FPC','FPR')` → 90/'최고의 짝'/`['A1','A2']`; 21건 저장 시 길이 20.
  - `console.*` 0건.
- **Covers:** [F6-AC-1, F6-AC-3]
- **Files:** `src/lib/compat.ts`, `src/lib/storage/compatRepo.ts`, `src/lib/__tests__/compat.test.ts`
- **Depends on:** Task 2.1, Task 2.2

### Task 2.5 앱 상태 훅 레이어
- **Description:** 페이지가 저장소를 직접 호출하지 않도록 얇은 React 훅을 만든다. 로딩 상태와 비영속 Toast 트리거를 여기서 관리.
- **DoD:**
  - `useResult(resultId?)` → `{ status:'loading'|'ready'|'empty'; result; persona; refresh() }`. resultId가 있으면 history 우선 조회 → 없으면 `loadResult()` 폴백 → persona 조회 실패 시 `status:'empty'` + `mp:result:v1` 삭제.
  - `useHistory()` → `{ status; items }`(최신순, 손상 항목 제외).
  - `useCompatHistory()` → `{ items; add(rec): StorageResult }`.
  - `useQuizProgress()` → `{ status; progress; corrupted; save(p); clear() }` — 손상 감지 시 `corrupted:true`를 1회 노출.
  - `useStorageNotice()` → `isPersistent() === false`일 때 세션 최초 1회만 `true` 반환(중복 Toast 방지).
  - 모든 훅은 마운트 시 동기 예외를 던지지 않고 초기 렌더에서 `status:'loading'`을 1틱 이상 유지.
  - `console.*` 0건, `tsc --noEmit` 통과.
- **Covers:** [F3-AC-7, F7-AC-7, F8-AC-8]
- **Files:** `src/hooks/useResult.ts`, `src/hooks/useHistory.ts`, `src/hooks/useCompatHistory.ts`, `src/hooks/useQuizProgress.ts`, `src/hooks/useStorageNotice.ts`
- **Depends on:** Task 2.3, Task 2.4

---

## Epic 3. 공용 UI + 페이지

**Risk Assessment**
- **Complexity:** High
- **Risk factors:**
  - **`location.state` 미방어 크래시:** `/result`·`/report`·`/share`를 새로고침하거나 직접 진입하면 state는 **항상 undefined**. `const { resultId } = useLocation().state as X`는 즉시 크래시(2026-08-03 SplitMate 사고: 가상 사용자 3인 전원 결과 화면에서 막혀 완주율 0%).
  - TDS 컴포넌트에 Tailwind/인라인 padding을 덮어써 레이아웃 붕괴 → 검수 반려.
  - MiniBar/Sparkline/SummaryHero를 페이지마다 중복 구현하면 HEX 하드코딩이 새어 들어옴(F8-AC-4).
  - 리워드 광고 콜백(성공/실패/중도이탈) 분기 누락 시 F4-AC-4/F4-AC-5 동시 실패.
  - **동일 페이지 파일을 두 태스크가 편집하면 충돌** — 이번 개정에서 제거.
- **Mitigation:** Task 3.1에서 공용 시각화 컴포넌트를 TDS 토큰만으로 먼저 만든다. 화면은 "로직 훅/서브 컴포넌트 태스크" → "페이지 조립 태스크" 순으로 분할해 **각 파일 소유자를 1명으로 고정**한다. state를 받는 모든 페이지 태스크에 "state 없이 직접 진입해도 크래시 없이 빈 상태" DoD를 강제한다.

**모든 페이지 태스크 공통 계약 (각 태스크 DoD에 포함)**
```tsx
// 필수 — 캐스팅 전에 null 확인. 'as'는 런타임 방어가 아니다.
const state = (useLocation().state as RouteState['/result']) ?? null;
const resultId = state?.resultId;   // 없으면 저장소 폴백 → 그래도 없으면 빈 상태
```
- 금지: `const { resultId } = useLocation().state as X;`
- 금지: `(useLocation().state as X).items.map(...)`
- 모든 화면은 `ScreenScaffold` + TDS `Top`으로 감싼다(raw `<div>` 골격 금지). 색상은 `var(--tds-color-*)`만, HEX 0건.

---

### Task 3.1 공용 시각화 컴포넌트 (MiniBar / SummaryHero / Sparkline / EmptyState)
- **Description:** 여러 화면이 공유하는 4개 프레젠테이션 컴포넌트. 상태·저장소 접근 없음, props만 받는 순수 컴포넌트.
- **DoD:**
  - `<MiniBar percent={0|25|50|75|100} label testId />` — 채움 폭이 `percent`와 일치, 트랙/채움 색은 `var(--tds-color-*)`, 우측에 TDS `Chip` 라벨.
  - `<SummaryHero value suffix? caption />` — 0→value CountUp(600ms, rAF), 값은 t2 타이포. `prefers-reduced-motion` 시 최종값 즉시 표시.
  - `<Sparkline points testId />` — 좌표가 points 개수/값에 비례하는 SVG polyline. `points.length < 3`이면 `null` 반환(호출측이 대체 문구 표시).
  - `<EmptyState icon message ctaLabel onCta />` — `Asset.ContentIcon` + `Paragraph.Text` + TDS `Button display="block"`(48px 이상).
  - 4개 컴포넌트 전체 HEX 리터럴 0건, Tailwind padding/margin 클래스 0건, TDS 컴포넌트에 인라인 padding/margin 주입 0건.
  - 빈 배열/0값/undefined label에도 크래시하지 않는다.
- **Covers:** [F3-AC-2, F7-AC-5]
- **Files:** `src/components/MiniBar.tsx`, `src/components/SummaryHero.tsx`, `src/components/Sparkline.tsx`, `src/components/EmptyState.tsx`
- **Depends on:** Task 1.1

### Task 3.2 홈 화면 `/`
- **Description:** 최근 결과 요약 카드 + 시작/이어하기 CTA + 빈 상태 + 배너. S1 레이아웃 계약 준수. **이 파일의 단독 소유자**(배너 배치까지 이 태스크에서 확정).
- **DoD:**
  - `ScreenScaffold > Top("MoneyPersona") > [최근 결과 Card] > Spacing(24) > AdSlot > SubmitFooter`.
  - `data-testid="home-latest-card"`에 이모지 + 캐릭터명 + 진단일 `YYYY.MM.DD` + "결과 다시 보기" 버튼, 카드 탭 영역 높이 72px 이상.
  - "결과 다시 보기" → `navigate('/result', { state: { resultId } })`.
  - SubmitFooter "테스트 시작하기" `display="block"`, 48px 이상 → `navigate('/quiz')`.
  - 유효한 `mp:progress:v1`이 있으면 라벨이 `이어서 하기 (4/12)` 형식(`currentIndex+1`/12).
  - 빈 상태(result·history 모두 없음): `EmptyState` + "12개 질문으로 내 소비 캐릭터를 찾아보세요", `home-latest-card` 미렌더.
  - 로딩: `data-testid="home-skeleton"` 스켈레톤 Card 1개, 완료 후 DOM 제거.
  - 저장소 파싱 실패 시 빈 상태 UI + Toast "이전 기록을 불러오지 못했어요".
  - `useStorageNotice()`가 true면 Toast "이번 기록은 앱을 닫으면 사라져요"를 세션 1회만 표시.
  - `<AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />`가 콘텐츠 아래·FloatingTabBar 위에 **정확히 1개**, static 흐름 배치(z-index 오버레이 0건), 탭바 높이만큼 하단 padding 확보. env가 비어 있어도 크래시하지 않는다.
  - `console.error`/`console.warn` 0건.
- **Covers:** [F7-AC-1, F7-AC-2, F7-AC-3, F7-AC-8, F8-AC-8]
- **Files:** `src/pages/HomePage.tsx`
- **Depends on:** Task 2.5, Task 3.1

### Task 3.3 퀴즈 진행 로직 훅 (`useQuizFlow`)
- **Description:** 퀴즈의 모든 비-UI 로직(진행 복구·저장·전환 잠금·완료 처리)을 훅으로 구현한다. JSX 0줄 → 단독 테스트 가능.
- **DoD:**
  - `useQuizFlow()` → `{ status:'loading'|'ready'; index; answers; corrupted; select(score:0|1); goBack(): 'home'|'prev'; }`.
  - 마운트 시 `loadProgress()`로 복구: `{answers:[1,0,1,null,...], currentIndex:3}` → `index === 3`(4번 문항). 복구 완료 전까지 `status:'loading'`.
  - 손상(`answers.length !== 12`, `currentIndex` 범위 밖) → 키 삭제 + `index=0` + `corrupted:true` 1회.
  - `select()` 호출마다 `mp:progress:v1`에 `{answers, currentIndex, updatedAt}` 저장 — 1번에서 score 1 선택 시 `{answers:[1,null×11], currentIndex:1}`.
  - 전환 잠금: `select()` 후 200ms 동안 추가 호출 무시 → 3연타 시 답변 1회 기록 + 인덱스 1 증가.
  - 12번째 `select()` → `scoreQuiz` 실행 → `QuizResult` 생성(`id = r_${createdAt}_${personaCode}`, `shareCode = makeShareCode(code)`, `reportUnlocked:false`) → `saveResult` → `clearProgress()` → `{ done:true, resultId }` 반환.
  - `scoreQuiz`가 `{ok:false}`면 진행 초기화 + `corrupted:true`만 세우고 크래시 0건.
  - 테스트: 복구/손상/잠금/완료 4케이스 통과, `console.*` 0건.
- **Covers:** [F2-AC-1, F2-AC-2, F2-AC-3, F2-AC-5, F2-AC-6]
- **Files:** `src/pages/quiz/useQuizFlow.ts`, `src/pages/quiz/__tests__/useQuizFlow.test.ts`
- **Depends on:** Task 1.2, Task 2.3, Task 2.5

### Task 3.4 퀴즈 화면 `/quiz`
- **Description:** `useQuizFlow`를 소비하는 UI 조립 — 문항 표시, 선택지 버튼, 진행률 바, 스켈레톤, 뒤로가기, Toast. **QuizPage.tsx 단독 소유자.**
- **DoD:**
  - `ScreenScaffold > Top(뒤로 + "n / 12") > 진행률 바 > 문항 텍스트(t3) > 선택지 Button 2개(세로 스택, `display="block"`, 각 56px)`.
  - 1번 문항 "월급날 가장 먼저 하는 일은?"에서 선택지 a 탭 → 2번 문항 + 진행 표시 "2 / 12".
  - `Top` 뒤로 버튼(44×44px 이상): 이전 문항으로 이동하며 해당 문항의 기존 선택지가 선택 상태(`aria-pressed="true"` + TDS 강조)로 표시. 1번에서 뒤로 → `navigate('/')`.
  - `status === 'loading'` 동안 `data-testid="quiz-skeleton"`만 렌더(선택지 Button 미렌더), 복구 완료 시 DOM 제거.
  - `corrupted === true`면 Toast "이전 진행 기록이 없어 처음부터 시작해요" 1회.
  - `done` 수신 시 `navigate('/result', { state: { resultId }, replace: true })`.
  - 이 화면에서 `AdSlot` 렌더 0건, `FloatingTabBar` 미렌더.
  - 진행률 바 색상은 `var(--tds-color-*)`만(HEX 0건), `console.error`/`console.warn` 0건.
- **Covers:** [F2-AC-1, F2-AC-3, F2-AC-4, F2-AC-5, F2-AC-7, F2-AC-8]
- **Files:** `src/pages/QuizPage.tsx`, `src/pages/quiz/ProgressBar.tsx`
- **Depends on:** Task 3.3, Task 3.1

### Task 3.5 결과 화면 서브 컴포넌트 (persona / axis / tips)
- **Description:** `/result`의 3개 Card를 props-only 컴포넌트로 분리 구현. 라우터·저장소 접근 0건.
- **DoD:**
  - `<PersonaCard persona />` — `data-testid="persona-card"` Card 1개에 이모지(🐿️) + 이름(t2 강조, "알뜰형 다람쥐") + tagline + 코드 `Chip`.
  - `<AxisMetricsCard axisScores />` — `data-testid="axis-metrics"` Card 안에 `data-testid="axis-bar-A1|A2|A3"` MiniBar 3개, 채움 비율이 각 축 `percent`와 일치하고 옆에 `Chip` 라벨("절약형 75%" 형식).
  - `<TipsCard tips />` — `data-testid="tips-card"` Card 안에 `ListRow` 정확히 3개(각 높이 56px 이상).
  - `<ResultSkeleton />` — `data-testid="result-skeleton"` Card 3개 플레이스홀더.
  - 세 컴포넌트 모두 빈/누락 props에도 크래시하지 않는다(빈 배열 → 행 0개 렌더).
  - HEX 0건, TDS 컴포넌트에 인라인 padding/margin 0건.
- **Covers:** [F3-AC-1, F3-AC-2]
- **Files:** `src/pages/result/PersonaCard.tsx`, `src/pages/result/AxisMetricsCard.tsx`, `src/pages/result/TipsCard.tsx`, `src/pages/result/ResultSkeleton.tsx`
- **Depends on:** Task 3.1, Task 1.1

### Task 3.6 결과 화면 `/result` 조립 + 빈 상태 + 배너
- **Description:** state 3단 방어, 서브 컴포넌트 조립, CTA 2개, 고지 문구, 빈 상태/손상 복구, AdSlot 배치. **ResultPage.tsx 단독 소유자.**
- **DoD:**
  - state 방어: `const state = (useLocation().state as RouteState['/result']) ?? null;` → `state?.resultId` 없으면 `loadResult()` 폴백 → 그래도 없으면 빈 상태. **state 없이 직접 진입/새로고침해도 크래시하지 않는다.**
  - 레이아웃: `ScreenScaffold > Top("내 소비 캐릭터") > PersonaCard > Spacing(16) > AxisMetricsCard > Spacing(16) > TipsCard > Spacing(24) > AdSlot > 고지 Paragraph.Text > SubmitFooter`.
  - "상세 리포트 보기"는 `SubmitFooter` 내부 `display="block"`, 48px 이상 → `navigate('/report', { state: { resultId } })`.
  - "결과 공유하기" 보조 버튼도 `display="block"`, 히트 영역 44px 이상 → `navigate('/share', { state: { resultId } })`.
  - 하단 `Paragraph.Text`로 "재미로 보는 성향 테스트이며 금융 투자 자문이 아닙니다" 표시.
  - 빈 상태: `EmptyState`(Asset.ContentIcon + "아직 진단 결과가 없어요" + "테스트 시작하기" block) → 탭 시 `navigate('/quiz')`. 이때 AdSlot·CTA 2개 미렌더.
  - `personaCode`가 PERSONAS에 없는 값('XXX')이면 크래시 없이 빈 상태 + `mp:result:v1` 삭제 + `console.error` 0회.
  - `<AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />`가 `tips-card` 아래·`SubmitFooter` 위에 **정확히 1개**, static 흐름 배치로 persona-card·CTA를 덮지 않는다(`position:fixed/absolute` + z-index 오버레이 0건).
  - 로딩 시 `ResultSkeleton` 렌더, `FloatingTabBar` 미렌더, HEX 0건, `console.*` 0건.
  - 테스트: state 없이 `/result` 직접 렌더 → 크래시 없이 빈 상태 노출.
- **Covers:** [F3-AC-1, F3-AC-3, F3-AC-4, F3-AC-5, F3-AC-6, F3-AC-7, F3-AC-8]
- **Files:** `src/pages/ResultPage.tsx`, `src/pages/__tests__/ResultPage.test.tsx`
- **Depends on:** Task 3.5, Task 2.5

### Task 3.7 리포트 콘텐츠 컴포넌트 + 잠금 미리보기 + 빈 상태
- **Description:** 해제 상태 3개 Card, 잠금 미리보기, 결과 없음 빈 상태를 props-only 컴포넌트로 구현. 광고·라우터 접근 0건.
- **DoD:**
  - `<ReportCards persona axisScores />` — `data-testid="report-card"` Card **3개**: (1) 요약 — 상단 `SummaryHero`로 대표 축 값("절약 지수 75") CountUp + t2 타이포, 아래 `summary`, (2) 위험 신호 — `cautions` 2개 `ListRow`, (3) 30일 플랜 — `plan30d` 3개를 `Chip` 번호 배지 1·2·3과 함께 `ListRow`.
  - `<ReportLockedPreview />` — "🔒 상세 분석 3가지" 제목만 있는 요약 목록 표시. `summary`/`cautions`/`plan30d` **본문 문자열이 DOM에 포함되지 않는다**(블러 금지 — 조건부 렌더로 제외). 테스트에서 본문 문자열 쿼리 0건 확인.
  - `<ReportEmpty onStart />` — `EmptyState` + "먼저 테스트를 완료해주세요" + "테스트 시작하기".
  - ListRow 높이 56px 이상, HEX 0건, `console.*` 0건.
- **Covers:** [F4-AC-3, F4-AC-7, F4-AC-8]
- **Files:** `src/pages/report/ReportCards.tsx`, `src/pages/report/ReportLockedPreview.tsx`, `src/pages/report/ReportEmpty.tsx`
- **Depends on:** Task 3.1, Task 1.1

### Task 3.8 리포트 화면 `/report` (리워드 게이트)
- **Description:** state 방어 + `TossRewardAd` 게이팅 + 해제 영속화 + 광고 실패/중도이탈/로딩 분기 + 콘텐츠 조립. **ReportPage.tsx 단독 소유자.**
- **DoD:**
  - state 방어: `(useLocation().state as RouteState['/report']) ?? null` → resultId 없으면 `loadResult()` 폴백 → 없으면 `<ReportEmpty>`. **state 없이 직접 진입해도 크래시 0건.**
  - `reportUnlocked === false`면 `ReportLockedPreview` + `SubmitFooter`의 "광고 보고 리포트 열기"(`display="block"`, 48px 이상)를 `<TossRewardAd slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}>`로 게이팅.
  - 시청 완료 콜백 → `updateResultUnlocked(resultId)`로 `mp:result:v1.reportUnlocked = true` **및 `mp:history:v1` 동일 id 항목 동시 갱신** → `ReportCards` 3개 Card 노출.
  - `reportUnlocked === true`로 재진입 시 광고 호출 0회, 즉시 리포트 표시.
  - 광고 로드 실패 → Toast "지금은 광고를 불러올 수 없어요. 잠시 후 다시 시도해주세요" + 잠금 유지 + "다시 시도" 버튼 표시 + `console.error` 0회.
  - 중도 이탈 → `reportUnlocked` false 유지 + Toast "광고를 끝까지 봐야 리포트가 열려요".
  - 로딩 중 → 버튼 `disabled` + `data-testid="report-loading"` 표시, 3연타해도 광고 요청 1회만(in-flight 가드).
  - 하단 "결과 공유하기" → `navigate('/share', { state: { resultId } })`, 뒤로 → `navigate(-1)`, 빈 상태 CTA → `navigate('/quiz')`.
  - `FloatingTabBar` 미렌더, HEX 0건.
- **Covers:** [F4-AC-1, F4-AC-2, F4-AC-4, F4-AC-5, F4-AC-6, F4-AC-7]
- **Files:** `src/pages/ReportPage.tsx`
- **Depends on:** Task 3.7, Task 2.3, Task 2.5

### Task 3.9 공유 이미지 생성 + 공유 실행 유틸
- **Description:** Canvas 1080×1080 PNG 생성, 공유 텍스트 조립, `navigator.share`/클립보드 폴백, 취소·실패 처리. UI 없음 → 단독 테스트 가능.
- **DoD:**
  - `renderShareImage(persona, shareCode): Promise<Blob | null>` — 1080×1080 캔버스에 이모지·이름·tagline·공유 코드를 그리고 `toBlob('image/png')`. `toBlob`이 `null`이면 `null` 반환(throw 금지).
  - `buildShareText(persona, shareCode)` → 정확히 `내 소비 캐릭터는 ${persona.name} ${persona.emoji}! 내 코드: ${shareCode}` (FPC 예: `내 소비 캐릭터는 알뜰형 다람쥐 🐿️! 내 코드: MP1-FPC-2`).
  - `shareResult(persona, shareCode): Promise<'shared'|'copied'|'aborted'|'failed'>`:
    - `navigator.canShare?.({files})`가 true → PNG File + 텍스트로 `navigator.share` **1회** 호출 → `'shared'`.
    - `navigator.share` 미정의 → `navigator.clipboard.writeText(텍스트)` → `'copied'`.
    - 이미지 생성 실패 → 텍스트만으로 share 시도 → 실패 시 클립보드 복사 → `'copied'`(호출측이 Toast "이미지를 만들지 못했어요. 코드를 복사했어요").
    - `AbortError` reject → `'aborted'`(에러 전파·Toast 없음).
  - 파일 내 `window.open(` 0건, 외부 URL을 `window.location.href`에 대입 0건, `console.*` 0건.
  - 테스트: share 존재/미존재/toBlob null/AbortError 4케이스 반환값 검증 + share 호출 횟수 1회 검증.
- **Covers:** [F5-AC-1, F5-AC-2, F5-AC-5, F5-AC-6, F5-AC-7]
- **Files:** `src/lib/shareImage.ts`, `src/lib/shareResult.ts`, `src/lib/__tests__/shareResult.test.ts`
- **Depends on:** Task 1.3, Task 2.2

### Task 3.10 공유 화면 `/share`
- **Description:** 미리보기 카드, 공유 코드 Chip, 코드 복사, 공유 버튼 로딩 상태, 빈 상태. **SharePage.tsx 단독 소유자.**
- **DoD:**
  - state 방어: `(useLocation().state as RouteState['/share']) ?? null` → 폴백 `loadResult()` → 없으면 빈 상태. **직접 진입 크래시 0건.**
  - `ScreenScaffold > Top("결과 공유") > data-testid="share-preview" Card(1:1 비율) > Spacing(16) > 공유 코드 Chip + "코드 복사" 텍스트 버튼(44px 이상) > SubmitFooter("공유하기")`.
  - `share-preview` Card 1개 안에 이모지·캐릭터명·tagline·공유 코드가 모두 포함되고 공유 코드는 TDS `Chip`.
  - "공유하기"는 `SubmitFooter` 내부 `display="block"`, 48px 이상 → `shareResult()` 호출. 반환값에 따라 `'copied'` → Toast "공유 문구를 복사했어요", `'aborted'` → Toast 미표시·상태 유지, `'failed'` → Toast "이미지를 만들지 못했어요. 코드를 복사했어요".
  - 실행 중 버튼 라벨 "이미지 만드는 중" + `disabled` + `data-testid="share-loading"`, 완료 후 원래 라벨 복귀 + 활성화.
  - 결과 없음 → `EmptyState` + "공유할 결과가 없어요" + "테스트 시작하기" → `navigate('/quiz')`. 이때 공유 버튼·미리보기 미렌더.
  - 화면 내 카카오톡/인스타그램 등 앱 이름·설치 유도 문구·외부 링크 0건, `window.open(` 0건.
  - 뒤로 → `navigate(-1)`, `FloatingTabBar` 미렌더, HEX 0건, `console.error` 0회.
- **Covers:** [F5-AC-3, F5-AC-4, F5-AC-7, F5-AC-8]
- **Files:** `src/pages/SharePage.tsx`
- **Depends on:** Task 3.9, Task 3.1, Task 2.5

### Task 3.11 궁합 화면 서브 컴포넌트 (입력 / 점수 카드 / 기록 목록)
- **Description:** `/compat`의 3개 UI 블록을 props-only 컴포넌트로 구현. 계산·저장소 접근 0건(콜백으로 위임).
- **DoD:**
  - `<CompatInput value onChange onSubmit error disabled />` — TDS TextField에 `inputMode="text"`, `autoCapitalize="characters"`, `maxLength={12}`, 높이 48px 이상. 포커스 시 `scrollIntoView({ block:'center' })` 호출. Enter(완료) → `onSubmit` 실행 + 입력 필드 `blur()`. `error` 문자열이 있으면 TextField 하단 에러 슬롯에 표시.
  - `<CompatResultCard score grade axes />` — `data-testid="compat-score-card"` Card 안에 `SummaryHero`가 0→score CountUp을 t2 타이포로 렌더, 등급은 `Chip` 배지. `data-testid="compat-axis-list"`에 축 3개 `ListRow`, 각 행 우측 라벨은 일치 "찰떡" / 불일치 "정반대".
  - `<CompatHistoryList items onSelect />` — 최신순 `ListRow`(각 56px 이상)에 친구 캐릭터명 + 점수. 3건이면 정확히 3개 렌더, 0건이면 "아직 비교한 친구가 없어요" 빈 상태 문구. 행 탭 → `onSelect(rec)`(내비게이션 호출 0회, 호출측 BottomSheet용).
  - `items`가 `undefined`/빈 배열이어도 크래시 0건(`?? []` 방어), HEX 0건.
- **Covers:** [F6-AC-2, F6-AC-7, F6-AC-8]
- **Files:** `src/pages/compat/CompatInput.tsx`, `src/pages/compat/CompatResultCard.tsx`, `src/pages/compat/CompatHistoryList.tsx`
- **Depends on:** Task 3.1, Task 1.1

### Task 3.12 궁합 화면 `/compat` 조립
- **Description:** 코드 검증 → 궁합 계산 → 기록 저장 → 결과 표시, 빈/에러 상태, BottomSheet 상세, 배너. **CompatPage.tsx 단독 소유자.**
- **DoD:**
  - state 방어: `(useLocation().state as RouteState['/compat']) ?? null` → `state?.prefillCode`가 있으면 초기값 세팅, 없어도 크래시 0건.
  - 레이아웃: `ScreenScaffold > Top("친구와 궁합") > CompatInput > (결과 있으면) CompatResultCard > Spacing(24) > CompatHistoryList > AdSlot > SubmitFooter("궁합 보기", block, 48px 이상)`.
  - `"mp1-spr-6"` 제출 → `MP1-SPR-6` 정규화 → 내 코드 FPC 기준 점수 50 / "서로 배우는 궁합" 표시 + `mp:compat:v1`에 레코드 1건 추가.
  - `"MP1-FPC-2"` 제출(내 코드 FPC) → 점수 100 / "최고의 짝" / 축 3개 모두 "찰떡".
  - `"ABCD"` → 에러 "코드 형식이 올바르지 않아요 (예: MP1-FPC-2)" + 기록 저장 0건.
  - `"MP1-FPC-9"` → 에러 "코드가 잘못됐어요. 친구에게 다시 받아보세요" + `computeCompatibility` 호출 0회.
  - `mp:result:v1` 없음 → TextField·"궁합 보기" `disabled` + `EmptyState`("먼저 내 캐릭터를 진단해주세요" + "테스트 시작하기" → `/quiz`).
  - 계산 중 버튼 `disabled` + `data-testid="compat-loading"`.
  - 기록 항목 탭 → 같은 화면 내 TDS `BottomSheet` 상세(내비게이션 호출 0회).
  - `AdSlot` 1개만 렌더(탭바 위, 겹침 0건), 키보드 노출 시 SubmitFooter가 입력창을 가리지 않도록 하단 여백 보정, HEX 0건, `console.*` 0건.
- **Covers:** [F6-AC-1, F6-AC-3, F6-AC-4, F6-AC-5, F6-AC-6, F6-AC-8]
- **Files:** `src/pages/CompatPage.tsx`
- **Depends on:** Task 3.11, Task 2.2, Task 2.4, Task 2.5

### Task 3.13 기록 화면 `/history`
- **Description:** 진단 기록 목록(최신순) + 절약 지수 추이 Sparkline + 손상 항목 필터링 + 빈 상태 + 배너. **HistoryPage.tsx 단독 소유자**(배너 배치까지 여기서 확정).
- **DoD:**
  - `ScreenScaffold > Top("내 진단 기록") > history-trend Card > Spacing(16) > ListRow 목록 > AdSlot`.
  - 히스토리 20건 시 `ListRow` 20개가 `createdAt` **내림차순**, 일반 세로 스크롤(가상 스크롤 미적용), 각 행 44px 이상, 캐릭터명 + 진단일 + `Chip`(캐릭터 코드).
  - 행 탭 → `navigate('/result', { state: { resultId } })`.
  - 3건 이상 → `data-testid="history-trend"` Card 안 Sparkline이 각 결과 A1 `percent`를 **시간 오름차순**으로 렌더. 2건 이하 → "기록이 3개 이상 쌓이면 추이를 보여드려요" 문구.
  - `personaCode` 누락 1 + 정상 2 → 정상 2건만 렌더 + 저장소도 2건으로 정리, 크래시 0건, `console.error` 0회.
  - 로딩: `data-testid="history-skeleton"` ListRow 3개 플레이스홀더.
  - 빈 상태: `EmptyState` + "아직 기록이 없어요" + "테스트 시작하기"(block) → `/quiz`.
  - `<AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />`가 목록 아래·FloatingTabBar 위에 **정확히 1개**, static 흐름 배치(겹침 0건), env 미설정에도 크래시 0건. HEX 0건.
- **Covers:** [F7-AC-4, F7-AC-5, F7-AC-7, F7-AC-8]
- **Files:** `src/pages/HistoryPage.tsx`
- **Depends on:** Task 2.5, Task 3.1

---

## Epic 4. 통합 + 컴플라이언스

**Risk Assessment**
- **Complexity:** Medium
- **Risk factors:**
  - 라우팅을 마지막에 붙이면 페이지 진입 경로가 미검증인 채 쌓인다.
  - `FloatingTabBar`를 전역에 두면 `/quiz`·`/report`·`/share`에 노출되어 F2-AC-8·F7-AC-6 위반.
  - 반려 사유(HEX 하드코딩, `window.open`, 외부 로깅 SDK, `Array.prototype.at` 등 구형 OS 미지원 API)는 코드 리뷰만으로 놓치기 쉽다.
  - Epic 4가 페이지 파일을 다시 편집하면 Epic 3과 충돌 → **이번 개정에서 4.x는 페이지 파일을 수정하지 않는다**(광고 배치는 3.2/3.6/3.13 소유, 4.3은 검증 테스트만 추가).
- **Mitigation:** Task 4.1에서 라우트를 한 번에 정의하고 탭바 노출을 경로 화이트리스트로 제어. Task 4.2에서 grep 기반 자동 테스트를 CI 가능한 형태로 추가. Task 4.3은 신규 테스트 파일과 `.env.example`만 소유해 파일 충돌 없이 최종 검증한다.

---

### Task 4.1 라우팅 + FloatingTabBar 조건부 노출
- **Description:** 7개 라우트를 `BrowserRouter`에 배선하고 하단 탭바 노출 규칙을 확정한다. 페이지 파일은 수정하지 않는다(import만).
- **DoD:**
  - `/`, `/quiz`, `/result`, `/report`, `/share`, `/compat`, `/history` 7개 라우트가 `react-router-dom`으로 등록되고, 알 수 없는 경로는 `<Navigate to="/" replace />`.
  - `FloatingTabBar`(템플릿 제공)에 홈·궁합·기록 3개 탭 등록. "궁합" 탭 탭 시 `navigate('/compat')` + 해당 아이템 선택 상태 표시.
  - 탭바는 `/`, `/compat`, `/history`에서만 렌더되고 `/quiz`, `/report`, `/share`에서는 **DOM에 존재하지 않는다**(숨김 스타일이 아닌 조건부 렌더).
  - 각 탭 아이템 히트 영역 44×44px 이상.
  - 모든 `navigate` 호출 인자가 `RouteState`의 해당 키 타입과 일치(불일치 시 `tsc --noEmit` 실패).
  - 테스트: 7개 라우트를 **state 없이** 직접 렌더해도 크래시 없이 화면(정상 또는 빈 상태)이 표시된다.
- **Covers:** [F7-AC-6, F2-AC-8]
- **Files:** `src/App.tsx`, `src/routes.tsx`, `src/components/tabbar.config.ts`
- **Depends on:** Task 3.2, 3.4, 3.6, 3.8, 3.10, 3.12, 3.13

### Task 4.2 검수 컴플라이언스 가드 + 정적 검사 테스트
- **Description:** 외부 이탈 차단 가드, 반려 사유 자동 검출 테스트, 빌드 타깃 조정.
- **DoD:**
  - `installExternalNavGuard()`를 앱 부트에서 1회 설치: 앱 도메인 외 URL로의 `window.open` / `window.location.href` 대입을 차단하고 Toast "외부 페이지로 이동할 수 없어요" 표시.
  - grep 테스트(`src/**/*.{ts,tsx,css}` 대상, 각 매치 0건 assert):
    - `window.open(` 0건
    - `#RRGGBB`/`#RGB` 색상 리터럴 0건 (모든 색상은 `var(--tds-color-*)` 또는 TDS 기본값)
    - "앱을 설치" / "다운로드" / "설치하기" / "스토어에서" / 앱스토어·플레이스토어 URL 0건
    - `.at(`, `Object.hasOwn`, `.replaceAll(`, 옵셔널 catch binding(`catch {`) 0건
  - `package.json`에 Google Analytics / Amplitude / Sentry / Mixpanel 및 shadcn/ui·MUI·Ant Design·Chakra UI 의존성 0건 assert.
  - 앱 도메인 외부로 나가는 `fetch`/`XMLHttpRequest` 호출 0건(광고 SDK 제외) assert.
  - `vite.config.ts`의 `build.target === 'es2019'`이고 빌드 성공.
  - 모든 Button·ListRow·Chip·탭 아이템의 최소 히트 영역 44×44px을 보장하는 전역 스타일 규칙(`src/styles/hit-area.css`) 적용 + 렌더 검증 테스트.
- **Covers:** [F8-AC-1, F8-AC-2, F8-AC-4, F8-AC-5, F8-AC-6, F8-AC-7]
- **Files:** `src/lib/guards/externalNavGuard.ts`, `src/main.tsx`, `src/styles/hit-area.css`, `src/__tests__/compliance.test.ts`, `vite.config.ts`
- **Depends on:** Task 4.1

### Task 4.3 전 라우트 스모크 + 광고 배치 검증 + env 문서화
- **Description:** 프로덕션 빌드로 7개 라우트를 순회해 콘솔·크래시·광고 배치를 검증한다. **페이지 파일은 수정하지 않고 테스트/문서 파일만 추가**한다(위반 발견 시 해당 페이지 소유 태스크로 되돌려 수정).
- **DoD:**
  - `src/__tests__/routes.smoke.test.tsx`: `/`, `/quiz`, `/result`, `/report`, `/share`, `/compat`, `/history`를 state 없이 순회 렌더 → `console.error` 0건, `console.warn` 0건, 처리되지 않은 Promise rejection 0건, 크래시 0건.
  - `src/__tests__/ads.placement.test.tsx`: `/`·`/history`·`/result`·`/compat`에서 `AdSlot` 렌더 수가 각 **정확히 1개**, `/quiz`·`/report`·`/share`에서 **0개**임을 assert. 광고 컨테이너의 computed `position`이 `fixed`/`absolute`가 아니며(탭바·CTA 겹침 0건) 탭바 높이만큼 하단 여백이 확보됨을 assert.
  - 다크모드 검증: 7개 화면 렌더 결과에 HEX 인라인 색상 0건 + 모든 색상 선언이 `var(--tds-color-*)`임을 assert(대비비 4.5:1은 TDS 토큰 사용으로 보장 + 육안 체크리스트 통과).
  - `.env.example`에 `VITE_TOSS_AD_GROUP_ID`, `VITE_TOSS_AD_SLOT_ID`가 주석과 함께 문서화되고, 값이 빈 문자열이어도 7개 라우트 스모크가 통과한다.
- **Covers:** [F8-AC-3, F7-AC-8, F3-AC-8]
- **Files:** `src/__tests__/routes.smoke.test.tsx`, `src/__tests__/ads.placement.test.tsx`, `.env.example`
- **Depends on:** Task 4.2

---

## 파일 소유권 표 (충돌 0건 검증)

| 파일 | 소유 태스크 |
|---|---|
| `src/lib/types.ts` | 1.1 |
| `src/data/questions.ts` (+test) | 1.2 |
| `src/data/personas.ts` (+test) | 1.3 |
| `src/lib/storage/safeStorage.ts` (+test) | 2.1 |
| `src/lib/scoring.ts`, `src/lib/shareCode.ts` (+tests) | 2.2 |
| `src/lib/storage/resultRepo.ts`, `progressRepo.ts`, `flagsRepo.ts` (+test) | 2.3 |
| `src/lib/compat.ts`, `src/lib/storage/compatRepo.ts` (+test) | 2.4 |
| `src/hooks/*.ts` | 2.5 |
| `src/components/MiniBar|SummaryHero|Sparkline|EmptyState.tsx` | 3.1 |
| `src/pages/HomePage.tsx` | **3.2 단독** |
| `src/pages/quiz/useQuizFlow.ts` (+test) | 3.3 |
| `src/pages/QuizPage.tsx`, `src/pages/quiz/ProgressBar.tsx` | **3.4 단독** |
| `src/pages/result/*.tsx` | 3.5 |
| `src/pages/ResultPage.tsx` (+test) | **3.6 단독** |
| `src/pages/report/*.tsx` | 3.7 |
| `src/pages/ReportPage.tsx` | **3.8 단독** |
| `src/lib/shareImage.ts`, `src/lib/shareResult.ts` (+test) | 3.9 |
| `src/pages/SharePage.tsx` | **3.10 단독** |
| `src/pages/compat/*.tsx` | 3.11 |
| `src/pages/CompatPage.tsx` | **3.12 단독** |
| `src/pages/HistoryPage.tsx` | **3.13 단독** |
| `src/App.tsx`, `src/routes.tsx`, `src/components/tabbar.config.ts` | 4.1 |
| `src/lib/guards/externalNavGuard.ts`, `src/main.tsx`, `src/styles/hit-area.css`, `src/__tests__/compliance.test.ts`, `vite.config.ts` | 4.2 |
| `src/__tests__/routes.smoke.test.tsx`, `src/__tests__/ads.placement.test.tsx`, `.env.example` | 4.3 |

→ **중복 소유 파일 0건.**

---

## AC Coverage

- **Total ACs in SPEC:** 64 (F1–F8 × 8)
- **Covered by tasks:** 64

| AC | Task |
|---|---|
| F1-AC-1 | 1.2, 1.3 |
| F1-AC-2 | 2.2 |
| F1-AC-3 | 2.2 |
| F1-AC-4 | 2.3 |
| F1-AC-5 | 2.1 |
| F1-AC-6 | 2.1, 2.3 |
| F1-AC-7 | 2.2 |
| F1-AC-8 | 2.1, 2.3 |
| F2-AC-1 | 3.3, 3.4 |
| F2-AC-2 | 3.3 |
| F2-AC-3 | 3.3, 3.4 |
| F2-AC-4 | 3.4 |
| F2-AC-5 | 3.3, 3.4 |
| F2-AC-6 | 3.3 |
| F2-AC-7 | 3.4 |
| F2-AC-8 | 3.4, 4.1 |
| F3-AC-1 | 3.5, 3.6 |
| F3-AC-2 | 3.1, 3.5 |
| F3-AC-3 | 3.6 |
| F3-AC-4 | 3.6 |
| F3-AC-5 | 3.6 |
| F3-AC-6 | 3.6 |
| F3-AC-7 | 2.5, 3.6 |
| F3-AC-8 | 3.6, 4.3 |
| F4-AC-1 | 3.8 |
| F4-AC-2 | 3.8 |
| F4-AC-3 | 3.7 |
| F4-AC-4 | 3.8 |
| F4-AC-5 | 3.8 |
| F4-AC-6 | 3.8 |
| F4-AC-7 | 3.7, 3.8 |
| F4-AC-8 | 3.7 |
| F5-AC-1 | 3.9 |
| F5-AC-2 | 3.9 |
| F5-AC-3 | 3.10 |
| F5-AC-4 | 3.10 |
| F5-AC-5 | 3.9 |
| F5-AC-6 | 3.9 |
| F5-AC-7 | 3.9, 3.10 |
| F5-AC-8 | 3.10 |
| F6-AC-1 | 2.4, 3.12 |
| F6-AC-2 | 3.11 |
| F6-AC-3 | 2.4, 3.12 |
| F6-AC-4 | 2.2, 3.12 |
| F6-AC-5 | 2.2, 3.12 |
| F6-AC-6 | 3.12 |
| F6-AC-7 | 3.11 |
| F6-AC-8 | 3.11, 3.12 |
| F7-AC-1 | 3.2 |
| F7-AC-2 | 3.2 |
| F7-AC-3 | 3.2 |
| F7-AC-4 | 3.13 |
| F7-AC-5 | 3.1, 3.13 |
| F7-AC-6 | 4.1 |
| F7-AC-7 | 2.3, 2.5, 3.13 |
| F7-AC-8 | 3.2, 3.13, 4.3 |
| F8-AC-1 | 4.2 |
| F8-AC-2 | 4.2 |
| F8-AC-3 | 4.3 |
| F8-AC-4 | 4.2 |
| F8-AC-5 | 4.2 |
| F8-AC-6 | 4.2 |
| F8-AC-7 | 4.2 |
| F8-AC-8 | 2.1, 2.5, 3.2 |

- **Uncovered:** 0 ✅ (이전 미커버 지적 항목 F3-AC-6 → 3.6, F4-AC-4 → 3.8, F7-AC-7 → 2.3/2.5/3.13, F8-AC-8 → 2.1/2.5/3.2 로 모두 명시 커버)

---

## 실행 순서 요약

```
1.1 types(RouteState) ─┬─ 1.2 questions ─┐
                       └─ 1.3 personas ──┴─ 2.2 scoring/shareCode
2.1 safeStorage ──┬─ 2.3 result/history/progress repo ─┐
                  └─ 2.4 compat 계산 + repo ───────────┴─ 2.5 hooks
3.1 공용 컴포넌트
 → 3.2 홈
 → 3.3 useQuizFlow → 3.4 QuizPage
 → 3.5 result 컴포넌트 → 3.6 ResultPage
 → 3.7 report 컴포넌트 → 3.8 ReportPage
 → 3.9 shareResult/shareImage → 3.10 SharePage
 → 3.11 compat 컴포넌트 → 3.12 CompatPage
 → 3.13 HistoryPage
 → 4.1 라우팅+탭바 → 4.2 컴플라이언스 가드 → 4.3 스모크·광고 배치 검증
```

**코딩 에이전트 주의:** `location.state`를 받는 4개 화면(`/result`, `/report`, `/share`, `/compat`)은 반드시 `?? null` 확인 → 저장소 폴백 → 빈 상태 3단 방어. `as` 캐스팅은 런타임 방어가 아니다. 또한 각 파일은 표에 명시된 소유 태스크에서만 생성·수정한다.