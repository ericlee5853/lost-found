// src/components/StatusBox.jsx
// 불러오는 중 / 오류 안내 화면.

/** 자료를 받아오는 동안 보여 준다. */
export function LoadingBox({ message = "불러오는 중입니다..." }) {
  return <div className="status-box">{message}</div>;
}

/**
 * 오류 안내.
 * @param {string} message 오류 문구
 * @param {function} [onRetry] 다시 시도 버튼을 넣는다
 * @param {React.ReactNode} [children] 함께 놓을 버튼 (예: 목록으로)
 */
export function ErrorBox({ message, onRetry, children }) {
  return (
    <div className="status-box">
      <p className="form-error">{message}</p>
      <div className="status-actions">
        {onRetry && <button className="btn" onClick={onRetry}>다시 시도</button>}
        {children}
      </div>
    </div>
  );
}
