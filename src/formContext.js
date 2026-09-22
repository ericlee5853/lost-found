// src/formContext.js
// 한 화면 안의 입력칸(Field)들이 폼 상태를 함께 쓰도록 전달하는 통로.
// readOnly 가 true 면 같은 자리에 값만 보여 주므로 상세 화면과 수정 화면의 모양이 같다.

import { createContext, useContext } from "react";

/** { form, setField, readOnly } 를 담는다. */
export const RecordFormContext = createContext(null);

/** Field 에서 폼 상태를 꺼내 쓴다. */
export function useRecordFormContext() {
  return useContext(RecordFormContext);
}
