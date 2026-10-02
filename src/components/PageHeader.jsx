// src/components/PageHeader.jsx
// 화면 맨 위의 큰 제목. 옆에 짧은 설명, 오른쪽에 버튼을 둘 수 있다.

/**
 * @param {string} title 화면 제목
 * @param {string} [sub] 제목 옆 설명
 * @param {React.ReactNode} [children] 오른쪽 위 버튼들
 */
export default function PageHeader({ title, sub, children }) {
  return (
    <header className="page-header">
      <h1 className="page-title">
        {title}{sub && <span className="page-sub">{sub}</span>}
      </h1>
      {children && <div className="header-buttons">{children}</div>}
    </header>
  );
}
