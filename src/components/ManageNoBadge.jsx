// src/components/ManageNoBadge.jsx
// 제목 아래에 관리번호를 보여 준다. 오른쪽에 처리상태 같은 표시를 덧붙일 수 있다.

export default function ManageNoBadge({ manageNo, children }) {
  return (
    <div className="manage-no-row">
      <div className="manage-no">
        <span className="manage-no-label">관리번호</span>
        <span className="manage-no-value">{manageNo}</span>
      </div>
      {children}
    </div>
  );
}
