# SPEC — MoneyPersona

> 소스: PRD `MoneyPersona` (앱인토스 / Vite + React + TypeScript + TDS)
> 이 문서가 구현의 단일 진실 소스. PRD에 없는 사실은 추가하지 않았고, 불확실한 항목은 Assumptions / Open Questions에 명시.

---

## Common Principles

**CP-1. 기술 스택 고정**
- Vite + React + TypeScript, 라우팅은 `react-router-dom`(BrowserRouter), 상태 저장은 `localStorage`만 사용.
- 서버 코드 없음. 외부 API 호출 없음(§API Contract 참조).
- 모든 UI는 `@toss/tds-mobile` 컴포넌트로 조립. shadcn/ui, MUI, Ant Design, Chakra UI 사용 금지.

**CP-2. TDS 사용 규칙**
- 사용 컴포넌트: `Top`, `ListRow`, `Button`, `TextField`, `Paragraph.Text`, `Chip`, `Switch`, `AlertDialog`, `BottomSheet`, `Toast`, `Tab`, `Spacing`, `Asset.ContentIcon`.
- 간격은 `Spacing`(size prop 필수)으로만 조절. TDS 컴포넌트의 내장 padding/margin을 Tailwind·인라인 스타일로 덮어쓰지 않는다.
- 커스텀 CSS는 TDS가 제공하지 않는 레이아웃(flex/grid 배치)에만 허용.
- 하단 탭 네비게이션은 템플릿 제공 `src/components/FloatingTabBar` 사용(TDS에 TabBar 없음). `Tab`은 상단 콘텐츠 전환 전용.
- 색상은 `var(--tds-color-*)` CSS 변수 또는 TDS 컴포넌트 기본값만 사용. HEX 하드코딩 금지(다크모드 필수).

**CP-3. 페이지 골격 계약**
- 모든 라우트 화면은 `ScreenScaffold`(템플릿의 PageShell 역할)로 감싼다. raw `<div>` 골격 금지.
- 1차 액션은 `SubmitFooter`(하단 고정) 또는 `display="block"` 버튼. 좌측 글자폭 버튼 금지.
- 결과/지표/비교 정보는 `Card`로 묶어 위계를 표현하고, 핵심 값은 강조 타이포(t2~t3) + 필요 시 `Chip` 배지.
- 모든 터치 대상의 히트 영역은 최소 44×44px.

**CP-4. 인증**
- 토스 앱이 세션을 자동 제공. 로그인 호출·커스텀 인증 없음. 사용자 식별이 필요할 때만 `getIsTossLoginIntegratedService()`로 연동 상태를 확인한다. MVP에서 사용자 ID를 저장하지 않는다.

**CP-5. 수익화**
- 배너: 템플릿 제공 `<AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />`.
- 리워드: 템플릿 제공 `<TossRewardAd slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}>{children}</TossRewardAd>` — 상세 분석 리포트 게이팅에 사용.
- IAP 없음. 프로모션 리워드(`grantPromotionReward`) 없음(Open Question OQ-4).

**CP-6. 생성형 AI 비해당**
- 진단·리포트·궁합은 **규칙 기반 결정론적 스코어링 + 사전 작성된 정적 카피**이며 LLM/생성형 AI를 호출하지 않는다. 따라서 "AI가 생성한 결과입니다" 라벨 및 AI 사전 고지 의무는 해당 없음.
- 대신 결과 화면에는 [W] 오해 방지 고지 "재미로 보는 성향 테스트이며 금융 투자 자문이 아닙니다"를 표시한다(F3 AC-6).

**CP-7. 결정론**
- 동일한 12개 답변 배열은 항상 동일한 personaId를 산출한다(랜덤·시간 의존 로직 금지).

**CP-8. 데이터 버전**
- 모든 localStorage 값은 `{ v: 1, data: ... }` 래퍼로 저장. `v !== 1`이면 해당 키를 삭제하고 초기값으로 시작한다(마이그레이션 없음).

---

## Data Models

### Axis (진단 축)
3개 이진 축. 각 축당 4문항, 문항당 선택지 2개(점수 1 또는 0).

| 축 | 코드 | 양극 | 문항 |
|---|---|---|---|
| 소비 성향 | `A1` | `F`(절약) / `S`(소비) | Q1–Q4 |
| 관리 성향 | `A2` | `P`(계획) / `I`(즉흥) | Q5–Q8 |
| 투자 성향 | `A3` | `C`(안정) / `R`(모험) | Q9–Q12 |

판정 규칙(결정론): 축 점수 `score ∈ [0,4]` (첫 글자 선택지 = +1). `score >= 2` → 첫 글자(`F`/`P`/`C`), `score < 2` → 둘째 글자(`S`/`I`/`R`). 동점 없음.

```ts
export type AxisId = 'A1' | 'A2' | 'A3';
export type AxisLetter = 'F' | 'S' | 'P' | 'I' | 'C' | 'R';
export type PersonaCode =
  | 'FPC' | 'FPR' | 'FIC' | 'FIR' | 'SPC' | 'SPR' | 'SIC' | 'SIR';
```

### Question (정적 콘텐츠, `src/data/questions.ts`)

```ts
export interface Choice {
  id: 'a' | 'b';
  label: string;       // 8~40자
  score: 0 | 1;        // 1 = 축의 첫 글자 방향
}

export interface Question {
  id: number;          // 1..12, 고정 순서
  axis: AxisId;
  text: string;        // 10~40자
  choices: [Choice, Choice]; // 정확히 2개
}
```

12문항 고정 콘텐츠(변경 금지, 테스트가 이 값을 검증):

| id | axis | text | choice a (score 1) | choice b (score 0) |
|---|---|---|---|---|
| 1 | A1 | 월급날 가장 먼저 하는 일은? | 저축·투자 계좌로 이체한다 | 사고 싶던 걸 결제한다 |
| 2 | A1 | 평일 커피값은? | 회사 탕비실이나 편의점 | 매일 카페에서 사 마신다 |
| 3 | A1 | 세일 알림을 봤다 | 필요 없으면 안 산다 | 일단 장바구니에 담는다 |
| 4 | A1 | 20분 더 걸리지만 요금은 1/5 | 지하철을 탄다 | 택시를 탄다 |
| 5 | A2 | 여행을 갈 때 나는 | 일정표를 미리 만든다 | 가서 그때그때 정한다 |
| 6 | A2 | 가계부는? | 매달 기록하고 점검한다 | 쓰지 않는다 |
| 7 | A2 | 큰 지출을 앞두고 | 최소 3곳을 비교한다 | 마음에 들면 바로 산다 |
| 8 | A2 | 다음 달 고정지출 금액을 | 대략 알고 있다 | 모른다 |
| 9 | A3 | 여윳돈 100만 원이 생기면 | 예적금·파킹통장에 넣는다 | 주식·코인 등에 투자한다 |
| 10 | A3 | 투자 원금이 20% 하락하면 | 정리하고 예금으로 옮긴다 | 추가로 더 매수한다 |
| 11 | A3 | 새로 나온 금융상품을 보면 | 검증된 뒤에 가입한다 | 먼저 써보고 판단한다 |
| 12 | A3 | 수입을 늘릴 기회가 있다면 | 안정적인 월급이 최고다 | 리스크가 있어도 도전한다 |

### Persona (정적 콘텐츠, `src/data/personas.ts`)

