import { useNavigate, useParams } from "react-router-dom";
import {
  addFoundItem, getFoundItem, updateFoundItem, deleteFoundItem, peekFoundManageNo,
} from "../storage";
import {
  itemCategoryTable, processResultTable, selectOptions,
  computeDeadline, getDefaultResultId, getExpireAction,
} from "../settings";
import { STAFF_NAMES, CONTACTED_OPTIONS, DEFAULT_STORAGE_PLACE, toOptions } from "../constants";
import { formatPhone } from "../imageUtil";
import { today } from "../dateUtil";
import { useRecordForm } from "../useRecordForm";
import { RecordFormContext } from "../formContext";
import PageHeader from "../components/PageHeader";
import ManageNoBadge from "../components/ManageNoBadge";
import PhotoCard from "../components/PhotoCard";
import Section from "../components/Section";
import Field from "../components/Field";
import ActionBar from "../components/ActionBar";
import NotFoundBox from "../components/NotFoundBox";

/** 새 접수 화면의 초기값. 물품구분·처리결과는 이름이 아니라 id 로 담는다. */
function emptyForm() {
  return {
    receivedDate: today(), foundDate: today(), category_id: "", itemName: "",
    feature: "", lostPlace: "", storagePlace: DEFAULT_STORAGE_PLACE,
    owner: "", ownerContact: "", contacted: CONTACTED_OPTIONS[0],
    result_id: getDefaultResultId(), checker: "", image: "",
  };
}

/** 필수 입력 항목과 안내 문구 */
const REQUIRED_FIELDS = [
  ["category_id", "물품 구분을 선택하세요."],
  ["itemName", "물품명을 입력하세요."],
  ["receivedDate", "접수일을 입력하세요."],
  ["foundDate", "습득일을 입력하세요."],
];

/**
 * 분실물관리대장 한 건의 상세 / 접수 / 수정 화면.
 * 세 화면은 배치가 같고, 상세(view)에서는 입력칸 대신 값만 보여 준다.
 * @param {"view"|"edit"} mode view = 상세, edit = 접수(관리번호 없음) 또는 수정
 */
export default function FoundItemPage({ mode }) {
  const navigate = useNavigate();
  const { manageNo } = useParams();
  const isNew = !manageNo;
  const readOnly = mode === "view";
  const saved = isNew ? null : getFoundItem(manageNo);

  const recordForm = useRecordForm(() => saved ?? emptyForm());
  const { form, error, handleImage, removeImage, checkRequired } = recordForm;

  // 보관기한은 계산 시점에 확정해 레코드에 저장한다(규칙 3).
  // 수정 화면에서는 접수일·물품구분이 실제로 바뀌었을 때만 다시 계산하고,
  // 그렇지 않으면 저장돼 있던 기한을 그대로 둔다.
  // (그래서 보관기간 설정을 바꿔도 기존 건의 기한은 변하지 않는다.)
  const deadlineInputsKept = saved
    && saved.receivedDate === form.receivedDate
    && Number(saved.category_id) === Number(form.category_id);
  const deadline = deadlineInputsKept
    ? saved.deadline
    : computeDeadline(form.receivedDate, form.category_id);

  // 기간 만료 시 조치 방법은 지금의 설정값을 보여 준다(앞으로 취할 조치이므로).
  const expireAction = getExpireAction(form.category_id);

  if (!isNew && !saved) return <NotFoundBox manageNo={manageNo} />;

  function handleSubmit(e) {
    e.preventDefault();
    if (!checkRequired(REQUIRED_FIELDS)) return;

    const data = { ...form, category_id: Number(form.category_id), deadline };
    if (isNew) {
      addFoundItem(data);
      navigate("/", { replace: true });
    } else {
      updateFoundItem(manageNo, data);
      navigate(`/found/${manageNo}`, { replace: true });
    }
  }

  function handleDelete() {
    if (window.confirm(`관리번호 ${manageNo} 건을 삭제하시겠습니까?`)) {
      deleteFoundItem(manageNo);
      navigate("/");
    }
  }

  const title = readOnly ? "분실물 상세" : isNew ? "분실물 접수" : "분실물 수정";

  return (
    <div className="page form-page">
      <PageHeader title={title} />
      <ManageNoBadge manageNo={isNew ? peekFoundManageNo() : manageNo} />

      <RecordFormContext.Provider value={{ ...recordForm, readOnly }}>
        <form onSubmit={handleSubmit}>
          <div className="record-layout">
            <PhotoCard image={form.image}
              onPick={readOnly ? undefined : handleImage} onRemove={removeImage} />

            <div className="record-sections">
              <Section title="물품 정보" cols={2}>
                <Field label="물품 구분" name="category_id" type="select" numeric
                  placeholder="선택하세요"
                  options={selectOptions(itemCategoryTable, form.category_id)} />
                <Field label="물품명" name="itemName" placeholder="예) 신분증, 카드지갑, 텀블러 등" />
                <Field label="특징" name="feature" placeholder="입력해주세요" full />
                <Field label="분실 장소" name="lostPlace" placeholder="입력해주세요" />
                <Field label="보관 장소" name="storagePlace" placeholder="입력해주세요" />
              </Section>

              <Section title="습득 정보">
                <Field label="접수일" name="receivedDate" type="date" />
                <Field label="습득일" name="foundDate" type="date" />
                <Field label="보관기간" type="computed" value={deadline} placeholder="자동 계산" />
              </Section>

              <Section title="소유자 및 처리정보">
                <Field label="소유자" name="owner" placeholder="이름을 입력해주세요" />
                <Field label="소유자 연락처" name="ownerContact" placeholder="010-0000-0000"
                  format={formatPhone} inputMode="numeric" />
                <Field label="연락 여부" name="contacted" type="select"
                  options={toOptions(CONTACTED_OPTIONS)} />
                <Field label="처리결과" name="result_id" type="select" numeric
                  options={selectOptions(processResultTable, form.result_id)} />
                <Field label="기간 만료 시 조치 방법" type="computed" value={expireAction}
                  placeholder="물품 구분 선택 시 표시" />
                <Field label="확인자" name="checker" type="select" placeholder="--선택--"
                  options={toOptions(STAFF_NAMES)} />
              </Section>
            </div>
          </div>

          <ActionBar message={error}>
            {readOnly ? (
              <>
                <button type="button" className="btn" onClick={() => navigate("/")}>목록</button>
                <button type="button" className="btn primary"
                  onClick={() => navigate(`/found/${manageNo}/edit`)}>수정</button>
              </>
            ) : (
              <>
                <button type="button" className="btn"
                  onClick={() => navigate(isNew ? "/" : `/found/${manageNo}`)}>취소</button>
                {!isNew && (
                  <button type="button" className="btn danger" onClick={handleDelete}>삭제</button>
                )}
                <button type="submit" className="btn primary">{isNew ? "등록" : "저장"}</button>
              </>
            )}
          </ActionBar>
        </form>
      </RecordFormContext.Provider>
    </div>
  );
}
