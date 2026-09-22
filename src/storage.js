// src/storage.js
// 유실물(found_item) · 분실신고(lost_report) 레코드 저장소.
//
// 레코드는 물품구분·처리결과를 이름이 아니라 id 로 들고 있다(규칙 1).
//   found_item.category_id → item_category.id
//   found_item.result_id   → process_result.id
//   found_item.deadline    ← 등록/수정 시점에 계산해 저장 (설정 변경과 무관, 규칙 3)

import { itemCategoryTable, processResultTable, computeDeadline } from "./settings";

const FOUND_KEY = "lf_found_items";
const LOST_KEY = "lf_lost_reports";
const SCHEMA_KEY = "lf_schema_version"; // 마이그레이션 중복 실행 방지용
const SCHEMA_VERSION = 2;               // v2: 이름 문자열 → id 참조

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? [];
  } catch {
    return [];
  }
}

function save(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

/** 관리번호 생성: 연도 + 종류숫자 + 3자리 일련번호 (예: 20250001) */
function nextManageNo(list, typeDigit) {
  const prefix = String(new Date().getFullYear()) + typeDigit;
  let max = 0;
  for (const item of list) {
    if (item.manageNo?.startsWith(prefix)) {
      const seq = parseInt(item.manageNo.slice(prefix.length), 10);
      if (!isNaN(seq) && seq > max) max = seq;
    }
  }
  return prefix + String(max + 1).padStart(3, "0");
}

// ---- 공통 CRUD 생성기 (found/lost 중복 제거) ----
function makeApi(key, typeDigit) {
  return {
    getAll: () => load(key).slice().reverse(), // 최신 먼저
    getOne: (no) => load(key).find((i) => i.manageNo === no) ?? null,
    peekNo: () => nextManageNo(load(key), typeDigit),
    add: (data) => {
      const list = load(key);
      const item = { ...data, manageNo: nextManageNo(list, typeDigit) };
      list.push(item);
      save(key, list);
      return item;
    },
    update: (no, data) => {
      const list = load(key);
      const idx = list.findIndex((i) => i.manageNo === no);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...data, manageNo: no }; // 관리번호는 불변
      save(key, list);
      return list[idx];
    },
    remove: (no) => {
      save(key, load(key).filter((i) => i.manageNo !== no));
    },
  };
}

const foundApi = makeApi(FOUND_KEY, "0");
const lostApi = makeApi(LOST_KEY, "1");

// ---- 분실물관리대장 ----
export const getFoundItems = foundApi.getAll;
export const getFoundItem = foundApi.getOne;
export const peekFoundManageNo = foundApi.peekNo;
export const addFoundItem = foundApi.add;
export const updateFoundItem = foundApi.update;
export const deleteFoundItem = foundApi.remove;

// ---- 교내 분실신고 관리대장 ----
export const getLostReports = lostApi.getAll;
export const getLostReport = lostApi.getOne;
export const peekLostManageNo = lostApi.peekNo;
export const addLostReport = lostApi.add;
export const updateLostReport = lostApi.update;
export const deleteLostReport = lostApi.remove;

// ---- 설정 항목 사용 건수 ----
// 설정값을 정말 지워도 되는지 판단할 때 쓴다. 한 건이라도 쓰고 있으면
// 실제 삭제 대신 사용중지(is_active = false)를 해야 한다(규칙 2).

/** key 대장에서 field 가 id 인 레코드 수 */
function countUses(key, field, id) {
  return load(key).filter((item) => Number(item[field]) === Number(id)).length;
}

/** 물품구분 id 를 쓰고 있는 유실물 + 분실신고 건수 */
export const countCategoryUses = (id) =>
  countUses(FOUND_KEY, "category_id", id) + countUses(LOST_KEY, "category_id", id);

/** 처리결과 id 를 쓰고 있는 유실물 건수 */
export const countResultUses = (id) => countUses(FOUND_KEY, "result_id", id);

// ===================== 기존 데이터 마이그레이션 =====================
// 예전 버전은 물품구분/처리결과를 "전자기기" 같은 이름 문자열로 저장했다.
// 이를 설정 테이블의 id 참조로 바꾼다. 앱 시작 시 한 번만 실행된다.

/** 이름으로 설정 항목의 id 를 찾고, 설정에 없는 이름이면 새로 만들어 준다(데이터 유실 방지). */
function ensureId(table, name, extra = {}) {
  if (!name) return null;
  return table.idOf(name) ?? table.add({ name, ...extra }).id;
}

/** 레코드 한 건을 id 참조 구조로 변환한다. 이미 변환된 건은 그대로 둔다. */
function migrateRecord(item, isFound) {
  const next = { ...item };

  if (next.category !== undefined) {
    next.category_id = ensureId(itemCategoryTable, next.category);
    delete next.category;
  }
  if (isFound && next.result !== undefined) {
    next.result_id = ensureId(processResultTable, next.result);
    delete next.result;
  }
  // 보관기한이 없던 과거 데이터는 지금 한 번 계산해 확정 저장한다(규칙 3).
  if (isFound && !next.deadline) {
    next.deadline = computeDeadline(next.receivedDate, next.category_id);
  }
  return next;
}

function migrateAll() {
  if (Number(localStorage.getItem(SCHEMA_KEY)) >= SCHEMA_VERSION) return;
  save(FOUND_KEY, load(FOUND_KEY).map((it) => migrateRecord(it, true)));
  save(LOST_KEY, load(LOST_KEY).map((it) => migrateRecord(it, false)));
  localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
}

migrateAll();
