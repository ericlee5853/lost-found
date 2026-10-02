import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { lostReportApi } from "../api/records";
import { toMessage } from "../api/client";
import { useReference, selectOptions } from "../referenceContext";
import { useAsync } from "../useAsync";
import { formatPhone } from "../formatUtil";
import { today } from "../dateUtil";
import { useRecordForm } from "../useRecordForm";
import { RecordFormContext } from "../formContext";
import PageHeader from "../components/PageHeader";
import ManageNoBadge from "../components/ManageNoBadge";
import Section from "../components/Section";
import Field from "../components/Field";
import ActionBar from "../components/ActionBar";
import { LoadingBox, ErrorBox } from "../components/StatusBox";

/** 새 분실 신고 화면의 초기값. 분실신고에는 사진을 붙이지 않는다. */
function emptyForm(manageNo, defaultStatusId, meId) {
  return {
    manageNo,
    receivedDate: today(), foundDate: today(), categoryId: "", itemName: "",
    feature: "", lostPlace: "", owner: "", ownerContact: "",
    statusId: defaultStatusId, processedDate: "", checkerId: meId,
    matchedFoundId: "", imagePath: "",
  };
}

/** 필수 입력 항목과 안내 문구 (서버가 요구하는 항목과 같다) */
const REQUIRED_FIELDS = [
  ["categoryId", "물품 구분을 선택하세요."],
  ["itemName", "물품명을 입력하세요."],
  ["receivedDate", "접수일을 입력하세요."],
  ["foundDate", "습득일을 입력하세요."],
  ["owner", "소유자를 입력하세요."],
  ["ownerContact", "소유자 연락처를 입력하세요."],
  ["statusId", "처리 상태를 선택하세요."],
];

/**
 * 분실신고 관리대장 한 건의 상세 / 신고 / 수정 화면.
 * @param {"view"|"edit"} mode view = 상세, edit = 신고(관리번호 없음) 또는 수정
 */
export default function LostReportPage({ mode }) {
  const navigate = useNavigate();
  const { manageNo } = useParams();
  const isNew = !manageNo;

  const { data, loading, error, reload } = useAsync(
    () => (isNew ? lostReportApi.nextManageNo() : lostReportApi.get(manageNo)),
    [manageNo]
  );

  if (loading) return <LoadingBox />;
  if (error) {
    return (
      <ErrorBox message={error} onRetry={reload}>
        <button className="btn" onClick={() => navigate("/")}>목록으로</button>
      </ErrorBox>
    );
  }

  return <LostReportForm mode={mode} manageNo={manageNo} saved={isNew ? null : data}
    newManageNo={isNew ? data : ""} />;
}

function LostReportForm({ mode, manageNo, saved, newManageNo }) {
  const navigate = useNavigate();
  const { categories, statuses, users, me } = useReference();
  const [sending, setSending] = useState(false);

  const isNew = !saved;
  const readOnly = mode === "view";
  const defaultStatusId = statuses.find((s) => s.is_active)?.id ?? "";

  const recordForm = useRecordForm(() =>
    saved ?? emptyForm(newManageNo, defaultStatusId, me?.id ?? ""));
  const { form, error, setError, checkRequired } = recordForm;

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending || !checkRequired(REQUIRED_FIELDS)) return;
    setSending(true);
    try {
      if (isNew) {
        const created = await lostReportApi.create(form);
        navigate(`/lost/${created.manageNo}`, { replace: true });
      } else {
        await lostReportApi.update(manageNo, saved, form);
        navigate(`/lost/${form.manageNo}`, { replace: true });
      }
    } catch (err) {
      setError(toMessage(err, "저장하지 못했습니다."));
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`관리번호 ${manageNo} 건을 삭제하시겠습니까?\n서버에서 완전히 지워집니다.`)) return;
    setSending(true);
    try {
      await lostReportApi.remove(manageNo);
      navigate("/", { replace: true });
    } catch (err) {
      setError(toMessage(err, "삭제하지 못했습니다."));
      setSending(false);
    }
  }

  const title = readOnly ? "분실 신고 상세" : isNew ? "분실 신고" : "분실 신고 수정";

  return (
    <div className="page form-page">
      <PageHeader title={title} />
      <ManageNoBadge manageNo={form.manageNo} />

      <RecordFormContext.Provider value={{ ...recordForm, readOnly }}>
        <form onSubmit={handleSubmit}>
          <div className="record-sections">
            <Section title="물품 정보">
              <Field label="물품 구분" name="categoryId" type="select" numeric
                placeholder="--선택--"
                options={selectOptions(categories, form.categoryId)} />
              <Field label="물품명" name="itemName" placeholder="예) 신분증, 카드지갑, 텀블러 등" />
              <Field label="처리 상태" name="statusId" type="select" numeric
                options={selectOptions(statuses, form.statusId)} />
              <Field label="특징" name="feature" placeholder="입력해주세요" full />
            </Section>

            <Section title="습득 정보">
              <Field label="접수일" name="receivedDate" type="date" />
              <Field label="습득일" name="foundDate" type="date" />
              <Field label="분실 장소" name="lostPlace" placeholder="입력해주세요" />
            </Section>

            <Section title="소유자 정보">
              <Field label="소유자" name="owner" placeholder="이름을 입력해주세요" />
              <Field label="소유자 연락처" name="ownerContact" placeholder="010-0000-0000"
                format={formatPhone} inputMode="numeric" />
              <Field label="처리일" name="processedDate" type="date" />
              <Field label="확인자" name="checkerId" type="select" numeric placeholder="--선택--"
                options={users.map((u) => ({ value: u.id, label: u.name }))} />
            </Section>
          </div>

          <ActionBar message={error}>
            {readOnly ? (
              <>
                <button type="button" className="btn" onClick={() => navigate("/")}>목록</button>
                <button type="button" className="btn primary"
                  onClick={() => navigate(`/lost/${manageNo}/edit`)}>수정</button>
              </>
            ) : (
              <>
                <button type="button" className="btn" disabled={sending}
                  onClick={() => navigate(isNew ? "/" : `/lost/${manageNo}`)}>취소</button>
                {!isNew && (
                  <button type="button" className="btn danger" disabled={sending}
                    onClick={handleDelete}>삭제</button>
                )}
                <button type="submit" className="btn primary" disabled={sending}>
                  {sending ? "저장 중..." : isNew ? "등록" : "저장"}
                </button>
              </>
            )}
          </ActionBar>
        </form>
      </RecordFormContext.Provider>
    </div>
  );
}
