import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { reportApi, foundApi, unmatchReport } from "../data/records";
import { useReference, nameOf, selectOptions, byCode } from "../referenceContext";
import { useAsync } from "../useAsync";
import { toMessage } from "../api/client";
import { LoadingBox, ErrorBox } from "../components/StatusBox";
import { FINDER_TYPES, toOptions } from "../constants";
import { formatPhone } from "../formatUtil";
import { today } from "../dateUtil";
import { useRecordForm } from "../useRecordForm";
import { RecordFormContext } from "../formContext";
import PageHeader from "../components/PageHeader";
import ManageNoBadge from "../components/ManageNoBadge";
import Section from "../components/Section";
import Field from "../components/Field";
import ActionBar from "../components/ActionBar";
import StatusPill from "../components/StatusPill";
import NotFoundBox from "../components/NotFoundBox";

function emptyForm(manageNo, meId, openStatusId) {
  return {
    manageNo, receivedDate: today(),
    categoryId: "", itemName: "", feature: "",
    foundDate: today(), lostBuildingId: "", lostPlaceDetail: "",
    reporterType: FINDER_TYPES[0], reporterNo: "", ownerName: "", ownerContact: "",
    statusId: openStatusId, processedDate: "", checkerId: meId, note: "", matchedFoundId: "",
  };
}

const REQUIRED = [
  ["categoryId", "물품 구분을 고르세요."],
  ["itemName", "물품명을 입력하세요."],
  ["receivedDate", "접수일을 입력하세요."],
  ["foundDate", "분실일을 입력하세요."],
  ["lostBuildingId", "분실장소를 고르세요."],
  ["reporterType", "신고자 구분을 고르세요."],
  ["ownerName", "신고자 이름을 입력하세요."],
  ["ownerContact", "신고자 연락처를 입력하세요."],
  ["statusId", "처리상태를 고르세요."],
];

/** 분실신고 한 건의 상세 / 접수 / 수정 화면. */
export default function LostReportPage({ mode }) {
  const navigate = useNavigate();
  const { manageNo } = useParams();
  const isNew = !manageNo;

  // 기존 건이면 그 한 건과 연결된 분실물을, 새 건이면 미리 보여줄 관리번호를 받아온다.
  const { data, loading, error, reload } = useAsync(async () => {
    if (isNew) return { newNo: await reportApi.nextManageNo().catch(() => ""), saved: null, matched: null };
    const saved = await reportApi.get(manageNo);
    const matched = saved.matchedFoundId
      ? await foundApi.list().then((rows) => rows.find((it) => it.id === Number(saved.matchedFoundId)) ?? null)
      : null;
    return { newNo: "", saved, matched };
  }, [manageNo]);

  if (loading) return <LoadingBox />;
  if (error) {
    return (
      <ErrorBox message={error} onRetry={reload}>
        <button className="btn" onClick={() => navigate("/lost")}>목록으로</button>
      </ErrorBox>
    );
  }

  return <LostReportForm mode={mode} manageNo={manageNo} {...data} />;
}

