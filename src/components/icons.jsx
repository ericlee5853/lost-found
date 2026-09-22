// src/components/icons.jsx
// 화면에 쓰는 선 아이콘들. 색은 글자색(currentColor)을 따른다.

const base = {
  fill: "none", stroke: "currentColor", strokeWidth: 2,
  strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true,
};

/** 돋보기 (검색) */
export function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...base}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.8-3.8" />
    </svg>
  );
}

/** 더하기 (등록) */
export function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...base}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** 조절 막대 (필터) */
export function FilterIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...base} strokeWidth={1.8}>
      <path d="M3 7h18M3 12h18M3 17h18" />
      <path d="M15 5v4M8 10v4M13 15v4" />
    </svg>
  );
}

/** 왼쪽 꺾쇠 (이전 쪽) */
export function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...base} strokeWidth={1.6}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

/** 오른쪽 꺾쇠 (다음 쪽) */
export function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...base} strokeWidth={1.6}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}
