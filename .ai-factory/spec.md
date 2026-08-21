# SPEC — MoneyPersona

> 12개 질문으로 소비 성향을 8가지 캐릭터로 진단하는 앱인토스 미니앱
> Platform: 앱인토스 (Vite + React + TypeScript + TDS + React Router + localStorage)
> Monetization: 광고 단독 (배너 `AdSlot` + 결과 리포트 `TossRewardAd` 게이팅)

---

## Common Principles

| # | 원칙 | 검증 방법 |
|---|---|---|
| CP-1 | 모든 UI는 TDS(`@toss/tds-mobile`) 컴포넌트로만 구성한다. shadcn/ui·MUI·Ant·Chakra 사용 0건 | `package.json` 의존성 검사 |
| CP-2 | TDS 컴포넌트에 Tailwind/인라인 스타일로 padding·margin을 덮어쓰지 않는다. 간격은 TDS `Spacing`(size prop 필수)만 사용 | 코드 리뷰 + grep `style={{ *padding` |
| CP-3 | 색상 HEX 하드코딩 금지. `var(--tds-color-*)` CSS 변수 또는 TDS 컴포넌트 기본값만 사용 (다크모드 필수) | grep `#[0-9a-fA-F]{3,6}` → 0건 |
| CP-4 | 커스텀 CSS는 TDS가 제공하지 않는 레이아웃(flex/grid)에만 허용 | 코드 리뷰 |
| CP-5 | 외부 네트워크 호출 0건. `fetch`/`XMLHttpRequest` 사용하지 않음 → CORS 에러 0건 | grep `fetch(` → 0건 |
| CP-6 | 외부 도메인 이탈 금지. `window.location.href`, `window.open` 사용 0건 | grep → 0건 |
| CP-7 | 외부 분석 솔루션(GA, Amplitude 등) 미탑재. 로깅은 화면 렌더링에 영향 없는 no-op | `package.json` 검사 |
| CP-8 | 프로덕션 빌드에서 `console.error` 출력 0건. 모든 `JSON.parse`/스토리지 접근은 try-catch로 감싼다 | 빌드 후 E2E 실행 중 console 캡처 |
| CP-9 | Android 7+ / iOS 16+ 호환. `Array.prototype.at`, `Object.groupBy`, `structuredClone`, 옵셔널 체이닝 이후 최신 API 사용 금지 (Vite target `es2020`) | `vite.config.ts` target 검사 |
| CP-10 | 모든 인터랙티브 요소의 터치 타겟은 최소 44×44px. 리스트 행은 56px 이상 | E2E `getBoundingClientRect().height >= 44` |
| CP-11 | 페이지 골격은 템플릿 `ScreenScaffold`로 감싼다. raw `div` 골격 금지 | grep 화면 컴포넌트 최상위 |
| CP-12 | 1차 액션은 `SubmitFooter`(하단 고정) 또는 `display="block"` 버튼. 좌측 글자폭 버튼 금지 | 레이아웃 AC |
| CP-13 | 모든 저장 모델은 `version: 1` 필드를 가진다. `version !== 1`이면 해당 key를 삭제하고 기본값으로 시작 | 유닛 테스트 |
| CP-14 | 앱 설치 유도 문구/배너/링크 금지. "설치", "다운로드" 문자열 0건 | grep → 0건 |
| CP-15 | 결제(IAP)·프로모션 리워드 미사용. `TossPurchase`, `grantPromotionReward` 호출 0건 | grep → 0건 |

---

## Data Models

### Persona — 캐릭터 정적 상수 (코드에 내장, 저장 안 함)

```ts
export type AxisSpend = 'T' | 'F';   // T=티끌모아(절약), F=플렉스(소비)
export type AxisPlan  = 'P' | 'I';   // P=플랜(계획), I=임프로(즉흥)
export type AxisRisk  = 'S' | 'R';   // S=세이프(안정), R=리스크(도전)
export type PersonaId = `${AxisSpend}${AxisPlan}${AxisRisk}`;  // 정확히 8종

export interface Persona {
  id: PersonaId;
  name: string;                       // "알뜰형 다람쥐"
  emoji: string;                      // "🐿️"
  summary: string;                    // 60~120자
  strengths: [string, string, string];
  weakness: string;
  tips: [string, string, string];     // 절약 팁 3가지
  report: {
    spendComment: string;             // 40~100자
    planComment: string;
    riskComment: string;
    actionPlan: [string, string, string, string];
  };
  colorToken: string;                 // 'var(--tds-color-blue-500)' 형태만 허용
}
```

**8종 확정 테이블 (`PERSONAS: Record<PersonaId, Persona>`)**

| id | name | emoji |
|---|---|---|
| `TPS` | 알뜰형 다람쥐 | 🐿️ |
| `TPR` | 전략가 여우 | 🦊 |
| `TIS` | 곳간지기 거북이 | 🐢 |
| `TIR` | 한방노림 매 | 🦅 |
| `FPS` | 균형잡힌 판다 | 🐼 |
| `FPR` | 성장추구 늑대 | 🐺 |
| `FIS` | 행복소비 강아지 | 🐶 |
| `FIR` | 욜로 앵무새 | 🦜 |

### Question — 문항 정적 상수 (코드에 내장)

```ts
export interface Question {
  id: number;                          // 1..12 (고정)
  axis: 'spend' | 'plan' | 'risk';     // 1~4=spend, 5~8=plan, 9~12=risk
  text: string;                        // 20~60자
  options: [
    { key: 'A'; label: string; value: 0 | 1 },
    { key: 'B'; label: string; value: 0 | 1 }
  ];
}
export const QUESTIONS: Question[];    // length === 12, id 중복 없음
```

- `value: 1` = 축의 앞 글자(T/P/S) 쪽 가점, `value: 0` = 뒷 글자(F/I/R) 쪽.

### QuizDraft — 진행 중 응답 (localStorage)

```ts
export interface QuizDraft {
  version: 1;
  answers: Array<0 | 1 | null>;        // length === 12, 미응답은 null
  updatedAt: number;                   // epoch ms
}
```
- key: `mp.quiz.draft` · 크기 ≈ 120 bytes

### QuizResult — 진단 결과 (localStorage)

```ts
export interface AxisScores { spend: number; plan: number; risk: number; }  // 각 0..4

export interface QuizResult {
  version: 1;
  id: string;                          // "r_" + createdAt + "_" + 4자리 [a-z0-9]
  personaId: PersonaId;
  scores: AxisScores;
  answers: Array<0 | 1>;               // length === 12
  code: string;                        // 친구코드 5자 [A-Z]{5}
  createdAt: number;
  reportUnlocked: boolean;             // 리워드 광고 시청 완료 여부
}
```
- key: `mp.result.latest` → `QuizResult | null` (약 300 bytes)
- key: `mp.result.history` → `QuizResult[]` **최대 20건**, 오래된 순 절삭 (약 6 KB)

### CompatRecord — 궁합 비교 기록 (localStorage)

```ts
export interface CompatRecord {
  version: 1;
  id: string;                          // "c_" + createdAt + "_" + 4자리 [a-z0-9]
  myPersonaId: PersonaId;
  friendPersonaId: PersonaId;
  friendCode: string;                  // [A-Z]{5}
  score: 10 | 40 | 70 | 100;
  grade: 'S' | 'A' | 'B' | 'C';
  createdAt: number;
}
```
- key: `mp.compat.history` → `CompatRecord[]` **최대 20건** (약 4 KB)

### AppPref — 앱 설정 (localStorage)

```ts
export interface AppPref {
  version: 1;
  onboardingSeen: boolean;             // 온보딩 다이얼로그 1회 표시 플래그
  lastVisitedAt: number;
}
```
- key: `mp.pref` · 크기 ≈ 90 bytes

### 저장 용량 총계

| key | 최대 크기 |
|---|---|
| `mp.quiz.draft` | 0.12 KB |
| `mp.result.latest` | 0.3 KB |
| `mp.result.history` | 6 KB |
| `mp.compat.history` | 4 KB |
| `mp.pref` | 0.09 KB |
| **합계** | **≈ 10.5 KB** (5 MB 한도의 0.21%) |

### 순수 함수 계약 (`src/domain/`)