```ts
export interface Persona {
  code: PersonaCode;
  name: string;          // 예: '알뜰형 다람쥐'
  emoji: string;         // 1글자 이모지
  tagline: string;       // 12~30자 한 줄 요약
  summary: string;       // 60~140자
  tips: [string, string, string];      // 절약 팁 정확히 3개, 각 15~60자
  strengths: [string, string];
  cautions: [string, string];          // 위험 신호 2개
  plan30d: [string, string, string];   // 30일 액션 플랜 3단계
  bestMatch: PersonaCode;              // 최고 궁합 캐릭터
}
```

8캐릭터 고정 매핑(변경 금지):

| code | name | emoji | bestMatch |
|---|---|---|---|
| FPC | 알뜰형 다람쥐 | 🐿️ | SPR |
| FPR | 전략형 여우 | 🦊 | SIC |
| FIC | 느긋한 거북이 | 🐢 | SPR |
| FIR | 도전하는 토끼 | 🐰 | SPC |
| SPC | 계획형 코끼리 | 🐘 | FIR |
| SPR | 야심가 매 | 🦅 | FPC |
| SIC | 포근한 판다 | 🐼 | FPR |
| SIR | 플렉스 공작 | 🦚 | FPC |

예시(FPC, 테스트 픽스처로 사용): `tips = ['월급날 자동이체로 저축분을 먼저 떼어두세요', '고정 구독 서비스를 3개월마다 점검하세요', '주 1회 무지출 데이를 캘린더에 고정하세요']`

### QuizResult (localStorage)

```ts
export interface AxisScore {
  axis: AxisId;
  score: 0 | 1 | 2 | 3 | 4;
  letter: AxisLetter;
  percent: 0 | 25 | 50 | 75 | 100; // score / 4 * 100
}

export interface QuizResult {
  id: string;                 // `r_${createdAt}_${personaCode}` — 랜덤 미사용
  createdAt: number;          // Date.now()
  answers: (0 | 1)[];         // 길이 12, index i = 문항 i+1의 선택 점수
  axisScores: [AxisScore, AxisScore, AxisScore]; // A1,A2,A3 순서 고정
  personaCode: PersonaCode;
  shareCode: string;          // `MP1-<personaCode>-<checksum>`
  reportUnlocked: boolean;    // 리워드 광고 시청 완료 여부
}
```

### QuizProgress (localStorage, 진행 중 이탈 복구)

```ts
export interface QuizProgress {
  answers: (0 | 1 | null)[];  // 길이 12, 미응답은 null
  currentIndex: number;       // 0..11
  updatedAt: number;
}
```

### CompatibilityRecord (localStorage)

```ts
export interface CompatibilityRecord {
  id: string;                 // `c_${createdAt}`
  createdAt: number;
  myCode: PersonaCode;
  friendCode: PersonaCode;
  friendShareCode: string;
  score: number;              // 50..100 정수
  grade: '최고의 짝' | '좋은 궁합' | '무난한 궁합' | '서로 배우는 궁합';
  matchedAxes: AxisId[];      // 일치한 축
}
```

궁합 점수 공식(결정론, 테스트 대상):
`score = 100 - (A1 불일치 ? 25 : 0) - (A2 불일치 ? 15 : 0) - (A3 불일치 ? 10 : 0)` → 범위 50~100.
등급: `>=90` 최고의 짝 / `75~89` 좋은 궁합 / `60~74` 무난한 궁합 / `<60` 서로 배우는 궁합.

### AppFlags (localStorage)

```ts
export interface AppFlags {
  onboardingSeen: boolean;
  lastResultId: string | null;
  disclaimerSeen: boolean;
}
```

### ShareCode 규칙

- 포맷: `MP1-<PersonaCode>-<checksum>` (예: `MP1-FPC-2`)
- `checksum = (personaCode의 charCodeAt 합) % 10` → 한 자리 숫자.
- 검증: 정규식 `/^MP1-(FPC|FPR|FIC|FIR|SPC|SPR|SIC|SIR)-\d$/` 통과 + checksum 일치. 입력은 대문자로 정규화(`trim().toUpperCase()`), 하이픈 없는 입력(`MP1FPC2`)도 허용해 재조립한다.

### localStorage 키 & 용량

| 키 | 값 | 상한 | 예상 크기 |
|---|---|---|---|
| `mp:result:v1` | `{v:1,data:QuizResult}` | 1건 | ~0.4KB |
| `mp:history:v1` | `{v:1,data:QuizResult[]}` | 최신 20건(초과 시 오래된 것부터 삭제) | ~8KB |
| `mp:progress:v1` | `{v:1,data:QuizProgress}` | 1건 | ~0.2KB |
| `mp:compat:v1` | `{v:1,data:CompatibilityRecord[]}` | 최신 20건 | ~4KB |
| `mp:flags:v1` | `{v:1,data:AppFlags}` | 1건 | ~0.1KB |

**총 예상 최대 ≈ 13KB (5MB 한도의 0.3%).** 정적 콘텐츠(questions/personas)는 번들 내 상수이며 localStorage에 저장하지 않는다.

---

## Feature List

### F1. 진단 엔진 & 저장소 (데이터 레이어)

- **Description:** 12문항 정적 콘텐츠, 3축 스코어링, 8캐릭터 매핑, shareCode 생성, localStorage 읽기/쓰기 유틸을 순수 함수로 제공한다. UI 없이 단독으로 테스트 가능한 레이어이며 F2~F7이 모두 이 레이어를 사용한다. 모든 함수는 결정론적이고 예외를 던지지 않는다(실패 시 기본값 반환).
- **Data:** Question, Persona, QuizResult, QuizProgress, AppFlags, `mp:result:v1`, `mp:history:v1`, `mp:progress:v1`, `mp:flags:v1`
- **API:** 없음(로컬 전용)
- **Requirements:** `scoreQuiz(answers)`, `getPersona(code)`, `makeShareCode(code)`, `parseShareCode(str)`, `saveResult(r)`, `loadResult()`, `loadHistory()`, `saveProgress(p)`, `clearProgress()`

- **AC-1 [U][P0]: Scenario: 문항·캐릭터 콘텐츠 무결성**
  Given 앱 번들이 로드되었을 때
  Then `questions.length === 12`이고 각 문항의 `choices.length === 2`이며 축별 문항 수는 A1=4, A2=4, A3=4다
  And `personas.length === 8`이고 code 집합은 `{FPC,FPR,FIC,FIR,SPC,SPR,SIC,SIR}`와 정확히 일치하며 모든 persona의 `tips.length === 3`이다

- **AC-2 [U][P0]: Scenario: 스코어링 결정론**
  Given `answers = [1,1,1,1, 1,1,1,1, 1,1,1,1]`
  When `scoreQuiz(answers)` 호출
  Then `personaCode === 'FPC'`이고 `axisScores`는 `[{axis:'A1',score:4,letter:'F',percent:100},{axis:'A2',score:4,letter:'P',percent:100},{axis:'A3',score:4,letter:'C',percent:100}]`이다
  And 동일 입력으로 100회 호출해도 결과가 동일하다

- **AC-3 [U][P0]: Scenario: 경계값 2는 첫 글자로 판정**
  Given `answers = [1,1,0,0, 1,0,0,0, 0,0,0,0]` (A1=2, A2=1, A3=0)
  When `scoreQuiz(answers)` 호출
  Then `personaCode === 'FIR'`이고 `axisScores[0].percent === 50`이다

- **AC-4 [E][P0]: Scenario: 결과 저장 및 히스토리 누적**
  Given `mp:history:v1`에 20건이 저장되어 있을 때
  When `saveResult(newResult)` 호출
  Then `mp:result:v1`이 newResult로 덮어써지고 `mp:history:v1`의 길이는 20을 유지하며 `createdAt`이 가장 오래된 1건이 제거된다
  And `mp:flags:v1.lastResultId === newResult.id`가 된다

