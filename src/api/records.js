// src/api/records.js
// 분실물 관리대장(/things/lost-items) 과 분실신고 관리대장(/things/lost-reports) API.
//
// 서버는 snake_case(manage_no, item_name ...), 화면은 camelCase(manageNo, itemName ...)를 쓴다.
// 이 파일의 fromApi/toApi 가 두 이름을 서로 바꿔 주므로, 화면 코드는 서버 이름을 몰라도 된다.

import { api } from "./client";

/** 목록 조회 시 한 번에 받아오는 최대 건수 (서버 허용 최대값) */
const MAX_LIMIT = 1000;

/** 빈 문자열은 서버에 null 로 보낸다. */
const orNull = (v) => (v === "" || v === undefined ? null : v);
/** 빈 값이면 null, 아니면 숫자로 바꾼다. */
const numOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

// ---------- 분실물 관리대장 ----------

/** 서버 응답 → 화면에서 쓰는 모양 */
export function foundFromApi(row) {
  return {
    id: row.id,
    manageNo: row.manage_no,
    receivedDate: row.received_date ?? "",
    foundDate: row.found_date ?? "",
    categoryId: row.category_id ?? "",
    itemName: row.item_name ?? "",
    feature: row.feature ?? "",
    lostPlace: row.lost_place ?? "",
    owner: row.owner_name ?? "",
    ownerContact: row.owner_contact ?? "",
    contacted: row.contacted ?? "X",
    storagePlace: row.storage_place ?? "",
    deadline: row.deadline ?? "",
    resultId: row.result_id ?? "",
    processedDate: row.processed_date ?? "",
    checkerId: row.checker_id ?? "",
    imagePath: row.image_path ?? "",
  };
}

/** 화면 입력값 → 서버로 보낼 모양 */
export function foundToApi(form) {
  return {
    manage_no: form.manageNo,
    received_date: form.receivedDate,
    found_date: form.foundDate,
    category_id: numOrNull(form.categoryId),
    item_name: form.itemName,
    feature: orNull(form.feature),
    lost_place: orNull(form.lostPlace),
    owner_name: orNull(form.owner),
    owner_contact: orNull(form.ownerContact),
    contacted: form.contacted || "X",
    storage_place: orNull(form.storagePlace),
    result_id: numOrNull(form.resultId),
    processed_date: orNull(form.processedDate),
    checker_id: numOrNull(form.checkerId),
    image_path: orNull(form.imagePath),
  };
}

// ---------- 분실신고 관리대장 ----------

export function reportFromApi(row) {
  return {
    id: row.id,
    manageNo: row.manage_no,
    receivedDate: row.received_date ?? "",
    foundDate: row.found_date ?? "",
    categoryId: row.category_id ?? "",
    itemName: row.item_name ?? "",
    feature: row.feature ?? "",
    lostPlace: row.lost_place ?? "",
    owner: row.owner_name ?? "",
    ownerContact: row.owner_contact ?? "",
    statusId: row.status_id ?? "",
    processedDate: row.processed_date ?? "",
    checkerId: row.checker_id ?? "",
    matchedFoundId: row.matched_found_id ?? "",
    imagePath: row.image_path ?? "",
  };
}

export function reportToApi(form) {
  return {
    manage_no: form.manageNo,
    received_date: form.receivedDate,
    found_date: form.foundDate,
    category_id: numOrNull(form.categoryId),
    item_name: form.itemName,
    feature: orNull(form.feature),
    lost_place: orNull(form.lostPlace),
    owner_name: orNull(form.owner),
    owner_contact: orNull(form.ownerContact),
    status_id: numOrNull(form.statusId),
    processed_date: orNull(form.processedDate),
    checker_id: numOrNull(form.checkerId),
    matched_found_id: numOrNull(form.matchedFoundId),
    image_path: orNull(form.imagePath),
  };
}

/**
 * 수정 시 실제로 바뀐 항목만 골라낸다.
 * 서버는 category_id 나 found_date 가 오면 보관기한을 다시 계산하므로,
 * 바뀌지 않은 항목을 빼야 기존 보관기한이 그대로 유지된다.
 */
export function changedFields(before, after) {
  const body = {};
  for (const key of Object.keys(after)) {
    if (before[key] !== after[key]) body[key] = after[key];
  }
  return body;
}

/**
 * 대장 한 종류에 대한 API 묶음을 만든다. (분실물/분실신고 동작이 같다)
 * @param {string} path      API 경로
 * @param {function} fromApi 서버 → 화면 변환
 * @param {function} toApi   화면 → 서버 변환
 * @param {string} typeDigit 관리번호의 종류 숫자 ("0" 분실물, "1" 분실신고)
 */
function makeLedgerApi(path, fromApi, toApi, typeDigit) {
  const ledger = {
    /** 전체 목록 (화면에서 검색·필터·쪽나눔을 하므로 한 번에 받아온다) */
    list: async () => {
      const { data } = await api.get(path, { params: { skip: 0, limit: MAX_LIMIT } });
      return data.map(fromApi);
    },

    /** 관리번호로 한 건 조회 */
    get: async (manageNo) => fromApi((await api.get(`${path}/${manageNo}`)).data),

    /** 등록. 관리번호가 겹치면(409) 다음 번호로 한 번 더 시도한다. */
    create: async (form) => {
      try {
        return fromApi((await api.post(path, toApi(form))).data);
      } catch (error) {
        if (error?.response?.status !== 409) throw error;
        const retry = { ...form, manageNo: await ledger.nextManageNo() };
        return fromApi((await api.post(path, toApi(retry))).data);
      }
    },

    /** 수정. 바뀐 항목만 보낸다. */
    update: async (manageNo, before, after) => {
      const body = changedFields(toApi(before), toApi(after));
      if (Object.keys(body).length === 0) return before;
      return fromApi((await api.put(`${path}/${manageNo}`, body)).data);
    },

    /** 삭제 (서버에서 실제로 지운다) */
    remove: async (manageNo) => (await api.delete(`${path}/${manageNo}`)).data,

    /**
     * 다음 관리번호: 연도 + 종류숫자 + 3자리 일련번호 (예: 20260001)
     * 서버가 번호를 만들어 주지 않으므로 기존 목록에서 가장 큰 번호 다음을 쓴다.
     */
    nextManageNo: async () => {
      const prefix = String(new Date().getFullYear()) + typeDigit;
      const rows = await ledger.list();
      let max = 0;
      for (const row of rows) {
        if (row.manageNo?.startsWith(prefix)) {
          const seq = parseInt(row.manageNo.slice(prefix.length), 10);
          if (!isNaN(seq) && seq > max) max = seq;
        }
      }
      return prefix + String(max + 1).padStart(3, "0");
    },
  };
  return ledger;
}

export const foundItemApi = makeLedgerApi("/things/lost-items", foundFromApi, foundToApi, "0");
export const lostReportApi = makeLedgerApi("/things/lost-reports", reportFromApi, reportToApi, "1");
