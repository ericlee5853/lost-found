# 백엔드 자료

백엔드를 만드는 사람이 볼 자료를 모아 둔 폴더다. 화면(프런트)은 이미 이 규칙대로
만들어져 있으므로, 서버를 아래대로 맞추면 화면을 고치지 않고 붙는다.

| 문서 | 내용 |
| --- | --- |
| [api-spec.md](api-spec.md) | 백엔드 API 규칙 전체. 주소, 주고받는 모양, 오류, 지켜야 할 규칙 |
| [data-model.md](data-model.md) | DB 표와 칸 목록 |

## 읽는 순서

1. **[api-spec.md](api-spec.md) 0장** — 이미 만들어 둔 「분실물 관리대장 API 연동 가이드」에서
   **무엇이 바뀌는지만** 모아 두었다. 가이드대로 만들어 둔 상태라면 여기부터 본다.
2. **[data-model.md](data-model.md)** — 새로 만들 표와 추가할 칸을 확인한다.
3. **[api-spec.md](api-spec.md) 1~6장** — 주소별로 주고받는 모양을 맞춘다.
4. **[api-spec.md](api-spec.md) 8장** — 지금 들어 있는 자료를 새 구조로 옮긴다.
5. **[api-spec.md](api-spec.md) 9장** — 다 만든 뒤 확인할 목록이다.

## 꼭 지켜야 할 세 가지

1. **설정은 이름이 아니라 번호로 이어진다.** 대장에는 `category_id` 같은 번호만 저장한다.
2. **설정은 지우지 않고 사용중지한다.** `DELETE` 는 `is_active` 를 거짓으로 바꾸는 것이다.
3. **보관만료일은 만들 때 확정해 저장한다.** `found_date` 나 `category_id` 가 바뀔 때만 다시 계산한다.

## 화면이 실제로 부르는 주소

화면 코드에서 부르는 곳은 아래가 전부다. 이 밖의 주소는 화면이 쓰지 않는다.

| 하는 일 | 주소 |
| --- | --- |
| 로그인 | `POST /auth/login` |
| 내 정보 | `GET /auth/me` |
| 담당자 목록 | `GET /auth/users?active_only=true` |
| 설정 다섯 가지 | `GET` `POST` `PUT` `DELETE /things/{설정}` |
| 대장 목록 | `GET /things/{대장}?skip=0&limit=500` |
| 다음 관리번호 | `GET /things/{대장}/next-manage-no` |
| 한 건 | `GET` `PUT` `DELETE /things/{대장}/{manage_no}` |
| 등록 | `POST /things/{대장}` |
| 사진 올리기 | `POST /things/uploads` |

검색·필터·엑셀 내보내기는 화면이 직접 처리하므로 서버 주소를 쓰지 않는다.

## 화면 쪽 연결 코드

화면은 **axios** 로 서버를 부른다. 서버 응답 모양이 궁금하면 아래 파일을 보면 된다.

| 파일 | 하는 일 |
| --- | --- |
| `src/api/client.js` | 주소, 토큰 붙이기, 오류 문구 |
| `src/api/mappers.js` | 서버 칸 이름(`snake_case`) ↔ 화면 칸 이름 변환 |
| `src/data/` | 주소별 호출 (`auth.js` · `settings.js` · `records.js` · `uploads.js`) |