```ts
export function computeScores(answers: Array<0 | 1>): AxisScores;
export function toPersonaId(scores: AxisScores): PersonaId;   // 각 축 >= 2 → 'T'/'P'/'S', < 2 → 'F'/'I'/'R'
export function makeCode(personaId: PersonaId): string;        // personaId + 체크섬 2자
export function parseCode(code: string): PersonaId | null;     // 형식·체크섬 불일치 시 null
export function computeCompat(a: PersonaId, b: PersonaId): { score: 10|40|70|100; grade: 'S'|'A'|'B'|'C' };
```

- **체크섬 규칙(확정)**: `n = (charCodeSum(personaId) * 7) % 676` → `String.fromCharCode(65 + Math.floor(n/26)) + String.fromCharCode(65 + (n%26))`
  예) `TPS` → 84+80+83=247 → 247×7=1729 → 1729 % 676 = 377 → 377 = 14×26+13 → `"ON"` → **최종 코드 `TPSON`**
- **궁합 규칙(확정)**: `score = 10 + (소비축 동일 ? 30 : 0) + (계획축 상이 ? 30 : 0) + (위험축 동일 ? 30 : 0)`
  → `100`=`S`(환상의 짝꿍) / `70`=`A`(잘 맞는 사이) / `40`=`B`(노력이 필요한 사이) / `10`=`C`(정반대 성향)

---

## Feature List

### F1. 도메인 상수 · 채점 엔진 · 저장 계층

- **Description**: 12문항 상수, 8캐릭터 상수 테이블, 채점/캐릭터 판정/친구코드/궁합 계산 순수 함수와 localStorage 래퍼(`storage.ts`)를 구현한다. 모든 저장/조회는 try-catch로 감싸 파싱 실패·용량 초과 시에도 앱이 죽지 않도록 한다. UI를 전혀 포함하지 않는 순수 로직 계층이다.
- **Data**: `Persona`, `Question`, `QuizDraft`, `QuizResult`, `CompatRecord`, `AppPref`
- **API**: 없음 (외부 호출 0건)
- **Requirements**: 상수 테이블 완결성, 결정론적 채점, 안전한 스토리지 접근

- **AC-1 [U][P0]**: Scenario: 상수 테이블 완결성
  Given 앱이 빌드된 상태일 때
  When `QUESTIONS`와 `PERSONAS`를 조회
  Then `QUESTIONS.length === 12`이고 `id`는 1~12 중복 없이 존재
  And `Object.keys(PERSONAS).length === 8`이며 키 집합은 `['TPS','TPR','TIS','TIR','FPS','FPR','FIS','FIR']`와 정확히 일치
  And 모든 Persona의 `tips.length === 3`, `strengths.length === 3`, `report.actionPlan.length === 4`

- **AC-2 [E][P0]**: Scenario: 채점 및 캐릭터 판정
  Given 순수 함수 `computeScores`, `toPersonaId`가 있을 때
  When `answers = [1,1,1,1, 1,1,1,1, 1,1,1,1]` 입력
  Then `computeScores` 결과는 `{ spend: 4, plan: 4, risk: 4 }`
  And `toPersonaId({spend:4,plan:4,risk:4}) === 'TPS'`
  And `answers = [1,1,0,0, 0,0,0,1, 1,1,1,0]` 입력 시 `{spend:2,plan:1,risk:3}` → `'TIS'` (각 축 `>= 2`이면 앞 글자)

- **AC-3 [E][P0]**: Scenario: 친구코드 생성과 역파싱
  Given `makeCode`, `parseCode`가 있을 때
  When `makeCode('TPS')` 호출
  Then 반환값은 정확히 `"TPSON"` (길이 5, `/^[A-Z]{5}$/`)
  And `parseCode('TPSON') === 'TPS'`
  And 8개 PersonaId 전부에 대해 `parseCode(makeCode(id)) === id`가 성립

- **AC-4 [E][P0]**: Scenario: 궁합 점수 계산
  Given `computeCompat`가 있을 때
  When `computeCompat('TPS','TIS')` 호출 (소비 동일·계획 상이·위험 동일)
  Then `{ score: 100, grade: 'S' }` 반환
  And `computeCompat('TPS','TPS')` → `{ score: 70, grade: 'A' }` (계획축 동일이라 +30 미적용)
  And `computeCompat('TPS','FPR')` → `{ score: 10, grade: 'C' }`

- **AC-5 [E][P0]**: Scenario: 결과 저장과 기록 상한
  Given `mp.result.history`에 이미 20건이 저장돼 있을 때
  When `saveResult(newResult)` 호출
  Then `mp.result.latest`가 `newResult`로 갱신됨
  And `mp.result.history.length === 20`이고 `createdAt`이 가장 오래된 1건이 제거됨
  And 배열은 `createdAt` 내림차순으로 정렬돼 저장됨

- **AC-6 [W][P1]**: Scenario: 손상된 JSON 복구
  Given `localStorage['mp.result.history']`의 값이 `"{not-json"`일 때
  When `loadResultHistory()` 호출
  Then 예외를 던지지 않고 `[]`를 반환
  And 해당 key를 `removeItem`으로 삭제
  And `console.error`를 호출하지 않음

- **AC-7 [W][P1]**: Scenario: localStorage 용량 초과
  Given `localStorage.setItem`이 `QuotaExceededError`를 던지는 환경일 때
  When `saveResult(newResult)` 호출
  Then 함수는 예외를 전파하지 않고 `{ ok: false, reason: 'QUOTA' }`를 반환
  And 호출한 화면은 Toast `"저장 공간이 부족해요. 기록을 삭제해주세요"`를 표시할 수 있어야 함

- **AC-8 [W][P1]**: Scenario: 버전 불일치 데이터 폐기
  Given `localStorage['mp.pref']`의 값이 `{"version":0,"onboardingSeen":true}`일 때
  When `loadPref()` 호출
  Then `{ version: 1, onboardingSeen: false, lastVisitedAt: 0 }` 기본값을 반환
  And `mp.pref` key가 삭제됨

---

### F2. 홈 & 온보딩 고지

- **Description**: 앱 진입 시 캐릭터 8종 프리뷰와 "테스트 시작하기" CTA를 보여주는 홈 화면이다. 최초 1회 온보딩 다이얼로그로 로컬 저장 정책을 고지하고, 이미 진단 결과가 있으면 "내 결과 다시 보기" 진입점을 함께 노출한다. 홈 하단에는 배너 광고를 배치한다.
- **Data**: `AppPref`, `QuizResult`(latest), `QuizDraft`
- **API**: 없음
- **Requirements**: TDS `Top`/`Button`/`Card`/`Chip`/`AlertDialog`, 템플릿 `ScreenScaffold`/`SubmitFooter`/`FloatingTabBar`/`AdSlot`

- **AC-1 [U][P0]**: Scenario: 홈 기본 구성
  Given 사용자가 `/`에 진입했을 때
  Then `data-testid="home-start-button"` 버튼이 `display="block"`으로 `SubmitFooter` 안에 렌더링됨
  And 8종 캐릭터 프리뷰가 `data-testid="persona-preview-grid"` 안에 정확히 8개 Chip으로 표시됨
  And 버튼 높이가 48px 이상

- **AC-2 [E][P0]**: Scenario: 테스트 시작
  Given 사용자가 `/`에 있을 때
  When `data-testid="home-start-button"` 탭
  Then `mp.quiz.draft`가 `{ version:1, answers:[null×12], updatedAt: <now> }`로 초기화됨
  And `navigate('/quiz/1')` 실행

- **AC-3 [E][P1]**: Scenario: 온보딩 고지 1회 표시
  Given `mp.pref.onboardingSeen === false`일 때
  When `/` 최초 렌더링
  Then TDS `AlertDialog`가 `"진단 결과는 이 기기에만 저장돼요."` 문구와 함께 1회 표시됨
  And `"확인"` 탭 시 `mp.pref = { version:1, onboardingSeen:true, lastVisitedAt:<now> }` 저장
  And 재진입 시 다이얼로그가 다시 표시되지 않음

