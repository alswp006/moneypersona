# Shared Context (auto-generated — do NOT modify)


## 패킷 간 계약 (src/lib/contract.ts — 자동 생성, 수정 금지)
여기 선언된 이름·인자·반환 타입은 확정이다. 기반 패킷은 이대로 구현하고,
화면 패킷은 이대로 호출하라. 다르게 만들지 마라.

```typescript
/**
 * 패킷 간 인터페이스 계약 — 자동 생성. **수정하지 마라.**
 *
 * 기반 패킷은 여기 선언된 모양 그대로 구현하고, 화면 패킷은 여기 적힌 이름·인자·반환
 * 타입을 그대로 가정해도 된다. 추측이 어긋나 병합에서 무너지는 것을 막기 위한 파일이다.
 */

/** 워크패킷 구조 — heal-1-01의 generateWorkPackets가 생성, heal-1-02에서 재생성 (구현: 패킷 heal-1-02) */
export type WorkPacket = { id: string; stageIndex: number; input: unknown; metadata?: Record<string, unknown> };

/** 파이프라인 스테이지 정의 — runPipeline이 사용, stageSchema가 검증 (구현: 패킷 heal-1-01) */
export type PipelineStage = { name: string; validate?: (input: unknown) => boolean; transform?: (input: unknown) => unknown };

/** 스테이지 스키마 검증 — 크래시 방어 위해 heal-1-02가 워크패킷 재생성 시 호출 (구현: 패킷 heal-1-01) */
export type validateStageSchemaFn = (stage: PipelineStage, input: unknown) => { valid: boolean; error?: string };

/** 안전한 배열 변환 — runPipeline과 generateWorkPackets에서 공유 사용 (구현: 패킷 heal-1-01) */
export type toArrayFn = (input: unknown) => unknown[];

/** 질문 상수 — heal-1-02의 generateWorkPackets가 재생성 시 참조, heal-1-03이 무결성 테스트 (구현: 패킷 heal-1-02) */
export type QUESTIONS = { id: string; text: string; type: string }[];

/** 캐릭터 상수 — heal-1-02의 generateWorkPackets가 참조, heal-1-03이 무결성 테스트 (구현: 패킷 heal-1-02) */
export type CHARACTERS = { id: string; name: string; traits: string[] }[];

/** 점수 계산 — routes/index.tsx가 호출, heal-1-03에서 테스트 (구현: 패킷 heal-1-03) */
export type calculateScoreFn = (responses: Record<string, unknown>, character: { id: string; traits: string[] }) => number;

/** 파이프라인 실행 결과 — runPipeline이 반환, heal-1-02의 routes/index.tsx가 소비 (구현: 패킷 heal-1-01) */
export type PipelineResult = { packets: WorkPacket[]; errors: Array<{ packetId: string; message: string }> };

```

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  constants/
    __tests__/
    characters.ts
    questions.ts
  domain/
    __tests__/
    scoring.ts
  lib/
    contract.ts
  pipeline/
    __tests__/
    quality/
    runPipeline.ts
    stages/
    utils/
    validation/
  routes/
    index.tsx

### Exports (src/lib/)
- contract.ts: export type WorkPacket =; export type PipelineStage =; export type validateStageSchemaFn = (stage: PipelineStage, input: unknown) =>; export type toArrayFn = (input: unknown) => unknown[]; export type QUESTIONS =; export type CHARACTERS =; export type calculateScoreFn = (responses: Record<string, unknown>, character:; export type PipelineResult =
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Available exports from existing files
// src/constants/characters.ts
export interface Character {
export const CHARACTERS: Character[] = [

// src/constants/questions.ts
export interface Question {
export const QUESTIONS: Question[] = [

// src/domain/scoring.ts
export type Responses = Record<string, unknown>;
export interface ValidationResult {
export function validateResponses(responses: Responses): ValidationResult {
export function calculateAxisScores(responses: Responses): Record<Axis, number> {
export function calculateAxisPercents(responses: Responses): Record<Axis, number> {
export function determineCharacter(responses: Responses): string {
export function calculateScore(

// src/lib/contract.ts
export type WorkPacket = { id: string; stageIndex: number; input: unknown; metadata?: Record<string, unknown> };
export type PipelineStage = { name: string; validate?: (input: unknown) => boolean; transform?: (input: unknown) => unknown };
export type validateStageSchemaFn = (stage: PipelineStage, input: unknown) => { valid: boolean; error?: string };
export type toArrayFn = (input: unknown) => unknown[];
export type QUESTIONS = { id: string; text: string; type: string }[];
export type CHARACTERS = { id: string; name: string; traits: string[] }[];
export type calculateScoreFn = (responses: Record<string, unknown>, character: { id: string; traits: string[] }) => number;
export type PipelineResult = { packets: WorkPacket[]; errors: Array<{ packetId: string; message: string }> };

// src/pipeline/quality/parseTscOutput.ts
export interface TypeCheckError {
export function parseTscOutput(output: string): TypeCheckError[] {

// src/pipeline/quality/qualityGate.ts
export interface QualityGateResult {
export function assessTypecheckResult(result: TypeCheckResult): QualityGateResult {
export function runQualityGate(options: RunTypecheckOptions = {}): QualityGateResult {
export function isPacketBlocking(gate: QualityGateResult): boolean {

// src/pipeline/quality/typecheck.ts
export interface TypeCheckResult {
exp

## Memory Index (자동 학습 — 힌트로만 사용, 실제 코드 확인 필수)

Available topics: deploy(1), general(7), testing(2), ui(4)

Key lessons (verify against actual code before applying):
- [deploy] 빌드 불안정 — 의존성 버전 고정, 빌드 전 typecheck 필수 (60% · 타 앱 1회 — 맹신 금지)
- [general] 영속 저장소에서 읽은 값은 항상 스키마 기본값으로 정규화해 배열·객체 타입을 보장한 뒤 반환하고, 화면은 빈/손상/부분 데이터에서도 렌더되도록 방어하라. (60% · 타 앱 1회 — 맹신 금지)
- [testing] 여러 화면이 공유하는 상태 훅·데이터 계층은 반환 시그니처와 실패 사유 코드를 먼저 테스트로 고정하고 통과시킨 뒤에야 의존 화면 작업을 시작하고, 화면은 예외 대신 결과 객체로 분기하게 하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 정책·기능 제거형 리팩터링은 화면과 도메인 로직 레이어에서만 수행하고, package.json의 플랫폼 필수 의존성(디자인 시스템·플랫폼 SDK·프레임워크 코어)은 어떤 경우에도 삭제하지 말 것 — 필수 패키지 화이트리스트를 빌드 전 가드로 검증하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 공용 기반 모듈(상수·저장소·계산 유틸)이 실제로 머지되기 전에는 이를 import하는 화면·훅 패킷을 머지하지 말고, 모든 머지 게이트에 타입체크와 프로덕션 빌드 통과(미해결 import 0건)를 필수로 걸어라. (60% · 타 앱 1회 — 맹신 금지)