- **AC-5 [W][P1]: Scenario: 손상된 localStorage 복구**
  Given `mp:result:v1`의 값이 `"{ not json"`일 때
  When `loadResult()` 호출
  Then 예외를 던지지 않고 `null`을 반환하며 해당 키를 삭제한다
  And `console.error`를 호출하지 않는다

- **AC-6 [W][P1]: Scenario: 저장 공간 초과(QuotaExceededError)**
  Given `localStorage.setItem`이 `QuotaExceededError`를 던지는 상태일 때
  When `saveResult(newResult)` 호출
  Then `mp:history:v1`을 최신 5건으로 축소한 뒤 1회 재시도하고, 재시도도 실패하면 `{ ok: false, reason: 'quota' }`를 반환한다
  And 앱이 크래시하지 않는다

- **AC-7 [W][P1]: Scenario: 잘못된 답변 배열 방어**
  Given `answers = [1,1,1]` (길이 3)
  When `scoreQuiz(answers)` 호출
  Then `{ ok:false, reason:'invalid_answers' }`를 반환하고 personaCode를 생성하지 않는다

- **AC-8 [S][P1]: Scenario: 데이터 없는 초기 상태**
  Given localStorage에 `mp:*` 키가 하나도 없을 때
  When `loadResult()`, `loadHistory()`, `loadProgress()`를 호출
  Then 각각 `null`, `[]`, `null`을 반환하고 새 키를 생성하지 않는다

---

### F2. 12문항 진단 퀴즈 화면

- **Description:** `/quiz`에서 12문항을 한 번에 1문항씩 표시하고, 선택 즉시 다음 문항으로 전환하며 상단에 진행률(n/12)을 노출한다. 진행 상태는 매 선택마다 localStorage에 저장되어 앱을 종료했다 돌아와도 이어서 응답할 수 있다. 12번째 응답 시 스코어링 후 결과 화면으로 이동한다.
- **Data:** Question, QuizProgress(`mp:progress:v1`), QuizResult(`mp:result:v1`)
- **API:** 없음
- **Requirements:** 뒤로가기(이전 문항), 진행률 표시, 이어하기 복구, 광고 미노출

- **AC-1 [E][P0]: Scenario: 선택 시 다음 문항 전환**
  Given `/quiz`에서 1번 문항("월급날 가장 먼저 하는 일은?")이 표시 중일 때
  When 선택지 a("저축·투자 계좌로 이체한다")를 탭
  Then 2번 문항이 표시되고 진행 표시가 "2 / 12"로 갱신된다
  And `mp:progress:v1`에 `{ answers:[1,null,...], currentIndex:1 }`이 저장된다

- **AC-2 [E][P0]: Scenario: 12문항 완료 시 결과 이동**
  Given 11문항에 응답해 12번 문항이 표시 중일 때
  When 12번 문항의 선택지를 탭
  Then `scoreQuiz`가 실행되어 결과가 `mp:result:v1`에 저장되고 `navigate('/result', { state: { resultId } , replace: true })`로 이동한다
  And `mp:progress:v1`이 삭제된다

- **AC-3 [S][P0]: Scenario: 이어하기**
  Given `mp:progress:v1`에 `{ answers:[1,0,1,null,...], currentIndex:3 }`이 저장된 상태에서
  When `/quiz`에 진입
  Then 4번 문항이 표시되고 진행 표시는 "4 / 12"다

- **AC-4 [E][P1]: Scenario: 이전 문항으로 이동**
  Given 5번 문항이 표시 중일 때
  When 상단 `Top`의 뒤로 버튼을 탭
  Then 4번 문항이 표시되고 4번의 기존 선택지가 선택 상태로 강조된다
  And 1번 문항에서 뒤로 버튼을 탭하면 `navigate('/')`로 홈에 돌아간다

- **AC-5 [S][P1]: Scenario: 전환 중 중복 입력 차단**
  Given 선택지 탭 후 다음 문항 전환 애니메이션(200ms)이 진행 중일 때
  When 같은 선택지를 3회 연속 탭
  Then 답변은 1회만 기록되고 문항 인덱스는 1만 증가한다

- **AC-6 [W][P1]: Scenario: 진행 데이터 손상**
  Given `mp:progress:v1`의 `answers` 길이가 7(비정상)일 때
  When `/quiz`에 진입
  Then 진행 데이터를 삭제하고 1번 문항부터 새로 시작하며 Toast "이전 진행 기록이 없어 처음부터 시작해요"를 표시한다

- **AC-7 [U][P1]: Scenario: 로딩 상태**
  Given `/quiz` 마운트 후 progress 복구가 끝나기 전
  Then 스켈레톤 영역(`data-testid="quiz-skeleton"`)을 표시하고 선택지 버튼은 렌더링하지 않는다
  And 복구 완료 후 스켈레톤은 DOM에서 제거된다

- **AC-8 [U][P2]: Scenario: 퀴즈 몰입 유지**
  Given `/quiz`가 표시 중일 때
  Then 화면 어디에도 `AdSlot`이 렌더링되지 않고 FloatingTabBar도 숨겨진다

---

### F3. 결과 카드 화면 + 맞춤 절약 팁

- **Description:** `/result`에서 진단된 8캐릭터 중 하나를 큰 카드로 보여주고, 3축 지표를 MiniBar로 시각화하며 캐릭터별 절약 팁 3가지를 리스트로 제공한다. 하단에는 "상세 리포트 보기"(F4)와 "결과 공유"(F5) CTA를 배치한다. 배너 광고는 팁 섹션과 CTA 사이에만 삽입한다.
- **Data:** QuizResult(`mp:result:v1`), Persona
- **API:** 없음
- **Requirements:** persona 카드, 축 지표, 팁 3개, CTA 2개, 고지 문구, 배너 1개

- **AC-1 [E][P0]: Scenario: 결과 카드 표시**
  Given `mp:result:v1`에 `personaCode: 'FPC'` 결과가 저장된 상태에서
  When `/result`에 진입
  Then `data-testid="persona-card"` Card 1개 안에 이모지 "🐿️", 이름 "알뜰형 다람쥐", tagline이 t2 강조 타이포로 표시된다
  And `data-testid="tips-card"` Card 안에 `ListRow` 3개가 정확히 렌더링된다

- **AC-2 [U][P0]: Scenario: 레이아웃 계약 — 3축 지표 시각화**
  Given `/result`가 표시 중일 때
  Then `data-testid="axis-metrics"` Card 안에 MiniBar 3개(`data-testid="axis-bar-A1|A2|A3"`)가 있고 각 바의 채움 비율은 해당 축 `percent` 값(0/25/50/75/100)과 일치한다
  And 각 바 옆에 `Chip`으로 축 라벨("절약형 75%" 형식)이 표시된다

- **AC-3 [U][P0]: Scenario: 1차 액션 배치 계약**
  Given `/result`가 표시 중일 때
  Then 화면은 `ScreenScaffold`로 감싸져 있고, "상세 리포트 보기" 버튼은 `SubmitFooter`(하단 고정) 안에 `display="block"`으로 렌더링되며 높이가 48px 이상이다
  And "결과 공유하기" 보조 버튼도 `display="block"`이고 두 버튼의 히트 영역은 각각 44px 이상이다