- **AC-4 [S][P1]**: Scenario: 진행 중 응답 이어하기
  Given `mp.quiz.draft.answers`에 null이 아닌 값이 5개 있고 6번째가 null일 때
  When `/` 렌더링
  Then `data-testid="home-resume-button"` 버튼에 `"6번 문항부터 이어하기"` 텍스트가 표시됨
  And 탭 시 `navigate('/quiz/6')` 실행

- **AC-5 [S][P1]**: Scenario: 결과 없음 상태(Empty)
  Given `mp.result.latest === null`일 때
  When `/` 렌더링
  Then `data-testid="home-result-entry"` 요소가 DOM에 존재하지 않음
  And `Asset.ContentIcon`과 함께 `"아직 진단 결과가 없어요"` 문구가 표시됨

- **AC-6 [W][P1]**: Scenario: 광고 ID 미주입
  Given `import.meta.env.VITE_TOSS_AD_GROUP_ID`가 `undefined`일 때
  When `/` 렌더링
  Then `AdSlot`이 렌더링되지 않고 빈 공간도 차지하지 않음
  And 화면 나머지 요소는 정상 표시되며 `console.error` 출력 0건

- **AC-7 [W][P1]**: Scenario: 손상된 draft 무시
  Given `mp.quiz.draft`의 `answers` 길이가 `7`일 때 (스키마 위반)
  When `/` 렌더링
  Then `data-testid="home-resume-button"`이 표시되지 않음
  And `mp.quiz.draft` key가 삭제되고 앱이 크래시하지 않음

- **AC-8 [W][P0]**: Scenario: 외부 이탈 차단
  Given 홈 화면의 모든 인터랙티브 요소를 검사할 때
  Then `window.open` / `window.location.href` 호출 코드가 0건
  And `"설치"`, `"다운로드"` 문자열이 화면에 0건 표시됨

---

### F3. 12문항 퀴즈 진행 & 계산 연출

- **Description**: `/quiz/:step`에서 한 화면에 한 문항씩 표시하고 선택 즉시 다음 문항으로 자동 전환한다. 진행률과 이전 버튼을 제공하며 모든 응답은 `mp.quiz.draft`에 즉시 저장돼 앱을 껐다 켜도 이어할 수 있다. 12번 응답 완료 시 `/quiz/calculating`에서 1,200ms 연출 후 결과를 저장하고 `/result`로 이동한다.
- **Data**: `Question`, `QuizDraft`, `QuizResult`
- **API**: 없음
- **Requirements**: TDS `Top`(뒤로가기)/`ListRow`(선택지)/`Paragraph.Text`, 템플릿 `ScreenScaffold`, 진행률 표시

- **AC-1 [E][P0]**: Scenario: 선택지 탭 → 자동 진행
  Given 사용자가 `/quiz/3`에 있고 `mp.quiz.draft.answers[2] === null`일 때
  When `data-testid="quiz-option-A"` 탭 (해당 옵션 `value === 1`)
  Then `mp.quiz.draft.answers[2]`가 `1`로 저장됨
  And 300ms 이내에 `navigate('/quiz/4')` 실행

- **AC-2 [U][P0]**: Scenario: 진행률 표시
  Given 사용자가 `/quiz/7`에 있을 때
  Then `data-testid="quiz-progress-text"`에 정확히 `"7 / 12"`가 표시됨
  And `data-testid="quiz-progress-bar"`의 `aria-valuenow`가 `58` (Math.round(7/12*100))

- **AC-3 [E][P0]**: Scenario: 12문항 완료 → 계산 화면
  Given 사용자가 `/quiz/12`에 있고 앞 11문항이 모두 응답된 상태일 때
  When 12번 선택지를 탭
  Then `navigate('/quiz/calculating')` 실행
  And 1,200ms 후 `QuizResult`가 생성되어 `mp.result.latest`·`mp.result.history`에 저장됨
  And `navigate('/result', { state: { resultId } , replace: true })` 실행

- **AC-4 [S][P1]**: Scenario: 계산 중 로딩 상태
  Given 사용자가 `/quiz/calculating`에 있을 때
  Then `data-testid="calculating-indicator"`가 표시되고 문구 `"소비 성향을 분석하고 있어요"`가 렌더링됨
  And 1,200ms 동안 뒤로가기 제스처로 `/quiz/12`에 되돌아가도 결과가 중복 저장되지 않음 (저장은 1회만 실행)

- **AC-5 [E][P1]**: Scenario: 이전 문항으로 돌아가기
  Given 사용자가 `/quiz/5`에 있을 때
  When TDS `Top`의 `data-testid="quiz-back-button"` 탭
  Then `navigate('/quiz/4')` 실행
  And 4번 문항의 기존 선택지가 `selected` 상태로 하이라이트됨

- **AC-6 [W][P1]**: Scenario: 잘못된 step 접근
  Given 사용자가 URL `/quiz/0` 또는 `/quiz/13` 또는 `/quiz/abc`로 직접 진입할 때
  Then `navigate('/quiz/1', { replace: true })`로 리다이렉트됨
  And 에러 화면이나 흰 화면이 표시되지 않음

- **AC-7 [W][P1]**: Scenario: 앞 문항 미응답 상태로 건너뛰기 차단
  Given `mp.quiz.draft.answers`의 인덱스 0~2만 채워져 있을 때
  When 사용자가 URL `/quiz/9`로 직접 진입
  Then `navigate('/quiz/4', { replace: true })`로 최소 미응답 문항으로 이동됨

- **AC-8 [W][P1]**: Scenario: draft 없이 계산 화면 진입
  Given `mp.quiz.draft === null`일 때
  When 사용자가 `/quiz/calculating`로 직접 진입
  Then `navigate('/', { replace: true })` 실행
  And `console.error` 출력 0건

---

### F4. 결과 캐릭터 카드 & 절약 팁

- **Description**: 진단된 캐릭터를 히어로 카드로 보여주고 요약·강점 3가지·약점, 그리고 캐릭터별 맞춤 절약 팁 3가지를 표시한다. 카드 자체는 무료로 열람 가능해 공유 바이럴을 극대화하고, 하단에 상세 리포트(광고 게이팅)·공유·궁합 진입점을 배치한다. 3축 점수는 MiniBar로 시각화한다.
- **Data**: `QuizResult`, `Persona`
- **API**: 없음
- **Requirements**: TDS `Card`/`Chip`/`ListRow`/`Paragraph.Text`/`Spacing`/`Button`, 템플릿 `SummaryHero`/`MiniBar`/`AdSlot`/`SubmitFooter`

- **AC-1 [U][P0]**: Scenario: 결과 카드 렌더링
  Given `mp.result.latest.personaId === 'TPS'`이고 `/result`에 진입했을 때
  Then `data-testid="persona-hero-card"` Card 안에 `"알뜰형 다람쥐"`와 `"🐿️"`가 표시됨
  And `data-testid="persona-summary"`에 해당 Persona의 `summary` 전문이 표시됨
  And `data-testid="persona-code-chip"` Chip에 `"TPSON"`이 표시됨

- **AC-2 [U][P0]**: Scenario: 절약 팁 3가지
  Given `/result`가 렌더링됐을 때
  Then `data-testid="tip-card"` Card 안에 `data-testid="tip-row"` ListRow가 정확히 3개 존재
  And 각 행의 텍스트는 `PERSONAS[personaId].tips[0..2]`와 문자열이 정확히 일치
  And 각 ListRow 높이가 56px 이상

- **AC-3 [U][P1]**: Scenario: 3축 점수 시각화 (레이아웃 계약)
  Given `scores = { spend: 4, plan: 3, risk: 2 }`일 때
  Then `data-testid="axis-minibar"` 요소가 정확히 3개 렌더링됨
  And 각 MiniBar의 `aria-valuenow`가 각각 `4`, `3`, `2`이고 `aria-valuemax`가 `4`
  And `data-testid="persona-hero-card"`는 TDS `Card`이며 캐릭터명이 t2 이상 강조 타이포로 표시됨

- **AC-4 [E][P0]**: Scenario: 하단 액션 진입
  Given `/result`에 있을 때
  When `data-testid="result-report-button"` 탭
  Then `navigate('/report', { state: { resultId } })` 실행
  And `data-testid="result-share-button"` 탭 시 `navigate('/share', { state: { resultId } })`
  And `data-testid="result-compat-button"` 탭 시 `navigate('/compat')`

