# 유실물 관리 프로그램

교내 분실물(습득물)과 분실신고를 접수·조회·처리하는 관리 프로그램.
React + Vite 로 만들었고, 모든 데이터는 백엔드 API 서버에서 가져온다.

## 실행

```bash
npm install
npm run dev     # 개발 서버
npm run build   # 배포용 빌드
npm run lint    # 문법 검사
```

### 올리는 곳과 주소

화면과 API 를 같은 서버의 같은 경로(`https://campuslife.dongyang.ac.kr/founder/`)에 둔다.
`npm run build` 결과(`dist/`)를 그 경로에 올리면 된다.

| 주소 | 받는 곳 |
| --- | --- |
| `/founder/auth/...`, `/founder/things/...`, `/founder/health` | 백엔드 API |
| `/founder/uploads/...` | 올린 사진 파일 |
| 그 밖의 `/founder/...` | 화면 (`index.html`) |

웹서버는 위 경로들만 API 로 넘기고, 나머지 `/founder/` 주소는 모두 `index.html` 을
돌려줘야 한다. 그래야 `/founder/found/20260001` 에서 새로고침해도 화면이 열린다.
nginx 예시:

```nginx
location ^~ /founder/auth/   { proxy_pass http://127.0.0.1:8000; }
location ^~ /founder/things/ { proxy_pass http://127.0.0.1:8000; }
location = /founder/health   { proxy_pass http://127.0.0.1:8000; }
location ^~ /founder/uploads/ { proxy_pass http://127.0.0.1:8000; }   # 올린 사진
location /founder/ {
    alias /var/www/lost-found/;      # dist 를 올린 곳
    try_files $uri $uri/ /founder/index.html;
}
```

### 환경변수

`.env.example` 을 `.env` 로 복사해 쓴다. 기본값만으로도 동작한다.

| 이름 | 뜻 | 기본값 |
| --- | --- | --- |
| `VITE_BASE_PATH` | 화면을 올릴 경로 | `/founder/` |
| `VITE_API_BASE_URL` | API 주소. 비우면 화면과 같은 경로를 쓴다 | (비움) |
| `VITE_DEV_API_TARGET` | 개발 서버가 API 요청을 넘겨줄 서버 | 운영 서버 |

개발 중에는 `npm run dev` 로 띄운 뒤 `http://localhost:5173/founder/` 로 연다.
API 요청은 개발 서버가 운영 서버로 넘겨주므로 주소가 같아 보이고 CORS 문제가 없다.

### 로그인

로그인 계정은 백엔드에서 발급받는다. 로그인에 성공하면 받은 토큰(JWT)을 브라우저에
저장하고, 이후 모든 요청의 `Authorization: Bearer` 헤더에 자동으로 붙인다.
토큰이 없거나 만료되면(401) 토큰을 지우고 로그인 화면으로 보낸다.

## 화면

| 경로 | 화면 |
| --- | --- |
| `/login` | 로그인 |
| `/` | 목록 (분실물관리대장 · 분실신고 관리대장 탭, 한 쪽 10건씩) |
| `/settings` | 설정값 변경 (물품구분 · 처리결과) |
| `/found/new`, `/found/:관리번호`, `/found/:관리번호/edit` | 분실물 접수 · 상세 · 수정 |
| `/lost/new`, `/lost/:관리번호`, `/lost/:관리번호/edit` | 분실 신고 접수 · 상세 · 수정 |

## 서버 연동

화면은 아래 API 만 쓴다. 자세한 규격은 백엔드의 연동 가이드를 따른다.

| 하는 일 | API |
| --- | --- |
| 로그인 · 내 정보 · 사용자 목록 | `POST /auth/login`, `GET /auth/me`, `GET /auth/users` |
| 물품 구분 설정 | `/things/item-categories` |
| 분실물 처리상태 설정 | `/things/process-results` |
| 분실신고 처리상태 설정 | `/things/report-statuses` |
| 건물 설정 | `/things/buildings` (예정) |
| 보관장소 설정 | `/things/storage-places` (예정) |
| 분실물 관리대장 | `/things/lost-items` |
| 분실신고 관리대장 | `/things/lost-reports` |
| 사진 올리기 | `POST /things/uploads` |

표와 칸을 정리한 문서는 [docs/data-model.md](docs/data-model.md) 에 있다.

### 이름 규칙

서버는 `manage_no`, `item_name` 처럼 snake_case 를 쓰고 화면은 `manageNo`, `itemName`
처럼 camelCase 를 쓴다. `src/api/records.js` 의 `fromApi`/`toApi` 가 두 이름을 서로 바꾼다.
화면 코드는 서버 필드명을 알 필요가 없다.

### 설정값을 다루는 3가지 규칙

