# 데이터 구조

유실물 관리 프로그램이 쓰는 표(테이블)와 칸(컬럼)을 정리한 문서다.

- **필수** 칸은 비워 둘 수 없다(NOT NULL).
- `신규` 표시는 지금 서버에 없어서 새로 만들어야 하는 칸이다.
- 괄호 안은 DB 칸 이름이다. 화면에 보이는 이름과 다를 수 있으며,
  이미 쓰고 있는 칸은 이름을 바꾸지 않고 화면 이름만 바꾼다.

## 1. 전체 구성

| 표 | 하는 일 |
| --- | --- |
| `found_item` | 분실물 관리대장. 습득한 물건 한 건 |
| `found_item_image` | 분실물 사진. 한 건에 여러 장 `신규` |
| `lost_report` | 분실신고 관리대장. 신고 한 건 |
| `item_category` | 설정: 물품 구분 |
| `process_result` | 설정: 분실물 처리상태 |
| `report_status` | 설정: 분실신고 처리상태 |
| `building` | 설정: 건물 `신규` |
| `storage_place` | 설정: 보관장소 `신규` |
| `user` | 담당자 |

## 2. 설정 표 (리스트에서 고르는 값)

화면에서 고르는 목록은 모두 DB 에 둔다. 설정값 변경 페이지에서 추가하고 사용중지한다.

다섯 표 모두 아래 칸을 공통으로 가진다.

| 칸 | 필수 | 설명 |
| --- | --- | --- |
| `id` | 필수 | 번호. 대장은 이 번호를 저장한다 |
| `name` | 필수 | 화면에 보이는 이름. 중복 불가 |
| `sort_order` | | 목록에 나오는 순서 |
| `is_active` | 필수 | 사용중(true) / 사용중지(false) |

`item_category` 만 칸이 더 있다.

| 칸 | 필수 | 설명 |
| --- | --- | --- |
| `storage_months` | 필수 | 보관 개월. 보관만료일 계산에 쓴다 |
| `expire_action` | | 만료 시 조치 방법의 기본값 |

### 다루는 규칙 세 가지

1. **이름이 아니라 번호로 저장한다.** 대장에는 "전자기기" 대신 `category_id` 번호가 들어간다.
   이름을 고쳐도 기존 대장이 새 이름으로 보인다.
2. **지우지 않고 사용중지한다.** `is_active` 를 false 로 바꾼다. 새로 등록할 때 선택 목록에서는
   빠지지만, 그 값을 쓰던 과거 기록은 이름이 그대로 보인다.
3. **계산 결과는 그때 확정해 저장한다.** 보관만료일은 등록 시점에 계산해 대장에 넣는다.
   나중에 보관 개월을 바꿔도 이미 등록된 건의 만료일은 변하지 않는다.

### 설정이 아닌 고정 목록

아래 두 가지는 값에 따라 화면 동작이 달라지므로 설정이 아니라 코드에 둔다.

| 이름 | 값 |
| --- | --- |
| 습득자 구분 · 신고자 구분 | 학생, 교직원, 외부인, 기타 |
| 연락 여부 | O, X |

## 3. 분실물 관리대장 `found_item`

### 기본 정보

| 화면 이름 | 칸 | 필수 | 설명 |
| --- | --- | --- | --- |
| (내부 식별자) | `id` | 필수 | 자동 증가. 분실신고가 이 번호로 분실물을 가리킨다 |
| 관리번호 | `manage_no` | 필수 | 자동 생성. 중복 불가. 예) `20260001` |
| 접수일 | `received_date` | 필수 | `YYYY-MM-DD` |

### 물품 정보

| 화면 이름 | 칸 | 필수 | 설명 |
| --- | --- | --- | --- |
| 물품 구분 | `category_id` | 필수 | `item_category` 선택 |
| 물품명 | `item_name` | 필수 | |
| 특징 | `feature` | | |

### 습득 정보

