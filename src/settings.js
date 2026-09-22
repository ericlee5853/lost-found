// src/settings.js
// 설정 테이블(item_category · process_result) 저장소.
//
// 백엔드/DB 연결을 대비해 아래 3가지 규칙을 지킨다.
//  1) 유실물 데이터는 이름이 아니라 id 를 저장한다.
//     (found_item.category_id → item_category.id, found_item.result_id → process_result.id)
//     이름은 항상 이 설정 테이블에서 가져오므로, 이름을 바꾸면 기존 데이터도 새 이름으로 보인다.
//  2) 삭제하지 않고 사용중지한다. is_active = false 인 항목은 신규 등록 선택지에서는 빠지지만
//     과거 데이터의 이름은 그대로 조회된다.
//  3) 계산 결과(보관기한)는 계산 시점에 확정해 유실물 레코드에 저장한다.
//     따라서 나중에 보관기간 설정을 바꿔도 기존 건의 기한은 변하지 않는다.

import { addMonths } from "./dateUtil";

const CATEGORY_KEY = "lf_item_category";
const RESULT_KEY = "lf_process_result";

/** 기간 만료 시 조치 방법 선택지 (item_category.expire_action) */
export const EXPIRE_ACTIONS = ["관할서인계", "폐기", "계속보관"];

// 프로그램을 처음 실행할 때 들어가는 기본 설정값 (유실물 유형별 관리 기준표 기준)
const DEFAULT_CATEGORIES = [
  { id: 1, name: "신분증", storage_months: 1, expire_action: "관할서인계", sort_order: 1, is_active: true },
  { id: 2, name: "금융카드", storage_months: 1, expire_action: "관할서인계", sort_order: 2, is_active: true },
  { id: 3, name: "전자기기", storage_months: 3, expire_action: "관할서인계", sort_order: 3, is_active: true },
  { id: 4, name: "일반 물품", storage_months: 1, expire_action: "폐기", sort_order: 4, is_active: true },
  { id: 5, name: "일반 귀중품", storage_months: 3, expire_action: "관할서인계", sort_order: 5, is_active: true },
];

const DEFAULT_RESULTS = [
  { id: 1, name: "미처리", sort_order: 1, is_active: true },
  { id: 2, name: "본인반환", sort_order: 2, is_active: true },
  { id: 3, name: "폐기", sort_order: 3, is_active: true },
  { id: 4, name: "관할서인계", sort_order: 4, is_active: true },
];

/** localStorage 에서 설정 테이블을 읽는다. 값이 없거나 깨졌으면 기본값으로 초기화한다. */
function load(key, defaults) {
  try {
    const rows = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(rows) && rows.length > 0) return rows;
  } catch {
    // 손상된 값은 기본값으로 되돌린다.
  }
  localStorage.setItem(key, JSON.stringify(defaults));
  return defaults.map((row) => ({ ...row }));
}

/**
 * 설정 테이블 하나에 대한 CRUD 묶음을 만든다.
 * (물품구분·처리결과가 동작이 같아 중복 코드를 없애기 위한 공통 생성기)
 * @param {string} key      localStorage 키
 * @param {object[]} defaults 기본 행 목록
 * @param {object} template 새 행을 만들 때 채울 추가 컬럼 기본값
 */
