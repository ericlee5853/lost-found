import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { reportApi, foundApi, matchReport } from "../data/records";
import { imageUrl } from "../api/client";
import { useReference, nameOf, byCode } from "../referenceContext";
import { useAsync } from "../useAsync";
import { toMessage } from "../api/client";
import { LoadingBox, ErrorBox } from "../components/StatusBox";
import PageHeader from "../components/PageHeader";
import ManageNoBadge from "../components/ManageNoBadge";
import ActionBar from "../components/ActionBar";
import StatusPill from "../components/StatusPill";
import NotFoundBox from "../components/NotFoundBox";
import { SearchIcon } from "../components/icons";

const COLUMNS = [["", 8], ["관리번호", 13], ["사진", 12], ["물품명", 27], ["물품구분", 14], ["습득일", 14], ["처리상태", 12]];

/**
 * 분실신고에 맞는 분실물을 골라 연결하는 화면.
 * 처음 열 때 신고의 물품 구분으로 걸러 두고, 검색으로 더 찾을 수 있다.
 */
export default function LostMatchPage() {
  const navigate = useNavigate();
  const { manageNo } = useParams();

  // 신고 한 건과 고를 수 있는 분실물 목록을 함께 받아온다.
  const { data, loading, error, reload } = useAsync(async () => {
    const [report, founds] = await Promise.all([reportApi.get(manageNo), foundApi.list()]);
    return { report, founds };
  }, [manageNo]);

  if (loading) return <LoadingBox />;
  if (error) {
    return (
      <ErrorBox message={error} onRetry={reload}>
        <button className="btn" onClick={() => navigate("/lost")}>목록으로</button>
      </ErrorBox>
    );
  }
  return <MatchBody manageNo={manageNo} report={data.report} founds={data.founds} />;
}

function MatchBody({ manageNo, report, founds }) {
  const navigate = useNavigate();
  const ref = useReference();

  const [keyword, setKeyword] = useState("");
  const [sameCategory, setSameCategory] = useState(true);
  const [picked, setPicked] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  if (!report) return <NotFoundBox manageNo={manageNo} backTo="/lost" />;

  // 처리완료 상태는 이름이 아니라 code 로 찾는다.
  const doneStatusId = byCode(ref.statuses, "DONE", "완료")?.id ?? ref.statuses[0]?.id;

  const rows = founds
    .map((it) => ({
      ...it,
      categoryName: nameOf(ref.categories, it.categoryId),
      resultName: nameOf(ref.results, it.resultId),
      foundPlace: [nameOf(ref.buildings, it.foundBuildingId), it.foundPlaceDetail].filter(Boolean).join(" "),
    }))
    .filter((it) => {
      if (sameCategory && it.categoryId !== report.categoryId) return false;
      const k = keyword.trim().toLowerCase();
      if (!k) return true;
      return [it.manageNo, it.itemName, it.feature, it.foundPlace]
        .filter(Boolean).join(" ").toLowerCase().includes(k);
    });

  async function handleMatch() {
    if (!picked) return setError("연결할 분실물을 고르세요.");
    if (sending) return;
    setSending(true);
    try {
      await matchReport(manageNo, picked, doneStatusId);
      navigate(`/lost/${manageNo}`, { replace: true });
    } catch (err) {
      setError(toMessage(err, "연결하지 못했습니다."));
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader title="분실물 찾아 연결" sub="신고 내용과 맞는 분실물을 고릅니다" />
      <ManageNoBadge manageNo={manageNo} />

      <section className="card">
        <h2 className="card-title">신고 내용</h2>
        <div className="field-grid cols-3">
          <div className="field"><label className="field-label">물품 구분</label>
            <div className="input value-box">{nameOf(ref.categories, report.categoryId) || "-"}</div></div>
          <div className="field"><label className="field-label">물품명</label>
            <div className="input value-box">{report.itemName || "-"}</div></div>
          <div className="field"><label className="field-label">분실일</label>
            <div className="input value-box">{report.foundDate || "-"}</div></div>
          <div className="field full"><label className="field-label">분실장소</label>
            <div className="input value-box">
              {[nameOf(ref.buildings, report.lostBuildingId), report.lostPlaceDetail]
                .filter(Boolean).join(" ") || "-"}</div></div>
        </div>
      </section>

      <div className="list-panel short">
        <div className="list-toolbar">
          <label className="search-box">
            <input className="search-input" value={keyword}
              placeholder="관리번호, 물품명, 특징으로 찾기"
              onChange={(e) => setKeyword(e.target.value)} />
            <SearchIcon />
          </label>
          <label className="check-inline">
            <input type="checkbox" checked={sameCategory}
              onChange={() => setSameCategory((v) => !v)} />
            같은 물품 구분만 보기
          </label>
        </div>

        <p className="list-count">찾은 분실물 <b>{rows.length}건</b></p>

        <table className="data-table">
          <colgroup>{COLUMNS.map(([, w], i) => <col key={i} style={{ width: `${w}%` }} />)}</colgroup>
          <thead><tr>{COLUMNS.map(([t], i) => <th key={i}>{t}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={COLUMNS.length} className="empty-cell">맞는 분실물이 없습니다.</td></tr>
            )}
            {rows.map((it) => (
              <tr key={it.id} className="clickable" onClick={() => { setPicked(it.id); setError(""); }}>
                <td>
                  <label className="pick">
                    <input type="radio" name="pick" checked={picked === it.id} readOnly /> 선택
                  </label>
                </td>
                <td>{it.manageNo}</td>
                <td><div className="thumb">{it.images?.[0] && <img src={imageUrl(it.images[0])} alt="" />}</div></td>
                <td className="cell-left">
                  <div className="item-name">{it.itemName}</div>
                  {it.foundPlace && <div className="item-sub">{it.foundPlace}</div>}
                </td>
                <td>{it.categoryName}</td>
                <td>{it.foundDate}</td>
                <td><StatusPill name={it.resultName} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ActionBar message={error}>
        <button type="button" className="btn" onClick={() => navigate(`/lost/${manageNo}`)}>취소</button>
        <button type="button" className="btn primary" disabled={sending} onClick={handleMatch}>
          {sending ? "연결하는 중..." : "연결"}
        </button>
      </ActionBar>
    </>
  );
}
