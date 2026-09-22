// src/dateUtil.js
// 날짜 문자열("YYYY-MM-DD") 관련 공통 함수.
// 여러 페이지에 흩어져 있던 today() 중복 정의를 이 파일 하나로 모았다.

/** Date 객체 → "YYYY-MM-DD" 문자열 (로컬 시간 기준, UTC 변환으로 인한 하루 밀림 방지) */
function toDateString(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/** 오늘 날짜를 "YYYY-MM-DD" 로 반환 */
export function today() {
  return toDateString(new Date());
}

/**
 * 날짜 문자열에 개월 수를 더한다. ("2025-01-31" + 1개월 → 2025-03-03 처럼
 * 월말 넘김은 JS Date 가 자동으로 정규화한다.)
 * @param {string} dateStr "YYYY-MM-DD"
 * @param {number} months  더할 개월 수
 * @returns {string} 계산된 날짜, 입력이 비었으면 빈 문자열
 */
export function addMonths(dateStr, months) {
  if (!dateStr || !Number.isFinite(months)) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "";
  return toDateString(new Date(y, m - 1 + months, d));
}