function makeSettingTable(key, defaults, template) {
  const read = () => load(key, defaults);
  const write = (rows) => localStorage.setItem(key, JSON.stringify(rows));

  // 화면 표시 순서: sort_order 오름차순, 같으면 id 순
  const sortRows = (rows) =>
    rows.slice().sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id));

  const table = {
    /** 전체 목록. activeOnly = true 면 사용중인 항목만 (신규 등록 선택지용) */
    all: (activeOnly = false) => sortRows(read().filter((r) => !activeOnly || r.is_active)),

    /** id 로 한 행 조회. 없으면 null */
    one: (id) => read().find((r) => r.id === Number(id)) ?? null,

    /** id → 이름. 사용중지된 항목도 이름은 정상 반환한다(규칙 2). */
    nameOf: (id) => table.one(id)?.name ?? "",

    /** 이름 → id. 없으면 null (기존 데이터 마이그레이션용) */
    idOf: (name) => read().find((r) => r.name === name)?.id ?? null,

    /** 새 항목 추가. id 와 sort_order 는 비어 있으면 자동 부여 */
    add: (data) => {
      const rows = read();
      const nextId = rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
      const nextOrder = rows.reduce((max, r) => Math.max(max, r.sort_order), 0) + 1;
      const row = {
        ...template,
        ...data,
        id: nextId,
        sort_order: Number(data.sort_order) || nextOrder,
        is_active: true,
      };
      rows.push(row);
      write(rows);
      return row;
    },

    /** 기존 항목 수정. id 는 참조 키이므로 변경하지 않는다(규칙 1). */
    update: (id, patch) => {
      const rows = read();
      const idx = rows.findIndex((r) => r.id === Number(id));
      if (idx === -1) return null;
      rows[idx] = { ...rows[idx], ...patch, id: rows[idx].id };
      write(rows);
      return rows[idx];
    },

    /** 사용/사용중지 전환. 과거 데이터를 지키기 위한 기본 삭제 방식이다(규칙 2). */
    setActive: (id, isActive) => table.update(id, { is_active: Boolean(isActive) }),

    /**
     * 행을 실제로 지운다.
     * 이 항목을 쓰는 데이터가 한 건도 없을 때만 부른다.
     * (잘못 추가한 항목을 정리하는 용도. 쓰는 데이터가 있으면 setActive 로 사용중지한다.)
     */
    remove: (id) => write(read().filter((r) => r.id !== Number(id))),
  };

  return table;
}

// ---- item_category (물품구분) ----
export const itemCategoryTable = makeSettingTable(CATEGORY_KEY, DEFAULT_CATEGORIES, {
  storage_months: 1,
  expire_action: EXPIRE_ACTIONS[0],
});

// ---- process_result (처리결과) ----
export const processResultTable = makeSettingTable(RESULT_KEY, DEFAULT_RESULTS, {});

// ---- 화면에서 자주 쓰는 짧은 이름 (id → 이름) ----
export const getCategoryName = itemCategoryTable.nameOf;
export const getResultName = processResultTable.nameOf;

/**
 * 신규 등록에서 쓸 기본 처리결과 id.
 * "미처리"가 사용중지되었을 수도 있으므로 사용중인 첫 항목을 쓴다.
 */
export function getDefaultResultId() {
  const active = processResultTable.all(true);
  return active[0]?.id ?? null;
}

/**
 * 선택 상자(select)에 넣을 {value, label} 목록.
 * 사용중인 항목 + 현재 선택된 항목(사용중지되었더라도)을 함께 돌려주므로
 * 과거 데이터를 보거나 수정할 때 값이 사라지지 않는다(규칙 2).
 * @param {object} table      itemCategoryTable 또는 processResultTable
 * @param {number} selectedId 현재 선택된 id
 */
export function selectOptions(table, selectedId) {
  const rows = table.all(true);
  const selected = selectedId ? table.one(selectedId) : null;
  const list = selected && !selected.is_active ? [selected, ...rows] : rows;
  return list.map((row) => ({ value: row.id, label: row.name }));
}

/**
 * 보관기한 계산: 접수일 + 물품구분의 보관기간(개월).
 * 계산 결과는 호출한 쪽에서 레코드에 저장해 확정한다(규칙 3).
 * @param {string} receivedDate 접수일 "YYYY-MM-DD"
 * @param {number} categoryId   item_category.id
 * @returns {string} 보관기한, 계산 불가 시 빈 문자열
 */
export function computeDeadline(receivedDate, categoryId) {
  const category = itemCategoryTable.one(categoryId);
  if (!receivedDate || !category) return "";
  return addMonths(receivedDate, Number(category.storage_months));
}

/** 물품구분의 기간 만료 시 조치 방법 (설정에서 바로 읽는 현재 값) */
export function getExpireAction(categoryId) {
  return itemCategoryTable.one(categoryId)?.expire_action ?? "";
}