- **AC-4 [E][P0]: Scenario: CTA 내비게이션**
  Given `/result`에 `resultId = 'r_1_FPC'` 결과가 표시 중일 때
  When "상세 리포트 보기" 버튼 탭
  Then `navigate('/report', { state: { resultId: 'r_1_FPC' } })`가 호출된다
  And "결과 공유하기" 탭 시 `navigate('/share', { state: { resultId: 'r_1_FPC' } })`가 호출된다

- **AC-5 [S][P1]: Scenario: 결과 없음(빈 상태)**
  Given `mp:result:v1`이 없고 `location.state`도 비어 있을 때
  When `/result`에 진입
  Then `Asset.ContentIcon`과 "아직 진단 결과가 없어요" 문구, "테스트 시작하기" 버튼(`display="block"`)이 표시된다
  And 버튼 탭 시 `navigate('/quiz')`로 이동한다

- **AC-6 [U][P1]: Scenario: 오해 방지 고지**
  Given `/result`가 표시 중일 때
  Then 화면 하단에 `Paragraph.Text`로 "재미로 보는 성향 테스트이며 금융 투자 자문이 아닙니다"가 표시된다

- **AC-7 [W][P1]: Scenario: 알 수 없는 personaCode**
  Given `mp:result:v1.personaCode === 'XXX'`(정의되지 않은 코드)일 때
  When `/result`에 진입
  Then 크래시하지 않고 빈 상태 UI를 표시하며 `mp:result:v1`을 삭제한다
  And `console.error` 호출이 0회다

- **AC-8 [U][P1]: Scenario: 배너 광고 배치**
  Given `/result`가 표시 중일 때
  Then `<AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />`가 `tips-card` 아래, `SubmitFooter` 위에 1개만 렌더링된다
  And 광고 영역이 persona-card나 버튼 위에 겹치지 않는다(z-index 오버레이 금지)

---

### F4. 리워드 광고 게이팅 상세 분석 리포트

- **Description:** `/report`에서 캐릭터별 상세 분석(소비 습관 요약, 축별 지표, 위험 신호 2가지, 30일 액션 플랜 3단계)을 제공하되, 콘텐츠 전체를 `TossRewardAd`로 감싸 광고 시청 완료 후에만 공개한다. 한 번 해제한 결과는 `reportUnlocked=true`로 저장되어 재진입 시 광고 없이 열람한다.
- **Data:** QuizResult(`reportUnlocked`), Persona(`summary`, `cautions`, `plan30d`)
- **API:** 없음
- **Requirements:** 리워드 게이트, 해제 상태 영속화, 광고 실패 처리

- **AC-1 [E][P0]: Scenario: 리워드 광고 시청 후 리포트 공개**
  Given `/report`에 진입했고 `reportUnlocked === false`일 때
  When `TossRewardAd`가 감싼 "광고 보고 리포트 열기" 액션으로 광고 시청이 완료되면
  Then `data-testid="report-card"` Card 3개(요약/위험 신호/30일 플랜)가 표시된다
  And `mp:result:v1.reportUnlocked`가 `true`로 저장되고 `mp:history:v1`의 동일 id 항목도 갱신된다

- **AC-2 [S][P0]: Scenario: 해제된 리포트 재열람**
  Given `mp:result:v1.reportUnlocked === true`일 때
  When `/report`에 재진입
  Then 광고 호출 없이 즉시 리포트 3개 Card가 표시된다

- **AC-3 [U][P0]: Scenario: 리포트 콘텐츠 계약**
  Given personaCode `'FPC'`의 리포트가 공개된 상태에서
  Then 위험 신호 Card에는 `cautions` 2개가 `ListRow`로, 30일 플랜 Card에는 `plan30d` 3개가 번호 배지(`Chip`) 1·2·3과 함께 표시된다
  And 요약 Card 상단에는 SummaryHero로 대표 축 값(예: "절약 지수 75")이 CountUp 애니메이션과 함께 t2 타이포로 표시된다

- **AC-4 [W][P1]: Scenario: 광고 로드 실패**
  Given 리워드 광고 로드가 실패(에러 콜백)했을 때
  When 사용자가 "광고 보고 리포트 열기"를 탭
  Then Toast "지금은 광고를 불러올 수 없어요. 잠시 후 다시 시도해주세요"가 표시되고 리포트는 잠금 상태를 유지한다
  And "다시 시도" 버튼이 표시되며 `console.error` 호출은 0회다

- **AC-5 [W][P1]: Scenario: 광고 중도 이탈**
  Given 리워드 광고가 재생 중일 때
  When 사용자가 광고를 끝까지 보지 않고 닫으면
  Then 리포트는 잠금 상태를 유지하고 `reportUnlocked`는 `false`로 남으며 Toast "광고를 끝까지 봐야 리포트가 열려요"가 표시된다

- **AC-6 [U][P1]: Scenario: 로딩 상태**
  Given "광고 보고 리포트 열기" 탭 직후 광고 로드 중일 때
  Then 버튼은 disabled 상태가 되고 `data-testid="report-loading"` 로딩 인디케이터가 표시된다
  And 중복 탭 시 광고 요청은 1회만 발생한다

- **AC-7 [S][P1]: Scenario: state 없이 직접 진입**
  Given `location.state`가 `undefined`이고 `mp:result:v1`도 없을 때
  When `/report`에 진입
  Then `Asset.ContentIcon`과 "먼저 테스트를 완료해주세요" 빈 상태가 표시되고 "테스트 시작하기" 버튼으로 `/quiz`로 이동한다

- **AC-8 [U][P2]: Scenario: 잠금 미리보기**
  Given 리포트가 잠금 상태일 때
  Then 리포트 Card 영역은 블러 처리된 더미 텍스트 대신 "🔒 상세 분석 3가지" 요약 목록(제목만)을 보여주고 본문 텍스트는 DOM에 포함하지 않는다

---

### F5. 결과 이미지 공유

- **Description:** `/share`에서 결과 카드를 정사각 이미지(1080×1080 PNG)로 렌더링하고, 공유 코드가 포함된 텍스트와 함께 시스템 공유 시트를 호출한다. 공유 시트를 사용할 수 없는 환경에서는 클립보드 복사로 대체한다. 외부 도메인으로 이동하지 않는다.
- **Data:** QuizResult(`shareCode`, `personaCode`), Persona
- **API:** 없음(브라우저 `navigator.share` / `navigator.clipboard`만 사용)
- **Requirements:** 이미지 생성, 공유 텍스트, 폴백, 외부 이탈 금지

- **AC-1 [E][P0]: Scenario: 이미지 생성 후 공유 시트 호출**
  Given `/share`에 `personaCode: 'FPC'`, `shareCode: 'MP1-FPC-2'` 결과가 전달된 상태에서
  When "공유하기" 버튼 탭 && `navigator.canShare({ files })`가 true
  Then 1080×1080 PNG Blob과 텍스트 `"내 소비 캐릭터는 알뜰형 다람쥐 🐿️! 내 코드: MP1-FPC-2"`로 `navigator.share`가 1회 호출된다

- **AC-2 [E][P0]: Scenario: 공유 코드 복사 폴백**
  Given `navigator.share`가 정의되지 않은 환경일 때
  When "공유하기" 버튼 탭
  Then `navigator.clipboard.writeText`로 위 공유 텍스트가 복사되고 Toast "공유 문구를 복사했어요"가 표시된다

- **AC-3 [U][P0]: Scenario: 공유 카드 레이아웃 계약**
  Given `/share`가 표시 중일 때
  Then `data-testid="share-preview"` Card 1개 안에 캐릭터 이모지·이름·tagline·공유 코드가 포함되고, 공유 코드는 `Chip`으로 표시된다
  And "공유하기" 버튼은 `SubmitFooter` 안 `display="block"`, 높이 48px 이상이다

