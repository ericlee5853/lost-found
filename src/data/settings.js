// src/data/settings.js
// 설정 다섯 가지(물품 구분, 분실물 처리상태, 분실신고 처리상태, 건물, 보관장소).
// 다섯 가지가 동작이 같아 공통 생성기로 한 번만 만든다.

import { read, update, nextId } from "./db";

/** 화면에 나오는 순서: sort_order 오름차순, 같으면 id 순 */
const sorted = (rows) =>
  rows.slice().sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id));

/**
 * 설정 한 가지를 다루는 묶음을 만든다.
 * @param {string} key db 안의 이름 (categories, results ...)
 * @param {object} template 새 항목에 기본으로 넣을 값
 */
function makeSetting(key, template = {}) {
  return {
    /** 목록. activeOnly 면 사용중인 것만 */
    list: (activeOnly = false) =>
      sorted(read()[key].filter((row) => !activeOnly || row.is_active)),

    create: (data) => update((db) => {
      const rows = db[key];
      const order = Number(data.sort_order) || rows.reduce((m, r) => Math.max(m, r.sort_order), 0) + 1;
      return { [key]: [...rows, { ...template, ...data, id: nextId(rows), sort_order: order, is_active: true }] };
    }),

    /** id 는 참조 키라 바꾸지 않는다. */
    update: (id, patch) => update((db) => ({
      [key]: db[key].map((row) => (row.id === id ? { ...row, ...patch, id: row.id } : row)),
    })),

    /** 지우지 않고 사용중지한다. 과거 자료의 이름을 지키기 위해서다. */
    setActive: (id, isActive) => update((db) => ({
      [key]: db[key].map((row) => (row.id === id ? { ...row, is_active: isActive } : row)),
    })),
  };
}

export const categoryApi = makeSetting("categories", { storage_months: 1, expire_action: "관할서인계" });
export const resultApi = makeSetting("results");
export const statusApi = makeSetting("statuses");
export const buildingApi = makeSetting("buildings");
export const storagePlaceApi = makeSetting("storagePlaces");

/** 설정 화면과 기준 정보가 함께 쓰는 묶음 */
export const SETTING_APIS = {
  categories: categoryApi,
  results: resultApi,
  statuses: statusApi,
  buildings: buildingApi,
  storagePlaces: storagePlaceApi,
};
