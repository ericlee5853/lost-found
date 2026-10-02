import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { foundApi } from "../data/records";
import { useReference, nameOf, selectOptions } from "../referenceContext";
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
  const ref = useReference();
  const saved = foundApi.get(manageNo);
  const [done] = useState(() => ref.results.find((r) => r.name.includes("반환")));

  const recordForm = useRecordForm(() => ({
    receiverNo: saved?.receiverNo ?? "",
    receiverName: saved?.receiverName ?? "",
    returnDate: saved?.returnDate || today(),
    verifyMethod: saved?.verifyMethod ?? "",
    verifyCheckerId: saved?.verifyCheckerId || ref.me.id,
  }));
  const { form, error, checkRequired } = recordForm;

  if (!saved) return <NotFoundBox manageNo={manageNo} backTo="/found" />;

  function handleSubmit(e) {
    e.preventDefault();
    if (!checkRequired(REQUIRED)) return;
    foundApi.update(manageNo, {
      ...form,
      resultId: done?.id ?? saved.resultId,
      processedDate: form.returnDate,
    });
    navigate(`/found/${manageNo}`, { replace: true });
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
            <button type="submit" className="btn primary">반환 처리</button>
          </ActionBar>
        </form>
      </RecordFormContext.Provider>
    </>
  );
}
