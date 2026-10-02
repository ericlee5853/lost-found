// src/api/settings.js
// 설정 API (/things). 물품 구분 · 처리결과 · 분실신고 처리상태 세 가지를 다룬다.
//
// 세 설정은 호출 주소만 다르고 동작이 같아, 공통 생성기로 한 번만 작성한다.
// 삭제(DELETE)는 실제 삭제가 아니라 is_active=false 로 바꾸는 "사용중지"다.

import { api } from "./client";

/**
 * 설정 하나에 대한 조회·추가·수정·사용중지 묶음을 만든다.
 * @param {string} path API 경로 (예: "/things/item-categories")
 */
function makeSettingApi(path) {
  return {
    /** 목록. activeOnly=true 면 사용중인 항목만 (신규 등록 선택 목록용) */
    list: async (activeOnly = false) => {
      const { data } = await api.get(path, { params: { active_only: activeOnly } });
      return data;
    },
    create: async (body) => (await api.post(path, body)).data,
    update: async (id, body) => (await api.put(`${path}/${id}`, body)).data,
    /** 사용중지 (is_active=false) */
    deactivate: async (id) => (await api.delete(`${path}/${id}`)).data,
    /** 다시 사용 (is_active=true) */
    activate: async (id) => (await api.put(`${path}/${id}`, { is_active: true })).data,
  };
}

/** 물품 구분: id, name, storage_months, expire_action, sort_order, is_active */
export const itemCategoryApi = makeSettingApi("/things/item-categories");

/** 분실물 처리결과: id, name, sort_order, is_active */
export const processResultApi = makeSettingApi("/things/process-results");

/** 분실신고 처리상태: id, name, sort_order, is_active */
export const reportStatusApi = makeSettingApi("/things/report-statuses");
