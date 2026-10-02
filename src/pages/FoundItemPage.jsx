import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { foundItemApi } from "../api/records";
import { toMessage, imageUrl } from "../api/client";
import { uploadImage } from "../api/uploads";
import { checkImageFile, shrinkImage } from "../imageFile";
import { useReference, selectOptions } from "../referenceContext";
import { useAsync } from "../useAsync";
import { CONTACTED_OPTIONS, DEFAULT_STORAGE_PLACE, toOptions } from "../constants";
import { formatPhone } from "../formatUtil";
import { today, previewDeadline } from "../dateUtil";
import { useRecordForm } from "../useRecordForm";
import { RecordFormContext } from "../formContext";
import PageHeader from "../components/PageHeader";
import ManageNoBadge from "../components/ManageNoBadge";
import PhotoCard from "../components/PhotoCard";
import Section from "../components/Section";
import Field from "../components/Field";
import ActionBar from "../components/ActionBar";
import { LoadingBox, ErrorBox } from "../components/StatusBox";

/** 새 접수 화면의 초기값. 물품구분·처리결과·확인자는 이름이 아니라 서버의 id 로 담는다. */
function emptyForm(manageNo, defaultResultId, meId) {
  return {
    manageNo,
    receivedDate: today(), foundDate: today(), categoryId: "", itemName: "",
    feature: "", lostPlace: "", storagePlace: DEFAULT_STORAGE_PLACE,
    owner: "", ownerContact: "", contacted: CONTACTED_OPTIONS[0],
    resultId: defaultResultId, processedDate: "", checkerId: meId, imagePath: "",
  };
}

/** 필수 입력 항목과 안내 문구 (서버가 요구하는 항목과 같다) */
const REQUIRED_FIELDS = [
  ["categoryId", "물품 구분을 선택하세요."],
  ["itemName", "물품명을 입력하세요."],
  ["receivedDate", "접수일을 입력하세요."],
  ["foundDate", "습득일을 입력하세요."],
  ["resultId", "처리결과를 선택하세요."],
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

  // 기존 건이면 서버에서 한 건을 받아오고, 새 건이면 다음 관리번호를 받아온다.
  const { data, loading, error, reload } = useAsync(
    () => (isNew ? foundItemApi.nextManageNo() : foundItemApi.get(manageNo)),
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

  return <FoundItemForm mode={mode} manageNo={manageNo} saved={isNew ? null : data}
    newManageNo={isNew ? data : ""} />;
}

function FoundItemForm({ mode, manageNo, saved, newManageNo }) {
  const navigate = useNavigate();
  const { categories, results, users, me } = useReference();
  const [sending, setSending] = useState(false);
  const [photo, setPhoto] = useState({ uploading: false, message: "" });

  const isNew = !saved;
  const readOnly = mode === "view";
  const defaultResultId = results.find((r) => r.is_active)?.id ?? "";

  const recordForm = useRecordForm(() =>
    saved ?? emptyForm(newManageNo, defaultResultId, me?.id ?? ""));
  const { form, error, setError, checkRequired } = recordForm;

  // 보관기한은 서버가 습득일 + 물품구분의 보관개월로 계산해 저장한다.
  // 저장 전에는 같은 규칙으로 미리 계산해 보여 주고, 저장된 건은 서버 값을 그대로 쓴다.
  const category = categories.find((c) => c.id === Number(form.categoryId));
  const deadline = saved && saved.categoryId === form.categoryId && saved.foundDate === form.foundDate
    ? saved.deadline
    : previewDeadline(form.foundDate, Number(category?.storage_months));

  /**
   * 고른 사진을 올리고 그 경로를 폼에 담는다.
   * 올리기 전에 크기를 줄여 전송량을 아끼고, 브라우저가 열지 못하는 형식이면
   * (예: 크롬에서 아이폰 HEIC) 원본을 그대로 올린다.
   */
  async function handlePickPhoto(file) {
    const problem = checkImageFile(file);
    if (problem) return setPhoto({ uploading: false, message: problem });

    setPhoto({ uploading: true, message: "" });
    try {
      const shrunk = await shrinkImage(file);
      const imagePath = await uploadImage(shrunk ?? file);
      recordForm.setField("imagePath", imagePath);
      setPhoto({
        uploading: false,
        message: shrunk ? "" : "이 형식은 브라우저에 따라 미리보기가 보이지 않을 수 있습니다.",
      });
    } catch (err) {
      setPhoto({ uploading: false, message: toMessage(err, "사진을 올리지 못했습니다.") });
    }
  }

  /** 사진을 떼어 낸다. 서버의 파일은 지우지 않는다(다른 글이 쓰고 있을 수 있다). */
  function handleRemovePhoto() {
    recordForm.setField("imagePath", "");
    setPhoto({ uploading: false, message: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending || photo.uploading || !checkRequired(REQUIRED_FIELDS)) return;
    setSending(true);
    try {
      if (isNew) {
        const created = await foundItemApi.create(form);
        navigate(`/found/${created.manageNo}`, { replace: true });
      } else {
        await foundItemApi.update(manageNo, saved, form);
        navigate(`/found/${form.manageNo}`, { replace: true });
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
      await foundItemApi.remove(manageNo);
      navigate("/", { replace: true });
    } catch (err) {
      setError(toMessage(err, "삭제하지 못했습니다."));
      setSending(false);
    }
  }

  const title = readOnly ? "분실물 상세" : isNew ? "분실물 접수" : "분실물 수정";

  return (
    <div className="page form-page">
      <PageHeader title={title} />
      <ManageNoBadge manageNo={form.manageNo} />

      <RecordFormContext.Provider value={{ ...recordForm, readOnly }}>
        <form onSubmit={handleSubmit}>
          <div className="record-layout">
            <PhotoCard imageSrc={imageUrl(form.imagePath)}
              onPick={readOnly ? undefined : handlePickPhoto}
              onRemove={handleRemovePhoto}
              uploading={photo.uploading}
              error={photo.message} />

            <div className="record-sections">
              <Section title="물품 정보" cols={2}>
                <Field label="물품 구분" name="categoryId" type="select" numeric
                  placeholder="선택하세요"
                  options={selectOptions(categories, form.categoryId)} />
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
                <Field label="처리결과" name="resultId" type="select" numeric
                  options={selectOptions(results, form.resultId)} />
                <Field label="기간 만료 시 조치 방법" type="computed"
                  value={category?.expire_action ?? ""} placeholder="물품 구분 선택 시 표시" />
                <Field label="처리일" name="processedDate" type="date" />
                <Field label="확인자" name="checkerId" type="select" numeric placeholder="--선택--"
                  options={users.map((u) => ({ value: u.id, label: u.name }))} />
                <Field label="사진 경로" type="computed" value={form.imagePath}
                  placeholder="사진을 올리면 자동 입력" />
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
                <button type="button" className="btn" disabled={sending}
                  onClick={() => navigate(isNew ? "/" : `/found/${manageNo}`)}>취소</button>
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
