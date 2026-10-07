# 유실물 관리 프로그램

교내 분실물(습득물)과 분실신고를 접수·조회·처리하는 관리 프로그램.
React + Vite 로 만들었고, 모든 자료는 백엔드 API 서버에서 가져온다.

백엔드에 넘길 자료는 [docs/backend/](docs/backend/) 에 모아 두었다.
기존 연동 가이드에서 바뀌는 부분은 [api-spec.md](docs/backend/api-spec.md) 0장에 있다.

## 실행

```bash
npm install
npm run dev     # 개발 서버
npm run build   # 배포용 빌드
npm run lint    # 문법 검사
```

### 올리는 곳

화면과 API 를 학교 서버의 같은 경로(`https://campuslife.dongyang.ac.kr/founder/`)에 둔다.
`npm run build` 결과(`dist/`)를 그 경로에 올린다.

| 주소 | 받는 곳 |
| --- | --- |
| `/founder/auth/...`, `/founder/things/...`, `/founder/health` | 백엔드 |
| `/founder/uploads/...` | 올린 사진 파일 |
| 그 밖의 `/founder/...` | 화면 (`index.html`) |

웹서버는 위 경로만 백엔드로 넘기고, 나머지 `/founder/` 주소는 모두 `index.html` 을
돌려줘야 한다. 그래야 `/founder/found/20260001` 에서 새로고침해도 화면이 열린다.
nginx 예시다. `proxy_pass` 끝에 경로를 붙여야 `/founder` 가 떨어진다.

```nginx
location ^~ /founder/auth/    { proxy_pass http://127.0.0.1:8000/auth/; }
location ^~ /founder/things/  { proxy_pass http://127.0.0.1:8000/things/; }
location ^~ /founder/uploads/ { proxy_pass http://127.0.0.1:8000/uploads/; }
location = /founder/health    { proxy_pass http://127.0.0.1:8000/health; }
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
| `VITE_API_BASE_URL` | API 주소. 비우면 화면과 같은 경로 | (비움) |
| `VITE_DEV_API_TARGET` | 개발 서버가 API 요청을 넘겨줄 서버 | 학교 서버 |

개발할 때는 `npm run dev` 로 띄운 뒤 `http://localhost:5173/founder/` 로 연다.
API 요청은 개발 서버가 넘겨주므로 주소가 같아 보이고 CORS 문제가 없다.

API 요청은 학교 서버(`https://campuslife.dongyang.ac.kr`)로 넘어간다.
다른 서버를 보려면 `.env` 의 `VITE_DEV_API_TARGET` 만 바꾼다.

### 로그인

계정은 백엔드에서 발급받는다. 로그인에 성공하면 받은 토큰(JWT)을 브라우저에 저장하고,
이후 모든 요청의 `Authorization: Bearer` 헤더에 자동으로 붙인다.
토큰이 없거나 만료되면(401) 토큰을 지우고 로그인 화면으로 보낸다.

## 화면

| 경로 | 화면 |
| --- | --- |
| `/login` | 로그인 |
| `/found` | 분실물 대장 |
| `/found/new` | 분실물 접수 |
| `/found/:관리번호` | 분실물 상세 |
| `/found/:관리번호/edit` | 분실물 수정 |
| `/found/:관리번호/return` | 반환 처리 |
| `/lost` | 분실신고 대장 |
| `/lost/new` | 분실 신고 접수 |
| `/lost/:관리번호` | 분실 신고 상세 |
| `/lost/:관리번호/edit` | 분실 신고 수정 |
| `/lost/:관리번호/match` | 분실물 찾아 연결 |
| `/settings` | 설정값 변경 |

버튼을 누르면 어디로 가는지는 [docs/screen-flow.md](docs/screen-flow.md) 에 있다.

## 서버 연동

화면이 쓰는 자료는 모두 `src/data/` 를 거친다. 그 아래에서 `src/api/` 가 실제 호출을 맡는다.

| 파일 | 맡은 일 |
| --- | --- |
| `api/client.js` | 주소·토큰·오류 문구·목록 응답 모양 맞추기 |
| `api/mappers.js` | 서버(snake_case) ↔ 화면(camelCase) 칸 이름 변환 |
| `data/auth.js` | 로그인 · 내 정보 · 담당자 목록 |
| `data/settings.js` | 설정 다섯 가지 |
| `data/records.js` | 두 대장과 연결 |
| `data/uploads.js` | 사진 올리기 |

| 문서 | 내용 |
| --- | --- |
| [docs/backend/api-spec.md](docs/backend/api-spec.md) | 백엔드 API 규칙 전체. 0장에 기존 가이드 대비 변경점 |
| [docs/backend/data-model.md](docs/backend/data-model.md) | DB 표와 칸 |

### 설정값을 다루는 세 가지 규칙

1. **이름이 아니라 번호로 저장한다.** 대장에는 "전자기기" 대신 번호가 들어간다.
   이름을 고치면 기존 자료의 표시 이름도 함께 바뀐다.
2. **지우지 않고 사용중지한다.** 새로 등록할 때 목록에서 빠지지만 과거 자료는 이름이 남는다.
3. **계산 결과는 그때 확정해 저장한다.** 보관만료일은 등록할 때 계산해 적어 두므로,
   나중에 보관기간 설정을 바꿔도 이미 등록된 건의 기한은 그대로다.

### 사진

사진 칸에서 **사진 촬영** 또는 **파일 업로드** 로 한 건에 다섯 장까지 넣는다.
큰 사진은 좌우 화살표로 넘겨 보고, 아래 작은 사진을 눌러 바로 고를 수 있다.

- 올릴 수 있는 형식: jpg, jpeg, jpe, jfif, png, gif, bmp, webp, heic, heif, hif, avif, tif, tiff
- 최대 용량: 원본 20MB. 넣기 전에 긴 변을 1000px 로 줄인다
- 고르면 바로 서버에 올리고, 받은 경로만 대장에 저장한다

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
  api/               서버를 부르는 자리 (주소·토큰·오류·칸 이름 변환)
  data/              화면이 쓰는 자료 창구 (로그인·설정·대장·사진)
  useAsync.js        API 호출을 "불러오는 중 / 오류 / 결과" 로 다루는 도우미
  referenceContext.js 설정·담당자 목록을 화면에 넘기는 통로와 번호 → 이름 도우미
  constants.js       설정으로 바꾸지 않는 고정 값 (습득자 구분, 연락 여부)
  dateUtil.js        날짜 계산과 보관만료일 미리보기
  formatUtil.js      전화번호 형식 변환
  imageFile.js       사진 확인(형식·용량)과 넣기 전 크기 줄이기
  useStickyState.js  화면을 옮겨도 유지되는 useState
  useRecordForm.js   상세·접수·수정 화면의 폼 공통 처리
  formContext.js     한 화면의 입력칸들이 폼 상태를 함께 쓰는 통로
  components/        여러 화면이 함께 쓰는 조각
                     AppLayout(왼쪽 메뉴 틀) · PageHeader · ManageNoBadge · Section
                     Field(이름 + 입력칸, 상세에서는 값만) · PhotoBox(사진 넘겨보기)
                     StatusPill(처리상태 표시) · ListToolbar · Pagination · icons
                     ReferenceProvider(설정·담당자 준비) · StatusBox(불러오는 중·오류)
  pages/             LoginPage · FoundListPage · FoundItemPage · FoundReturnPage
                     LostListPage · LostReportPage · LostMatchPage · SettingsPage
```

문서는 `docs/` 에 있다.

```
docs/   백엔드 API 규칙 · 데이터 구조 · 화면 흐름 · 화면 시안 그림
```
