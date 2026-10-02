import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { foundApi } from "../data/records";
import { useReference, nameOf, selectOptions } from "../referenceContext";
import { CONTACTED_OPTIONS, FINDER_TYPES, toOptions } from "../constants";
import { formatPhone } from "../formatUtil";
import { today, previewDeadline } from "../dateUtil";
import { useRecordForm } from "../useRecordForm";
import { RecordFormContext } from "../formContext";
import PageHeader from "../components/PageHeader";
import ManageNoBadge from "../components/ManageNoBadge";
import PhotoBox from "../components/PhotoBox";
import Section from "../components/Section";
import Field from "../components/Field";
import ActionBar from "../components/ActionBar";
import StatusPill from "../components/StatusPill";
import NotFoundBox from "../components/NotFoundBox";

/** 새 접수 화면의 첫 값 */
function emptyForm(manageNo, meId, keepStatusId) {
  return {
    manageNo, receivedDate: today(),
    categoryId: "", itemName: "", feature: "",
    foundDate: today(), foundBuildingId: "", foundPlaceDetail: "",
    storagePlaceId: "", storageDetail: "", deadline: "",
    finderType: FINDER_TYPES[0], finderNo: "", finderName: "", finderContact: "",
    ownerName: "", ownerContact: "", contacted: CONTACTED_OPTIONS[0],
    resultId: keepStatusId, expireAction: "", processedDate: "", checkerId: meId, note: "",
    receiverNo: "", receiverName: "", returnDate: "", verifyMethod: "", verifyCheckerId: "",
    images: [],
  };
}

const REQUIRED = [
  ["categoryId", "물품 구분을 고르세요."],
  ["itemName", "물품명을 입력하세요."],
  ["receivedDate", "접수일을 입력하세요."],
  ["foundDate", "습득일을 입력하세요."],
  ["foundBuildingId", "습득장소를 고르세요."],
  ["storagePlaceId", "보관장소를 고르세요."],
  ["finderType", "습득자 구분을 고르세요."],
  ["resultId", "처리상태를 고르세요."],
];

/**
 * 분실물 한 건의 상세 / 접수 / 수정 화면.
 * 세 화면이 같은 배치를 쓰고, 상세에서는 입력칸 대신 값만 보여 준다.
 * @param {"view"|"edit"} mode
 */
