import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { logout } from "../auth";
import { getFoundItems, getLostReports } from "../storage";
import {
  itemCategoryTable, processResultTable,
  getCategoryName, getResultName, getDefaultResultId,
} from "../settings";
import { PROCESS_STATUSES, CONTACTED_OPTIONS, toOptions } from "../constants";
import { today } from "../dateUtil";
import { useStickyState } from "../useStickyState";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";
import { SearchIcon, PlusIcon, FilterIcon } from "../components/icons";

const PAGE_SIZE = 10; // 한 쪽에 보여줄 건수

// 엑셀 내보내기 컬럼: [레코드의 키, 엑셀 머리글]
// 화면 표보다 항목이 많다(대장 전체를 내보내기 위함).
// 이름이 필요한 항목은 화면용으로 미리 풀어 둔 categoryName/resultName 을 쓴다.
const FOUND_EXPORT = [
  ["manageNo", "관리번호"], ["receivedDate", "접수일"], ["foundDate", "습득일"],
  ["categoryName", "물품 구분"], ["itemName", "물품명"], ["feature", "특징"],
  ["lostPlace", "분실 장소"], ["owner", "소유자"], ["ownerContact", "소유자 연락처"],
  ["contacted", "연락여부"], ["storagePlace", "보관장소"], ["deadline", "보관기한"],
  ["resultName", "처리결과"], ["checker", "확인자"],
];
const LOST_EXPORT = [
  ["manageNo", "관리번호"], ["receivedDate", "접수일"], ["foundDate", "습득일"],
  ["categoryName", "물품 구분"], ["itemName", "물품명"], ["feature", "특징"],
  ["lostPlace", "분실 장소"], ["owner", "소유자"], ["ownerContact", "소유자 연락처"],
  ["status", "처리 상태"], ["processedDate", "처리일"], ["checker", "확인자"],
];

// 화면 표의 컬럼: 머리글과 너비(%). 디자인 시안의 칸 비율을 따른다.
const FOUND_COLUMNS = [
  ["관리번호", 11.7], ["이미지", 11.2], ["물품명", 18.1], ["물품구분", 12.4],
  ["접수일", 13.1], ["습득일", 13], ["처리상태", 11.1], ["확인자", 9.4],
];
const LOST_COLUMNS = [
  ["관리번호", 11.4], ["물품구분", 10.7], ["물품명", 9.6], ["소유자", 10.3],
  ["소유자 연락처", 12.4], ["접수일", 13.5], ["습득일", 12.3], ["처리상태", 10.5], ["확인자", 9.3],
];

/**
 * 설정 테이블을 필터 체크박스 옵션으로 바꾼다.
 * 사용중지된 항목도 과거 데이터 검색을 위해 남겨 두되 표시로 구분한다.
 */
const settingOptions = (table) =>
  table.all().map((row) => ({
    value: row.id,
    label: row.is_active ? row.name : `${row.name} (사용중지)`,
  }));

/** 값이 비어 있으면 "-" */
const orDash = (v) => v || "-";

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

/** 표 머리글 + 칸 너비 */
function TableHead({ columns }) {
  return (
    <>
      <colgroup>
        {columns.map(([title, width]) => <col key={title} style={{ width: `${width}%` }} />)}
      </colgroup>
      <thead>
        <tr>{columns.map(([title]) => <th key={title}>{title}</th>)}</tr>
      </thead>
    </>
  );
}

/** 결과가 없을 때의 한 줄 */
function EmptyRow({ colSpan }) {
  return <tr><td colSpan={colSpan} className="empty-cell">표시할 데이터가 없습니다.</td></tr>;
}