1. **설정은 이름이 아니라 id 로 참조한다.**
   대장 데이터에는 "전자기기"라는 글자 대신 `category_id` 번호가 들어 있다.
   서버 응답에는 이름이 없으므로, 화면은 설정 목록과 사용자 목록을 받아 id 로 이름을 찾는다.
   (`src/components/ReferenceProvider.jsx` 가 로그인 뒤 한 번 받아 둔다.)
   리스트에서 고르는 값은 모두 DB 의 설정 표에 둔다. 화면 동작과 묶인 목록
   (습득자 구분, 연락 여부)만 코드에 상수로 둔다.
2. **삭제 대신 사용중지한다.**
   설정의 `DELETE` 는 실제 삭제가 아니라 `is_active` 를 false 로 바꾼다.
   새로 등록할 때 선택 목록에는 안 나오지만, 과거 데이터는 이름을 그대로 보여 준다.
3. **계산 결과는 계산 시점에 확정해 저장한다.**
   보관기한은 서버가 습득일 + 물품구분의 보관개월로 계산해 저장한다.
   수정할 때는 실제로 바뀐 항목만 보내므로, 습득일이나 물품 구분을 건드리지 않으면
   보관기간 설정이 바뀌어도 기존 건의 기한은 그대로 유지된다.

### 사진 등록

사진 칸을 누르면 파일을 고르고 바로 서버에 올린다. 올린 뒤 받은 경로를 사진 표에 저장한다.
한 건에 5장까지 올린다. (사진 표는 [docs/data-model.md](docs/data-model.md) 참고)

- 올릴 수 있는 형식: jpg, jpeg, jpe, jfif, png, gif, bmp, webp, heic, heif, hif, avif, tif, tiff
  (아이폰의 HEIC·HEIF 와 안드로이드 형식을 포함한다)
- 최대 용량: 원본 20MB
- 올리기 전에 긴 변을 1280px 로 줄이고 JPEG 로 바꾼다. 휴대폰 사진도 수백 KB 로 작아진다.
- 브라우저가 열지 못하는 형식(예: 크롬의 HEIC)은 줄이지 않고 원본을 올리며,
  미리보기가 안 보일 수 있다고 화면에서 알려 준다.

크기와 형식 제한은 모두 화면에서 안내한다. 서버 쪽 제한은 화면을 거치지 않은 요청을
막기 위한 안전장치다. 서버에 붙이는 방법은 `backend/README.md` 에 있다.

### 서버에 필요한 것

- **표와 칸 추가**: 건물·보관장소 설정 표, 분실물 사진 표, 습득자·반환 정보 칸 등.
  [docs/data-model.md](docs/data-model.md) 의 "서버에서 할 일" 에 정리했다.
- **사진 업로드 API**: `backend/uploads.py` 를 백엔드에 복사해 연결한다.
  (`backend/README.md` 참고)
- **확인자 목록**: `GET /auth/users` 는 ADMIN 만 부를 수 있다. 권한이 없으면
  확인자 선택 목록에 본인만 나온다.
- **인증서 중간 체인**: 서버가 중간 인증서를 함께 보내지 않아 브라우저가 아닌
  프로그램(Node·curl 등)에서 연결이 막힌다. fullchain 인증서를 설치하면 된다.

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
  api/client.js      axios 설정 (주소 · 토큰 · 오류 문구)
  api/auth.js        로그인 · 내 정보 · 사용자 목록
  api/settings.js    설정 세 가지의 조회 · 추가 · 수정 · 사용중지
  api/records.js     두 대장의 조회 · 등록 · 수정 · 삭제 + 이름 변환
  api/uploads.js     사진 올리기
  referenceContext.js 설정·사용자 목록을 화면에 넘기는 통로와 id → 이름 도우미
  useAsync.js        API 호출을 "불러오는 중 / 오류 / 결과" 로 다루는 도우미
  constants.js       서버 설정으로 바꾸지 않는 고정 값
  dateUtil.js        날짜 계산 공통 함수
  formatUtil.js      전화번호 형식 변환
  imageFile.js       사진 파일 확인(형식·용량) 과 올리기 전 크기 줄이기
  useStickyState.js  화면을 옮겨도 유지되는 useState
  useRecordForm.js   상세 · 접수 · 수정 화면의 폼 공통 처리
  formContext.js     한 화면의 입력칸들이 폼 상태를 함께 쓰는 통로
  components/        여러 화면이 함께 쓰는 조각
                     PageHeader(큰 제목) · ManageNoBadge(관리번호 상자) · Section(흰 카드)
                     Field(항목 이름 + 입력칸, 상세 화면에선 값만) · PhotoCard(사진)
                     ActionBar(아래 버튼 줄) · Pagination(쪽번호) · icons
                     ReferenceProvider(설정·사용자 목록 준비) · StatusBox(불러오는 중·오류)
  pages/             LoginPage · ListPage · SettingsPage
                     FoundItemPage(분실물 상세·접수·수정) · LostReportPage(분실신고 상세·신고·수정)
```

백엔드에 붙일 코드는 따로 있다.

```
backend/
  uploads.py         사진 업로드 API (FastAPI 라우터). 백엔드 프로젝트에 복사해 쓴다.
  README.md          붙이는 방법
```
