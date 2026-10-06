import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { foundApi } from "../data/records";
import { useReference, nameOf, selectOptions, byCode } from "../referenceContext";
import { useAsync } from "../useAsync";
import { toMessage } from "../api/client";
import { LoadingBox, ErrorBox } from "../components/StatusBox";
import { today } from "../dateUtil";
import { useRecordForm } from "../useRecordForm";
import { RecordFormContext } from "../formContext";
import PageHeader from "../components/PageHeader";
import ManageNoBadge from "../components/ManageNoBadge";
import Section from "../components/Section";
import Field from "../components/Field";
import ActionBar from "../components/ActionBar";
import NotFoundBox from "../components/NotFoundBox";

const REQUIRED = [
  ["receiverName", "수령자 이름을 입력하세요."],
  ["returnDate", "수령일을 입력하세요."],
  ["verifyMethod", "확인 방법을 입력하세요."],
];

/**
 * 반환 처리 화면.
 * 저장하면 수령자 정보와 함께 처리상태를 반환으로 바꾸고 처리일에 수령일을 넣는다.
 */
export default function FoundReturnPage() {
  const navigate = useNavigate();
  const { manageNo } = useParams();
  const { data, loading, error, reload } = useAsync(() => foundApi.get(manageNo), [manageNo]);

  if (loading) return <LoadingBox />;
  if (error) {
    return (
      <ErrorBox message={error} onRetry={reload}>
        <button className="btn" onClick={() => navigate("/found")}>목록으로</button>
      </ErrorBox>
    );
  }
  return <ReturnForm manageNo={manageNo} saved={data} />;
}

function ReturnForm({ manageNo, saved }) {
  const navigate = useNavigate();
  const ref = useReference();
  const [sending, setSending] = useState(false);
  // 반환 상태는 이름이 아니라 code 로 찾는다.
  const done = byCode(ref.results, "RETURNED", "반환");

  const recordForm = useRecordForm(() => ({
    receiverNo: saved?.receiverNo ?? "",
    receiverName: saved?.receiverName ?? "",
    returnDate: saved?.returnDate || today(),
    verifyMethod: saved?.verifyMethod ?? "",
    verifyCheckerId: saved?.verifyCheckerId || ref.me.id,
  }));
  const { form, error, setError, checkRequired } = recordForm;

  if (!saved) return <NotFoundBox manageNo={manageNo} backTo="/found" />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending || !checkRequired(REQUIRED)) return;
    setSending(true);
    try {
      // 반환 정보와 함께 처리상태·처리일을 한 번에 보낸다.
      await foundApi.update(manageNo, saved, {
        ...saved, ...form,
        resultId: done?.id ?? saved.resultId,
        processedDate: form.returnDate,
      });
      navigate(`/found/${manageNo}`, { replace: true });
    } catch (err) {
      setError(toMessage(err, "반환 처리를 저장하지 못했습니다."));
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader title="반환 처리" sub="물건을 돌려줄 때 수령자를 기록합니다" />
      <ManageNoBadge manageNo={manageNo} />

      <RecordFormContext.Provider value={{ ...recordForm, readOnly: false }}>
        <form onSubmit={handleSubmit}>
          <div className="record-sections narrow">
            {/* 어떤 물건인지 먼저 보여 준다 */}
            <RecordFormContext.Provider value={{ form: saved, setField: () => {}, readOnly: true }}>
              <Section title="반환할 물건">
                <Field label="물품명" name="itemName" />
                <Field label="물품 구분" type="computed"
                  value={nameOf(ref.categories, saved.categoryId)} />
                <Field label="보관장소" type="computed"
                  value={[nameOf(ref.storagePlaces, saved.storagePlaceId), saved.storageDetail]
                    .filter(Boolean).join(" ")} />
              </Section>
            </RecordFormContext.Provider>

            <Section title="수령자 정보">
              <Field label="수령자 학번" name="receiverNo" placeholder="학번 또는 교직원번호" />
              <Field label="수령자 이름" name="receiverName" required placeholder="이름을 입력하세요" />
              <Field label="수령일" name="returnDate" type="date" required />
            </Section>

            <Section title="확인 정보" cols={2}>
              <Field label="확인 방법" name="verifyMethod" required
                placeholder="예) 학생증 확인, 본인 진술" full />
              <Field label="확인담당자" name="verifyCheckerId" type="select" numeric
                options={selectOptions(ref.users.map((u) => ({ ...u, is_active: true })), form.verifyCheckerId)} />
            </Section>

            <p className="hint-line">
              반환 처리를 하면 처리상태가 <b>{done?.name ?? "반환"}</b> 으로 바뀌고 처리일에 수령일이 들어갑니다.
            </p>
          </div>

          <ActionBar message={error}>
            <button type="button" className="btn"
              onClick={() => navigate(`/found/${manageNo}`)}>취소</button>
            <button type="submit" className="btn primary" disabled={sending}>
              {sending ? "저장 중..." : "반환 처리"}
            </button>
          </ActionBar>
        </form>
      </RecordFormContext.Provider>
    </>
  );
}
