# 유실물 관리 프로그램

교내 분실물(습득물)과 분실신고를 접수·조회·처리하는 관리 프로그램.
React + Vite 로 만들었다.

**지금은 화면만 확인하는 단계다.** 자료는 서버가 아니라 보고 있는 브라우저에 저장되며,
새로고침해도 남지만 다른 기기와는 공유되지 않는다. 설정값 변경 화면 맨 아래에서
처음 보기 자료로 되돌릴 수 있다. 백엔드가 준비되면 `src/data/` 폴더만 바꿔 서버와 잇는다.

## 실행

```bash
npm install
npm run dev     # 개발 서버
npm run build   # 배포용 빌드
npm run lint    # 문법 검사
```

### 올리는 곳

Vercel 에 그대로 올리면 된다. 들어오는 설정은 `vercel.json` 에 있고, 어떤 주소로 들어와도
화면이 열리도록 해 둔다.

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버. `http://localhost:5173` |
| `npm run build` | 올릴 파일 만들기 (`dist/`) |

나중에 학교 서버의 `/founder/` 아래로 옮길 때는 `.env` 에 아래 한 줄만 넣는다.

```
VITE_BASE_PATH=/founder/
```

### 로그인

화면 확인 단계라 아이디와 비밀번호를 적으면 들어간다.
백엔드가 붙으면 이 자리에서 토큰을 받아 저장하고, 토큰이 없거나 만료되면
로그인 화면으로 보내도록 바꾼다.

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

## 앞으로 서버와 잇기

화면이 쓰는 자료는 모두 `src/data/` 를 거친다. 서버가 준비되면 이 폴더의 함수 속을
API 호출로 바꾸면 되고, 화면 코드는 고치지 않아도 된다.

| 파일 | 맡은 일 |
| --- | --- |
| `data/db.js` | 자료를 브라우저에 담아 두고 보기 자료를 넣는다 |
| `data/settings.js` | 설정 다섯 가지의 조회·추가·수정·사용중지 |
| `data/records.js` | 두 대장의 조회·등록·수정·삭제, 관리번호 매기기, 연결 |
| `data/auth.js` | 로그인 상태 |

표와 칸, 서버에 필요한 것은 [docs/data-model.md](docs/data-model.md) 에 정리했다.
사진 업로드 API 코드는 `backend/` 에 있다.

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
- 지금은 사진도 브라우저에 담긴다. 서버가 붙으면 올린 뒤 받은 경로만 담도록 바꾼다

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
  data/              자료를 넣고 꺼내는 곳 (나중에 서버 연동으로 바꿀 자리)
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
  pages/             LoginPage · FoundListPage · FoundItemPage · FoundReturnPage
                     LostListPage · LostReportPage · LostMatchPage · SettingsPage
```

백엔드에 붙일 코드와 문서는 따로 있다.

```
backend/   사진 업로드 API (FastAPI 라우터)
docs/      데이터 구조 · 화면 흐름 · 화면 시안 그림
```
