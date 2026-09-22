// src/components/Pagination.jsx
// 목록 아래 쪽번호. 한 번에 5쪽씩 보여 주고 화살표로 앞뒤 쪽을 오간다.

import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

const WINDOW = 5; // 한 번에 보여줄 쪽번호 개수

/**
 * @param {number} page       현재 쪽 (1부터)
 * @param {number} totalPages 전체 쪽 수
 * @param {function} onChange 쪽을 바꿀 때 호출 (새 쪽번호)
 */
export default function Pagination({ page, totalPages, onChange }) {
  const start = Math.floor((page - 1) / WINDOW) * WINDOW + 1;
  const end = Math.min(start + WINDOW - 1, totalPages);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className="pagination" aria-label="쪽 이동">
      <button className="page-arrow" disabled={page <= 1}
        onClick={() => onChange(page - 1)} aria-label="이전 쪽">
        <ChevronLeftIcon />
      </button>
      {pages.map((p) => (
        <button key={p} className={"page-btn" + (p === page ? " current" : "")}
          onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined}>
          {p}
        </button>
      ))}
      <button className="page-arrow" disabled={page >= totalPages}
        onClick={() => onChange(page + 1)} aria-label="다음 쪽">
        <ChevronRightIcon />
      </button>
    </nav>
  );
}
