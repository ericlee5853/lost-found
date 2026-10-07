# 백엔드 API 규칙

- `POST /auth/signup`, `PUT /auth/me`, `PUT /auth/users/{id}`, `DELETE /auth/users/{id}`
- 로그인 동작(fail_count, 감사 로그, 토큰 만료 시간)
- 설정의 `DELETE` 가 실제 삭제가 아니라 `is_active=false` 인 점과 지금의 안내 문구
- 설정 목록 정렬(`sort_order` → `id`), `active_only` 조건
- 보관기한 계산 규칙
- `contacted` 가 `"O"`/`"X"` 인 점과 생략 시 `"X"`
- 대장 목록의 검색·필터 조건과 별칭 — 화면은 받아온 자료에서 직접 거르므로 쓰지 않는다
- `GET /things/lost-items/export/excel` 과 분실신고 쪽 같은 주소 — 화면이 직접 엑셀을 만든다
- `GET /things/audit-logs`
- `GET /health`
- 대장 응답에 이름(`category_name` 등)이 없는 점 — 화면이 설정 목록에서 번호로 찾아 붙인다

### 새로 만들 것

설정 표 두 개(건물·보관장소), 분실물 사진 표, 사진 올리기 주소, 그리고 분실물·분실신고에
추가되는 칸이다. 칸 목록은 [데이터 구조](data-model.md) 에 있고, 주소와 주고받는 모양은
이 문서 3~6장에 있다. 기존 자료를 옮기는 방법은 [8장](#8-기존-자료-옮기기) 에 있다.

## 1. 공통 규칙

### 주소

```
https://campuslife.dongyang.ac.kr/founder/
```

화면도 같은 경로에 올린다. 웹서버는 아래만 백엔드로 넘기고, 나머지 `/founder/...` 는
화면(`index.html`)이 받는다.

| 주소 | 받는 곳 |
| --- | --- |
| `/founder/auth/...` | 백엔드 |
| `/founder/things/...` | 백엔드 |
| `/founder/uploads/...` | 올린 사진 파일 |
| `/founder/health` | 백엔드 |
| 그 밖 | 화면 |

> `바뀜` 기존 가이드의 `GET /` (`{"message":"분실물 관리 대장 API가 실행 중입니다."}`) 는
> 화면 주소와 겹친다. 위 표대로 웹서버에서 갈라 주면 되고, **백엔드 코드는 고치지 않아도 된다.**
> nginx 예시는 저장소 README 에 있다.

### 주고받는 모양

- 본문은 JSON 이다. 파일을 올릴 때만 `multipart/form-data` 를 쓴다.
- 칸 이름은 `snake_case` 다. 예) `manage_no`, `found_building_id`
- 날짜는 `"YYYY-MM-DD"` 글자다. 시각은 ISO 8601 이다.
- 값이 없으면 `null` 을 보낸다. 빈 글자(`""`)는 보내지 않는다.
- 로그인과 서버 확인(`/auth/login`, `/health`)을 뺀 모든 요청에 아래 헤더가 필요하다.

```
Authorization: Bearer {access_token}
```

### 목록 응답

목록은 아래 모양을 권한다. 전체 개수가 있어야 나중에 서버 쪽 나누기로 넘어갈 수 있다.

```json
{ "items": [ ... ], "total": 137 }
```

> `바뀜` 기존 가이드는 배열만 돌려준다. 화면은 **두 모양 다 받도록** 해 두었고
> `limit=500` 으로 한 번에 받아 화면에서 쪽을 나누므로, 이 변경은 급하지 않다.
> 대장이 500건을 넘어가면 서버 쪽 나누기로 바꿔야 하고, 그때 `total` 이 필요하다.

### 오류

```json
{ "detail": "사람이 읽을 수 있는 한국어 설명" }
```

| 코드 | 언제 |
| --- | --- |
| 400 | 요청이 형식에 맞지 않음 |
| 401 | 토큰이 없거나 만료됨 |
| 403 | 권한이 없음 |
| 404 | 그 관리번호·번호의 자료가 없음 |
| 409 | 관리번호나 설정 이름이 겹침 |
| 422 | 필수값 빠짐, 날짜·숫자 형식 오류, 길이 초과 |

> `바뀜` 화면은 `detail` 을 **그대로 사용자에게 보여 준다.** `"Not authenticated"` 처럼
> 영어로 오면 사용자가 그 글자를 그대로 본다. 그래서 **오류 문구는 한국어로** 적는다.
> 오류 코드 자체는 기존 가이드 그대로다.

