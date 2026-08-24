# Sprint Contract: Compliance Gate + Disclaimer + Static Checks

## 개요
검수 반려 방지 마지막 폴리시 패킷. 오해 방지 고지(DisclaimerNotice), 최초 1회 안내(useDisclaimerGate), 정적 검사 테스트로 금지 SDK/HEX/설치 유도/console을 자동 감지.

## 만들 항목
| 파일 | 변경 내용 |
|------|---------|
| `src/components/DisclaimerNotice.tsx` | TDS Paragraph.Text 래퍼 — 앱이 AI 활용 시 "생성형 AI 활용" 고지 표시, 타겟 페이지(Result, Compat)에서 카드 하단 embedded 고지 |
| `src/hooks/useDisclaimerGate.ts` | localStorage 기반 최초 1회 AlertDialog 표시 — 조건: `AI_DISCLAIMER_SHOWN` 플래그, getItem 후 미표시 시 show + setItem |
| `src/lib/__tests__/compliance.test.ts` | 정적 검사 테스트(grepping) — 금지 SDK 임포트(useTossLogin, TossRewardAd), #[0-9A-F]{6} HEX 색상, "설치하기/앱 설치", console.error 문자열 감지 |
| `.env.example` | VITE_SHOW_DISCLAIMER (boolean, default=true) 예제 |

## 사용 타입
- 타입 신규 정의 불필요 (기존 types.ts 충분) — QuizResult, PersonaCode 참조 가능하나 DisclaimerNotice는 무상태 UI

## 검증 방법
1. **DisclaimerNotice**: 타겟 페이지(Result, Compat)에서 카드 하단에 "이 서비스는 생성형 AI를 활용합니다" Paragraph.Text(st13) 렌더 확인
2. **useDisclaimerGate**: `npm run test:visual` 첫 접속 시 AlertDialog 한 번만 표시, 새로고침 후 미표시 확인 (localStorage mock)
3. **compliance.test.ts**: `npx vitest run src/lib/__tests__/compliance.test.ts` — 5개 케이스(금지 import, HEX, console, 설치유도) 전부 통과
4. **App.tsx 미변경**: git diff에 App.tsx 없음 확인

## 절대 금지
- ❌ App.tsx 수정 (라우팅·Provider 기존 대로)
- ❌ types.ts 수정 (타입 신규 정의 → 기존만 조합)
- ❌ localStorage 직접 선언 (Storage SDK 또는 browser localStorage 래퍼 사용)
- ❌ DisclaimerNotice에 display="block" Button 포함 (고지만, CTA 아님)
- ❌ HEX 색상/console.error를 compliance.test.ts에서 검출 후 "주석 처리" (실제 제거)

## 마지막 체크 (완료 조건)
- `npx tsc --noEmit` 통과
- `npx vitest run` 통과
- `npm run test:visual` 패스 + 스크린샷 Review (DisclaimerNotice 고지 텍스트 보임)
- 금지 API/HEX/console 0개 (compliance.test.ts)