export default function ListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useStickyState("lf_tab", "found");
  const [keyword, setKeyword] = useStickyState("lf_keyword", "");
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
      it.manageNo, it.itemName, it.feature, it.owner, it.ownerContact,
      it.lostPlace, it.storagePlace, it.checker, it.categoryName, it.resultName,
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
  const allFound = getFoundItems().map((it) => {
    const resultId = it.result_id ?? getDefaultResultId();
    return {
      ...it,
      categoryName: getCategoryName(it.category_id),
      result_id: resultId,
      resultName: getResultName(resultId),
    };
  });
  const allLost = getLostReports().map((it) => ({
    ...it,
    categoryName: getCategoryName(it.category_id),
  }));

  const isFound = tab === "found";
  const current = isFound ? allFound.filter(matchFound) : allLost.filter(matchLost);

  // 쪽 나누기. 탭·검색어·필터가 바뀌면 1쪽으로 돌아간다.
  // (조건을 key 로 같이 저장해 두고, key 가 다르면 1쪽으로 본다.)
  const pageKey = JSON.stringify([tab, keyword, catFilter, contactedFilter,
    resultFilter, expiredOnly, statusFilter]);
  const [pageState, setPageState] = useStickyState("lf_page", { key: "", page: 1 });
  const totalPages = Math.max(1, Math.ceil(current.length / PAGE_SIZE));
  const page = Math.min(pageState.key === pageKey ? pageState.page : 1, totalPages);
  const pageItems = current.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function changeTab(next) {
    setTab(next);
    setFilterOpen(false);
  }

  /** 현재 탭에서 검색·필터로 걸러진 목록 전체를 엑셀 파일로 내려받는다. */
  function exportExcel() {
    if (current.length === 0) { alert("내보낼 데이터가 없습니다."); return; }
    const columns = isFound ? FOUND_EXPORT : LOST_EXPORT;
    const sheetName = isFound ? "분실물관리대장" : "분실신고관리대장";
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
    <div className="page list-page">
      <PageHeader title="유실물 관리">
        <button className="btn" onClick={() => navigate("/settings")}>설정값 변경</button>
        <button className="btn" onClick={exportExcel}>엑셀 내보내기</button>
        <button className="btn" onClick={handleLogout}>로그아웃</button>
      </PageHeader>

      {/* 탭 */}
      <div className="tabs">
        <button className={"tab" + (isFound ? " active" : "")} onClick={() => changeTab("found")}>
          분실물 관리대장 <span className="tab-count">{allFound.length}</span>
        </button>
        <button className={"tab" + (!isFound ? " active" : "")} onClick={() => changeTab("lost")}>
          분실신고 관리대장 <span className="tab-count">{allLost.length}</span>
        </button>
      </div>

      <div className="list-panel">
        {/* 검색 · 등록 · 필터 */}
        <div className="list-toolbar">
          <label className="search-box">
            <input className="search-input" value={keyword}
              placeholder="관리번호, 물품명, 특징, 소유자명 등 검색해보세요."
              onChange={(e) => setKeyword(e.target.value)} />
            <SearchIcon />
          </label>

          <button className="btn primary toolbar-btn"
            onClick={() => navigate(isFound ? "/found/new" : "/lost/new")}>
            <PlusIcon /> 유실물 등록
          </button>

          <div className="filter-wrap">
            <button className="btn toolbar-btn filter-btn" onClick={() => setFilterOpen((v) => !v)}>
              <FilterIcon /> 필터
              {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
            </button>
            {filterOpen && (
              <>
                <div className="filter-backdrop" onClick={() => setFilterOpen(false)} />
                <div className="filter-panel">
                  <CheckGroup title="물품 구분" options={settingOptions(itemCategoryTable)}
                    selected={catFilter} onToggle={toggle(setCatFilter)} />
                  {isFound && (
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
                  {!isFound && (
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

        {/* 건수: 검색·필터 뒤 남은 건수. 대장 전체 건수는 탭 옆 숫자로 보인다. */}
        <p className="list-count">전체 <b>{current.length}건</b></p>

        {/* 분실물관리대장 */}
        {isFound && (
          <table className="data-table">
            <TableHead columns={FOUND_COLUMNS} />
            <tbody>
              {pageItems.length === 0 && <EmptyRow colSpan={FOUND_COLUMNS.length} />}
              {pageItems.map((it) => (
                <tr key={it.manageNo} className="clickable"
                  onClick={() => navigate(`/found/${it.manageNo}`)}>
                  <td>{it.manageNo}</td>
                  <td>
                    <div className="thumb">{it.image && <img src={it.image} alt="" />}</div>
                  </td>
                  {/* 물품명 아래에 분실 장소를 작게 적는다 */}
                  <td className="cell-left">
                    <div className="item-name">{orDash(it.itemName)}</div>
                    {it.lostPlace && <div className="item-sub">{it.lostPlace}</div>}
                  </td>
                  <td>{orDash(it.categoryName)}</td>
                  <td>{orDash(it.receivedDate)}</td>
                  <td>{orDash(it.foundDate)}</td>
                  <td>{orDash(it.resultName)}</td>
                  <td>{orDash(it.checker)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 분실신고 관리대장 */}
        {!isFound && (
          <table className="data-table">
            <TableHead columns={LOST_COLUMNS} />
            <tbody>
              {pageItems.length === 0 && <EmptyRow colSpan={LOST_COLUMNS.length} />}
              {pageItems.map((it) => (
                <tr key={it.manageNo} className="clickable"
                  onClick={() => navigate(`/lost/${it.manageNo}`)}>
                  <td>{it.manageNo}</td>
                  <td>{orDash(it.categoryName)}</td>
                  <td>{orDash(it.itemName)}</td>
                  <td>{orDash(it.owner)}</td>
                  <td>{orDash(it.ownerContact)}</td>
                  <td>{orDash(it.receivedDate)}</td>
                  <td>{orDash(it.foundDate)}</td>
                  <td>{orDash(it.status)}</td>
                  <td>{orDash(it.checker)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages}
        onChange={(p) => setPageState({ key: pageKey, page: p })} />
    </div>
  );
}