- **AC-4 [U][P1]: Scenario: 이미지 생성 로딩 상태**
  Given "공유하기" 탭 후 캔버스 렌더링이 진행 중일 때
  Then 버튼 라벨이 "이미지 만드는 중"으로 바뀌고 disabled가 되며 `data-testid="share-loading"`이 표시된다
  And 렌더링 완료 후 버튼이 다시 활성화된다

- **AC-5 [W][P1]: Scenario: 이미지 생성 실패**
  Given 캔버스 `toBlob`이 `null`을 반환했을 때
  When "공유하기" 버튼 탭
  Then 이미지 없이 텍스트만으로 공유를 시도하고, 그것도 실패하면 Toast "이미지를 만들지 못했어요. 코드를 복사했어요"와 함께 클립보드 복사로 폴백한다
  And `console.error` 호출은 0회다

- **AC-6 [W][P1]: Scenario: 공유 취소**
  Given `navigator.share`가 `AbortError`로 reject될 때
  Then 에러 Toast를 표시하지 않고 화면 상태를 그대로 유지한다

- **AC-7 [W][P0]: Scenario: 외부 도메인 이탈 금지**
  Given `/share`의 모든 인터랙션에서
  Then `window.open` 및 `window.location.href = <외부 URL>` 호출이 0회다
  And 카카오톡·인스타그램 등 앱 설치 유도 문구/버튼/링크가 렌더링되지 않는다

- **AC-8 [S][P1]: Scenario: 결과 없이 진입**
  Given `location.state`와 `mp:result:v1`이 모두 없을 때
  When `/share`에 진입
  Then `Asset.ContentIcon`과 "공유할 결과가 없어요" 빈 상태 및 "테스트 시작하기" 버튼이 표시된다

---

### F6. 친구 궁합 비교

- **Description:** `/compat`에서 친구의 공유 코드(`MP1-XXX-N`)를 입력하면 내 캐릭터와의 궁합 점수(50~100)와 등급, 일치/불일치 축을 계산해 보여준다. 비교 기록은 최신 20건까지 저장되어 목록으로 다시 볼 수 있다. 서버 통신 없이 코드 파싱만으로 동작한다.
- **Data:** CompatibilityRecord(`mp:compat:v1`), QuizResult, Persona
- **API:** 없음
- **Requirements:** 코드 입력·검증, 점수 계산, 기록 저장, 모바일 키보드 처리

- **AC-1 [E][P0]: Scenario: 궁합 계산 성공**
  Given 내 `personaCode === 'FPC'`이고 `/compat`에 진입한 상태에서
  When TextField에 `"mp1-spr-6"`을 입력하고 "궁합 보기" 탭
  Then 코드가 `MP1-SPR-6`으로 정규화·검증되고 점수 `100 - 25 - 15 - 10 = 50`, 등급 "서로 배우는 궁합"이 계산된다
  And `mp:compat:v1`에 CompatibilityRecord 1건이 추가된다

- **AC-2 [U][P0]: Scenario: 결과 레이아웃 계약**
  Given 궁합 계산이 완료된 상태에서
  Then `data-testid="compat-score-card"` Card 안에 SummaryHero가 점수를 CountUp(0→50)으로 t2 타이포로 표시하고, 등급이 `Chip` 배지로 표시된다
  And `data-testid="compat-axis-list"`에 3개 축의 일치 여부가 `ListRow`로 표시되며 각 행 우측에 "찰떡"/"정반대" 라벨이 붙는다

- **AC-3 [E][P0]: Scenario: 동일 캐릭터 만점**
  Given 내 `personaCode === 'FPC'`일 때
  When 친구 코드 `MP1-FPC-2` 입력 후 "궁합 보기" 탭
  Then 점수 100, 등급 "최고의 짝", 일치 축 `['A1','A2','A3']`이 표시된다

- **AC-4 [W][P1]: Scenario: 잘못된 코드 형식**
  Given `/compat`에서
  When TextField에 `"ABCD"`를 입력하고 "궁합 보기" 탭
  Then 에러 메시지 "코드 형식이 올바르지 않아요 (예: MP1-FPC-2)"가 TextField 하단에 표시되고 기록은 저장되지 않는다

- **AC-5 [W][P1]: Scenario: 체크섬 불일치**
  Given `/compat`에서
  When `"MP1-FPC-9"`(정상 체크섬은 2)를 입력하고 "궁합 보기" 탭
  Then 에러 메시지 "코드가 잘못됐어요. 친구에게 다시 받아보세요"가 표시되고 점수 계산을 수행하지 않는다

- **AC-6 [S][P1]: Scenario: 내 결과가 없는 상태**
  Given `mp:result:v1`이 없을 때
  When `/compat`에 진입
  Then TextField와 "궁합 보기" 버튼이 disabled 상태이고, `Asset.ContentIcon`과 "먼저 내 캐릭터를 진단해주세요" 안내 및 "테스트 시작하기" 버튼이 표시된다

- **AC-7 [U][P1]: Scenario: 모바일 키보드 동작**
  Given `/compat`의 TextField에 포커스가 있을 때
  Then `inputMode="text"`, `autoCapitalize="characters"`, `maxLength={12}`가 적용되고, 키보드가 올라올 때 입력 필드와 1차 버튼이 가려지지 않도록 포커스 요소가 `scrollIntoView({ block: 'center' })`로 노출된다
  And 키보드 "완료"(Enter) 입력 시 제출이 실행되고 입력 필드가 blur된다

- **AC-8 [S][P1]: Scenario: 비교 기록 목록**
  Given `mp:compat:v1`에 3건이 저장되어 있을 때
  When `/compat`에 진입
  Then 입력 영역 아래에 최신순 `ListRow` 3개(친구 캐릭터명 + 점수)가 표시된다
  And 기록이 0건이면 "아직 비교한 친구가 없어요" 빈 상태 문구가 표시된다

---

### F7. 홈 · 기록 · 탭 내비게이션

- **Description:** `/`(홈)에서 테스트 시작 CTA와 최근 결과 요약을 보여주고, `/history`에서 지난 진단 기록을 최신순으로 나열하며 절약 지수(A1 percent) 추이를 Sparkline으로 시각화한다. 하단 FloatingTabBar로 홈·궁합·기록 3개 탭을 전환한다.
- **Data:** QuizResult, `mp:history:v1`, `mp:flags:v1`
- **API:** 없음
- **Requirements:** 홈 CTA, 최근 결과 카드, 히스토리 목록, 추이 차트, 탭 내비, 배너

- **AC-1 [E][P0]: Scenario: 홈에서 테스트 시작**
  Given `/`에 진입한 상태에서
  When "테스트 시작하기" 버튼 탭
  Then `navigate('/quiz')`가 호출된다
  And 진행 중 데이터(`mp:progress:v1`)가 있으면 버튼 라벨이 "이어서 하기 (4/12)" 형식으로 표시된다

- **AC-2 [U][P0]: Scenario: 홈 레이아웃 계약**
  Given `mp:result:v1`에 `personaCode: 'FPC'`가 있을 때
  When `/`에 진입
  Then `data-testid="home-latest-card"` Card 1개에 이모지·캐릭터명·진단일(YYYY.MM.DD)이 표시되고 "결과 다시 보기" 버튼이 포함된다
  And 1차 액션 "테스트 시작하기"는 `SubmitFooter` 안 `display="block"`으로 렌더링된다