- **AC-5 [U][P1]**: Scenario: 광고 배치 규칙
  Given `/result`가 렌더링됐을 때
  Then `AdSlot`은 `data-testid="tip-card"` 아래, `SubmitFooter` 위에 배치됨
  And 광고 영역이 결과 카드나 버튼 위에 겹치지 않음 (`getBoundingClientRect` 교차 0)

- **AC-6 [S][P1]**: Scenario: 결과 없음 Empty 상태
  Given `location.state === null`이고 `mp.result.latest === null`일 때
  When `/result` 진입
  Then `Asset.ContentIcon`과 `"아직 진단 결과가 없어요"` 문구가 표시됨
  And `data-testid="result-empty-cta"` 버튼(`"테스트 시작하기"`)이 표시되고 탭 시 `navigate('/quiz/1')`

- **AC-7 [W][P1]**: Scenario: 존재하지 않는 resultId
  Given `location.state = { resultId: "r_9999_zzzz" }`이고 history에 해당 id가 없을 때
  When `/result` 진입
  Then `mp.result.latest`로 폴백해 렌더링
  And `latest`도 없으면 Empty 상태를 표시하고 크래시하지 않음

- **AC-8 [W][P1]**: Scenario: 알 수 없는 personaId
  Given 저장된 결과의 `personaId`가 `'XYZ'`일 때 (스키마 위반)
  When `/result` 진입
  Then 해당 결과를 `mp.result.history`에서 제거하고 Empty 상태를 표시
  And `console.error` 출력 0건

---

### F5. 리워드 광고 게이팅 상세 리포트

- **Description**: 상세 분석 리포트(3축 코멘트 + 4단계 액션플랜)는 `TossRewardAd`로 게이팅한다. 사용자가 광고 시청을 완료하면 해당 `resultId`의 `reportUnlocked`가 `true`로 저장되어 이후 재진입 시 광고 없이 열람할 수 있다. 광고 로드 실패 시 재시도 경로를 제공한다.
- **Data**: `QuizResult.reportUnlocked`, `Persona.report`
- **API**: 없음 (템플릿 `TossRewardAd` = `loadFullScreenAd` + `showFullScreenAd` 래퍼)
- **Requirements**: TDS `Card`/`ListRow`/`Button`/`Toast`/`Paragraph.Text`, 템플릿 `TossRewardAd`/`SummaryHero`/`ScreenScaffold`

- **AC-1 [S][P0]**: Scenario: 잠금 상태 게이트 노출
  Given `QuizResult.reportUnlocked === false`이고 `/report`에 진입했을 때
  Then `data-testid="report-locked-gate"`가 표시되고 `data-testid="report-content"`는 DOM에 존재하지 않음
  And 게이트 버튼 텍스트는 `"광고 보고 상세 리포트 열기"`이며 높이 48px 이상

- **AC-2 [E][P0]**: Scenario: 결과 보기 전 보상형 광고
  Given 사용자가 `/report`의 잠금 게이트를 보고 있을 때
  When `TossRewardAd`(slotId=`import.meta.env.VITE_TOSS_AD_SLOT_ID`) 광고 시청이 완료됨
  Then `data-testid="report-content"`가 표시되고 3축 코멘트 3개와 액션플랜 4개 ListRow가 렌더링됨
  And 해당 `resultId`의 `reportUnlocked`가 `true`로 `mp.result.history`와 `mp.result.latest`에 저장됨

- **AC-3 [S][P0]**: Scenario: 해제 상태 재진입
  Given `QuizResult.reportUnlocked === true`일 때
  When `/report` 재진입
  Then 광고 없이 즉시 `data-testid="report-content"`가 표시됨
  And `data-testid="report-locked-gate"`는 렌더링되지 않음

- **AC-4 [S][P1]**: Scenario: 광고 로딩 상태
  Given 사용자가 게이트 버튼을 탭한 직후일 때
  Then 버튼이 `loading` 상태로 전환되어 중복 탭이 무시됨
  And `data-testid="report-ad-loading"` 문구 `"광고를 불러오는 중이에요"`가 표시됨

- **AC-5 [U][P1]**: Scenario: 리포트 레이아웃 계약
  Given `data-testid="report-content"`가 표시됐을 때
  Then `data-testid="report-axis-card"` Card가 정확히 3개(소비/계획/위험) 존재
  And `data-testid="report-action-card"` Card 안에 액션플랜 ListRow 4개 존재
  And `SummaryHero`가 캐릭터 매칭도 값을 CountUp으로 표시하며 값은 `scores` 합계 × 8 (0~96 범위 정수)

- **AC-6 [W][P1]**: Scenario: 광고 로드 실패
  Given `TossRewardAd`가 로드 실패 콜백을 반환할 때
  When 사용자가 게이트 버튼을 탭
  Then Toast `"광고를 불러오지 못했어요. 잠시 후 다시 시도해주세요"`가 표시됨
  And 게이트 화면이 유지되고 `reportUnlocked`는 `false`로 남음
  And `console.error` 출력 0건

- **AC-7 [W][P1]**: Scenario: 광고 중도 이탈
  Given 사용자가 광고를 시청하다 완료 전에 닫았을 때
  Then `reportUnlocked`는 `false`로 유지됨
  And `data-testid="report-content"`가 표시되지 않음
  And Toast `"광고를 끝까지 봐야 리포트가 열려요"`가 표시됨

- **AC-8 [W][P1]**: Scenario: resultId 누락 진입
  Given `location.state === null`이고 `mp.result.latest === null`일 때
  When `/report` 직접 진입
  Then `navigate('/', { replace: true })` 실행
  And 흰 화면이 노출되지 않음

---

### F6. 결과 이미지 생성 & 공유

- **Description**: Canvas 2D API로 결과 카드 이미지(1080×1350)를 클라이언트에서 직접 생성하고 `navigator.share`(파일 공유) → `navigator.share`(텍스트) → `navigator.clipboard.writeText` 3단 폴백으로 SNS/카톡 공유를 지원한다. 공유 텍스트에는 친구 궁합용 5자 코드가 포함된다. 외부 라이브러리를 추가하지 않는다.
- **Data**: `QuizResult`, `Persona`
- **API**: 없음 (브라우저 API `navigator.share`, `navigator.clipboard`)
- **Requirements**: TDS `Button`/`Card`/`Toast`/`Paragraph.Text`, 템플릿 `ScreenScaffold`/`SubmitFooter`

- **AC-1 [E][P0]**: Scenario: 결과 이미지 생성
  Given `/share`에 `state = { resultId }`로 진입했을 때
  When 화면 마운트 완료
  Then 1,000ms 이내에 `data-testid="share-preview-canvas"`에 1080×1350 캔버스가 렌더링됨
  And 캔버스에 캐릭터 이모지, 이름, `summary` 첫 40자, 코드 `"TPSON"`이 그려짐
  And 색상은 `PERSONAS[personaId].colorToken` CSS 변수를 `getComputedStyle`로 읽어 사용 (HEX 하드코딩 0건)

- **AC-2 [E][P0]**: Scenario: 파일 공유 성공 경로
  Given `navigator.canShare({ files: [file] }) === true`인 환경일 때
  When `data-testid="share-button"` 탭
  Then `navigator.share({ files: [PNG File], text: "나는 알뜰형 다람쥐! 내 코드는 TPSON" })`가 호출됨
  And 공유 완료 후 Toast `"공유했어요"`가 표시됨

- **AC-3 [W][P1]**: Scenario: 파일 공유 미지원 → 텍스트 공유 폴백
  Given `navigator.canShare`가 `undefined`이고 `navigator.share`는 존재할 때
  When `data-testid="share-button"` 탭
  Then `navigator.share({ text: "나는 알뜰형 다람쥐! 내 코드는 TPSON" })`가 호출됨
  And 예외가 발생하지 않고 `console.error` 출력 0건

- **AC-4 [W][P1]**: Scenario: 공유 API 전부 미지원 → 클립보드 폴백
  Given `navigator.share`와 `navigator.canShare`가 모두 `undefined`일 때
  When `data-testid="share-button"` 탭
  Then `navigator.clipboard.writeText("나는 알뜰형 다람쥐! 내 코드는 TPSON")`가 호출됨
  And Toast `"결과를 클립보드에 복사했어요"`가 표시됨