| 화면 이름 | 칸 | 필수 | 설명 |
| --- | --- | --- | --- |
| 습득일 | `found_date` | 필수 | 보관만료일 계산 기준 |
| 습득장소 | `found_building_id` `신규` | 필수 | `building` 선택 |
| 습득장소 상세 | `found_place_detail` `신규` | | 예) 2층 복도 자판기 앞 |

### 보관 정보

| 화면 이름 | 칸 | 필수 | 설명 |
| --- | --- | --- | --- |
| 보관장소 | `storage_place_id` `신규` | 필수 | `storage_place` 선택 |
| 보관 세부 | `storage_detail` `신규` | | 예) A-03 |
| 보관만료일 | `deadline` | | 습득일 + 물품 구분의 보관 개월. 서버가 계산 |

### 습득자 정보

| 화면 이름 | 칸 | 필수 | 설명 |
| --- | --- | --- | --- |
| 습득자 구분 | `finder_type` `신규` | 필수 | 학생 / 교직원 / 외부인 / 기타 |
| 학번·교직원번호 | `finder_no` `신규` | | 칸 하나를 쓰고 구분에 따라 이름표만 바꾼다 |
| 성명 | `finder_name` `신규` | | |
| 연락처 | `finder_contact` `신규` | | |

### 분실자 정보

화면 이름만 소유자에서 분실자로 바꾸고 칸 이름은 그대로 둔다.

| 화면 이름 | 칸 | 필수 | 설명 |
| --- | --- | --- | --- |
| 분실자 | `owner_name` | | |
| 연락처 | `owner_contact` | | |
| 연락 여부 | `contacted` | 필수 | O 또는 X. 기본값 X |

### 관리 정보

| 화면 이름 | 칸 | 필수 | 설명 |
| --- | --- | --- | --- |
| 처리상태 | `result_id` | 필수 | `process_result` 선택 |
| 만료 시 조치 방법 | `expire_action` `신규` | | 물품 구분의 기본값이 들어오고 건별로 고칠 수 있다 |
| 처리일 | `processed_date` | | 반환·폐기·인계한 날 |
| 접수담당자 | `checker_id` | | 로그인한 사용자가 자동으로 들어간다 |
| 비고 | `note` `신규` | | |

### 반환 정보 `신규`

반환 처리 화면에서 채운다. 반환 전에는 모두 비어 있다.

| 화면 이름 | 칸 | 필수 | 설명 |
| --- | --- | --- | --- |
| 수령자 학번 | `receiver_no` | | 학번 또는 교직원번호 |
| 수령자 이름 | `receiver_name` | | |
| 수령일 | `return_date` | | 접수일(`received_date`)과 헷갈리지 않게 이름을 다르게 둔다 |
| 확인 방법 | `verify_method` | | 직접 입력. 예) 학생증 확인, 본인 진술 |
| 확인담당자 | `verify_checker_id` | | `user` 선택 |

반환 처리를 저장할 때 처리상태를 본인반환으로 바꾸고 처리일을 함께 넣는다.

### 기록 시각

| 칸 | 설명 |
| --- | --- |
| `created_at` | 등록 시각 |
| `updated_at` | 마지막 수정 시각 |

## 4. 분실물 사진 `found_item_image` `신규`

한 건에 사진을 여러 장 올린다. 화면과 서버 모두 **한 건에 5장까지** 받는다.

| 칸 | 필수 | 설명 |
| --- | --- | --- |
| `id` | 필수 | |
| `found_item_id` | 필수 | `found_item.id` 참조. 분실물을 지우면 같이 지운다 |
| `image_path` | 필수 | 서버에 저장된 경로. 최대 255자 |
| `sort_order` | | 보여줄 순서. 가장 앞선 장을 목록의 대표 사진으로 쓴다 |
| `created_at` | | |

지금 `found_item.image_path` 한 칸에 담고 있는 값은 이 표의 첫 줄로 옮긴다.
옮긴 뒤 `found_item.image_path` 는 더 쓰지 않는다.

## 5. 분실신고 관리대장 `lost_report`

### 기본 정보

| 화면 이름 | 칸 | 필수 | 설명 |
| --- | --- | --- | --- |
| (내부 식별자) | `id` | 필수 | |
| 관리번호 | `manage_no` | 필수 | 자동 생성. 예) `20261001` |
| 접수일 | `received_date` | 필수 | |

