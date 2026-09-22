// src/components/ActionBar.jsx
// 상세·접수·수정 화면 맨 아래 오른쪽의 버튼 줄. 입력 오류가 있으면 왼쪽에 알려 준다.

/**
 * @param {string} [message] 버튼 왼쪽에 보여줄 오류 문구
 */
export default function ActionBar({ message, children }) {
  return (
    <div className="action-bar">
      {message && <p className="form-error">{message}</p>}
      {children}
    </div>
  );
}
