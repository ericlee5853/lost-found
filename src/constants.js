// src/constants.js
// 설정 화면에서 바꾸지 않는 고정 값.
// 값에 따라 화면 동작이 달라지므로 설정이 아니라 코드에 둔다.

/** 습득자·신고자 구분 */
export const FINDER_TYPES = ["학생", "교직원", "외부인", "기타"];

/** 분실자 연락 여부 */
export const CONTACTED_OPTIONS = ["X", "O"];

/** 글자 목록을 선택 상자용 {value, label} 로 바꾼다. */
export const toOptions = (values) => values.map((v) => ({ value: v, label: v }));