- **AC-3 [S][P1]: Scenario: 홈 빈 상태**
  Given `mp:result:v1`과 `mp:history:v1`이 모두 없을 때
  When `/`에 진입
  Then `Asset.ContentIcon`과 "12개 질문으로 내 소비 캐릭터를 찾아보세요" 문구가 표시되고 최근 결과 Card는 렌더링되지 않는다

- **AC-4 [U][P0]: Scenario: 기록 목록 및 스크롤**
  Given `mp:history:v1`에 20건이 저장된 상태에서
  When `/history`에 진입
  Then `ListRow` 20개가 `createdAt` 내림차순으로 렌더링되고 일반 세로 스크롤로 동작한다(항목 상한 20건이므로 가상 스크롤 미적용)
  And 각 `ListRow`의 높이는 44px 이상이며 탭 시 `navigate('/result', { state: { resultId } })`로 이동한다

- **AC-5 [U][P1]: Scenario: 절약 지수 추이 시각화**
  Given `mp:history:v1`에 3건 이상 저장된 상태에서
  When `/history`에 진입
  Then `data-testid="history-trend"` Card 안에 Sparkline이 각 결과의 A1 percent 값을 시간순으로 렌더링한다
  And 기록이 2건 이하이면 Sparkline 대신 "기록이 3개 이상 쌓이면 추이를 보여드려요" 문구를 표시한다

- **AC-6 [E][P1]: Scenario: 탭 전환**
  Given FloatingTabBar가 표시 중일 때
  When "궁합" 탭 탭
  Then `navigate('/compat')`가 호출되고 해당 탭 아이템이 선택 상태로 표시된다
  And `/quiz`, `/report`, `/share`에서는 FloatingTabBar가 렌더링되지 않는다

- **AC-7 [W][P1]: Scenario: 히스토리 손상 항목 필터링**
  Given `mp:history:v1`에 `personaCode`가 없는 항목 1건과 정상 항목 2건이 있을 때
  When `/history`에 진입
  Then 정상 항목 2건만 렌더링되고 손상 항목은 목록과 저장소 양쪽에서 제거된다
  And 크래시 없이 `console.error` 호출은 0회다

- **AC-8 [U][P1]: Scenario: 홈·기록 배너 광고 배치**
  Given `/` 또는 `/history`가 표시 중일 때
  Then `<AdSlot />`이 콘텐츠 목록 아래·FloatingTabBar 위에 1개만 렌더링되고 탭바나 CTA 버튼과 겹치지 않는다

---

### F8. 토스 검수 컴플라이언스 & 접근성

- **Description:** 검수 반려 사유(외부 이탈, 콘솔 에러, 하드코딩 색상, 외부 로깅, 설치 유도)를 앱 전역에서 차단하고, 다크모드·구형 OS 호환·터치 타깃 규격을 보장한다. 이 기능은 별도 화면이 없으며 전역 가드·린트 규칙·테스트로 구현된다.
- **Data:** AppFlags(`mp:flags:v1`)
- **API:** 없음
- **Requirements:** 전역 가드, 색상 토큰 검사, 콘솔 클린, 호환 API만 사용

- **AC-1 [W][P0]: Scenario: 외부 도메인 이탈 차단**
  Given 앱의 어떤 화면에서든
  When 코드가 `window.open` 또는 `window.location.href`에 외부 URL을 설정하려 하면
  Then 전역 가드가 이동을 차단하고 Toast "외부 페이지로 이동할 수 없어요"를 표시한다
  And 소스 전체 grep 결과 `window.open(` 호출은 0건이다

- **AC-2 [W][P0]: Scenario: 앱 설치 유도 금지**
  Given 프로덕션 번들 전체에서
  Then "앱을 설치", "다운로드", "설치하기", "스토어에서" 문구와 앱스토어/플레이스토어 링크가 0건이다

- **AC-3 [U][P0]: Scenario: 콘솔 에러 0개**
  Given 프로덕션 빌드로 `/`, `/quiz`, `/result`, `/report`, `/share`, `/compat`, `/history`를 순회했을 때
  Then `console.error` 및 `console.warn` 출력이 0건이다
  And 처리되지 않은 Promise rejection이 0건이다

- **AC-4 [W][P0]: Scenario: HEX 색상 하드코딩 금지**
  Given `src/**/*.{ts,tsx,css}` 전체를 검사했을 때
  Then `#RRGGBB` / `#RGB` 형태의 색상 리터럴이 0건이고 모든 색상은 `var(--tds-color-*)` 또는 TDS 컴포넌트 기본값을 사용한다
  And 시스템 다크모드에서 모든 화면의 텍스트/배경 대비비가 4.5:1 이상이다

- **AC-5 [W][P0]: Scenario: 외부 로깅·분석 금지**
  Given `package.json`과 번들 전체에서
  Then Google Analytics, Amplitude, Sentry, Mixpanel 등 외부 분석/로깅 SDK 의존성이 0건이고 앱 도메인 외부로 나가는 네트워크 요청이 0건이다

- **AC-6 [U][P0]: Scenario: 구형 OS 호환**
  Given Android 7 / iOS 16 대응 빌드 타깃일 때
  Then 소스에서 `Array.prototype.at`, `Object.hasOwn`, `String.prototype.replaceAll`, 옵셔널 catch binding 미지원 API 사용이 0건이고 Vite build target은 `es2019` 이하다

- **AC-7 [U][P1]: Scenario: 터치 타깃 규격**
  Given 모든 화면의 버튼·ListRow·Chip·탭 아이템에 대해
  Then 각 요소의 렌더링된 히트 영역이 44×44px 이상이다

- **AC-8 [W][P1]: Scenario: localStorage 사용 불가 환경**
  Given `localStorage` 접근이 `SecurityError`를 던지는 환경일 때
  When 앱을 실행
  Then 인메모리 폴백 저장소로 동작해 퀴즈·결과·궁합이 세션 내에서 정상 작동하고, 홈에 1회 Toast "이번 기록은 앱을 닫으면 사라져요"를 표시한다
  And 앱이 흰 화면으로 크래시하지 않는다

---

## Screen Definitions

공통: 모든 화면은 `ScreenScaffold`로 감싸고 상단은 TDS `Top`, 1차 액션은 `SubmitFooter`를 사용한다. 라우터는 `react-router-dom`.

### S1. 홈 — `/`

- **TDS 컴포넌트:** TDS Top(타이틀 "MoneyPersona"), TDS Card(`home-latest-card`), TDS Paragraph.Text, TDS Button(`display="block"`, SubmitFooter 내부), TDS Chip(캐릭터 코드 배지), TDS Spacing(size=16/24), Asset.ContentIcon(빈 상태), FloatingTabBar(홈 선택), AdSlot(배너)
- **레이아웃 계약:** ScreenScaffold > [Top] > [최근 결과 Card] > Spacing(24) > [AdSlot] > SubmitFooter("테스트 시작하기", block, 48px+). raw div 골격 금지.
- **상태:**
  - Loading: `mp:result:v1` 읽기 전 `data-testid="home-skeleton"` 스켈레톤 Card 1개
  - Empty: Asset.ContentIcon + "12개 질문으로 내 소비 캐릭터를 찾아보세요"
  - Error: 저장소 파싱 실패 시 Empty와 동일 UI + Toast "이전 기록을 불러오지 못했어요"
- **터치:** 시작 버튼 48px, 최근 결과 Card 전체 탭 영역 높이 72px 이상
- **Navigation state contract**
  - Incoming: `location.state = undefined`
  - Outgoing: "테스트 시작하기" → `navigate('/quiz')` (state 없음) / "결과 다시 보기" → `navigate('/result', { state: { resultId: string } })` / 탭 → `navigate('/compat')`, `navigate('/history')`

