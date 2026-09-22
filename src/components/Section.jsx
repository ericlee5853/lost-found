// src/components/Section.jsx
// 상세·접수·수정 화면의 흰 카드 한 장 (예: 물품 정보, 습득 정보).
// 안쪽 입력칸은 cols 개의 열로 늘어선다.

/**
 * @param {string} title 카드 제목
 * @param {2|3} [cols]   한 줄에 놓을 입력칸 수
 */
export default function Section({ title, cols = 3, children }) {
  return (
    <section className="card">
      <h2 className="card-title">{title}</h2>
      <div className={`field-grid cols-${cols}`}>{children}</div>
    </section>
  );
}