- **AC-5 [W][P1]**: Scenario: 사용자 공유 취소
  Given `navigator.share`가 `AbortError`를 reject할 때
  When 사용자가 공유 시트를 닫음
  Then Toast가 표시되지 않고 `/share` 화면이 그대로 유지됨
  And 에러 다이얼로그나 `console.error`가 발생하지 않음

- **AC-6 [S][P1]**: Scenario: 이미지 생성 중 로딩 상태
  Given 캔버스 렌더링이 아직 완료되지 않았을 때
  Then `data-testid="share-loading"` 문구 `"이미지를 만들고 있어요"`가 표시됨
  And `data-testid="share-button"`은 `disabled` 상태로 중복 탭이 무시됨

- **AC-7 [W][P0]**: Scenario: 외부 이탈 없는 공유
  Given 공유 로직 전체를 검사할 때
  Then `window.open`, `window.location.href`, `<a target="_blank">` 사용 0건
  And 공유 텍스트에 외부 URL·앱 설치 유도 문구가 포함되지 않음

- **AC-8 [S][P1]**: Scenario: 결과 없이 진입
  Given `location.state === null`이고 `mp.result.latest === null`일 때
  When `/share` 진입
  Then `navigate('/', { replace: true })` 실행

---

### F7. 친구 궁합 비교

- **Description**: 친구가 공유한 5자 코드를 입력하면 내 캐릭터와의 궁합 점수(10/40/70/100)와 등급(S/A/B/C)을 계산해 카드로 보여준다. 계산은 동기 순수 함수이며 결과는 `mp.compat.history`에 최대 20건 저장된다. 모바일 키보드 동작(대문자 입력, 5자 제한, 포커스 스크롤)을 명시적으로 처리한다.
- **Data**: `CompatRecord`, `QuizResult`(latest), `Persona`
- **API**: 없음
- **Requirements**: TDS `TextField`/`Button`/`Card`/`Chip`/`ListRow`/`Paragraph.Text`/`Spacing`, 템플릿 `SummaryHero`/`SubmitFooter`/`AdSlot`/`Asset.ContentIcon`

- **AC-1 [E][P0]**: Scenario: 궁합 계산 성공
  Given `mp.result.latest.personaId === 'TPS'`이고 `/compat`에 있을 때
  When TextField에 `"TISON"` 입력 후 `data-testid="compat-submit-button"` 탭
  Then 200ms 이내에 `data-testid="compat-result-card"`가 표시되고 점수 `100`, 등급 Chip `"S"`, 문구 `"환상의 짝꿍"`이 표시됨
  And `mp.compat.history`에 `{ myPersonaId:'TPS', friendPersonaId:'TIS', friendCode:'TISON', score:100, grade:'S' }` 레코드가 추가됨

- **AC-2 [U][P1]**: Scenario: 궁합 결과 레이아웃 계약
  Given `data-testid="compat-result-card"`가 표시됐을 때
  Then 해당 Card 안에 `data-testid="compat-persona-me"`와 `data-testid="compat-persona-friend"` 2블록이 flex로 배치됨
  And `SummaryHero`가 점수를 CountUp으로 0 → 100까지 애니메이션하며 t2 이상 강조 타이포로 표시
  And 등급은 TDS `Chip`으로 표시됨

- **AC-3 [W][P1]**: Scenario: 빈 코드 입력 거부
  Given `/compat`에서 TextField가 비어 있을 때
  When `data-testid="compat-submit-button"` 탭
  Then TextField 하단에 `"친구 코드를 입력해주세요"`가 표시됨
  And `mp.compat.history`에 레코드가 추가되지 않음

- **AC-4 [W][P1]**: Scenario: 체크섬 불일치 코드 거부
  Given `/compat`에 있을 때
  When TextField에 `"TPSAA"` 입력 후 제출 (`parseCode` 결과 `null`)
  Then TextField 하단에 `"올바른 코드가 아니에요"`가 표시됨
  And `data-testid="compat-result-card"`가 렌더링되지 않음

- **AC-5 [W][P1]**: Scenario: 자기 자신 코드 입력
  Given `mp.result.latest.code === "TPSON"`일 때
  When TextField에 `"TPSON"` 입력 후 제출
  Then Toast `"내 코드예요. 친구 코드를 입력해주세요"`가 표시됨
  And 기록이 저장되지 않음

- **AC-6 [S][P1]**: Scenario: 내 결과 없음 Empty 상태
  Given `mp.result.latest === null`일 때
  When `/compat` 진입
  Then `Asset.ContentIcon`과 `"먼저 내 소비 성향을 진단해주세요"`가 표시됨
  And 입력 폼(TextField, 제출 버튼)이 DOM에 렌더링되지 않음
  And `data-testid="compat-empty-cta"` 버튼 탭 시 `navigate('/quiz/1')`

- **AC-7 [U][P0]**: Scenario: 모바일 키보드 동작
  Given `/compat`의 TextField에 포커스했을 때
  Then `maxLength={5}`, `autoCapitalize="characters"`, `enterKeyHint="done"`, `inputMode="text"` 속성이 적용됨
  And 입력값은 항상 `toUpperCase()`로 정규화되어 표시됨
  And 포커스 시 `scrollIntoView({ block: 'center' })`가 호출되고 `SubmitFooter`가 `position: static`으로 전환되어 키보드에 가려지지 않음

- **AC-8 [U][P1]**: Scenario: 광고 배치 및 터치 타겟
  Given `/compat`가 렌더링됐을 때
  Then `AdSlot`은 `data-testid="compat-result-card"` 아래에 배치되고 카드와 겹치지 않음
  And TextField 높이 48px 이상, `data-testid="compat-submit-button"` 높이 48px 이상(`display="block"`)

---

### F8. 기록 관리 & 검수 컴플라이언스

- **Description**: 진단 기록과 궁합 기록을 상단 Tab으로 전환해 조회·삭제하는 화면을 제공하고, 각 기록에서 상세 화면으로 재진입할 수 있다. 동시에 앱 전역의 앱인토스 검수 요구사항(HEX 금지, 외부 이탈 금지, 콘솔 에러 0, 다크모드, OS 호환)을 검증 가능한 형태로 고정한다.
- **Data**: `QuizResult[]`, `CompatRecord[]`
- **API**: 없음
- **Requirements**: TDS `Top`/`Tab`/`ListRow`/`Button`/`AlertDialog`/`Toast`, 템플릿 `Sparkline`/`Asset.ContentIcon`/`FloatingTabBar`/`AdSlot`

- **AC-1 [E][P0]**: Scenario: 기록 목록 표시 및 재진입
  Given `mp.result.history`에 3건이 저장돼 있을 때
  When `/history`의 `"진단 기록"` 탭 진입
  Then `data-testid="history-result-row"` ListRow가 3개 표시되고 `createdAt` 내림차순으로 정렬됨
  And 각 행에 캐릭터 이모지·이름·`YYYY.MM.DD` 날짜가 표시됨
  And 행 탭 시 `navigate('/result', { state: { resultId } })` 실행

- **AC-2 [E][P0]**: Scenario: 기록 삭제
  Given `/history`에서 진단 기록 3건이 표시된 상태일 때
  When `data-testid="history-delete-button"` 탭 → `AlertDialog`에서 `"삭제"` 탭
  Then 해당 레코드가 `mp.result.history`에서 제거되고 목록이 2건으로 갱신됨
  And 삭제된 id가 `mp.result.latest.id`와 같으면 `mp.result.latest`가 `null`로 설정됨
  And Toast `"기록을 삭제했어요"`가 표시됨

- **AC-3 [S][P1]**: Scenario: 빈 기록 상태
  Given `mp.result.history`가 `[]`이고 `mp.compat.history`가 `[]`일 때
  When `/history` 진입
  Then `"진단 기록"` 탭에 `Asset.ContentIcon`과 `"아직 기록이 없어요"`가 표시됨
  And `"궁합 기록"` 탭에 `Asset.ContentIcon`과 `"아직 비교한 친구가 없어요"`가 표시됨
  And 삭제 버튼이 렌더링되지 않음

