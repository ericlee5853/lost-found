// src/data/db.js
// 화면 확인용 임시 저장소.
// 백엔드가 준비되기 전까지 브라우저(localStorage)에 자료를 담아 둔다.
// 칸 이름과 구조는 docs/data-model.md 와 같게 맞춰, 나중에 서버 연동으로 바꿀 때
// 이 폴더(src/data)만 교체하면 되도록 했다.

const KEY = "lf_demo_db_v1";

/** 처음 들어가는 보기 자료 */
function seed() {
  return {
    users: [
      { id: 1, name: "김남진", dept: "학생처" },
      { id: 2, name: "이은표", dept: "학생처" },
      { id: 3, name: "김유은", dept: "도서관" },
    ],
    categories: [
      { id: 1, name: "신분증", storage_months: 1, expire_action: "관할서인계", sort_order: 1, is_active: true },
      { id: 2, name: "금융카드", storage_months: 1, expire_action: "관할서인계", sort_order: 2, is_active: true },
      { id: 3, name: "전자기기", storage_months: 3, expire_action: "관할서인계", sort_order: 3, is_active: true },
      { id: 4, name: "일반 물품", storage_months: 1, expire_action: "폐기", sort_order: 4, is_active: true },
      { id: 5, name: "일반 귀중품", storage_months: 3, expire_action: "관할서인계", sort_order: 5, is_active: true },
    ],
    results: [
      { id: 1, name: "보관중", sort_order: 1, is_active: true },
      { id: 2, name: "본인반환", sort_order: 2, is_active: true },
      { id: 3, name: "폐기", sort_order: 3, is_active: true },
      { id: 4, name: "관할서인계", sort_order: 4, is_active: true },
    ],
    statuses: [
      { id: 1, name: "미처리", sort_order: 1, is_active: true },
      { id: 2, name: "처리완료", sort_order: 2, is_active: true },
      { id: 3, name: "취소", sort_order: 3, is_active: true },
    ],
    buildings: [
      { id: 1, name: "본관", sort_order: 1, is_active: true },
      { id: 2, name: "3호관", sort_order: 2, is_active: true },
      { id: 3, name: "6호관", sort_order: 3, is_active: true },
      { id: 4, name: "도서관", sort_order: 4, is_active: true },
      { id: 5, name: "학생회관", sort_order: 5, is_active: true },
    ],
    storagePlaces: [
      { id: 1, name: "학생처 분실물 보관함", sort_order: 1, is_active: true },
      { id: 2, name: "경비실", sort_order: 2, is_active: true },
      { id: 3, name: "도서관 안내데스크", sort_order: 3, is_active: true },
    ],
    foundItems: [
      {
        id: 1, manageNo: "20260001", receivedDate: "2026-10-01",
        categoryId: 3, itemName: "AirPods Pro", feature: "흰색 케이스, 케이스에 작은 스크래치 있음",
        foundDate: "2026-10-01", foundBuildingId: 2, foundPlaceDetail: "2층 복도 자판기 앞",
        storagePlaceId: 1, storageDetail: "A-03", deadline: "2027-01-01",
        finderType: "학생", finderNo: "20250113", finderName: "박서연", finderContact: "010-1234-5678",
        ownerName: "", ownerContact: "", contacted: "X",
        resultId: 1, expireAction: "관할서인계", processedDate: "", checkerId: 1,
        note: "케이스만 있고 본체 없음",
        receiverNo: "", receiverName: "", returnDate: "", verifyMethod: "", verifyCheckerId: "",
        images: [],
      },
      {
        id: 2, manageNo: "20260002", receivedDate: "2026-09-28",
        categoryId: 5, itemName: "검은색 카드지갑", feature: "카드 2장 들어 있음",
        foundDate: "2026-09-27", foundBuildingId: 1, foundPlaceDetail: "1층 로비 소파",
        storagePlaceId: 1, storageDetail: "B-01", deadline: "2026-12-27",
        finderType: "교직원", finderNo: "T2019041", finderName: "최민호", finderContact: "010-2222-3333",
        ownerName: "홍길동", ownerContact: "010-0000-0000", contacted: "O",
        resultId: 2, expireAction: "관할서인계", processedDate: "2026-09-29", checkerId: 2,
        note: "",
        receiverNo: "20221045", receiverName: "홍길동", returnDate: "2026-09-29",
        verifyMethod: "학생증 확인", verifyCheckerId: 2,
        images: [],
      },
      {
        id: 3, manageNo: "20260003", receivedDate: "2026-09-25",
        categoryId: 4, itemName: "텀블러", feature: "은색, 바닥에 이름 스티커",
        foundDate: "2026-09-25", foundBuildingId: 4, foundPlaceDetail: "3층 열람실",
        storagePlaceId: 3, storageDetail: "", deadline: "2026-10-25",
        finderType: "외부인", finderNo: "", finderName: "", finderContact: "",
        ownerName: "", ownerContact: "", contacted: "X",
        resultId: 1, expireAction: "폐기", processedDate: "", checkerId: 3,
        note: "", receiverNo: "", receiverName: "", returnDate: "", verifyMethod: "", verifyCheckerId: "",
        images: [],
      },
    ],
    lostReports: [
      {
        id: 1, manageNo: "20261001", receivedDate: "2026-10-01",
        categoryId: 3, itemName: "아이폰 15", feature: "검정색 케이스, 뒷면에 스티커",
        foundDate: "2026-09-30", lostBuildingId: 4, lostPlaceDetail: "3층 열람실",
        reporterType: "학생", reporterNo: "20240077", ownerName: "김유은", ownerContact: "010-3333-4444",
        statusId: 1, processedDate: "", checkerId: 1, note: "", matchedFoundId: "",
      },
      {
        id: 2, manageNo: "20261002", receivedDate: "2026-09-29",
        categoryId: 1, itemName: "학생증", feature: "",
        foundDate: "2026-09-29", lostBuildingId: 1, lostPlaceDetail: "1층 매점",
        reporterType: "학생", reporterNo: "20231188", ownerName: "조가빈", ownerContact: "010-5555-6666",
        statusId: 2, processedDate: "2026-09-30", checkerId: 2, note: "", matchedFoundId: 2,
      },
    ],
  };
}

/** 저장된 자료를 읽는다. 없으면 보기 자료를 넣고 시작한다. */
export function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.foundItems) return saved;
  } catch {
    // 깨진 값은 처음부터 다시 만든다
  }
  const fresh = seed();
  write(fresh);
  return fresh;
}

/** 자료를 저장한다. 사진이 많아 자리가 부족하면 알려 준다. */
export function write(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    throw new Error("브라우저 저장 공간이 가득 찼습니다. 사진을 줄이거나 자료를 초기화해 주세요.");
  }
}

/** 한 부분만 바꿔 저장한다. */
export function update(change) {
  const db = read();
  const next = { ...db, ...change(db) };
  write(next);
  return next;
}

/** 보기 자료로 되돌린다. */
export function reset() {
  write(seed());
}

/** 목록에서 다음 번호를 만든다. */
export function nextId(rows) {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}
