# 유실물 관리 프로그램

교내 분실물(습득물)과 분실신고를 접수·조회·처리하는 관리 프로그램.
React + Vite 로 만들었고, 현재 데이터는 브라우저의 localStorage 에 저장한다.
(추후 백엔드 서버와 DB 로 옮길 예정)

## 실행

```bash
npm install
npm run dev     # 개발 서버
npm run build   # 배포용 빌드
npm run lint    # 문법 검사
```

기본 로그인 계정은 `dytc` / `dytc` 이다.

## 화면

| 경로 | 화면 |
| --- | --- |
| `/login` | 로그인 |
| `/` | 목록 (분실물관리대장 · 분실신고 관리대장 탭, 한 쪽 10건씩) |
| `/settings` | 설정값 변경 (물품구분 · 처리결과) |
| `/found/new`, `/found/:관리번호`, `/found/:관리번호/edit` | 분실물 접수 · 상세 · 수정 |
| `/lost/new`, `/lost/:관리번호`, `/lost/:관리번호/edit` | 분실 신고 접수 · 상세 · 수정 |

## 데이터 구조

DB 로 옮길 때 그대로 테이블이 되도록 아래 구조를 따른다.

```
item_category (물품구분)
  id, name, storage_months, expire_action, sort_order, is_active

process_result (처리결과)
  id, name, sort_order, is_active

found_item (유실물)
  manageNo(관리번호), receivedDate, foundDate, itemName, feature,
  lostPlace(분실 장소), owner, ownerContact, contacted, storagePlace, checker, image,
  category_id  → item_category.id 참조
  result_id    → process_result.id 참조
  deadline     ← 등록 시점에 계산해 저장 (설정 변경과 무관)

lost_report (분실신고)   ※ 사진은 붙이지 않는다
  manageNo, receivedDate, foundDate, itemName, feature,
  lostPlace(분실 장소), owner, ownerContact, status, processedDate, checker,
  category_id  → item_category.id 참조
```

### 설정값을 다루는 3가지 규칙

1. **설정은 이름이 아니라 id 로 참조한다.**
   유실물 데이터에 "전자기기"라는 글자 대신 `category_id = 3` 처럼 번호를 저장하고,
   이름은 설정 테이블에서 가져온다. 이름을 바꾸면 기존 데이터도 새 이름으로 표시된다.
2. **삭제 대신 사용중지한다.**
   설정 테이블의 `is_active` 를 false 로 바꾼다. 새로 등록할 때 선택 목록에는 안 나오지만,
   과거 데이터는 이름을 그대로 보여 준다.
   실제 삭제는 그 항목을 쓰는 데이터가 한 건도 없을 때만 된다.
   (잘못 추가한 항목을 정리하는 용도이며, 쓰는 데이터가 있으면 화면에서 막는다.)
3. **계산 결과는 계산 시점에 확정해 저장한다.**
   `deadline`(보관기한) 은 등록할 때 계산해 레코드에 저장하므로,
   나중에 보관기간 설정이 바뀌어도 기존 건의 기한은 그대로 유지된다.

## 디자인

화면 디자인은 `유실물관리프로그램 ui.pdf` 시안(1440px 기준)을 따른다.
색과 굵기는 `src/index.css` 맨 위 변수에 모여 있다.

| 구분 | 값 | 쓰는 곳 |
| --- | --- | --- |
| 메인 컬러 | `#006EAA` | 버튼, 활성 탭, 강조 글자 |
| 메인 컬러 | `#F7F8FB` | 페이지 배경, 표 머리글, 자동 계산 칸 |
| 서브 컬러(회색) | `#E3E7ED` | 테두리, 구분선, 비활성 탭 건수 |
| 서브 블루 | `#E3ECF7` | 관리번호 상자 |

글꼴은 Pretendard 이며 npm 패키지로 들여와 인터넷 없이도 나온다.
제목·소제목(화면 제목, 로그인 제목, 카드 제목, 필터 묶음 제목)은 SemiBold(600), 나머지 본문은 Medium(500) 이다.

## 폴더 구성

```
src/
  settings.js        설정 테이블(item_category · process_result) 저장소 + 보관기한 계산
  storage.js         유실물 · 분실신고 레코드 저장소 + 구버전 데이터 마이그레이션
  constants.js       설정에서 바꾸지 않는 고정 목록 (확인자 등)
  dateUtil.js        날짜 계산 공통 함수
  imageUtil.js       사진 축소 · 전화번호 형식 변환
  auth.js            로그인 상태 저장
  useStickyState.js  화면을 옮겨도 유지되는 useState
  useRecordForm.js   상세 · 접수 · 수정 화면의 폼 공통 처리
  formContext.js     한 화면의 입력칸들이 폼 상태를 함께 쓰는 통로
  components/        여러 화면이 함께 쓰는 조각
                     PageHeader(큰 제목) · ManageNoBadge(관리번호 상자) · Section(흰 카드)
                     Field(항목 이름 + 입력칸, 상세 화면에선 값만) · PhotoCard(사진)
                     ActionBar(아래 버튼 줄) · Pagination(쪽번호) · icons · NotFoundBox
  pages/             LoginPage · ListPage · SettingsPage
                     FoundItemPage(분실물 상세·접수·수정) · LostReportPage(분실신고 상세·신고·수정)
```
