// src/components/inputs.jsx
// 폼 입력 요소들. 상세 화면(readOnly)에서는 같은 자리에 값만 보여 준다.
// 값은 RecordFormContext 에서 꺼내 쓰므로 화면 코드가 짧아진다.

import { useRecordFormContext } from "../formContext";

/** 값만 보여 주는 칸. 자동 계산 값은 회색으로 둔다. */
export function ReadOnlyBox({ value, placeholder = "-", muted }) {
  return (
    <div className={"input value-box" + (muted ? " computed" : "")}>
      {value || <span className="placeholder">{placeholder}</span>}
    </div>
  );
}

/** 글자 입력 */
export function TextInput({ name, placeholder, format, inputMode }) {
  const { form, setField, readOnly } = useRecordFormContext();
  if (readOnly) return <ReadOnlyBox value={form[name]} />;
  return (
    <input className="input" value={form[name] ?? ""} placeholder={placeholder} inputMode={inputMode}
      onChange={(e) => setField(name, format ? format(e.target.value) : e.target.value)} />
  );
}

/** 여러 줄 입력. 오른쪽 아래에 글자 수를 보여 준다. */
export function TextArea({ name, placeholder, max = 200, rows = 3 }) {
  const { form, setField, readOnly } = useRecordFormContext();
  const value = form[name] ?? "";
  if (readOnly) return <ReadOnlyBox value={value} />;
  return (
    <div className="textarea-wrap">
      <textarea className="input textarea" rows={rows} maxLength={max} value={value}
        placeholder={placeholder} onChange={(e) => setField(name, e.target.value)} />
      <span className="char-count">{value.length}/{max}</span>
    </div>
  );
}

/** 날짜 입력 */
export function DateInput({ name }) {
  const { form, setField, readOnly } = useRecordFormContext();
  if (readOnly) return <ReadOnlyBox value={form[name]} />;
  return (
    <input className="input" type="date" value={form[name] ?? ""}
      onChange={(e) => setField(name, e.target.value)} />
  );
}

/**
 * 선택 상자
 * @param {{value, label}[]} options 선택지
 * @param {boolean} [numeric] 값을 숫자(번호)로 저장할지
 */
export function SelectInput({ name, options, placeholder, numeric }) {
  const { form, setField, readOnly } = useRecordFormContext();
  const current = form[name];
  if (readOnly) {
    const picked = options.find((o) => String(o.value) === String(current));
    return <ReadOnlyBox value={picked?.label ?? ""} />;
  }
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

/** 동그라미로 고르는 칸 (습득자 구분 등) */
export function RadioGroup({ name, options }) {
  const { form, setField, readOnly } = useRecordFormContext();
  if (readOnly) return <ReadOnlyBox value={form[name]} />;
  return (
    <div className="radio-group">
      {options.map((opt) => (
        <label key={opt} className="radio-item">
          <input type="radio" name={name} checked={form[name] === opt}
            onChange={() => setField(name, opt)} />
          {opt}
        </label>
      ))}
    </div>
  );
}
