// src/components/Field.jsx
// 카드 안의 "항목 이름 + 입력칸" 한 개.
// 폼 상태는 RecordFormContext 에서 꺼내 쓰고, readOnly 면 입력칸 대신 값을 보여 준다.
// 그래서 상세 화면과 접수·수정 화면이 같은 배치를 그대로 공유한다.

import { useRecordFormContext } from "../formContext";

/**
 * @param {string} label        항목 이름
 * @param {string} [name]       폼 값의 키 (computed 타입이면 생략)
 * @param {"text"|"date"|"select"|"computed"} [type] 입력 방식. computed 는 자동 계산값(수정 불가)
 * @param {{value, label}[]} [options] select 선택지
 * @param {string} [placeholder] 빈칸 안내 문구 (select 에서는 "선택 안 함" 항목 글자)
 * @param {boolean} [numeric]   select 값을 숫자(id)로 저장할지 여부
 * @param {function} [format]   입력값을 저장 전에 다듬는 함수 (예: 전화번호 하이픈)
 * @param {string} [value]      computed 타입에서 보여줄 값
 * @param {boolean} [full]      한 줄 전체 너비를 쓸지 여부
 * @param {string} [inputMode]  모바일 키패드 종류
 */
export default function Field({
  label, name, type = "text", options = [], placeholder,
  numeric, format, value, full, inputMode,
}) {
  const { form, setField, readOnly } = useRecordFormContext();
  const current = type === "computed" ? value : form[name];

  return (
    <div className={"field" + (full ? " full" : "")}>
      <label className="field-label">{label}</label>
      {readOnly || type === "computed"
        ? <ValueBox type={type} text={displayText(type, current, options)} placeholder={readOnly ? "-" : placeholder} />
        : <Control {...{ type, name, current, options, placeholder, numeric, format, inputMode, setField }} />}
    </div>
  );
}

/** 저장된 값을 사람이 읽는 글자로 바꾼다 (select 는 id → 이름). */
function displayText(type, current, options) {
  if (type === "select") {
    return options.find((o) => String(o.value) === String(current))?.label ?? "";
  }
  return current ?? "";
}

/** 읽기 전용 칸. 자동 계산 칸은 회색, 상세 화면 값은 흰 칸으로 보인다. */
function ValueBox({ type, text, placeholder }) {
  return (
    <div className={"input value-box" + (type === "computed" ? " computed" : "")}>
      {text || <span className="placeholder">{placeholder}</span>}
    </div>
  );
}

/** 실제 입력 요소 */
function Control({ type, name, current, options, placeholder, numeric, format, inputMode, setField }) {
  if (type === "select") {
    return (
      <select className="input" value={current ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          setField(name, numeric ? (Number(raw) || "") : raw);
        }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  return (
    <input className="input" type={type} value={current ?? ""}
      placeholder={placeholder} inputMode={inputMode}
      onChange={(e) => setField(name, format ? format(e.target.value) : e.target.value)} />
  );
}
