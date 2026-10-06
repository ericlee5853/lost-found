// src/referenceContext.js
// 여러 화면이 함께 쓰는 "기준 정보"(설정 다섯 가지 · 담당자 목록)를 넘겨주는 통로와 도우미.
// 대장 자료에는 번호만 들어 있으므로, 이름을 보여주려면 여기서 번호로 찾아야 한다.

import { createContext, useContext } from "react";

export const ReferenceContext = createContext(null);

export function useReference() {
  return useContext(ReferenceContext);
}

/** 번호 → 이름. 사용중지된 항목도 이름은 그대로 나온다. */
export function nameOf(list, id) {
  if (id === "" || id === null || id === undefined) return "";
  return list.find((row) => row.id === Number(id))?.name ?? "";
}

/**
 * 선택 상자에 넣을 {value, label} 목록.
 * 사용중인 것 + 지금 골라져 있는 것(사용중지됐더라도)을 함께 돌려줘서
 * 과거 자료를 열어도 값이 사라지지 않는다.
 */
export function selectOptions(list, selectedId) {
  const active = list.filter((row) => row.is_active);
  const selected = selectedId ? list.find((row) => row.id === Number(selectedId)) : null;
  const rows = selected && !selected.is_active ? [selected, ...active] : active;
  return rows.map((row) => ({ value: row.id, label: row.name }));
}

/** 필터 체크박스용. 사용중지된 것도 과거 자료를 찾기 위해 남긴다. */
export function filterOptions(list) {
  return list.map((row) => ({
    value: row.id,
    label: row.is_active ? row.name : `${row.name} (사용중지)`,
  }));
}

/**
 * 뜻이 정해진 설정 항목을 code 로 찾는다.
 * 관리자가 이름을 바꿔도 화면 동작이 흔들리지 않게 하기 위해서다.
 * code 가 아직 없는 서버를 대비해 이름으로도 한 번 더 찾는다.
 * @param {object[]} list 설정 목록
 * @param {string} code   STORED · RETURNED · OPEN · DONE 등
 * @param {string} [nameHint] code 가 없을 때 찾아볼 이름 조각
 */
export function byCode(list, code, nameHint) {
  return list.find((row) => row.code === code)
    ?? (nameHint ? list.find((row) => row.name.includes(nameHint)) : undefined);
}