- **AC-4 [U][P1]**: Scenario: 추이 시각화 및 스크롤 계약
  Given `mp.result.history`에 2건 이상 저장돼 있을 때
  Then `data-testid="history-spend-sparkline"` Sparkline이 각 기록의 `scores.spend`(0~4)를 오래된 순으로 표시
  And 기록 상한이 20건이므로 가상 스크롤 없이 일반 렌더링하며, 20건 초과 저장 시도는 F1 저장 계층이 오래된 순으로 절삭
  And ListRow 높이 56px 이상, 삭제 버튼 터치 타겟 44px 이상

- **AC-5 [W][P1]**: Scenario: 손상된 기록 배열 복구
  Given `localStorage['mp.compat.history']`의 값이 `"[{\"version\":1,"` 일 때
  When `/history`의 `"궁합 기록"` 탭 진입
  Then 해당 key를 삭제하고 빈 상태를 렌더링
  And 앱이 크래시하지 않으며 `console.error` 출력 0건

- **AC-6 [W][P1]**: Scenario: 삭제 취소
  Given 삭제 확인 `AlertDialog`가 열려 있을 때
  When `"취소"` 탭 또는 딤 영역 탭
  Then 어떤 레코드도 삭제되지 않고 목록 건수가 유지됨
  And Toast가 표시되지 않음

- **AC-7 [U][P0]**: Scenario: 검수 정적 검증 (전역)
  Given 프로덕션 빌드 산출물과 소스 전체를 검사할 때
  Then `#[0-9a-fA-F]{3,6}` 형태의 색상 리터럴 0건 (모든 색상은 `var(--tds-color-*)` 또는 TDS 기본값)
  And `fetch(`, `XMLHttpRequest`, `window.open`, `window.location.href` 사용 0건 → CORS 에러 0건
  And `"설치"`·`"다운로드"` 등 외부 앱 설치 유도 문구 0건
  And GA/Amplitude 등 외부 분석 라이브러리 의존성 0건
  And `grantPromotionReward`, `IAP.createOneTimePurchaseOrder` 호출 0건

- **AC-8 [W][P1]**: Scenario: 구형 OS 호환 및 다크모드
  Given Android 7(Chrome 60 수준) / iOS 16 WebView에서 앱을 실행할 때
  Then `Object.groupBy`, `Array.prototype.at`, `structuredClone` 미사용으로 런타임 `TypeError`가 발생하지 않음
  And `prefers-color-scheme: dark`에서 모든 텍스트/배경 대비비가 4.5:1 이상 유지됨 (TDS 토큰 사용 결과)
  And 존재하지 않는 라우트(`/foo`) 진입 시 `navigate('/', { replace: true })`로 처리되어 흰 화면이 노출되지 않음

---

## Screen Definitions

### S1. 홈 (`/`)

| 항목 | 내용 |
|---|---|
| **골격** | `ScreenScaffold` + TDS `Top`(title `"MoneyPersona"`) |
| **TDS 컴포넌트** | `Top`, `Card`, `Chip`, `Button`, `Paragraph.Text`, `Spacing`, `AlertDialog`(온보딩) |
| **템플릿 컴포넌트** | `ScreenScaffold`, `SubmitFooter`, `FloatingTabBar`, `AdSlot`(FloatingTabBar 위), `Asset.ContentIcon` |
| **Loading** | 없음 (localStorage 동기 읽기) |
| **Empty** | `mp.result.latest === null` → `Asset.ContentIcon` + `"아직 진단 결과가 없어요"` |
| **Error** | 저장소 파싱 실패 → 해당 key 삭제 후 Empty 렌더링, Toast 없음 |
| **Touch** | `data-testid="home-start-button"` 48px(block), `home-resume-button` 48px, Chip 44px 이상 |
| **Layout AC** | `data-testid="persona-preview-grid"` 안 Chip 8개 (grid 2열), 1차 액션은 `SubmitFooter` 고정 |
| **Outgoing** | 시작 → `navigate('/quiz/1')` · 이어하기 → `navigate('/quiz/{n}')` · 내 결과 → `navigate('/result', { state: { resultId } })` · FloatingTabBar → `navigate('/compat')`, `navigate('/history')` |
| **Incoming** | `location.state = null` |

### S2. 퀴즈 (`/quiz/:step`)

| 항목 | 내용 |
|---|---|
| **골격** | `ScreenScaffold` + TDS `Top`(뒤로가기, title `"소비 성향 진단"`) |
| **TDS 컴포넌트** | `Top`, `ListRow`(선택지 2개), `Paragraph.Text`(문항), `Spacing` |
| **템플릿 컴포넌트** | `ScreenScaffold`, 진행률 바(`data-testid="quiz-progress-bar"`, `role="progressbar"`) |
| **Loading** | 없음 (상수 렌더링) |
| **Empty** | 해당 없음 (문항은 항상 12개 상수) |
| **Error** | 잘못된 step → `/quiz/1` replace · 앞 문항 미응답 → 최소 미응답 step replace |
| **Touch** | 선택지 ListRow 각 64px 이상, 뒤로가기 버튼 44px |
| **스크롤** | 문항 1개/화면 → 스크롤 없음. 긴 문항은 세로 스크롤 허용 |
| **광고** | 없음 (몰입 구간, 광고 미배치) |
| **Layout AC** | `data-testid="quiz-progress-text"`에 `"{step} / 12"` |
| **Outgoing** | 선택 → `navigate('/quiz/{step+1}')`, step 12 → `navigate('/quiz/calculating')` · 뒤로 → `navigate('/quiz/{step-1}')` |
| **Incoming** | `location.state = null` |

### S3. 계산 중 (`/quiz/calculating`)

| 항목 | 내용 |
|---|---|
| **골격** | `ScreenScaffold` (Top 없음, 전체 화면 연출) |
| **TDS 컴포넌트** | `Paragraph.Text`, `Spacing` |
| **템플릿 컴포넌트** | `ScreenScaffold`, 로딩 인디케이터(`data-testid="calculating-indicator"`) |
| **Loading** | 1,200ms 동안 `"소비 성향을 분석하고 있어요"` 표시 (핵심 상태) |
| **Empty** | draft 미완성 → `/` replace |
| **Error** | 저장 실패(QUOTA) → Toast `"저장 공간이 부족해요. 기록을 삭제해주세요"` 후 `/` replace |
| **Touch** | 인터랙티브 요소 없음 |
| **Outgoing** | 완료 → `navigate('/result', { state: { resultId }, replace: true })` |
| **Incoming** | `location.state = null` |

### S4. 결과 카드 (`/result`)

| 항목 | 내용 |
|---|---|
| **골격** | `ScreenScaffold` + TDS `Top`(title `"내 소비 성향"`) |
| **TDS 컴포넌트** | `Top`, `Card`, `Chip`, `ListRow`, `Paragraph.Text`, `Button`, `Spacing` |
| **템플릿 컴포넌트** | `SummaryHero`(없음 — 히어로는 Card 내부 타이포), `MiniBar`×3, `AdSlot`, `SubmitFooter`, `Asset.ContentIcon`, `FloatingTabBar` |
| **Loading** | 없음 (동기 읽기) |
| **Empty** | 결과 없음 → `Asset.ContentIcon` + `"아직 진단 결과가 없어요"` + `data-testid="result-empty-cta"` |
| **Error** | 알 수 없는 personaId → 해당 기록 제거 후 Empty · 존재하지 않는 resultId → latest 폴백 |
| **Touch** | tip ListRow 56px, 하단 3버튼 각 48px |
| **스크롤** | 세로 스크롤. 항목 수 고정(팁 3 + 축 3)이라 가상 스크롤 불필요 |
| **광고** | `AdSlot`은 `tip-card` 아래 · `SubmitFooter` 위 (콘텐츠 비중첩) |
| **Layout AC** | `data-testid="persona-hero-card"` Card + `data-testid="tip-card"` Card 2개, 캐릭터명 t2 이상, `data-testid="axis-minibar"` 3개 |
| **Outgoing** | 리포트 → `navigate('/report', { state: { resultId } })` · 공유 → `navigate('/share', { state: { resultId } })` · 궁합 → `navigate('/compat')` · Empty CTA → `navigate('/quiz/1')` |
| **Incoming** | `location.state = ResultNavState \| null` |

### S5. 상세 리포트 (`/report`)

