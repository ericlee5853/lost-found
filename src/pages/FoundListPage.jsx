import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { foundApi } from "../data/records";
import { imageUrl } from "../api/client";
import { useReference, nameOf, filterOptions } from "../referenceContext";
import { useStickyState } from "../useStickyState";
import { today } from "../dateUtil";
import { useAsync } from "../useAsync";
import { LoadingBox, ErrorBox } from "../components/StatusBox";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";
import StatusPill from "../components/StatusPill";
import ListToolbar, { CheckGroup } from "../components/ListToolbar";

const PAGE_SIZE = 10;

// 표의 칸과 너비(%)
const COLUMNS = [
  ["관리번호", 11], ["사진", 11], ["물품명", 20], ["물품구분", 12],
  ["접수일", 12], ["습득일", 12], ["처리상태", 12], ["접수담당자", 10],
];

// 엑셀로 내보낼 칸
const EXPORT = [
  ["manageNo", "관리번호"], ["receivedDate", "접수일"], ["foundDate", "습득일"],
  ["categoryName", "물품구분"], ["itemName", "물품명"], ["feature", "특징"],
  ["foundPlace", "습득장소"], ["storagePlace", "보관장소"], ["deadline", "보관만료일"],
  ["finderType", "습득자 구분"], ["finderNo", "습득자 학번"], ["finderName", "습득자"],
  ["finderContact", "습득자 연락처"], ["ownerName", "분실자"], ["ownerContact", "분실자 연락처"],
  ["contacted", "연락여부"], ["resultName", "처리상태"], ["processedDate", "처리일"],
  ["receiverName", "수령자"], ["returnDate", "수령일"], ["checkerName", "접수담당자"], ["note", "비고"],
];

const orDash = (v) => v || "-";

export default function FoundListPage() {
  const navigate = useNavigate();
  const ref = useReference();
  const [keyword, setKeyword] = useStickyState("lf_found_keyword", "");
  const [catFilter, setCatFilter] = useStickyState("lf_found_cat", []);
  const [resultFilter, setResultFilter] = useStickyState("lf_found_result", []);
  const [buildingFilter, setBuildingFilter] = useStickyState("lf_found_building", []);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useAsync(() => foundApi.list(), []);

  /** 번호로 저장된 값에 이름을 붙여 둔다. */
  const rows = (data ?? []).map((it) => ({
    ...it,
    categoryName: nameOf(ref.categories, it.categoryId),
    resultName: nameOf(ref.results, it.resultId),
    checkerName: nameOf(ref.users, it.checkerId),
    foundPlace: [nameOf(ref.buildings, it.foundBuildingId), it.foundPlaceDetail].filter(Boolean).join(" "),
    storagePlace: [nameOf(ref.storagePlaces, it.storagePlaceId), it.storageDetail].filter(Boolean).join(" "),
  }));

  const toggle = (setter) => (value) =>
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const activeCount = [catFilter, resultFilter, buildingFilter].filter((f) => f.length).length;

  const match = (it) => {
    if (catFilter.length && !catFilter.includes(it.categoryId)) return false;
    if (resultFilter.length && !resultFilter.includes(it.resultId)) return false;
    if (buildingFilter.length && !buildingFilter.includes(it.foundBuildingId)) return false;
    const k = keyword.trim().toLowerCase();
    if (!k) return true;
    return [it.manageNo, it.itemName, it.feature, it.foundPlace, it.storagePlace,
      it.finderName, it.ownerName, it.categoryName, it.resultName, it.checkerName]
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
    XLSX.utils.book_append_sheet(book, sheet, "분실물관리대장");
    XLSX.writeFile(book, `분실물관리대장_${today()}.xlsx`);
  }

  if (loading) return <LoadingBox message="분실물 대장을 불러오는 중입니다..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="분실물 대장" sub="습득한 물건을 등록하고 관리합니다">
        <button className="btn" onClick={exportExcel}>엑셀 내보내기</button>
      </PageHeader>

      <div className="list-panel">
        <ListToolbar
          keyword={keyword} onKeyword={(v) => { setKeyword(v); setPage(1); }}
          addLabel="분실물 접수" onAdd={() => navigate("/found/new")}
          activeCount={activeCount} filterOpen={filterOpen} setFilterOpen={setFilterOpen}
          filterPanel={
            <>
              <CheckGroup title="물품 구분" options={filterOptions(ref.categories)}
                selected={catFilter} onToggle={toggle(setCatFilter)} />
              <CheckGroup title="처리상태" options={filterOptions(ref.results)}
                selected={resultFilter} onToggle={toggle(setResultFilter)} />
              <CheckGroup title="습득장소" options={filterOptions(ref.buildings)}
                selected={buildingFilter} onToggle={toggle(setBuildingFilter)} />
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
              <tr key={it.manageNo} className="clickable" onClick={() => navigate(`/found/${it.manageNo}`)}>
                <td>{it.manageNo}</td>
                <td>
                  <div className="thumb">{it.images?.[0] && <img src={imageUrl(it.images[0])} alt="" />}</div>
                </td>
                <td className="cell-left">
                  <div className="item-name">{orDash(it.itemName)}</div>
                  {it.foundPlace && <div className="item-sub">{it.foundPlace}</div>}
                </td>
                <td>{orDash(it.categoryName)}</td>
                <td>{orDash(it.receivedDate)}</td>
                <td>{orDash(it.foundDate)}</td>
                <td><StatusPill name={it.resultName} /></td>
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