## 2. 로그인과 사용자

### POST /auth/login

인증 필요 없음.

```json
{ "login_id": "dytc", "password": "..." }
```

응답

```json
{ "access_token": "JWT 문자열", "token_type": "bearer" }
```

아이디나 비밀번호가 틀리면 401 이다.

### GET /auth/me

지금 로그인한 담당자. 화면은 접수담당자·확인담당자 기본값으로 쓴다.

```json
{ "id": 1, "login_id": "dytc", "name": "김남진", "dept": "학생처", "role": "ADMIN", "is_active": true }
```

### GET /auth/users?active_only=true

담당자 선택 목록에 쓴다. 응답은 `/auth/me` 와 같은 모양의 목록이다.

```json
{ "items": [ { "id": 1, "name": "김남진", "dept": "학생처", ... } ], "total": 3 }
```

> `바뀜` 기존 가이드는 **ADMIN 만** 부를 수 있다. 그러면 ADMIN 이 아닌 담당자는 목록과 상세에서
> 다른 사람이 처리한 건의 접수담당자·확인자 이름이 전부 "-" 로 보인다. 이름을 보여 주는
> 용도이니 **로그인한 사람 모두에게 열어 주기를 권한다.**
> 열기 어렵다면 그대로 둬도 화면은 돌아간다. 403 이 오면 본인 이름만 쓰고 나머지는 "-" 로 둔다.

## 3. 설정 (목록에서 고르는 값)

다섯 가지가 **주소만 다르고 동작이 같다.**

| 설정 | 주소 | |
| --- | --- | --- |
| 물품 구분 | `/things/item-categories` | |
| 분실물 처리상태 | `/things/process-results` | |
| 분실신고 처리상태 | `/things/report-statuses` | |
| 건물 | `/things/buildings` | `신규` |
| 보관장소 | `/things/storage-places` | `신규` |

### 공통 칸

| 칸 | 형식 | 설명 |
| --- | --- | --- |
| `id` | 정수 | 대장은 이 번호를 저장한다 |
| `name` | 글자 50 | 화면에 보이는 이름. 같은 설정 안에서 중복 불가 |
| `sort_order` | 정수 | 목록 순서. 기본 0 |
| `is_active` | 참/거짓 | 사용중 / 사용중지 |

`item-categories` 만 칸이 더 있다.

| 칸 | 형식 | 설명 |
| --- | --- | --- |
| `storage_months` | 정수 0 이상 | 보관 개월. 보관만료일 계산에 쓴다 |
| `expire_action` | 글자 50 또는 null | 기간 만료 시 조치 방법의 기본값 |

### code 칸 `바뀜`

`process-results` 와 `report-statuses` **두 설정에만** `code` 칸을 더한다.
물품 구분·건물·보관장소에는 필요 없다.

| 칸 | 형식 | 설명 |
| --- | --- | --- |
| `code` | 글자 20 또는 null | 화면이 뜻을 알아보는 열쇠. 설정 안에서 중복 불가 |

화면은 새로 접수할 때 "보관중"을 고르고, 반환 처리하면 "본인반환"으로 바꾼다.
지금은 **이름으로 찾기 때문에** 관리자가 "보관중"을 "보관 중"으로 바꾸면 동작이 어긋난다.
`code` 로 찾으면 이름을 마음대로 바꿔도 된다. 처음에 아래 값을 넣어 둔다.

| 설정 | code | 처음 이름 | 화면에서 쓰는 곳 |
| --- | --- | --- | --- |
| 분실물 처리상태 | `STORED` | 보관중 | 새로 접수할 때의 기본값, 초록 표시 |
| 분실물 처리상태 | `RETURNED` | 본인반환 | 반환 처리하면 이 상태로 바꾼다, 체크 표시 |
| 분실물 처리상태 | `DISCARDED` | 폐기 | |
| 분실물 처리상태 | `TRANSFERRED` | 관할서인계 | |
| 분실신고 처리상태 | `OPEN` | 미처리 | 새로 접수할 때의 기본값 |
| 분실신고 처리상태 | `DONE` | 처리완료 | 분실물과 연결하면 이 상태로 바꾼다 |
| 분실신고 처리상태 | `CANCELED` | 취소 | |

관리자가 새로 만드는 항목은 `code` 가 `null` 이다. `code` 가 있는 항목은 사용중지나
이름 바꾸기는 되더라도 **지우지는 못하게** 막는 편이 안전하다.

> 아직 `code` 가 없어도 화면은 이름으로 한 번 더 찾아보도록 해 두었다.
> 그래서 당장 깨지지는 않지만, 이름을 바꾸면 어긋난다.