export default function FoundItemPage({ mode }) {
  const navigate = useNavigate();
  const { manageNo } = useParams();
  const ref = useReference();
  const isNew = !manageNo;
  const readOnly = mode === "view";

  const saved = isNew ? null : foundApi.get(manageNo);
  const keepStatusId = ref.results.find((r) => r.name.includes("보관"))?.id ?? ref.results[0]?.id ?? "";
  const [newNo] = useState(() => (isNew ? foundApi.nextManageNo() : ""));

  const recordForm = useRecordForm(() => saved ?? emptyForm(newNo, ref.me.id, keepStatusId));
  const { form, setField, error, setError, checkRequired } = recordForm;

  if (!isNew && !saved) return <NotFoundBox manageNo={manageNo} backTo="/found" />;

  // 보관만료일: 습득일 + 물품 구분의 보관 개월. 저장할 때 같이 적어 둔다.
  const category = ref.categories.find((c) => c.id === Number(form.categoryId));
  const deadline = previewDeadline(form.foundDate, Number(category?.storage_months));
  const expireAction = category?.expire_action ?? "";

  // 습득자 구분에 따라 번호 칸의 이름이 바뀌고, 외부인·기타는 번호를 받지 않는다.
  const numberLabel = form.finderType === "교직원" ? "교직원번호" : "학번";
  const needNumber = form.finderType === "학생" || form.finderType === "교직원";

  const returned = Boolean(form.returnDate);

  function handleSubmit(e) {
    e.preventDefault();
    if (!checkRequired(REQUIRED)) return;
    const data = { ...form, deadline, expireAction };
    try {
      if (isNew) {
        const created = foundApi.create(data);
        navigate(`/found/${created.manageNo}`, { replace: true });
      } else {
        foundApi.update(manageNo, data);
        navigate(`/found/${manageNo}`, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDelete() {
    if (!window.confirm(`관리번호 ${manageNo} 건을 지우시겠습니까?`)) return;
    foundApi.remove(manageNo);
    navigate("/found", { replace: true });
  }

  const title = readOnly ? "분실물 상세" : isNew ? "분실물 접수" : "분실물 수정";

  return (
    <>
      <PageHeader title={title} />
      <ManageNoBadge manageNo={form.manageNo}>
        {readOnly && <StatusPill name={nameOf(ref.results, form.resultId)} />}
      </ManageNoBadge>

      <RecordFormContext.Provider value={{ ...recordForm, readOnly }}>
        <form onSubmit={handleSubmit}>
          <div className="record-layout">
            <PhotoBox photos={form.images}
              onChange={readOnly ? undefined : (list) => setField("images", list)} />

            <div className="record-sections">
              <Section title="기본 정보" cols={3}>
                <Field label="접수일" name="receivedDate" type="date" required />
                <Field label="접수담당자" type="computed"
                  value={nameOf(ref.users, form.checkerId)} placeholder="로그인한 담당자" />
              </Section>

              <Section title="물품 정보" cols={2}>
                <Field label="물품 구분" name="categoryId" type="select" numeric required
                  placeholder="선택하세요" options={selectOptions(ref.categories, form.categoryId)} />
                <Field label="물품명" name="itemName" required placeholder="예) 신분증, 카드지갑, 텀블러" />
                <Field label="특징" name="feature" placeholder="입력해주세요" full />
              </Section>

              <Section title="습득 정보">
                <Field label="습득일" name="foundDate" type="date" required />
                <Field label="습득장소" name="foundBuildingId" type="select" numeric required
                  placeholder="건물 선택" options={selectOptions(ref.buildings, form.foundBuildingId)} />
                <Field label="습득장소 상세" name="foundPlaceDetail" placeholder="예) 2층 복도 자판기 앞" />
              </Section>

              <Section title="보관 정보">
                <Field label="보관장소" name="storagePlaceId" type="select" numeric required
                  placeholder="보관장소 선택" options={selectOptions(ref.storagePlaces, form.storagePlaceId)} />
                <Field label="보관 세부" name="storageDetail" placeholder="예) A-03" />
                <Field label="보관만료일" type="computed"
                  value={readOnly ? form.deadline : deadline} placeholder="자동 계산" />
              </Section>

              <Section title="습득자 정보">
                <Field label="습득자 구분" name="finderType" type="select" required
                  options={toOptions(FINDER_TYPES)} />
                {needNumber
                  ? <Field label={numberLabel} name="finderNo" placeholder={`${numberLabel}를 입력하세요`} />
                  : <Field label="번호" type="computed" value="" placeholder="외부인·기타는 받지 않음" />}
                <Field label="성명" name="finderName" placeholder="이름을 입력하세요" />
                <Field label="연락처" name="finderContact" format={formatPhone}
                  inputMode="numeric" placeholder="010-0000-0000" />
              </Section>

              <Section title="분실자 정보">
                <Field label="분실자" name="ownerName" placeholder="이름을 입력하세요" />
                <Field label="연락처" name="ownerContact" format={formatPhone}
                  inputMode="numeric" placeholder="010-0000-0000" />
                <Field label="연락 여부" name="contacted" type="select" options={toOptions(CONTACTED_OPTIONS)} />
              </Section>

              <Section title="관리 정보">
                <Field label="처리상태" name="resultId" type="select" numeric required
                  options={selectOptions(ref.results, form.resultId)} />
                <Field label="만료 시 조치 방법" type="computed"
                  value={readOnly ? form.expireAction : expireAction} placeholder="물품 구분을 고르면 표시" />
                <Field label="처리일" name="processedDate" type="date" />
                <Field label="비고" name="note" placeholder="특이사항이 있으면 입력하세요" full />
              </Section>

              {/* 반환이 끝난 건에만 보여 준다 */}
              {returned && (
                <Section title="반환 정보">
                  <Field label="수령자 학번" type="computed" value={form.receiverNo} placeholder="-" />
                  <Field label="수령자 이름" type="computed" value={form.receiverName} placeholder="-" />
                  <Field label="수령일" type="computed" value={form.returnDate} placeholder="-" />
                  <Field label="확인 방법" type="computed" value={form.verifyMethod} placeholder="-" />
                  <Field label="확인담당자" type="computed"
                    value={nameOf(ref.users, form.verifyCheckerId)} placeholder="-" />
                </Section>
              )}
            </div>
          </div>

          <ActionBar message={error}>
            {readOnly ? (
              <>
                <button type="button" className="btn" onClick={() => navigate("/found")}>목록</button>
                {!returned && (
                  <button type="button" className="btn"
                    onClick={() => navigate(`/found/${manageNo}/return`)}>반환 처리</button>
                )}
                <button type="button" className="btn primary"
                  onClick={() => navigate(`/found/${manageNo}/edit`)}>수정</button>
              </>
            ) : (
              <>
                <button type="button" className="btn"
                  onClick={() => navigate(isNew ? "/found" : `/found/${manageNo}`)}>취소</button>
                {!isNew && <button type="button" className="btn danger" onClick={handleDelete}>삭제</button>}
                <button type="submit" className="btn primary">{isNew ? "등록" : "저장"}</button>
              </>
            )}
          </ActionBar>
        </form>
      </RecordFormContext.Provider>
    </>
  );
}
