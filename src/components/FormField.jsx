// src/components/FormField.jsx
// 이름이 왼쪽, 입력칸이 오른쪽에 오는 한 칸.
// 이름 칸 너비는 카드마다 --label-w 로 정한다.

import { useRecordFormContext } from "../formContext";

/**
 * @param {string} label    항목 이름
 * @param {boolean} [required] 필수면 이름 옆에 * 를 붙인다 (상세 화면에서는 숨긴다)
 * @param {number} [grow]   한 줄에 여러 칸이 있을 때의 너비 비율
 */
export default function FormField({ label, required, grow, children }) {
  const { readOnly } = useRecordFormContext() ?? {};
  return (
    <div className="form-cell" style={grow ? { flex: grow } : undefined}>
      <span className="form-label">
        {label}{required && !readOnly && <span className="required-mark">*</span>}
      </span>
      <div className="form-control">{children}</div>
    </div>
  );
}

/** 한 줄. 안에 FormField 를 하나 또는 둘 넣는다. */
export function FormRow({ children }) {
  return <div className="form-row">{children}</div>;
}
