// src/dateUtil.js
// 날짜 문자열("YYYY-MM-DD") 관련 공통 함수.

/** Date 객체 → "YYYY-MM-DD" (로컬 시간 기준, UTC 변환으로 인한 하루 밀림 방지) */
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
 * 보관기한 미리보기: 습득일 + 물품구분의 보관개월.
 * 실제 저장값은 서버가 같은 규칙(습득일 기준)으로 계산해 내려 주며,
 * 여기서는 등록·수정 화면에 미리 보여 주기만 한다.
 * @param {string} foundDate "YYYY-MM-DD" 습득일
 * @param {number} months    보관개월. 0 이하면 기한 없음
 */
export function previewDeadline(foundDate, months) {
  if (!foundDate || !Number.isFinite(months) || months <= 0) return "";
  const [y, m, d] = foundDate.split("-").map(Number);
  if (!y || !m || !d) return "";
  // 더한 달에 그 날짜가 없으면 그 달 마지막 날로 맞춘다(서버와 같은 규칙).
  // 예: 2026-01-31 + 1개월 → 2026-02-28
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, lastDay));
  return toDateString(target);
}

/**
 * 오늘부터 그 날짜까지 남은 날수. 지났으면 음수.
 * @returns {number|null} 날짜가 없으면 null
 */
export function daysLeft(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - start) / 86400000);
}

/** 기간 만료 시 조치 방법의 기본 선택지 (설정 화면에서 고른다) */
export const EXPIRE_ACTIONS = ["관할서인계", "폐기", "계속보관"];