### GET /things/{설정}?active_only=false

`sort_order` 오름차순, 같으면 `id` 순으로 돌려준다.
`active_only=true` 면 `is_active` 가 참인 것만 준다. 새로 등록하는 화면이 이 값을 쓴다.

### POST /things/{설정}

```json
{ "name": "6호관", "sort_order": 3 }
```

이름이 겹치면 409 다. 만든 행을 201 로 돌려준다.

### PUT /things/{설정}/{id}

바뀐 칸만 보낸다. `id` 는 바꾸지 않는다. 이름이 겹치면 409 다.

### DELETE /things/{설정}/{id}

**지우지 않는다.** `is_active` 를 거짓으로 바꾼다.

```json
{ "message": "사용중지되었습니다." }
```

다시 쓰려면 `PUT` 으로 `{"is_active": true}` 를 보낸다.

## 4. 분실물 관리대장

### 응답 모양

```json
{
  "id": 12,
  "manage_no": "20260001",
  "received_date": "2026-10-01",
  "category_id": 3,
  "item_name": "AirPods Pro",
  "feature": "흰색 케이스",
  "found_date": "2026-10-01",
  "found_building_id": 2,
  "found_place_detail": "2층 복도 자판기 앞",
  "storage_place_id": 1,
  "storage_detail": "A-03",
  "deadline": "2027-01-01",
  "finder_type": "학생",
  "finder_no": "20250113",
  "finder_name": "박서연",
  "finder_contact": "010-1234-5678",
  "owner_name": null,
  "owner_contact": null,
  "contacted": "X",
  "result_id": 1,
  "expire_action": "관할서인계",
  "processed_date": null,
  "checker_id": 1,
  "note": null,
  "receiver_no": null,
  "receiver_name": null,
  "return_date": null,
  "verify_method": null,
  "verify_checker_id": null,
  "images": [
    { "id": 5, "image_path": "/uploads/2026/10/a1b2.jpg", "sort_order": 0 }
  ],
  "created_at": "2026-10-01T09:12:03",
  "updated_at": "2026-10-01T09:12:03"
}
```

### 장소 칸 `바뀜`

| 기존 | 바뀜 |
| --- | --- |
| `storage_place` (자유 입력 글자 100) | `storage_place_id` (설정 참조) + `storage_detail` (글자 50, null 허용) |
| (없음) | `found_building_id` (설정 참조) + `found_place_detail` (글자 50, null 허용) |

보관장소는 `/things/storage-places` 에서, 습득장소는 `/things/buildings` 에서 고른다.
세부 위치(예 `A-03`, `2층 복도 자판기 앞`)는 뒤쪽 글자 칸에 따로 넣는다.
지금 들어 있는 글자를 옮기는 방법은 [8장](#8-기존-자료-옮기기) 에 있다.

### 사진 칸 `바뀜`

| 기존 | 바뀜 |
| --- | --- |
| `image_path` (글자 255 한 칸) | `images` (사진 표 `found_item_image` 참조) |

- 분실물 한 건에 사진을 **다섯 장까지** 넣는다.
- 응답의 `images` 는 **항상 배열**이다. 사진이 없으면 빈 배열이고, `sort_order` 순으로 준다.
- `POST` · `PUT` 은 **경로만 담은 배열**로 받는다. 배열 순서가 곧 보여 줄 순서다.

```json
{ "images": ["/uploads/2026/10/a1b2.jpg", "/uploads/2026/10/c3d4.jpg"] }
```

파일을 받는 주소는 [6장](#6-사진-올리기) 에 있다.

### 필수 칸

`received_date`, `category_id`, `item_name`, `found_date`, `found_building_id`,
`storage_place_id`, `finder_type`, `result_id`

`contacted` 는 `"O"` 또는 `"X"` 만 받는다. 안 보내면 `"X"` 로 저장한다.
`finder_type` 은 `학생`, `교직원`, `외부인`, `기타` 중 하나다.

### GET /things/lost-items

화면은 `skip=0&limit=500` 만 보내고, 검색과 필터는 받아온 자료에서 직접 거른다.
그래서 **기존 검색·필터 조건(`search`, `category_id`, `result_id`, 별칭 포함)은
지금 그대로 두면 된다.** 새로 만들거나 고칠 필요가 없다.

최근에 등록한 건(`id` 내림차순)이 먼저 오면 된다.

### GET /things/lost-items/next-manage-no `바뀜`

접수 화면에서 미리 보여 줄 번호를 돌려준다. 저장하지는 않는다. 새로 만드는 주소다.

```json
{ "manage_no": "20260004" }
```

> 이 주소가 없어도 화면은 열린다. 관리번호 칸만 비어 보이고, 저장하면 서버가 번호를 넣는다.

### GET /things/lost-items/{manage_no}

없으면 404 다.

### POST /things/lost-items

- **관리번호는 서버가 만든다** `바뀜`. 화면은 `manage_no` 를 보내지 않는다.
  기존 가이드는 `manage_no` 가 필수라서, 지금 코드 그대로면 필수값 누락으로 422 가 난다.
  번호 규칙은 지금과 같다. `연도 + 0 + 세 자리 일련번호`, 예) `20260001`
  두 사람이 같은 번호로 동시에 등록하면 한쪽이 409 로 막히는데, 번호를 서버가 쥐면 그 문제가 없다.
- `deadline` 은 보내지 않는다. 서버가 `found_date + 물품 구분의 storage_months` 로 계산해 저장한다.
  `storage_months` 가 0 이면 `null` 이다. 더한 달에 그 날짜가 없으면 그 달 마지막 날로 맞춘다.
  예) 2026-01-31 + 1개월 → 2026-02-28