| 항목 | 내용 |
|---|---|
| **골격** | `ScreenScaffold` + TDS `Top`(뒤로가기, title `"상세 리포트"`) |
| **TDS 컴포넌트** | `Top`, `Card`, `ListRow`, `Button`, `Paragraph.Text`, `Spacing`, `Toast` |
| **템플릿 컴포넌트** | `TossRewardAd`(slotId=`VITE_TOSS_AD_SLOT_ID`), `SummaryHero`(CountUp 매칭도), `SubmitFooter` |
| **게이팅 대상** | `data-testid="report-content"` 전체 (3축 코멘트 Card 3개 + 액션플랜 Card 1개) |
| **Loading** | 광고 로드 중 → `data-testid="report-ad-loading"` `"광고를 불러오는 중이에요"`, 버튼 `loading` |
| **Empty** | resultId·latest 모두 없음 → `/` replace |
| **Error** | 로드 실패 → Toast `"광고를 불러오지 못했어요. 잠시 후 다시 시도해주세요"` · 중도 이탈 → Toast `"광고를 끝까지 봐야 리포트가 열려요"` |
| **Touch** | 게이트 버튼 48px(block), 액션플랜 ListRow 56px |
| **광고** | 리워드 전면 광고만 사용. 배너 미배치(리포트 몰입 유지) |
| **Layout AC** | `data-testid="report-axis-card"` 3개, `data-testid="report-action-card"` 1개, `SummaryHero` CountUp |
| **Outgoing** | 뒤로 → `navigate(-1)` · 공유 → `navigate('/share', { state: { resultId } })` |
| **Incoming** | `location.state = ResultNavState \| null` |

### S6. 공유 (`/share`)

| 항목 | 내용 |
|---|---|
| **골격** | `ScreenScaffold` + TDS `Top`(뒤로가기, title `"결과 공유"`) |
| **TDS 컴포넌트** | `Top`, `Card`, `Button`, `Paragraph.Text`, `Spacing`, `Toast` |
| **템플릿 컴포넌트** | `ScreenScaffold`, `SubmitFooter` |
| **Loading** | 캔버스 생성 중 → `data-testid="share-loading"` `"이미지를 만들고 있어요"`, 버튼 `disabled` |
| **Empty** | 결과 없음 → `/` replace |
| **Error** | `AbortError`(사용자 취소) → 무동작 · 공유 API 미지원 → 클립보드 폴백 + Toast |
| **Touch** | `data-testid="share-button"` 48px(block) |
| **광고** | 없음 (공유 전환 방해 방지) |
| **Layout AC** | `data-testid="share-preview-canvas"` 1080×1350 (CSS로 화면 폭 맞춤, `aspect-ratio: 4/5`), Card로 감쌈 |
| **Outgoing** | 뒤로 → `navigate(-1)` |
| **Incoming** | `location.state = ResultNavState \| null` |

### S7. 친구 궁합 (`/compat`)

| 항목 | 내용 |
|---|---|
| **골격** | `ScreenScaffold` + TDS `Top`(title `"친구와 궁합"`) |
| **TDS 컴포넌트** | `TextField`, `Button`, `Card`, `Chip`, `ListRow`, `Paragraph.Text`, `Spacing`, `Toast` |
| **템플릿 컴포넌트** | `SummaryHero`(CountUp 궁합 점수), `SubmitFooter`, `FloatingTabBar`, `AdSlot`(결과 Card 아래), `Asset.ContentIcon` |
| **Loading** | 계산은 동기 순수 함수 — 제출 후 200ms 이내 결과 렌더링, 별도 스피너 없음 |
| **Empty** | `mp.result.latest === null` → `Asset.ContentIcon` + `"먼저 내 소비 성향을 진단해주세요"` + `data-testid="compat-empty-cta"`(입력 폼 미렌더링) |
| **Error** | 체크섬 오류 → `"올바른 코드가 아니에요"` · 빈 입력 → `"친구 코드를 입력해주세요"` · 자기 코드 → Toast `"내 코드예요. 친구 코드를 입력해주세요"` |
| **Touch** | TextField 48px 이상, `data-testid="compat-submit-button"` 48px(block), 궁합 기록 ListRow 56px |
| **키보드** | `maxLength={5}`, `autoCapitalize="characters"`, `enterKeyHint="done"`, 포커스 시 `scrollIntoView({ block: 'center' })`, 키보드 열림 시 `SubmitFooter` → `position: static` |
| **Layout AC** | `data-testid="compat-result-card"`(Card) 안에 `compat-persona-me` / `compat-persona-friend` 2블록 flex 배치, 점수는 `SummaryHero` CountUp + t2 이상, 등급은 `Chip` |
| **Outgoing** | `"내 결과 보기"` → `navigate('/result', { state: { resultId } })` · Empty CTA → `navigate('/quiz/1')` · FloatingTabBar → `navigate('/')`, `navigate('/history')` |
| **Incoming** | `location.state = CompatNavState \| null` — `prefillCode` 존재 시 TextField 초기값으로 채움 |

### S8. 기록 (`/history`)

| 항목 | 내용 |
|---|---|
| **골격** | `ScreenScaffold` + TDS `Top`(title `"내 기록"`) |
| **TDS 컴포넌트** | `Top`, `Tab`(`["진단 기록","궁합 기록"]`), `ListRow`, `Button`, `AlertDialog`, `Paragraph.Text`, `Spacing`, `Toast` |
| **템플릿 컴포넌트** | `Sparkline`(소비축 추이), `Asset.ContentIcon`, `FloatingTabBar`, `AdSlot`(리스트 하단, FloatingTabBar 위) |
| **Loading** | 없음 (동기 읽기) |
| **Empty** | 진단 탭 → `"아직 기록이 없어요"` / 궁합 탭 → `"아직 비교한 친구가 없어요"` (각각 `Asset.ContentIcon` 동반) |
| **Error** | 배열 파싱 실패 → 해당 key 삭제 후 Empty 렌더링, `console.error` 0건 |
| **Touch** | ListRow 56px 이상, `data-testid="history-delete-button"` 44px 이상, Tab 아이템 44px 이상 |
| **스크롤** | 각 리스트 상한 20건 → 일반 렌더링(가상 스크롤 불필요) |
| **Layout AC** | `data-testid="history-result-row"`, `data-testid="history-compat-row"`, `data-testid="history-spend-sparkline"` |
| **Outgoing** | 진단 행 → `navigate('/result', { state: { resultId } })` · 궁합 행 → `navigate('/compat', { state: { prefillCode } })` · FloatingTabBar → `navigate('/')`, `navigate('/compat')` |
| **Incoming** | `location.state = null` |

### 라우트 · 네비게이션 state 타입 계약 (전역 단일 소스)

```ts
// src/routes/navState.ts — 보내는 쪽/받는 쪽이 이 타입만 import 한다
export interface ResultNavState { resultId: string }        // → /result, /report, /share
export interface CompatNavState { prefillCode: string }     // → /compat
export type AppNavState = ResultNavState | CompatNavState | null;
```

| route | element | incoming state | 진입 가드 |
|---|---|---|---|
| `/` | `HomeScreen` | `null` | 없음 |
| `/quiz/:step` | `QuizScreen` | `null` | step이 1~12 정수가 아니면 `/quiz/1` replace, 앞 문항 미응답이면 최소 미응답 step으로 replace |
| `/quiz/calculating` | `CalculatingScreen` | `null` | draft 12문항 미완성이면 `/` replace |
| `/result` | `ResultScreen` | `ResultNavState \| null` | state·latest 모두 없으면 Empty 상태 |
| `/report` | `ReportScreen` | `ResultNavState \| null` | resultId 미존재 시 `/` replace |
| `/share` | `ShareScreen` | `ResultNavState \| null` | 결과 없으면 `/` replace |
| `/compat` | `CompatScreen` | `CompatNavState \| null` | `mp.result.latest` 없으면 Empty 상태 |
| `/history` | `HistoryScreen` | `null` | 없음 |
| `*` | — | — | `/` replace |

### FloatingTabBar 구성 (TDS에 TabBar 없음 → 템플릿 컴포넌트 사용)

