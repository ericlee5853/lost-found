// src/components/ManageNoBadge.jsx
// 제목 아래 연한 파란 상자에 관리번호를 보여 준다.

export default function ManageNoBadge({ manageNo }) {
  return (
    <div className="manage-no">
      <span className="manage-no-label">관리번호</span>
      <span className="manage-no-value">{manageNo}</span>
    </div>
  );
}