- `expire_action` 을 보내지 않으면 물품 구분의 값을 넣는다.
- `images` 는 올린 사진 경로의 배열로 받는다.

만든 건을 201 로 돌려준다.

### PUT /things/lost-items/{manage_no}

- 바뀐 칸만 보낸다. 보내지 않은 칸은 건드리지 않는다.
- **`found_date` 나 `category_id` 가 올 때만 `deadline` 을 다시 계산한다.**
  그래야 보관기간 설정을 바꿔도 기존 건의 기한이 그대로 유지된다.
- `manage_no` 는 바꾸지 않는다. 화면은 보내지 않으므로 **막는 편이 좋다** `바뀜`.
- `images` 가 오면 **그 배열로 통째로 맞춘다.** 배열에 없는 사진은 지우고, 순서도 배열을 따른다.

반환 처리도 이 주소를 쓴다. 화면이 아래를 한 번에 보낸다.

```json
{
  "receiver_no": "20231001",
  "receiver_name": "정하늘",
  "return_date": "2026-10-06",
  "verify_method": "학생증 확인",
  "verify_checker_id": 1,
  "result_id": 2,
  "processed_date": "2026-10-06"
}
```

### DELETE /things/lost-items/{manage_no}

정말로 지운다. 사진 행도 같이 지운다.

```json
{ "message": "삭제되었습니다." }
```

## 5. 분실신고 관리대장

### 응답 모양

```json
{
  "id": 7,
  "manage_no": "20261001",
  "received_date": "2026-10-01",
  "category_id": 3,
  "item_name": "아이폰 15",
  "feature": "검정색 케이스",
  "found_date": "2026-09-30",
  "lost_building_id": 4,
  "lost_place_detail": "3층 열람실",
  "reporter_type": "학생",
  "reporter_no": "20240077",
  "owner_name": "김유은",
  "owner_contact": "010-3333-4444",
  "status_id": 1,
  "processed_date": null,
  "checker_id": 1,
  "note": null,
  "matched_found_id": null,
  "created_at": "...",
  "updated_at": "..."
}
```

`found_date` 는 분실신고에서 **분실일**을 뜻한다. 칸 이름은 분실물과 같게 둔다.
분실 장소는 분실물의 습득 장소와 같은 방식으로 `lost_building_id` + `lost_place_detail` 을 쓴다 `바뀜`.

분실신고에는 사진을 쓰지 않는다. 기존 `image_path` 는 화면에서 다루지 않으니 **그대로 두면 된다.**

### 필수 칸

`received_date`, `category_id`, `item_name`, `found_date`, `lost_building_id`,
`reporter_type`, `owner_name`, `owner_contact`, `status_id`

### 주소

| 하는 일 | 주소 | |
| --- | --- | --- |
| 목록 | `GET /things/lost-reports` | |
| 다음 관리번호 | `GET /things/lost-reports/next-manage-no` (`연도 + 1 + 세 자리`) | `바뀜` |
| 한 건 | `GET /things/lost-reports/{manage_no}` | |
| 등록 | `POST /things/lost-reports` | |
| 수정 | `PUT /things/lost-reports/{manage_no}` | |
| 삭제 | `DELETE /things/lost-reports/{manage_no}` | |

