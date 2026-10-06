import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { foundApi } from "../data/records";
import { toMessage } from "../api/client";
import { useReference, nameOf, selectOptions, byCode } from "../referenceContext";
import { useAsync } from "../useAsync";
import { LoadingBox, ErrorBox } from "../components/StatusBox";
import { CONTACTED_OPTIONS, FINDER_TYPES, toOptions } from "../constants";
import { formatPhone } from "../formatUtil";
import { today, previewDeadline, daysLeft } from "../dateUtil";
import { useRecordForm } from "../useRecordForm";
import { RecordFormContext } from "../formContext";
import PageHeader from "../components/PageHeader";
import PhotoBox from "../components/PhotoBox";
import StatusPill from "../components/StatusPill";
import NotFoundBox from "../components/NotFoundBox";
import FormField, { FormRow } from "../components/FormField";
import { TextInput, TextArea, DateInput, SelectInput, RadioGroup, ReadOnlyBox } from "../components/inputs";
import { CalendarIcon } from "../components/icons";

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
  ["foundBuildingId", "습득 장소를 고르세요."],
  ["storagePlaceId", "보관 장소를 고르세요."],
  ["finderType", "습득자 구분을 고르세요."],
  ["resultId", "처리 상태를 고르세요."],
];

/**
 * 분실물 한 건의 상세 / 접수 / 수정 화면.
 * 세 화면이 같은 배치를 쓰고, 상세에서는 입력칸 자리에 값만 보여 준다.
 * @param {"view"|"edit"} mode
 */
export default function FoundItemPage({ mode }) {
  const navigate = useNavigate();
  const { manageNo } = useParams();
  const isNew = !manageNo;

  // 기존 건이면 그 한 건을, 새 건이면 미리 보여줄 관리번호를 받아온다.
  // 관리번호는 저장할 때 서버가 정하므로, 못 받아와도 화면은 열린다.
  const { data, loading, error, reload } = useAsync(
    () => (isNew ? foundApi.nextManageNo().catch(() => "") : foundApi.get(manageNo)),
    [manageNo]
  );

  if (loading) return <LoadingBox />;
  if (error) {
    return (
      <ErrorBox message={error} onRetry={reload}>
        <button className="btn" onClick={() => navigate("/found")}>목록으로</button>
      </ErrorBox>
    );
  }

  return <FoundItemForm mode={mode} manageNo={manageNo}
    saved={isNew ? null : data} newNo={isNew ? data : ""} />;
}

