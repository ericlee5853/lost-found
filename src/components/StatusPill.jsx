// src/components/StatusPill.jsx
// 처리상태를 알약 모양으로 보여 준다.
// 보관중처럼 아직 진행 중인 상태는 초록색, 반환이 끝난 상태는 체크 표시와 회색이다.

/** 상태 이름에 따라 색을 고른다. */
function toneOf(name = "") {
  if (name.includes("반환")) return "done";                       // 본인반환 · 반환완료
  if (name.includes("보관") || name.includes("미처리")) return "live";  // 보관중 · 미처리
  return "off";                                                   // 폐기 · 인계 · 취소 등
}

export default function StatusPill({ name }) {
  if (!name) return <span className="muted-dash">-</span>;
  const tone = toneOf(name);
  return (
    <span className={`status-pill ${tone}`}>
      {tone === "done" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <span className="status-dot" aria-hidden="true" />
      )}
      {name}
    </span>
  );
}
