// src/referenceContext.js
// 여러 화면이 함께 쓰는 "기준 정보"(설정 목록 · 사용자 목록)를 담는 통로와 도우미 함수들.
//
// 대장 API 응답에는 이름이 없고 id 만 있으므로(category_id, result_id ...),
// 화면에 이름을 보여주려면 여기 담긴 설정 목록에서 id 로 찾아야 한다.

import { createContext, useContext } from "react";

/** { categories, results, statuses, users, me, reload } 를 담는다. */
export const ReferenceContext = createContext(null);

/** 화면에서 기준 정보를 꺼내 쓴다. */
export function useReference() {
  return useContext(ReferenceContext);
}

/** id → 이름. 사용중지된 항목도 이름은 정상으로 나온다(과거 데이터 표시용). */
export function nameOf(list, id) {
  if (id === "" || id === null || id === undefined) return "";
  return list.find((row) => row.id === Number(id))?.name ?? "";
}

/**
 * 선택 상자에 넣을 {value, label} 목록.
 * 사용중인 항목 + 지금 선택된 항목(사용중지되었더라도)을 함께 돌려주므로
 * 과거 데이터를 보거나 수정할 때 값이 사라지지 않는다.
 */
export function selectOptions(list, selectedId) {
  const active = list.filter((row) => row.is_active);
  const selected = selectedId ? list.find((row) => row.id === Number(selectedId)) : null;
  const rows = selected && !selected.is_active ? [selected, ...active] : active;
  return rows.map((row) => ({ value: row.id, label: row.name }));
}

/** 필터 체크박스용 목록. 사용중지된 항목도 과거 데이터 검색을 위해 남긴다. */
export function filterOptions(list) {
  return list.map((row) => ({
    value: row.id,
    label: row.is_active ? row.name : `${row.name} (사용중지)`,
  }));
}
