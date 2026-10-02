import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { reportApi } from "../data/records";
import { useReference, nameOf, filterOptions } from "../referenceContext";
import { useStickyState } from "../useStickyState";
import { today } from "../dateUtil";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";
import StatusPill from "../components/StatusPill";
import ListToolbar, { CheckGroup } from "../components/ListToolbar";

const PAGE_SIZE = 10;

const COLUMNS = [
  ["관리번호", 11], ["물품구분", 11], ["물품명", 14], ["신고자", 10],
  ["연락처", 13], ["접수일", 12], ["분실일", 12], ["처리상태", 11], ["접수담당자", 9],
];

const EXPORT = [
  ["manageNo", "관리번호"], ["receivedDate", "접수일"], ["foundDate", "분실일"],
  ["categoryName", "물품구분"], ["itemName", "물품명"], ["feature", "특징"],
  ["lostPlace", "분실장소"], ["reporterType", "신고자 구분"], ["reporterNo", "신고자 학번"],
  ["ownerName", "신고자"], ["ownerContact", "연락처"], ["statusName", "처리상태"],
  ["processedDate", "처리일"], ["matchedNo", "찾은 분실물"], ["checkerName", "접수담당자"], ["note", "비고"],
];

const orDash = (v) => v || "-";

export default function LostListPage() {
  const navigate = useNavigate();
  const ref = useReference();
  const [keyword, setKeyword] = useStickyState("lf_lost_keyword", "");
  const [catFilter, setCatFilter] = useStickyState("lf_lost_cat", []);
  const [statusFilter, setStatusFilter] = useStickyState("lf_lost_status", []);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const rows = reportApi.list().map((it) => ({
    ...it,
    categoryName: nameOf(ref.categories, it.categoryId),
    statusName: nameOf(ref.statuses, it.statusId),
    checkerName: nameOf(ref.users, it.checkerId),
    lostPlace: [nameOf(ref.buildings, it.lostBuildingId), it.lostPlaceDetail].filter(Boolean).join(" "),
  }));

  const toggle = (setter) => (value) =>
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const activeCount = [catFilter, statusFilter].filter((f) => f.length).length;

  const match = (it) => {
    if (catFilter.length && !catFilter.includes(it.categoryId)) return false;
    if (statusFilter.length && !statusFilter.includes(it.statusId)) return false;
    const k = keyword.trim().toLowerCase();
    if (!k) return true;
    return [it.manageNo, it.itemName, it.feature, it.lostPlace, it.ownerName,
      it.ownerContact, it.categoryName, it.statusName, it.checkerName]
      .filter(Boolean).join(" ").toLowerCase().includes(k);
  };

  const list = rows.filter(match);
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function exportExcel() {
    if (list.length === 0) { alert("내보낼 자료가 없습니다."); return; }
    const sheet = XLSX.utils.json_to_sheet(list.map((it) =>
      Object.fromEntries(EXPORT.map(([key, title]) => [title, it[key] ?? ""]))));
    sheet["!cols"] = EXPORT.map(([, title]) => ({ wch: Math.max(title.length * 2, 12) }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "분실신고관리대장");
    XLSX.writeFile(book, `분실신고관리대장_${today()}.xlsx`);
  }

  return (
    <>
      <PageHeader title="분실신고 대장" sub="잃어버린 물건 신고를 접수합니다">
        <button className="btn" onClick={exportExcel}>엑셀 내보내기</button>
      </PageHeader>

      <div className="list-panel">
        <ListToolbar
          keyword={keyword} onKeyword={(v) => { setKeyword(v); setPage(1); }}
          addLabel="분실 신고" onAdd={() => navigate("/lost/new")}
          activeCount={activeCount} filterOpen={filterOpen} setFilterOpen={setFilterOpen}
          filterPanel={
            <>
              <CheckGroup title="물품 구분" options={filterOptions(ref.categories)}
                selected={catFilter} onToggle={toggle(setCatFilter)} />
              <CheckGroup title="처리상태" options={filterOptions(ref.statuses)}
                selected={statusFilter} onToggle={toggle(setStatusFilter)} />
            </>
          } />

        <p className="list-count">전체 <b>{list.length}건</b></p>

        <table className="data-table">
          <colgroup>{COLUMNS.map(([t, w]) => <col key={t} style={{ width: `${w}%` }} />)}</colgroup>
          <thead><tr>{COLUMNS.map(([t]) => <th key={t}>{t}</th>)}</tr></thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr><td colSpan={COLUMNS.length} className="empty-cell">표시할 자료가 없습니다.</td></tr>
            )}
            {pageItems.map((it) => (
              <tr key={it.manageNo} className="clickable" onClick={() => navigate(`/lost/${it.manageNo}`)}>
                <td>{it.manageNo}</td>
                <td>{orDash(it.categoryName)}</td>
                <td>{orDash(it.itemName)}</td>
                <td>{orDash(it.ownerName)}</td>
                <td>{orDash(it.ownerContact)}</td>
                <td>{orDash(it.receivedDate)}</td>
                <td>{orDash(it.foundDate)}</td>
                <td><StatusPill name={it.statusName} /></td>
                <td>{orDash(it.checkerName)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={current} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
