// src/data/settings.js
// 설정 다섯 가지. 주소만 다르고 동작이 같아 공통 생성기로 만든다.
// DELETE 는 실제 삭제가 아니라 사용중지(is_active=false)다.

import { api, toList } from "../api/client";

function makeSetting(path) {
  return {
    /** 목록. activeOnly 면 사용중인 것만 */
    list: async (activeOnly = false) => {
      const { data } = await api.get(path, { params: { active_only: activeOnly } });
      return toList(data).items;
    },
    create: async (body) => (await api.post(path, body)).data,
    update: async (id, body) => (await api.put(`${path}/${id}`, body)).data,
    /** 사용중지 / 다시 사용 */
    setActive: async (id, isActive) =>
      isActive
        ? (await api.put(`${path}/${id}`, { is_active: true })).data
        : (await api.delete(`${path}/${id}`)).data,
  };
}

export const categoryApi = makeSetting("/things/item-categories");
export const resultApi = makeSetting("/things/process-results");
export const statusApi = makeSetting("/things/report-statuses");
export const buildingApi = makeSetting("/things/buildings");
export const storagePlaceApi = makeSetting("/things/storage-places");

/** 설정 화면과 기준 정보가 함께 쓰는 묶음 */
export const SETTING_APIS = {
  categories: categoryApi,
  results: resultApi,
  statuses: statusApi,
  buildings: buildingApi,
  storagePlaces: storagePlaceApi,
};