### 물품 정보

| 화면 이름 | 칸 | 필수 | 설명 |
| --- | --- | --- | --- |
| 물품 구분 | `category_id` | 필수 | 분실물과 같은 목록 |
| 물품명 | `item_name` | 필수 | |
| 특징 | `feature` | | |

### 분실 정보

| 화면 이름 | 칸 | 필수 | 설명 |
| --- | --- | --- | --- |
| 분실일 | `found_date` | 필수 | 칸 이름은 그대로 두고 화면에서만 분실일로 부른다 |
| 분실장소 | `lost_building_id` `신규` | 필수 | 습득장소와 같은 `building` 목록 |
| 분실장소 상세 | `lost_place_detail` `신규` | | |

### 신고자 정보

| 화면 이름 | 칸 | 필수 | 설명 |
| --- | --- | --- | --- |
| 성명 | `owner_name` | 필수 | |
| 연락처 | `owner_contact` | 필수 | |
| 신고자 구분 | `reporter_type` `신규` | 필수 | 학생 / 교직원 / 외부인 / 기타 |
| 학번·교직원번호 | `reporter_no` `신규` | | |

### 관리 정보

| 화면 이름 | 칸 | 필수 | 설명 |
| --- | --- | --- | --- |
| 처리상태 | `status_id` | 필수 | `report_status` 선택 |
| 처리일 | `processed_date` | | |
| 접수담당자 | `checker_id` | | |
| 비고 | `note` `신규` | | |
| 찾은 분실물 | `matched_found_id` | | `found_item.id` 를 넣는다. 관리번호가 아니다 |

분실신고에는 사진을 쓰지 않는다. `lost_report.image_path` 는 남겨 두되 화면에서 다루지 않는다.

## 6. 서버에서 할 일

### 새로 만들 표

- `building`, `storage_place` : 설정 표 두 개
- `found_item_image` : 분실물 사진

### 새로 추가할 칸

| 표 | 칸 |
| --- | --- |
| `found_item` | `found_building_id`, `found_place_detail`, `storage_place_id`, `storage_detail`, `finder_type`, `finder_no`, `finder_name`, `finder_contact`, `expire_action`, `note`, `receiver_no`, `receiver_name`, `return_date`, `verify_method`, `verify_checker_id` |
| `lost_report` | `lost_building_id`, `lost_place_detail`, `reporter_type`, `reporter_no`, `note` |

### 옮겨야 할 기존 값

- `found_item.storage_place` 는 지금 자유 입력 글자다. 값들을 보고 `storage_place` 설정 표를
  만든 뒤 각 건을 `storage_place_id` + `storage_detail` 로 나눠 옮긴다. 옮긴 뒤 옛 칸은 지운다.
- `found_item.image_path` 는 `found_item_image` 의 첫 줄로 옮긴다.

### 새 API

| 하는 일 | 주소 |
| --- | --- |
| 건물 설정 | `/things/buildings` |
| 보관장소 설정 | `/things/storage-places` |
| 분실물 사진 목록·추가·삭제 | `/things/lost-items/{manage_no}/images` |

사진 올리기(`POST /things/uploads`)는 파일을 저장하고 경로를 돌려주는 역할만 한다.
그 경로를 사진 표에 연결하는 일은 위 주소가 맡는다.

## 7. 헷갈리기 쉬운 점

- **처리상태가 두 가지다.** 분실물은 `result_id`(`process_result`), 분실신고는
  `status_id`(`report_status`) 를 쓴다. 목록이 서로 다르므로 설정 화면에서
  "분실물 처리상태", "분실신고 처리상태"로 나눠 적는다.
- **분실물의 `found_date` 는 습득일, 분실신고의 `found_date` 는 분실일이다.** 칸 이름이 같다.
- **`matched_found_id` 에는 관리번호가 아니라 내부 식별자(`id`)를 넣는다.**
- **수령일은 `return_date`, 접수일은 `received_date`** 로 이름이 비슷하니 주의한다.
