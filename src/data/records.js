// src/data/records.js
// 분실물 관리대장과 분실신고 관리대장.

import { read, update, nextId } from "./db";

/**
 * 대장 한 종류를 다루는 묶음을 만든다. (두 대장의 동작이 같다)
 * @param {string} key       db 안의 이름
 * @param {string} typeDigit 관리번호의 종류 숫자 ("0" 분실물, "1" 분실신고)
 */
function makeLedger(key, typeDigit) {
  const ledger = {
    /** 최근에 등록한 건이 위로 오도록 돌려준다. */
    list: () => read()[key].slice().sort((a, b) => b.id - a.id),

    get: (manageNo) => read()[key].find((row) => row.manageNo === manageNo) ?? null,

    create: (form) => {
      const row = { ...form, id: nextId(read()[key]), manageNo: form.manageNo || ledger.nextManageNo() };
      update((db) => ({ [key]: [...db[key], row] }));
      return row;
    },

    /** 관리번호는 바꾸지 않는다. */
    update: (manageNo, form) => {
      let saved = null;
      update((db) => ({
        [key]: db[key].map((row) => {
          if (row.manageNo !== manageNo) return row;
          saved = { ...row, ...form, id: row.id, manageNo: row.manageNo };
          return saved;
        }),
      }));
      return saved;
    },

    remove: (manageNo) =>
      update((db) => ({ [key]: db[key].filter((row) => row.manageNo !== manageNo) })),

    /** 다음 관리번호: 연도 + 종류숫자 + 3자리 (예: 20260004) */
    nextManageNo: () => {
      const prefix = String(new Date().getFullYear()) + typeDigit;
      let max = 0;
      for (const row of read()[key]) {
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

export const foundApi = makeLedger("foundItems", "0");
export const reportApi = makeLedger("lostReports", "1");

/** 분실신고에 분실물을 연결한다. 연결하면 처리상태를 처리완료로 바꾼다. */
export function matchReport(manageNo, foundId, doneStatusId) {
  return reportApi.update(manageNo, {
    matchedFoundId: foundId,
    statusId: doneStatusId,
    processedDate: new Date().toISOString().slice(0, 10),
  });
}

/** 연결을 푼다. */
export function unmatchReport(manageNo, openStatusId) {
  return reportApi.update(manageNo, { matchedFoundId: "", statusId: openStatusId, processedDate: "" });
}