function FoundItemForm({ mode, manageNo, saved, newNo }) {
  const navigate = useNavigate();
  const ref = useReference();
  const [sending, setSending] = useState(false);
  const isNew = !saved;
  const readOnly = mode === "view";

  // 처리상태는 이름이 아니라 code 로 찾는다. 관리자가 이름을 바꿔도 흔들리지 않는다.
  const keepStatusId = byCode(ref.results, "STORED", "보관")?.id ?? ref.results[0]?.id ?? "";
  const blank = () => emptyForm(newNo, ref.me.id, keepStatusId);

  const recordForm = useRecordForm(() => saved ?? blank());
  const { form, setField, setForm, error, setError, checkRequired } = recordForm;

  if (!isNew && !saved) return <NotFoundBox manageNo={manageNo} backTo="/found" />;

  // 보관 만료일: 습득일 + 물품 구분의 보관 개월. 저장할 때 함께 적어 둔다.
  const category = ref.categories.find((c) => c.id === Number(form.categoryId));
  const months = Number(category?.storage_months) || 0;
  const deadline = readOnly ? form.deadline : previewDeadline(form.foundDate, months);
  const expireAction = readOnly ? form.expireAction : (category?.expire_action ?? "");
  const left = daysLeft(deadline);

  // 습득자 구분에 따라 번호 칸 이름이 바뀌고, 외부인·기타는 번호를 받지 않는다.
  const numberLabel = form.finderType === "교직원" ? "교직원번호" : "학번";
  const needNumber = form.finderType === "학생" || form.finderType === "교직원";
  const returned = Boolean(form.returnDate);

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending || !checkRequired(REQUIRED)) return;
    setSending(true);
    try {
      if (isNew) {
        const created = await foundApi.create(form);
        navigate(`/found/${created.manageNo}`, { replace: true });
      } else {
        await foundApi.update(manageNo, saved, form);
        navigate(`/found/${manageNo}`, { replace: true });
      }
    } catch (err) {
      setError(toMessage(err, "저장하지 못했습니다."));
      setSending(false);
    }
  }

  function handleReset() {
    if (!window.confirm("입력한 내용을 모두 지우고 처음 상태로 되돌립니다. 계속할까요?")) return;
    setForm(blank());
    setError("");
  }

  async function handleDelete() {
    if (!window.confirm(`관리번호 ${manageNo} 건을 지우시겠습니까?\n서버에서 완전히 지워집니다.`)) return;
    setSending(true);
    try {
      await foundApi.remove(manageNo);
      navigate("/found", { replace: true });
    } catch (err) {
      setError(toMessage(err, "삭제하지 못했습니다."));
      setSending(false);
    }
  }

  const title = readOnly ? "분실물 상세" : isNew ? "분실물 접수" : "분실물 수정";
  const titleSub = readOnly ? "등록된 분실물의 내용입니다."
    : isNew ? "습득한 분실물을 등록하여 관리하는 화면입니다." : "등록된 내용을 고칩니다.";

  return (
    <>
      <PageHeader title={title} sub={titleSub} />

      <RecordFormContext.Provider value={{ ...recordForm, readOnly }}>
        <form onSubmit={handleSubmit}>
          {/* 윗줄: 사진(두 칸에 걸침) · 기본/습득 · 물품/보관
              같은 줄의 카드는 높이가 같아져 아래 선이 맞는다. */}
          <div className="record-top">
            <PhotoBox photos={form.images}
              onChange={readOnly ? undefined : (list) => setField("images", list)} />

            <section className="card">
              <h2 className="card-title">기본 정보</h2>
              <div className="form-rows">
                <FormRow>
                  <FormField label="관리번호">
                    <ReadOnlyBox value={form.manageNo} muted />
                    <span className="tagline small">{isNew ? "자동생성" : "고정"}</span>
                  </FormField>
                </FormRow>
                <FormRow>
                  <FormField label="접수일" required><DateInput name="receivedDate" /></FormField>
                </FormRow>
                <FormRow>
                  <FormField label="접수 담당자">
                    <ReadOnlyBox value={nameOf(ref.users, form.checkerId)} muted
                      placeholder="로그인한 담당자" />
                  </FormField>
                </FormRow>
              </div>
            </section>

            <section className="card">
              <h2 className="card-title">물품 정보</h2>
              <div className="form-rows">
                <FormRow>
                  <FormField label="물품 구분" required>
                    <SelectInput name="categoryId" numeric placeholder="선택하세요"
                      options={selectOptions(ref.categories, form.categoryId)} />
                  </FormField>
                </FormRow>
                <FormRow>
                  <FormField label="물품명" required>
                    <TextInput name="itemName" placeholder="예) 신분증, 카드지갑, 텀블러" />
                  </FormField>
                </FormRow>
                <FormRow>
                  <FormField label="특징">
                    <TextArea name="feature" placeholder="색상, 상표, 흠집 등 알아볼 수 있는 내용" />
                  </FormField>
                </FormRow>
              </div>
            </section>

            <section className="card">
              <h2 className="card-title">습득 정보</h2>
              <div className="form-rows">
                <FormRow>
                  <FormField label="습득일" required><DateInput name="foundDate" /></FormField>
                </FormRow>
                <FormRow>
                  <FormField label="습득 장소" required>
                    <SelectInput name="foundBuildingId" numeric placeholder="건물 선택"
                      options={selectOptions(ref.buildings, form.foundBuildingId)} />
                    <TextInput name="foundPlaceDetail" placeholder="예) 2층 복도 자판기 앞" />
                  </FormField>
                </FormRow>
              </div>
            </section>

            <section className="card">
              <h2 className="card-title">보관 정보</h2>
              <div className="form-rows">
                <FormRow>
                  <FormField label="보관 장소" required>
                    <SelectInput name="storagePlaceId" numeric placeholder="보관 장소 선택"
                      options={selectOptions(ref.storagePlaces, form.storagePlaceId)} />
                    <TextInput name="storageDetail" placeholder="예) A-03" />
                  </FormField>
                </FormRow>
                <FormRow>
                  <FormField label="보관 만료일">
                    <ReadOnlyBox value={deadline} muted placeholder="물품 구분을 고르면 자동 계산" />
                  </FormField>
                </FormRow>
              </div>
              {/* 보관 기간 요약 */}
              <div className="storage-summary">
                <CalendarIcon />
                <b>보관 기간 : {months ? `${months}개월` : "-"}</b>
                {left !== null && (
                  <span className="summary-left">
                    {left >= 0 ? `(잔여 ${left}일)` : `(기한 ${-left}일 지남)`}
                  </span>
                )}
                <span className="summary-note">보관기간은 물품 구분 설정에 따라 자동 계산됩니다.</span>
              </div>
            </section>
          </div>

          {/* 가운뎃줄: 습득자 · 관리 */}
          <div className="record-mid">
            <section className="card">
              <h2 className="card-title">습득자 정보</h2>
              <div className="form-rows">
                <FormRow>
                  <FormField label="습득자 구분" required>
                    <RadioGroup name="finderType" options={FINDER_TYPES} />
                  </FormField>
                </FormRow>
                <FormRow>
                  <FormField label={numberLabel}>
                    {needNumber
                      ? <TextInput name="finderNo" placeholder={`${numberLabel}를 입력하세요`} />
                      : <ReadOnlyBox value="" muted placeholder="외부인·기타는 받지 않음" />}
                  </FormField>
                  <FormField label="성명">
                    <TextInput name="finderName" placeholder="이름을 입력하세요" />
                  </FormField>
                </FormRow>
                <FormRow>
                  <FormField label="연락처">
                    <TextInput name="finderContact" format={formatPhone}
                      inputMode="numeric" placeholder="010-0000-0000" />
                  </FormField>
                </FormRow>
              </div>
            </section>

            <section className="card wide-label">
              <h2 className="card-title">관리 정보</h2>
              <div className="form-rows">
                <FormRow>
                  <FormField label="처리 상태" required>
                    {readOnly
                      ? <StatusPill name={nameOf(ref.results, form.resultId)} />
                      : <SelectInput name="resultId" numeric
                          options={selectOptions(ref.results, form.resultId)} />}
                  </FormField>
                </FormRow>
                <FormRow>
                  <FormField label="보관기간 만료 시 조치 방법">
                    <ReadOnlyBox value={expireAction} muted placeholder="물품 구분을 고르면 표시" />
                  </FormField>
                </FormRow>
                <FormRow>
                  <FormField label="처리일"><DateInput name="processedDate" /></FormField>
                </FormRow>
                <FormRow>
                  <FormField label="비고">
                    <TextArea name="note" placeholder="특이사항이 있으면 입력하세요" rows={2} />
                  </FormField>
                </FormRow>
              </div>
            </section>
          </div>

          {/* 분실자 정보 */}
          <section className="card">
            <h2 className="card-title">분실자 정보</h2>
            <div className="form-rows">
              <FormRow>
                <FormField label="분실자"><TextInput name="ownerName" placeholder="이름을 입력하세요" /></FormField>
                <FormField label="연락처">
                  <TextInput name="ownerContact" format={formatPhone}
                    inputMode="numeric" placeholder="010-0000-0000" />
                </FormField>
                <FormField label="연락 여부">
                  <SelectInput name="contacted" options={toOptions(CONTACTED_OPTIONS)} />
                </FormField>
              </FormRow>
            </div>
          </section>

          {/* 처리 이력 */}
          <HistoryCard item={form} users={ref.users} returned={returned} />

          {error && <p className="form-error bottom-error">{error}</p>}

          <div className="bottom-bar">
            <button type="button" className="btn" onClick={() => navigate("/found")}>목록으로</button>
            <div className="bottom-right">
              {readOnly ? (
                <>
                  {!returned && (
                    <button type="button" className="btn"
                      onClick={() => navigate(`/found/${manageNo}/return`)}>반환 처리</button>
                  )}
                  <button type="button" className="btn primary"
                    onClick={() => navigate(`/found/${manageNo}/edit`)}>수정</button>
                </>
              ) : isNew ? (
                <>
                  <button type="button" className="btn" onClick={handleReset}>초기화</button>
                  <button type="submit" className="btn primary" disabled={sending}>
                    {sending ? "저장 중..." : "접수 등록"}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn danger" disabled={sending} onClick={handleDelete}>삭제</button>
                  <button type="button" className="btn"
                    onClick={() => navigate(`/found/${manageNo}`)}>취소</button>
                  <button type="submit" className="btn primary" disabled={sending}>
                    {sending ? "저장 중..." : "저장"}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </RecordFormContext.Provider>
    </>
  );
}

/**
 * 처리 이력.
 * 따로 적어 두는 자료가 아니라 접수·반환 기록에서 만들어 보여 준다.
 */
function HistoryCard({ item, users, returned }) {
  const rows = [];
  if (item.receivedDate) {
    rows.push({ date: item.receivedDate, kind: "접수",
      text: `${item.itemName || "물품"} 접수`, who: item.checkerId });
  }
  if (returned) {
    rows.push({ date: item.returnDate, kind: "반환",
      text: `${item.receiverName || "수령자"} 수령 · ${item.verifyMethod || "확인"}`,
      who: item.verifyCheckerId });
  }

  return (
    <section className="card">
      <h2 className="card-title">처리 이력</h2>
      <table className="data-table history-table">
        <colgroup>
          <col style={{ width: "8%" }} /><col style={{ width: "16%" }} />
          <col style={{ width: "16%" }} /><col /><col style={{ width: "16%" }} />
        </colgroup>
        <thead>
          <tr><th>번호</th><th>처리일</th><th>처리구분</th><th>내용</th><th>담당자</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={5} className="empty-cell">아직 처리 이력이 없습니다.</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{row.date}</td>
              <td>{row.kind}</td>
              <td className="cell-left">{row.text}</td>
              <td>{nameOf(users, row.who) || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