### S2. 퀴즈 — `/quiz`

- **TDS 컴포넌트:** TDS Top(뒤로 버튼 + "n / 12"), TDS Paragraph.Text(문항 텍스트, t3), TDS Button 2개(선택지, `display="block"`, 각 56px), TDS Spacing(size=12), 진행률 바(커스텀 flex 레이아웃 + `var(--tds-color-*)`)
- **레이아웃 계약:** ScreenScaffold > Top > 진행률 바 > 문항 텍스트 > 선택지 Button 2개(세로 스택, block). 하단 광고·탭바 미노출.
- **상태:**
  - Loading: `data-testid="quiz-skeleton"`(문항 1줄 + 버튼 2개 형태)
  - Empty: 해당 없음(문항은 정적 상수)
  - Error: progress 손상 시 1번 문항부터 시작 + Toast "이전 진행 기록이 없어 처음부터 시작해요"
- **터치:** 선택지 버튼 높이 56px, 뒤로 버튼 44×44px. 전환 중(200ms) 중복 탭 무시.
- **Navigation state contract**
  - Incoming: `location.state = undefined`
  - Outgoing: 12번 응답 완료 → `navigate('/result', { state: { resultId: string }, replace: true })` / 1번에서 뒤로 → `navigate('/')`

### S3. 결과 — `/result`

- **TDS 컴포넌트:** TDS Top("내 소비 캐릭터"), TDS Card ×3(`persona-card`, `axis-metrics`, `tips-card`), TDS Chip(축 라벨·캐릭터 코드), TDS ListRow ×3(절약 팁), TDS Paragraph.Text(고지 문구), TDS Button ×2(SubmitFooter: 상세 리포트 / 보조: 결과 공유, 둘 다 block), MiniBar ×3, AdSlot, Asset.ContentIcon(빈 상태), FloatingTabBar 미노출
- **레이아웃 계약:** ScreenScaffold > Top > persona-card(이모지 + 이름 t2 + tagline) > Spacing(16) > axis-metrics(MiniBar 3, `axis-bar-A1|A2|A3`) > Spacing(16) > tips-card(ListRow 3) > Spacing(24) > AdSlot > 고지 Paragraph.Text > SubmitFooter
- **상태:**
  - Loading: `data-testid="result-skeleton"` Card 3개 플레이스홀더
  - Empty: Asset.ContentIcon + "아직 진단 결과가 없어요" + "테스트 시작하기"
  - Error: personaCode 미정의 시 Empty UI + `mp:result:v1` 삭제
- **터치:** 두 CTA 각 48px, ListRow 56px
- **Navigation state contract**
  - Incoming: `location.state = { resultId: string } | undefined` (undefined면 `loadResult()` 폴백)
  - Outgoing: 상세 리포트 → `navigate('/report', { state: { resultId: string } })` / 공유 → `navigate('/share', { state: { resultId: string } })` / 빈 상태 CTA → `navigate('/quiz')`

### S4. 상세 리포트 — `/report`

- **TDS 컴포넌트:** TDS Top("상세 분석 리포트"), TossRewardAd(게이트), TDS Card ×3(`report-card`), SummaryHero(CountUp 대표 지표), TDS ListRow(위험 신호 2, 30일 플랜 3), TDS Chip(단계 배지 1·2·3), TDS Button(광고 보고 열기 / 다시 시도, block), Asset.ContentIcon
- **레이아웃 계약:** ScreenScaffold > Top > (잠금 시) 잠금 미리보기 Card + SubmitFooter("광고 보고 리포트 열기") / (해제 시) SummaryHero > report-card ×3. TossRewardAd가 리포트 콘텐츠를 감싼다.
- **상태:**
  - Loading: `data-testid="report-loading"` + 버튼 disabled
  - Empty: 결과 없음 → Asset.ContentIcon + "먼저 테스트를 완료해주세요"
  - Error: 광고 로드 실패 → Toast + "다시 시도" 버튼 / 중도 이탈 → Toast "광고를 끝까지 봐야 리포트가 열려요"
- **터치:** 광고 버튼 48px, 리스트 행 56px
- **Navigation state contract**
  - Incoming: `location.state = { resultId: string } | undefined`
  - Outgoing: 빈 상태 CTA → `navigate('/quiz')` / 하단 "결과 공유하기" → `navigate('/share', { state: { resultId: string } })` / 뒤로 → `navigate(-1)`

### S5. 공유 — `/share`

- **TDS 컴포넌트:** TDS Top("결과 공유"), TDS Card(`share-preview`), TDS Chip(공유 코드), TDS Paragraph.Text, TDS Button(SubmitFooter "공유하기", block), TDS Toast, Asset.ContentIcon
- **레이아웃 계약:** ScreenScaffold > Top > share-preview Card(1:1 비율 미리보기) > Spacing(16) > 공유 코드 Chip + "코드 복사" 텍스트 버튼 > SubmitFooter("공유하기")
- **상태:**
  - Loading: 버튼 라벨 "이미지 만드는 중" + disabled + `data-testid="share-loading"`
  - Empty: 결과 없음 → Asset.ContentIcon + "공유할 결과가 없어요" + "테스트 시작하기"
  - Error: 이미지 생성 실패 → 텍스트 공유 폴백 + Toast / 공유 취소(AbortError) → 무음 처리
- **터치:** 공유 버튼 48px, 코드 복사 버튼 44px
- **Navigation state contract**
  - Incoming: `location.state = { resultId: string } | undefined`
  - Outgoing: 빈 상태 CTA → `navigate('/quiz')` / 뒤로 → `navigate(-1)`

### S6. 궁합 비교 — `/compat`

- **TDS 컴포넌트:** TDS Top("친구와 궁합"), TDS TextField(공유 코드 입력, 에러 메시지 슬롯), TDS Button(SubmitFooter "궁합 보기", block), TDS Card(`compat-score-card`), SummaryHero(CountUp 점수), TDS Chip(등급 배지), TDS ListRow ×3(`compat-axis-list`), TDS ListRow(비교 기록 목록), Asset.ContentIcon, AdSlot, FloatingTabBar(궁합 선택)
- **레이아웃 계약:** ScreenScaffold > Top > TextField > (결과 있으면) compat-score-card(SummaryHero + Chip) > compat-axis-list > Spacing(24) > 비교 기록 ListRow 목록 > AdSlot > SubmitFooter("궁합 보기")
- **상태:**
  - Loading: 계산 중 버튼 disabled + `data-testid="compat-loading"`
  - Empty: 내 결과 없음 → 입력 disabled + Asset.ContentIcon + "먼저 내 캐릭터를 진단해주세요" / 기록 0건 → "아직 비교한 친구가 없어요"
  - Error: 형식 오류 "코드 형식이 올바르지 않아요 (예: MP1-FPC-2)" / 체크섬 오류 "코드가 잘못됐어요. 친구에게 다시 받아보세요"
- **모바일 키보드:** `inputMode="text"`, `autoCapitalize="characters"`, `maxLength={12}`, 포커스 시 `scrollIntoView({ block:'center' })`, Enter(완료) 제출 후 blur, 키보드 노출 중 SubmitFooter가 입력창을 가리지 않도록 하단 여백 보정
- **스크롤:** 비교 기록은 최대 20건 → 일반 세로 스크롤(가상 스크롤 미적용)
- **터치:** TextField 높이 48px, 제출 버튼 48px, 기록 ListRow 56px
- **Navigation state contract**
  - Incoming: `location.state = { prefillCode?: string } | undefined`
  - Outgoing: 빈 상태 CTA → `navigate('/quiz')` / 기록 항목 탭 → 동일 화면 내 BottomSheet 상세(내비게이션 없음)