| 탭 | 라우트 | 노출 화면 |
|---|---|---|
| 홈 | `/` | S1, S4, S7, S8 |
| 궁합 | `/compat` | S1, S4, S7, S8 |
| 기록 | `/history` | S1, S4, S7, S8 |

> S2/S3/S5/S6(퀴즈·계산·리포트·공유)에서는 몰입 유지를 위해 FloatingTabBar를 렌더링하지 않는다.

---

## API Contract

**외부 API 없음.** MoneyPersona는 모든 로직(문항 상수, 채점, 캐릭터 판정, 궁합 계산, 이미지 생성)을 클라이언트에서 수행하고 데이터는 `localStorage`에만 저장한다.

- `fetch` / `XMLHttpRequest` 호출 0건 → CORS 이슈 0건 (CP-5, F8 AC-7)
- 별도 API 서버(Railway 등) 배포 없음

사용하는 외부 인터페이스는 아래 3종의 **플랫폼/브라우저 API**뿐이며 네트워크 계약이 아니다.

| 인터페이스 | 출처 | 사용처 | 실패 처리 |
|---|---|---|---|
| `<AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />` | 템플릿 (`TossAds.attachBanner` 래퍼) | S1, S4, S7, S8 | env 미주입 시 미렌더링 (F2 AC-6) |
| `<TossRewardAd slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}>` | 템플릿 (`loadFullScreenAd` + `showFullScreenAd` 래퍼) | S5 | 실패 Toast + 재시도 (F5 AC-6/AC-7) |
| `navigator.share` / `navigator.clipboard.writeText` | 브라우저 | S6 | 3단 폴백 (F6 AC-2~4) |

향후 서버 연동(예: 유형별 실시간 분포 통계)이 필요해질 경우에만 아래 형태의 외부 API 서버를 별도 Railway 배포로 추가한다. **MVP 범위 밖.**

```
GET {VITE_API_BASE}/v1/persona-stats
Request:  (body 없음)
Response 200: {
  distribution: Record<PersonaId, number>;   // 각 값 0 이상 정수
  totalCount: number;                        // 0 이상 정수
  updatedAt: number;                         // epoch ms
}
Error 400 | 429 | 500: { error: string }     // 통합 에러 형태
```

---

## Assumptions

1. **생성형 AI 고지 의무 미해당** — 캐릭터 판정, 절약 팁, 상세 리포트 문구는 모두 `PERSONAS` **정적 상수 테이블**에서 조회하는 결정론적 규칙 기반 결과이며 LLM·생성형 모델을 호출하지 않는다. 따라서 "이 서비스는 생성형 AI를 활용합니다" 사전 고지와 "AI가 생성한 결과입니다" 라벨은 적용 대상이 아니다. 향후 리포트 문구를 LLM으로 생성하도록 변경하면 해당 고지 AC 2종을 **반드시 추가**해야 한다 (미이행 시 과태료 3,000만원).
2. **프로모션 리워드 미사용** — MVP 수익 모델은 광고 단독이므로 `grantPromotionReward`를 호출하지 않는다. 추후 도입 시 `amount ≤ 5,000` 검증 AC를 추가한다.
3. **IAP 미사용** — 결제 기능이 없으므로 `TossPurchase` 컴포넌트와 `VITE_TOSS_IAP_SKU`는 사용하지 않는다.
4. **사용자 식별 불필요** — 데이터가 기기 로컬에만 존재하므로 `getIsTossLoginIntegratedService()` 호출도 MVP에서는 하지 않는다. 토스가 제공하는 세션은 별도 처리 없이 그대로 둔다.
5. **친구 궁합은 코드 수동 입력 방식** — 서버가 없으므로 딥링크·초대 링크 대신 공유 텍스트에 포함된 5자 코드를 친구가 직접 입력한다. 코드에는 캐릭터 유형(3글자) + 체크섬(2글자)만 담기므로 개인정보가 포함되지 않는다.
6. **결과 이미지는 네이티브 Canvas 2D로 생성** — `html-to-image`, `html2canvas` 등 외부 라이브러리를 추가하지 않아 번들 크기와 검수 리스크를 줄인다. 이모지 렌더링은 시스템 폰트에 의존한다.
7. **`VITE_TOSS_AD_GROUP_ID`, `VITE_TOSS_AD_SLOT_ID`는 앱인토스 콘솔에서 발급받아 환경변수로 주입**되며 재빌드 없이 교체 가능하다. 로컬 개발 시 미설정이면 광고 컴포넌트는 렌더링되지 않는다.
8. **데이터 마이그레이션 불필요** — 모든 저장 모델에 `version: 1` 필드가 있고, `version !== 1`이면 key를 삭제하고 기본값으로 시작한다(MVP 정책).
9. **저장 상한 20건** — 진단/궁합 기록 각각 최대 20건이므로 총 사용량 ≈ 10.5 KB로 5 MB 한도 대비 여유가 크며, 가상 스크롤이 필요 없다.
10. **기기 간 동기화 없음** — 앱 삭제·브라우저 데이터 초기화 시 기록이 사라진다는 점을 온보딩 다이얼로그 문구(`"진단 결과는 이 기기에만 저장돼요."`)로 고지한다.

---

## Open Questions

| # | 질문 | 영향 범위 | 기본 결정(미회신 시) |
|---|---|---|---|
| Q1 | 상세 리포트 해제(`reportUnlocked`)를 결과별 **영구** 유지할지, 24시간 만료로 재광고를 유도할지? | F5 AC-3, 수익 지표 | 영구 유지 (재시청 강요는 이탈 위험) |
| Q2 | 결과 카드 자체에도 리워드 광고를 걸지? 현재는 카드 무료 / 리포트만 게이팅으로 공유 바이럴 우선 | F4, F5, MRR $250 목표 | 현행 유지(카드 무료). 2주 지표 확인 후 A/B 재검토 |
| Q3 | 8개 캐릭터의 `summary`(60~120자), `strengths`, `weakness`, `tips` 3종 최종 카피는 누가 확정하는가? | F1 상수 테이블, F4, F5 | 초안은 엔지니어가 작성 후 기획 검수 1회 |
| Q4 | 궁합 점수 가능값이 `10 / 40 / 70 / 100` 4종으로 이산적인데 그대로 확정할지? | F1 `computeCompat`, F7 | 명세대로 확정 (테스트 가능성 우선) |
| Q5 | 결과 이미지 "저장하기"(canvas → `a[download]`) 버튼을 추가할지? 토스 웹뷰에서 다운로드 동작이 보장되지 않음 | F6 (P2 범위) | MVP 제외. 공유 시트만 제공 |
| Q6 | 계산 화면의 1,200ms 연출 시간이 적정한가? | F3 AC-3/AC-4 | 1,200ms로 확정, 출시 후 조정 |
| Q7 | 유형별 실시간 분포(`"상위 12%의 알뜰형"`)를 보여주려면 외부 API 서버가 필요하다. MVP에 포함할지? | API Contract, F5 리포트 | MVP 제외 (서버 없음). 리포트에는 정적 기준 문구만 표기 |
| Q8 | FloatingTabBar 탭 구성을 `홈 / 궁합 / 기록` 3개로 확정할지? | S1, S4, S7, S8 | 3탭 확정 |

---

## Feature → Work Packet 매핑 (참고)

| Feature | 예상 패킷 수 | 비고 |
|---|---|---|
| F1 도메인·저장 계층 | 3 (상수 테이블 / 순수 함수 / storage 래퍼) | UI 없음, 유닛 테스트 중심 |
| F2 홈·온보딩 | 2 (홈 레이아웃 / 온보딩·이어하기) | |
| F3 퀴즈·계산 | 2 (퀴즈 화면·가드 / 계산 화면·저장) | |
| F4 결과 카드 | 2 (히어로·팁 카드 / MiniBar·광고·Empty) | |
| F5 리포트 게이팅 | 2 (게이트·광고 연동 / 리포트 콘텐츠) | |
| F6 공유 | 2 (Canvas 생성 / 공유 3단 폴백) | |
| F7 궁합 | 2 (입력 폼·검증 / 결과 카드·기록 저장) | |
| F8 기록·컴플라이언스 | 2 (기록 화면 / 검수 정적 검증·라우트 가드) | |
| **합계** | **17 패킷** | 최소 4패킷 요건 충족 |