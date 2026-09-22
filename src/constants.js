// src/constants.js
// 설정 페이지에서 바꿀 수 없는 고정 목록.
// 물품구분·처리결과는 사용자가 변경할 수 있으므로 settings.js 의 설정 테이블에 있다.

/** 확인자 선택 목록 */
export const STAFF_NAMES = [
  "김유은", "김회윤", "조가빈", "이은표", "신동야", "김인성",
];

/** 분실신고 처리 상태 */
export const PROCESS_STATUSES = ["미처리", "처리완료"];

/** 소유자 연락여부 */
export const CONTACTED_OPTIONS = ["X", "O"];

/** 분실물 접수 시 보관장소 기본값 */
export const DEFAULT_STORAGE_PLACE = "학생처 보관함";

/** 문자열 목록을 선택 상자용 {value, label} 목록으로 바꾼다. */
export const toOptions = (values) => values.map((v) => ({ value: v, label: v }));
