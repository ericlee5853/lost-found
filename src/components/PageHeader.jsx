// src/components/PageHeader.jsx
// 화면 맨 위의 큰 제목. 버튼을 넘기면 오른쪽 위에 놓는다.

/**
 * @param {string} title 화면 제목
 * @param {React.ReactNode} [children] 오른쪽 위 버튼들
 */
export default function PageHeader({ title, children }) {
  return (
    <header className="page-header">
      <h1 className="page-title">{title}</h1>
      {children && <div className="header-buttons">{children}</div>}
    </header>
  );
}