### S7. 기록 — `/history`

- **TDS 컴포넌트:** TDS Top("내 진단 기록"), TDS Card(`history-trend` + Sparkline), TDS ListRow(기록 항목), TDS Chip(캐릭터 코드), Asset.ContentIcon, AdSlot, FloatingTabBar(기록 선택)
- **레이아웃 계약:** ScreenScaffold > Top > history-trend Card(Sparkline: A1 percent 시간순) > Spacing(16) > ListRow 목록(최신순) > AdSlot(목록 하단, 탭바 위)
- **상태:**
  - Loading: `data-testid="history-skeleton"` ListRow 3개 플레이스홀더
  - Empty: Asset.ContentIcon + "아직 기록이 없어요" + "테스트 시작하기" 버튼(block)
  - Error: 손상 항목은 필터링 후 정상 항목만 표시(F7 AC-7)
- **스크롤:** 최대 20건 → 일반 세로 스크롤
- **터치:** ListRow 높이 56px 이상
- **Navigation state contract**
  - Incoming: `location.state = undefined`
  - Outgoing: 항목 탭 → `navigate('/result', { state: { resultId: string } })` / 빈 상태 CTA → `navigate('/quiz')`

---

## Data Storage

전부 localStorage. 모든 값은 `{ v: 1, data: T }` JSON 래퍼.

| 키 | 타입 | 형태 | 상한 | 예상 크기 |
|---|---|---|---|---|
| `mp:result:v1` | `{v:1,data:QuizResult}` | 최신 결과 1건 | 1 | ~0.4KB |
| `mp:history:v1` | `{v:1,data:QuizResult[]}` | `createdAt` 오름차순 배열 | 20건(FIFO 삭제) | ~8KB |
| `mp:progress:v1` | `{v:1,data:QuizProgress}` | 진행 중 답변 | 1 | ~0.2KB |
| `mp:compat:v1` | `{v:1,data:CompatibilityRecord[]}` | 최신 20건 | 20건(FIFO 삭제) | ~4KB |
| `mp:flags:v1` | `{v:1,data:AppFlags}` | 온보딩/고지 플래그 | 1 | ~0.1KB |

- **총 상한 ≈ 13KB** (5MB의 0.3% 미만).
- 읽기 실패(JSON 파싱 오류, 스키마 불일치, `v !== 1`) 시 해당 키 삭제 후 기본값 반환, 예외 전파 금지.
- 쓰기 실패(`QuotaExceededError`) 시 `mp:history:v1`·`mp:compat:v1`을 최신 5건으로 축소 후 1회 재시도.
- `localStorage` 자체가 사용 불가하면 인메모리 Map 폴백(F8 AC-8).

---

## API Contract

**외부 API 없음.** MoneyPersona MVP는 서버 통신을 수행하지 않는다.

- 문항·캐릭터·팁·리포트 카피는 번들 내 정적 상수(`src/data/*.ts`).
- 진단·궁합 계산은 클라이언트 순수 함수.
- 친구 궁합은 공유 코드 문자열 파싱으로만 처리(서버 조회 없음).
- 사용하는 플랫폼/브라우저 API: `@apps-in-toss/web-framework`의 `getIsTossLoginIntegratedService()`(선택), 템플릿 `AdSlot`/`TossRewardAd`, `navigator.share`, `navigator.clipboard`, `HTMLCanvasElement.toBlob`.
- 따라서 CORS 설정 대상이 없으며, 네트워크 에러 처리 대상도 광고 SDK 로드 실패(F4 AC-4)로 한정된다.
- 향후 외부 API를 추가할 경우 에러 응답은 `{ error: string }` 단일 형태로 통일한다(현재 미사용).

---

## Assumptions

1. **A1.** PRD의 "8가지 캐릭터"는 3개 이진 축(2³)의 조합으로 구현한다. "알뜰형 다람쥐"는 PRD에 명시된 예시이므로 `FPC`에 고정 배정했다.
2. **A2.** 12문항은 축당 4문항으로 균등 배분하고, 각 문항은 2지선다다(Likert 척도 아님).
3. **A3.** 상세 분석 리포트 및 절약 팁은 사전 작성된 정적 카피이며 생성형 AI를 호출하지 않는다(CP-6). 따라서 AI 고지·라벨 의무 비해당.
4. **A4.** "친구 결과와 궁합 비교"는 서버 없이 공유 코드 문자열 교환으로 구현한다. 실시간 친구 목록·서버 매칭은 MVP 범위 밖.
5. **A5.** 공유는 시스템 공유 시트(`navigator.share`)를 사용하며, 카카오톡 SDK 등 외부 SDK는 검수 정책상 사용하지 않는다. "SNS/카톡 공유"는 시스템 공유 시트를 통한 앱 선택으로 충족한다.
6. **A6.** 결과 이미지는 클라이언트 Canvas로 1080×1080 PNG를 생성한다(외부 이미지 서버 없음).
7. **A7.** 리워드 광고 게이팅 대상은 "상세 분석 리포트"이며, 기본 결과 카드(캐릭터 + 절약 팁 3개)는 광고 없이 공개한다 — 공유 바이럴 루프를 막지 않기 위함.
8. **A8.** 히스토리·궁합 기록 상한 20건은 5MB 제한과 UX(스크롤 길이)를 고려한 값이다.
9. **A9.** 사용자 식별자를 저장하지 않으므로 기기 변경 시 기록은 이전되지 않는다.
10. **A10.** 광고 ID(`VITE_TOSS_AD_GROUP_ID`, `VITE_TOSS_AD_SLOT_ID`)는 앱인토스 콘솔에서 발급되어 env로 주입된다.

---

## Open Questions

1. **OQ-1.** 8캐릭터의 이름·이모지·카피(`summary`, `tips`, `cautions`, `plan30d`)를 이 스펙의 초안 그대로 확정할지, 브랜드 카피라이터 검수를 거칠지? (현재는 초안을 확정 값으로 두고 구현 진행 가능)
2. **OQ-2.** 궁합 점수 가중치(A1=25, A2=15, A3=10, 최저 50점)를 이대로 확정할지? 최저 점수를 더 낮춰 편차를 키울지 여부.
3. **OQ-3.** 공유 코드에 진단 축 점수(percent)까지 담아 궁합 정밀도를 높일지, 현재처럼 캐릭터 코드만 담아 코드 길이를 짧게 유지할지?
4. **OQ-4.** 바이럴 유입 촉진을 위해 `grantPromotionReward`(1인당 최대 5,000원) 캠페인을 운영할지? 운영 시 promotionCode 발급과 amount ≤ 5,000 검증 AC를 F8에 추가해야 함.
5. **OQ-5.** 배너 광고를 `/result`·`/`·`/history` 3개 화면에 두는 현재 배치로 목표 MRR $250을 충족하는지, 아니면 `/compat` 결과 하단에도 추가할지?
6. **OQ-6.** 리워드 광고 해제 상태를 결과별(`resultId` 단위)로 유지하는 현재 정책 대신, 하루 1회 재시청 요구로 변경해 광고 노출을 늘릴지?
7. **OQ-7.** 재진단 시 기존 결과를 덮어쓰는 대신, 기록에서 "대표 캐릭터"를 사용자가 고를 수 있게 할 필요가 있는지?