관리번호를 서버가 만드는 것과 목록 조건은 분실물과 같다. 화면은 `skip`, `limit` 만 쓴다.

### 분실물과 연결

따로 주소를 두지 않는다. 화면이 `PUT` 으로 아래를 보낸다.

```json
{ "matched_found_id": 12, "status_id": 2, "processed_date": "2026-10-06" }
```

연결을 풀 때는 `matched_found_id` 를 `null` 로, `status_id` 를 `OPEN` 인 것으로 보낸다.
`matched_found_id` 에는 분실물의 **`id`** 를 넣는다. 관리번호가 아니다.
없는 `id` 면 404 나 422 로 막는다.

## 6. 사진 올리기

### POST /things/uploads `바뀜`

새로 만드는 주소다. 기존 가이드에는 파일 업로드 API 가 없었다.
`multipart/form-data`, 칸 이름은 `file` 이다. 한 번에 한 장이다.

```json
{ "image_path": "/uploads/2026/10/a1b2c3.jpg", "size": 182734 }
```

- 받은 `image_path` 를 분실물의 `images` 배열에 넣어 저장한다.
- 파일 이름은 **추측할 수 없는 임의 글자**로 바꿔 저장한다.
  사진 주소에는 로그인 토큰을 붙일 수 없어서 주소만 알면 열리기 때문이다.
- 크기·형식 안내는 화면에서 한다. 서버는 마지막 안전장치로만 막는다.
  허용 확장자는 jpg, jpeg, jpe, jfif, png, gif, bmp, webp, heic, heif, hif, avif, tif, tiff 이고
  25MB 를 넘으면 413 이다.
- 올린 파일은 `/founder/uploads/...` 로 열 수 있어야 한다.

바로 쓸 수 있는 FastAPI 코드가 `backend/uploads.py` 에 있다.

## 7. 꼭 지켜야 할 세 가지

1. **설정은 이름이 아니라 번호로 이어진다.**
   대장에는 `category_id` 같은 번호만 저장한다. 이름을 바꿔도 기존 자료가 새 이름으로 보여야 한다.
2. **설정은 지우지 않고 사용중지한다.**
   `DELETE` 는 `is_active` 를 거짓으로 바꾸는 것이다. 과거 자료가 그 설정을 가리켜도 이름이 나와야 한다.
3. **보관만료일은 만들 때 확정해 저장한다.**
   `found_date` 나 `category_id` 가 바뀔 때만 다시 계산한다. 보관기간 설정을 바꿔도
   이미 등록된 건의 기한은 변하지 않는다.

## 8. 기존 자료 옮기기

- `found_item.storage_place` 는 지금 자유 입력 글자다. 값들을 보고 `storage_place` 설정 표를
  만든 뒤, 각 건을 `storage_place_id` + `storage_detail` 로 나눠 옮긴다. 옮긴 뒤 옛 칸은 지운다.
- `found_item.image_path` 는 `found_item_image` 의 첫 줄(`sort_order` 0)로 옮긴다.
  옮긴 뒤 옛 칸은 더 쓰지 않는다.
- `lost_report.image_path` 는 손대지 않는다.

## 9. 만들 때 확인할 목록

- [ ] `POST` 가 관리번호를 서버에서 만들어 주는가
- [ ] `next-manage-no` 가 저장 없이 번호만 돌려주는가
- [ ] 보관장소·습득장소가 설정 참조 + 세부 글자 두 칸인가
- [ ] `images` 가 배열로 나가고, `PUT` 으로 통째로 맞춰지는가
- [ ] 업로드한 파일이 `/founder/uploads/...` 로 열리는가
- [ ] `process_result` · `report_status` 에 `code` 칸이 있고 기본값이 들어갔는가
- [ ] 설정 `DELETE` 가 실제로 지우지 않고 사용중지로 바꾸는가
- [ ] `deadline` 을 서버가 계산하고, `found_date`·`category_id` 가 올 때만 다시 계산하는가
- [ ] 월말 넘김이 그 달 마지막 날로 맞춰지는가 (1/31 + 1개월 → 2/28)
- [ ] 오류 `detail` 이 한국어인가
- [ ] `/auth/users` 를 ADMIN 이 아닌 사람도 부를 수 있는가 (이름 표시에 필요)
- [ ] 목록 응답이 `{items, total}` 인가 (권장, 급하지 않음)
- [ ] 웹서버가 `/founder/` 를 화면과 백엔드로 갈라 주는가
- [ ] 서버가 중간 인증서까지 보내는가 (브라우저가 아닌 프로그램이 붙을 때 필요)
