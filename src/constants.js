// src/constants.js
// 서버 설정으로 바꾸지 않는 고정 값.
// 물품 구분·처리결과·분실신고 처리상태·확인자는 서버(설정 API, 사용자 API)에서 받아온다.

/** 소유자 연락여부. 서버가 "O" 또는 "X" 만 받는다. */
export const CONTACTED_OPTIONS = ["X", "O"];

/** 분실물 접수 시 보관장소 기본값 */
export const DEFAULT_STORAGE_PLACE = "학생처 보관함";

/** 기간 만료 시 조치 방법 기본 선택지 (설정 화면에서 고른다) */
export const EXPIRE_ACTIONS = ["관할서인계", "폐기", "계속보관"];

/** 문자열 목록을 선택 상자용 {value, label} 목록으로 바꾼다. */
export const toOptions = (values) => values.map((v) => ({ value: v, label: v }));
