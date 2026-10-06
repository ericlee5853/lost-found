// src/api/mappers.js
// 서버(snake_case)와 화면(camelCase) 사이에서 칸 이름을 바꾼다.
// 이 파일 덕분에 화면 코드는 서버 칸 이름을 몰라도 된다.

/** 빈 값은 서버에 null 로 보낸다. */
const orNull = (v) => (v === "" || v === undefined ? null : v);
/** 빈 값은 null, 아니면 숫자 */
const numOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

// ---------- 분실물 ----------

export function foundFromApi(row) {
  return {
    id: row.id,
    manageNo: row.manage_no ?? "",
    receivedDate: row.received_date ?? "",
    categoryId: row.category_id ?? "",
    itemName: row.item_name ?? "",
    feature: row.feature ?? "",
    foundDate: row.found_date ?? "",
    foundBuildingId: row.found_building_id ?? "",
    foundPlaceDetail: row.found_place_detail ?? "",
    storagePlaceId: row.storage_place_id ?? "",
    storageDetail: row.storage_detail ?? "",
    deadline: row.deadline ?? "",
    finderType: row.finder_type ?? "",
    finderNo: row.finder_no ?? "",
    finderName: row.finder_name ?? "",
    finderContact: row.finder_contact ?? "",
    ownerName: row.owner_name ?? "",
    ownerContact: row.owner_contact ?? "",
    contacted: row.contacted ?? "X",
    resultId: row.result_id ?? "",
    expireAction: row.expire_action ?? "",
    processedDate: row.processed_date ?? "",
    checkerId: row.checker_id ?? "",
    note: row.note ?? "",
    receiverNo: row.receiver_no ?? "",
    receiverName: row.receiver_name ?? "",
    returnDate: row.return_date ?? "",
    verifyMethod: row.verify_method ?? "",
    verifyCheckerId: row.verify_checker_id ?? "",
    // 화면은 사진을 경로 목록으로만 다룬다.
    images: (row.images ?? []).map((img) => (typeof img === "string" ? img : img.image_path)),
  };
}

/** 관리번호와 보관만료일은 서버가 정하므로 보내지 않는다. */
export function foundToApi(form) {
  return {
    received_date: orNull(form.receivedDate),
    category_id: numOrNull(form.categoryId),
    item_name: orNull(form.itemName),
    feature: orNull(form.feature),
    found_date: orNull(form.foundDate),
    found_building_id: numOrNull(form.foundBuildingId),
    found_place_detail: orNull(form.foundPlaceDetail),
    storage_place_id: numOrNull(form.storagePlaceId),
    storage_detail: orNull(form.storageDetail),
    finder_type: orNull(form.finderType),
    finder_no: orNull(form.finderNo),
    finder_name: orNull(form.finderName),
    finder_contact: orNull(form.finderContact),
    owner_name: orNull(form.ownerName),
    owner_contact: orNull(form.ownerContact),
    contacted: form.contacted || "X",
    result_id: numOrNull(form.resultId),
    processed_date: orNull(form.processedDate),
    checker_id: numOrNull(form.checkerId),
    note: orNull(form.note),
    receiver_no: orNull(form.receiverNo),
    receiver_name: orNull(form.receiverName),
    return_date: orNull(form.returnDate),
    verify_method: orNull(form.verifyMethod),
    verify_checker_id: numOrNull(form.verifyCheckerId),
    images: form.images ?? [],
  };
}

// ---------- 분실신고 ----------

export function reportFromApi(row) {
  return {
    id: row.id,
    manageNo: row.manage_no ?? "",
    receivedDate: row.received_date ?? "",
    categoryId: row.category_id ?? "",
    itemName: row.item_name ?? "",
    feature: row.feature ?? "",
    foundDate: row.found_date ?? "",
    lostBuildingId: row.lost_building_id ?? "",
    lostPlaceDetail: row.lost_place_detail ?? "",
    reporterType: row.reporter_type ?? "",
    reporterNo: row.reporter_no ?? "",
    ownerName: row.owner_name ?? "",
    ownerContact: row.owner_contact ?? "",
    statusId: row.status_id ?? "",
    processedDate: row.processed_date ?? "",
    checkerId: row.checker_id ?? "",
    note: row.note ?? "",
    matchedFoundId: row.matched_found_id ?? "",
  };
}

export function reportToApi(form) {
  return {
    received_date: orNull(form.receivedDate),
    category_id: numOrNull(form.categoryId),
    item_name: orNull(form.itemName),
    feature: orNull(form.feature),
    found_date: orNull(form.foundDate),
    lost_building_id: numOrNull(form.lostBuildingId),
    lost_place_detail: orNull(form.lostPlaceDetail),
    reporter_type: orNull(form.reporterType),
    reporter_no: orNull(form.reporterNo),
    owner_name: orNull(form.ownerName),
    owner_contact: orNull(form.ownerContact),
    status_id: numOrNull(form.statusId),
    processed_date: orNull(form.processedDate),
    checker_id: numOrNull(form.checkerId),
    note: orNull(form.note),
    matched_found_id: numOrNull(form.matchedFoundId),
  };
}

/**
 * 수정할 때 실제로 바뀐 칸만 고른다.
 * 서버는 습득일이나 물품 구분이 오면 보관만료일을 다시 계산하므로,
 * 바뀌지 않은 칸을 빼야 기존 기한이 그대로 유지된다.
 */
export function changedFields(before, after) {
  const body = {};
  for (const key of Object.keys(after)) {
    const a = before[key], b = after[key];
    const same = Array.isArray(a) && Array.isArray(b)
      ? a.length === b.length && a.every((v, i) => v === b[i])
      : a === b;
    if (!same) body[key] = b;
  }
  return body;
}
