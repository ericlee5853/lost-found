// src/components/ListToolbar.jsx
// 두 대장 목록이 함께 쓰는 검색 · 등록 · 필터 줄과 건수 표시.

import { SearchIcon, PlusIcon, FilterIcon } from "./icons";

/** 필터 패널의 체크박스 묶음 하나 */
export function CheckGroup({ title, options, selected, onToggle }) {
  return (
    <div className="filter-group">
      <div className="filter-group-title">{title}</div>
      {options.map((opt) => (
        <label key={opt.value} className="filter-check">
          <input type="checkbox" checked={selected.includes(opt.value)}
            onChange={() => onToggle(opt.value)} />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

/**
 * @param {string} addLabel  등록 버튼 글자. 없으면 버튼을 넣지 않는다
 * @param {number} activeCount 켜져 있는 필터 수
 * @param {React.ReactNode} filterPanel 필터 버튼을 눌렀을 때 펼칠 내용
 */
export default function ListToolbar({
  keyword, onKeyword, addLabel, onAdd, activeCount, filterOpen, setFilterOpen, filterPanel,
}) {
  return (
    <div className="list-toolbar">
      <label className="search-box">
        <input className="search-input" value={keyword}
          placeholder="관리번호, 물품명, 특징, 소유자명 등 검색해보세요."
          onChange={(e) => onKeyword(e.target.value)} />
        <SearchIcon />
      </label>

      {addLabel && (
        <button className="btn primary toolbar-btn" onClick={onAdd}>
          <PlusIcon /> {addLabel}
        </button>
      )}

      <div className="filter-wrap">
        <button className="btn toolbar-btn filter-btn" onClick={() => setFilterOpen((v) => !v)}>
          <FilterIcon /> 필터
          {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
        </button>
        {filterOpen && (
          <>
            <div className="filter-backdrop" onClick={() => setFilterOpen(false)} />
            <div className="filter-panel">
              {filterPanel}
              <div className="filter-panel-actions">
                <button className="btn small primary" onClick={() => setFilterOpen(false)}>닫기</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
