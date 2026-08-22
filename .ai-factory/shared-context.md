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