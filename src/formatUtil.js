// src/formatUtil.js
// 입력값 형식 맞추기

// 전화번호 하이픈 자동 삽입: 01012345678 → 010-1234-5678
export function formatPhone(value) {
  const n = value.replace(/[^0-9]/g, "").slice(0, 11); // 숫자만, 최대 11자리
  if (n.length < 4) return n;
  if (n.length < 8) return `${n.slice(0, 3)}-${n.slice(3)}`;
  // 010 등 3자리 국번: 3-4-4
  if (n.length <= 10) return `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6)}`;
  return `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`;
}