import { useNavigate, useParams } from "react-router-dom";
import {
  addLostReport, getLostReport, updateLostReport, deleteLostReport, peekLostManageNo,
} from "../storage";
import { itemCategoryTable, selectOptions } from "../settings";
import { STAFF_NAMES, PROCESS_STATUSES, toOptions } from "../constants";
import { formatPhone } from "../imageUtil";
import { today } from "../dateUtil";
import { useRecordForm } from "../useRecordForm";
import { RecordFormContext } from "../formContext";
import PageHeader from "../components/PageHeader";
import ManageNoBadge from "../components/ManageNoBadge";
import Section from "../components/Section";
import Field from "../components/Field";
import ActionBar from "../components/ActionBar";
import NotFoundBox from "../components/NotFoundBox";

/**
 * 새 분실 신고 화면의 초기값.
 * 물품구분은 이름이 아니라 id 로 담는다. 분실신고에는 사진을 붙이지 않는다.
 */
function emptyForm() {
  return {
    receivedDate: today(), foundDate: today(), category_id: "", itemName: "",
    feature: "", lostPlace: "", owner: "", ownerContact: "",
    status: PROCESS_STATUSES[0], processedDate: "", checker: "",
  };
}

/** 필수 입력 항목과 안내 문구 */
const REQUIRED_FIELDS = [
  ["category_id", "물품 구분을 선택하세요."],
  ["itemName", "물품명을 입력하세요."],
  ["receivedDate", "접수일을 입력하세요."],
  ["foundDate", "습득일을 입력하세요."],
  ["owner", "소유자를 입력하세요."],
  ["ownerContact", "소유자 연락처를 입력하세요."],
];

/**
 * 분실신고 관리대장 한 건의 상세 / 신고 / 수정 화면.
 * @param {"view"|"edit"} mode view = 상세, edit = 신고(관리번호 없음) 또는 수정
 */
export default function LostReportPage({ mode }) {
  const navigate = useNavigate();
  const { manageNo } = useParams();
  const isNew = !manageNo;
  const readOnly = mode === "view";
  const saved = isNew ? null : getLostReport(manageNo);

  const recordForm = useRecordForm(() => saved ?? emptyForm());
  const { form, error, checkRequired } = recordForm;

  if (!isNew && !saved) return <NotFoundBox manageNo={manageNo} />;

  function handleSubmit(e) {
    e.preventDefault();
    if (!checkRequired(REQUIRED_FIELDS)) return;

    const data = { ...form, category_id: Number(form.category_id) };
    if (isNew) {
      addLostReport(data);
      navigate("/", { replace: true });
    } else {
      updateLostReport(manageNo, data);
      navigate(`/lost/${manageNo}`, { replace: true });
    }
  }

  function handleDelete() {
    if (window.confirm(`관리번호 ${manageNo} 건을 삭제하시겠습니까?`)) {
      deleteLostReport(manageNo);
      navigate("/");
    }
  }

  const title = readOnly ? "분실 신고 상세" : isNew ? "분실 신고" : "분실 신고 수정";

  return (
    <div className="page form-page">
      <PageHeader title={title} />
      <ManageNoBadge manageNo={isNew ? peekLostManageNo() : manageNo} />

      <RecordFormContext.Provider value={{ ...recordForm, readOnly }}>
        <form onSubmit={handleSubmit}>
          <div className="record-sections">
            <Section title="물품 정보">
              <Field label="물품 구분" name="category_id" type="select" numeric
                placeholder="--선택--"
                options={selectOptions(itemCategoryTable, form.category_id)} />
              <Field label="물품명" name="itemName" placeholder="예) 신분증, 카드지갑, 텀블러 등" />
              <Field label="처리 상태" name="status" type="select"
                options={toOptions(PROCESS_STATUSES)} />
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
              <Field label="확인자" name="checker" type="select" placeholder="--선택--"
                options={toOptions(STAFF_NAMES)} />
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
                <button type="button" className="btn"
                  onClick={() => navigate(isNew ? "/" : `/lost/${manageNo}`)}>취소</button>
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
