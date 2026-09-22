import { useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { logout } from "../auth";
import { getFoundItems, getLostReports, updateFoundItem } from "../storage";
import {
  itemCategoryTable, processResultTable, optionsFor,
  getCategoryName, getResultName, getDefaultResultId,
} from "../settings";
import { PROCESS_STATUSES, CONTACTED_OPTIONS } from "../constants";
import { today } from "../dateUtil";
import { useStickyState } from "../useStickyState";
import PageHeader from "../components/PageHeader";

/** 표의 일반 셀. 값이 비어 있으면 "-" 를 보여준다. */
function Td({ children, title }) {
  return <td className="cell" title={title}>{children || "-"}</td>;
}

/** 긴 글을 max 글자까지만 보여주고 나머지는 "..." 로 줄인다. */
function truncate(text, max = 15) {
  if (!text) return text;
  return text.length > max ? text.slice(0, max) + "..." : text;
}

// 엑셀 내보내기 컬럼: [레코드의 키, 엑셀 머리글]
// 이름이 필요한 항목은 화면용으로 미리 풀어 둔 categoryName/resultName 을 쓴다.
const FOUND_COLUMNS = [
  ["manageNo", "관리번호"], ["receivedDate", "접수일"], ["foundDate", "습득일"],
  ["categoryName", "물품 구분"], ["itemName", "물품명"], ["feature", "특징"],
  ["owner", "소유자"], ["ownerContact", "소유자 연락처"], ["contacted", "연락여부"],
  ["storagePlace", "보관장소"], ["deadline", "보관기한"], ["resultName", "처리결과"],
  ["checker", "확인자"],
];
const LOST_COLUMNS = [
  ["manageNo", "관리번호"], ["receivedDate", "접수일"], ["foundDate", "습득일"],
  ["categoryName", "물품 구분"], ["itemName", "물품명"], ["feature", "특징"],
  ["owner", "소유자"], ["ownerContact", "소유자 연락처"], ["status", "처리 상태"],
  ["processedDate", "처리일"], ["checker", "확인자"],
];

/** 문자열 목록을 체크박스 옵션 형태로 바꾼다. */
const toOptions = (values) => values.map((v) => ({ value: v, label: v }));

/**
 * 설정 테이블을 체크박스 옵션으로 바꾼다.
 * 사용중지된 항목도 과거 데이터 검색을 위해 남겨 두되 표시로 구분한다.
 */
const settingOptions = (table) =>
  table.all().map((row) => ({
    value: row.id,
    label: row.is_active ? row.name : `${row.name} (사용중지)`,
  }));

/** 필터 패널의 체크박스 묶음 하나 */
function CheckGroup({ title, options, selected, onToggle }) {
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

export default function ListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useStickyState("lf_tab", "found");
  const [keyword, setKeyword] = useStickyState("lf_keyword", "");
  const [, reload] = useReducer((n) => n + 1, 0); // 표에서 값을 고친 뒤 다시 그리기
  const [filterOpen, setFilterOpen] = useState(false); // 패널 열림 상태는 유지하지 않음

  // 필터 상태 (페이지를 옮겨도 유지). 물품구분·처리결과는 id 로 저장한다.
  const [catFilter, setCatFilter] = useStickyState("lf_catFilter_v2", []);
  const [contactedFilter, setContactedFilter] = useStickyState("lf_contactedFilter", []);
  const [resultFilter, setResultFilter] = useStickyState("lf_resultFilter_v2",
    [getDefaultResultId()].filter((id) => id != null));
  const [expiredOnly, setExpiredOnly] = useStickyState("lf_expiredOnly", false);
  const [statusFilter, setStatusFilter] = useStickyState("lf_statusFilter", []);

  /** 체크박스 토글 함수를 만든다 (선택돼 있으면 빼고, 아니면 넣는다) */
  function toggle(setter) {
    return (value) =>
      setter((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
  }
  function resetFilters() {
    setCatFilter([]); setContactedFilter([]); setResultFilter([]);
    setExpiredOnly(false); setStatusFilter([]);
  }

  // 필터 버튼에 표시할 "적용 중인 필터 개수"
  const activeCount =
    (catFilter.length ? 1 : 0) +
    (tab === "found" && contactedFilter.length ? 1 : 0) +
    (tab === "found" && resultFilter.length ? 1 : 0) +
    (tab === "found" && expiredOnly ? 1 : 0) +
    (tab === "lost" && statusFilter.length ? 1 : 0);

  /** 검색어가 레코드의 주요 항목 중 하나에라도 들어 있는지 */
  function matchKeyword(it) {
    if (!keyword.trim()) return true;
    const k = keyword.trim().toLowerCase();
    const hay = [
      it.manageNo, it.itemName, it.feature, it.owner,
      it.ownerContact, it.storagePlace, it.checker, it.categoryName, it.resultName,
    ].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(k);
  }
  function matchFound(it) {
    if (catFilter.length && !catFilter.includes(it.category_id)) return false;
    if (contactedFilter.length && !contactedFilter.includes(it.contacted)) return false;
    if (resultFilter.length && !resultFilter.includes(it.result_id)) return false;
    if (expiredOnly && !(it.deadline && it.deadline < today())) return false;
    return matchKeyword(it);
  }
  function matchLost(it) {
    if (catFilter.length && !catFilter.includes(it.category_id)) return false;
    if (statusFilter.length && !statusFilter.includes(it.status)) return false;
    return matchKeyword(it);
  }

  // 저장된 id 를 화면에 보여줄 이름으로 풀어 둔다(규칙 1: 이름은 항상 설정에서 가져온다).
  const allFound = getFoundItems().map((it) => ({
    ...it,
    categoryName: getCategoryName(it.category_id),
    result_id: it.result_id ?? getDefaultResultId(),
    resultName: getResultName(it.result_id ?? getDefaultResultId()),
  }));
  const allLost = getLostReports().map((it) => ({
    ...it,
    categoryName: getCategoryName(it.category_id),
  }));

  const foundItems = allFound.filter(matchFound);
  const lostReports = allLost.filter(matchLost);
  const current = tab === "found" ? foundItems : lostReports;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  /** 현재 탭에 맞는 등록 페이지로 이동 */
  function openAdd() {
    navigate(tab === "found" ? "/found/new" : "/lost/new");
  }

  /** 목록에서 바로 고치는 항목(처리결과·연락여부)을 저장한다. */
  function changeField(e, manageNo, field, asNumber = false) {
    e.stopPropagation();
    const value = asNumber ? Number(e.target.value) : e.target.value;
    updateFoundItem(manageNo, { [field]: value });
    reload();
  }

  /** 현재 탭에서 보이는 목록을 엑셀 파일로 내려받는다. */
  function exportExcel() {
    if (current.length === 0) { alert("내보낼 데이터가 없습니다."); return; }
    const columns = tab === "found" ? FOUND_COLUMNS : LOST_COLUMNS;
    const sheetName = tab === "found" ? "분실물관리대장" : "분실신고관리대장";
    const rows = current.map((it) =>
      Object.fromEntries(columns.map(([key, title]) => [title, it[key] ?? ""]))
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = columns.map(([, title]) => ({ wch: Math.max(title.length * 2, 12) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName}_${today()}.xlsx`);
  }

  return (
    <div className="page">
      <PageHeader title="유실물 관리">
        <button className="btn" onClick={() => navigate("/settings")}>설정값 변경</button>
        <button className="btn" onClick={exportExcel}>엑셀 내보내기</button>
        <button className="btn" onClick={handleLogout}>로그아웃</button>
      </PageHeader>

      {/* 탭 */}
      <div className="tabs">
        <button className={"tab" + (tab === "found" ? " active" : "")}
          onClick={() => { setTab("found"); setFilterOpen(false); }}>
          분실물관리대장 ({allFound.length})
        </button>
        <button className={"tab" + (tab === "lost" ? " active" : "")}
          onClick={() => { setTab("lost"); setFilterOpen(false); }}>
          분실신고 관리대장 ({allLost.length})
        </button>
      </div>

      {/* 검색 */}
      <div className="filters">
        <input className="input filter-search"
          placeholder="검색 (관리번호·물품명·특징·소유자 등)"
          value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>

      {/* 툴바: 왼쪽 건수, 오른쪽 추가 + 필터 */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          <span className="result-count">
            {activeCount > 0 || keyword.trim()
              ? `${current.length}건 표시 (전체 ${tab === "found" ? allFound.length : allLost.length}건)`
              : `전체 ${current.length}건`}
          </span>
        </div>

        <div className="toolbar-right">
          <button className="btn primary" onClick={openAdd}>+ 추가</button>
          <div className="filter-wrap">
            <button className={"btn filter-btn" + (activeCount ? " has-active" : "")}
              onClick={() => setFilterOpen((v) => !v)} title="필터">
              <span className="filter-icon"><span></span><span></span><span></span></span>
              필터
              {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
            </button>
            {filterOpen && (
              <>
                <div className="filter-backdrop" onClick={() => setFilterOpen(false)} />
                <div className="filter-panel">
                  <CheckGroup title="물품 구분" options={settingOptions(itemCategoryTable)}
                    selected={catFilter} onToggle={toggle(setCatFilter)} />
                  {tab === "found" && (
                    <>
                      <CheckGroup title="연락여부" options={toOptions(CONTACTED_OPTIONS)}
                        selected={contactedFilter} onToggle={toggle(setContactedFilter)} />
                      <CheckGroup title="처리결과" options={settingOptions(processResultTable)}
                        selected={resultFilter} onToggle={toggle(setResultFilter)} />
                      <div className="filter-group">
                        <div className="filter-group-title">보관기한</div>
                        <label className="filter-check">
                          <input type="checkbox" checked={expiredOnly}
                            onChange={() => setExpiredOnly((v) => !v)} />
                          기한 경과 항목만
                        </label>
                      </div>
                    </>
                  )}
                  {tab === "lost" && (
                    <CheckGroup title="처리 상태" options={toOptions(PROCESS_STATUSES)}
                      selected={statusFilter} onToggle={toggle(setStatusFilter)} />
                  )}
                  <div className="filter-panel-actions">
                    <button className="btn small" onClick={resetFilters}>초기화</button>
                    <button className="btn small primary" onClick={() => setFilterOpen(false)}>닫기</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 분실물관리대장 */}
      {tab === "found" && (
        <table className="grid">
          <thead>
            <tr>
              <th>관리번호</th><th>접수일</th><th>습득일</th><th>물품 구분</th>
              <th>물품명</th><th>특징</th><th>소유자</th><th>소유자 연락처</th>
              <th>연락여부</th><th>보관장소</th><th>보관기한</th><th>처리결과</th>
              <th>확인자</th>
            </tr>
          </thead>
          <tbody>
            {foundItems.length === 0 && (
              <tr><td colSpan={13} className="empty">표시할 데이터가 없습니다.</td></tr>
            )}
            {foundItems.map((it) => (
              <tr key={it.manageNo} onClick={() => navigate(`/found/${it.manageNo}`)}>
                <Td>{it.manageNo}</Td>
                <Td>{it.receivedDate}</Td>
                <Td>{it.foundDate}</Td>
                <Td>{it.categoryName}</Td>
                <Td>{it.itemName}</Td>
                <Td title={it.feature}>{truncate(it.feature)}</Td>
                <Td>{it.owner}</Td>
                <Td>{it.ownerContact}</Td>
                <td className="cell result-cell" onClick={(e) => e.stopPropagation()}>
                  <select className="result-select contacted-select" value={it.contacted}
                    onChange={(e) => changeField(e, it.manageNo, "contacted")}>
                    {CONTACTED_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <Td>{it.storagePlace}</Td>
                <Td>{it.deadline}</Td>
                <td className="cell result-cell" onClick={(e) => e.stopPropagation()}>
                  <select className="result-select" value={it.result_id ?? ""}
                    onChange={(e) => changeField(e, it.manageNo, "result_id", true)}>
                    {optionsFor(processResultTable, it.result_id).map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </td>
                <Td>{it.checker}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 분실신고 관리대장 */}
      {tab === "lost" && (
        <table className="grid">
          <thead>
            <tr>
              <th>관리번호</th><th>접수일</th><th>습득일</th><th>물품 구분</th>
              <th>물품명</th><th>특징</th><th>소유자</th><th>소유자 연락처</th>
              <th>처리 상태</th><th>처리일</th><th>확인자</th>
            </tr>
          </thead>
          <tbody>
            {lostReports.length === 0 && (
              <tr><td colSpan={11} className="empty">표시할 데이터가 없습니다.</td></tr>
            )}
            {lostReports.map((it) => (
              <tr key={it.manageNo} onClick={() => navigate(`/lost/${it.manageNo}`)}>
                <Td>{it.manageNo}</Td>
                <Td>{it.receivedDate}</Td>
                <Td>{it.foundDate}</Td>
                <Td>{it.categoryName}</Td>
                <Td>{it.itemName}</Td>
                <Td title={it.feature}>{truncate(it.feature)}</Td>
                <Td>{it.owner}</Td>
                <Td>{it.ownerContact}</Td>
                <Td>{it.status}</Td>
                <Td>{it.processedDate}</Td>
                <Td>{it.checker}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