function LostReportForm({ mode, manageNo, saved, newNo, matched }) {
  const navigate = useNavigate();
  const ref = useReference();
  const [sending, setSending] = useState(false);
  const isNew = !saved;
  const readOnly = mode === "view";

  // 처리상태는 이름이 아니라 code 로 찾는다.
  const openStatusId = byCode(ref.statuses, "OPEN", "미처리")?.id ?? ref.statuses[0]?.id ?? "";

  const recordForm = useRecordForm(() => saved ?? emptyForm(newNo, ref.me.id, openStatusId));
  const { form, error, setError, checkRequired } = recordForm;

  if (!isNew && !saved) return <NotFoundBox manageNo={manageNo} backTo="/lost" />;

  const numberLabel = form.reporterType === "교직원" ? "교직원번호" : "학번";
  const needNumber = form.reporterType === "학생" || form.reporterType === "교직원";

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending || !checkRequired(REQUIRED)) return;
    setSending(true);
    try {
      if (isNew) {
        const created = await reportApi.create(form);
        navigate(`/lost/${created.manageNo}`, { replace: true });
      } else {
        await reportApi.update(manageNo, saved, form);
        navigate(`/lost/${manageNo}`, { replace: true });
      }
    } catch (err) {
      setError(toMessage(err, "저장하지 못했습니다."));
      setSending(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`관리번호 ${manageNo} 건을 지우시겠습니까?\n서버에서 완전히 지워집니다.`)) return;
    setSending(true);
    try {
      await reportApi.remove(manageNo);
      navigate("/lost", { replace: true });
    } catch (err) {
      setError(toMessage(err, "삭제하지 못했습니다."));
      setSending(false);
    }
  }

  async function handleUnmatch() {
    if (!window.confirm("연결을 푸시겠습니까?")) return;
    setSending(true);
    try {
      await unmatchReport(manageNo, openStatusId);
      navigate(0);
    } catch (err) {
      setError(toMessage(err, "연결을 풀지 못했습니다."));
      setSending(false);
    }
  }

  const title = readOnly ? "분실 신고 상세" : isNew ? "분실 신고" : "분실 신고 수정";

  return (
    <>
      <PageHeader title={title} />
      <ManageNoBadge manageNo={form.manageNo}>
        {readOnly && <StatusPill name={nameOf(ref.statuses, form.statusId)} />}
      </ManageNoBadge>

      <RecordFormContext.Provider value={{ ...recordForm, readOnly }}>
        <form onSubmit={handleSubmit}>
          <div className="record-sections">
            {/* 연결된 분실물이 있으면 맨 위에 보여 준다 */}
            {readOnly && matched && (
              <section className="card">
                <h2 className="card-title">찾은 분실물</h2>
                <div className="linkline">
                  <span className="tagline">연결됨</span>
                  <button type="button" className="link-btn"
                    onClick={() => navigate(`/found/${matched.manageNo}`)}>
                    {matched.manageNo}
                  </button>
                  <span>{matched.itemName} · {nameOf(ref.categories, matched.categoryId)}</span>
                  <button type="button" className="btn small" onClick={handleUnmatch}>연결 해제</button>
                </div>
              </section>
            )}

            <Section title="기본 정보">
              <Field label="접수일" name="receivedDate" type="date" required />
              <Field label="접수담당자" type="computed"
                value={nameOf(ref.users, form.checkerId)} placeholder="로그인한 담당자" />
            </Section>

            <Section title="물품 정보">
              <Field label="물품 구분" name="categoryId" type="select" numeric required
                placeholder="선택하세요" options={selectOptions(ref.categories, form.categoryId)} />
              <Field label="물품명" name="itemName" required placeholder="예) 신분증, 카드지갑, 텀블러" />
              <Field label="처리상태" name="statusId" type="select" numeric required
                options={selectOptions(ref.statuses, form.statusId)} />
              <Field label="특징" name="feature" placeholder="입력해주세요" full />
            </Section>

            <Section title="분실 정보">
              <Field label="분실일" name="foundDate" type="date" required />
              <Field label="분실장소" name="lostBuildingId" type="select" numeric required
                placeholder="건물 선택" options={selectOptions(ref.buildings, form.lostBuildingId)} />
              <Field label="분실장소 상세" name="lostPlaceDetail" placeholder="예) 3층 열람실" />
            </Section>

            <Section title="신고자 정보">
              <Field label="신고자 구분" name="reporterType" type="select" required
                options={toOptions(FINDER_TYPES)} />
              {needNumber
                ? <Field label={numberLabel} name="reporterNo" placeholder={`${numberLabel}를 입력하세요`} />
                : <Field label="번호" type="computed" value="" placeholder="외부인·기타는 받지 않음" />}
              <Field label="성명" name="ownerName" required placeholder="이름을 입력하세요" />
              <Field label="연락처" name="ownerContact" required format={formatPhone}
                inputMode="numeric" placeholder="010-0000-0000" />
            </Section>

            <Section title="관리 정보">
              <Field label="처리일" name="processedDate" type="date" />
              <Field label="비고" name="note" placeholder="특이사항이 있으면 입력하세요" full />
            </Section>
          </div>

          <ActionBar message={error}>
            {readOnly ? (
              <>
                <button type="button" className="btn" onClick={() => navigate("/lost")}>목록</button>
                {!matched && (
                  <button type="button" className="btn"
                    onClick={() => navigate(`/lost/${manageNo}/match`)}>분실물 찾기</button>
                )}
                <button type="button" className="btn primary"
                  onClick={() => navigate(`/lost/${manageNo}/edit`)}>수정</button>
              </>
            ) : (
              <>
                <button type="button" className="btn"
                  onClick={() => navigate(isNew ? "/lost" : `/lost/${manageNo}`)}>취소</button>
                {!isNew && <button type="button" className="btn danger" disabled={sending} onClick={handleDelete}>삭제</button>}
                <button type="submit" className="btn primary" disabled={sending}>
                  {sending ? "저장 중..." : isNew ? "등록" : "저장"}
                </button>
              </>
            )}
          </ActionBar>
        </form>
      </RecordFormContext.Provider>
    </>
  );
}
