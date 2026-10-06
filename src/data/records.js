// src/data/records.js
// 분실물 관리대장과 분실신고 관리대장.

import { api, toList } from "../api/client";
import {
  foundFromApi, foundToApi, reportFromApi, reportToApi, changedFields,
} from "../api/mappers";

/** 한 번에 받아올 최대 건수. 화면에서 검색·쪽나눔을 하므로 넉넉히 받는다. */
const PAGE_LIMIT = 500;

/**
 * 대장 한 종류를 다루는 묶음을 만든다. (두 대장의 동작이 같다)
 * @param {string} path    API 경로
 * @param {function} fromApi 서버 → 화면 변환
 * @param {function} toApi   화면 → 서버 변환
 */
function makeLedger(path, fromApi, toApi) {
  return {
    /** 전체 목록 */
    list: async () => {
      const { data } = await api.get(path, { params: { skip: 0, limit: PAGE_LIMIT } });
      return toList(data).items.map(fromApi);
    },

    get: async (manageNo) => fromApi((await api.get(`${path}/${manageNo}`)).data),

    /** 관리번호는 서버가 만든다. 접수 화면에 미리 보여 줄 번호만 받아 온다. */
    nextManageNo: async () => {
      const { data } = await api.get(`${path}/next-manage-no`);
      return data.manage_no ?? "";
    },

    create: async (form) => fromApi((await api.post(path, toApi(form))).data),

    /** 바뀐 칸만 보낸다. */
    update: async (manageNo, before, after) => {
      const body = changedFields(toApi(before), toApi(after));
      if (Object.keys(body).length === 0) return before;
      return fromApi((await api.put(`${path}/${manageNo}`, body)).data);
    },

    remove: async (manageNo) => (await api.delete(`${path}/${manageNo}`)).data,
  };
}

export const foundApi = makeLedger("/things/lost-items", foundFromApi, foundToApi);
export const reportApi = makeLedger("/things/lost-reports", reportFromApi, reportToApi);

/** 분실신고에 분실물을 연결한다. 연결하면 처리상태를 처리완료로 바꾼다. */
export async function matchReport(manageNo, foundId, doneStatusId) {
  const { data } = await api.put(`/things/lost-reports/${manageNo}`, {
    matched_found_id: Number(foundId),
    status_id: doneStatusId,
    processed_date: new Date().toISOString().slice(0, 10),
  });
  return reportFromApi(data);
}

/** 연결을 푼다. */
export async function unmatchReport(manageNo, openStatusId) {
  const { data } = await api.put(`/things/lost-reports/${manageNo}`, {
    matched_found_id: null,
    status_id: openStatusId,
    processed_date: null,
  });
  return reportFromApi(data);
}
