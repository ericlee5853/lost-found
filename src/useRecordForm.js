// src/useRecordForm.js
// 분실물 · 분실신고 화면(상세/접수/수정)이 똑같이 쓰는 폼 처리 로직.
// (입력값 관리 · 오류 메시지)

import { useState } from "react";

/**
 * @param {object|function} initial 폼의 초기값 (함수를 주면 첫 렌더에서 한 번만 실행)
 */
export function useRecordForm(initial) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");

  /** 항목 하나를 바꾼다. */
  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /**
   * 필수 입력값을 차례로 확인한다.
   * @param {Array<[string, string]>} rules [항목이름, 오류 메시지] 목록
   * @returns {boolean} 모두 채워졌으면 true
   */
  function checkRequired(rules) {
    for (const [name, message] of rules) {
      const value = form[name];
      const empty = typeof value === "string" ? !value.trim() : !value;
      if (empty) {
        setError(message);
        return false;
      }
    }
    setError("");
    return true;
  }

  return { form, setField, error, setError, checkRequired };
}
