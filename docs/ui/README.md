# 화면 시안 이미지

[화면 구성과 이동](../screen-flow.md) 문서의 열두 화면을 그림으로 만든 것이다.
실제 스타일시트(`src/index.css`)를 그대로 써서 색·글꼴·간격이 완성될 화면과 같다.

| 그림 | 화면 | 들어가는 길 |
| --- | --- | --- |
| [01-login.png](01-login.png) | 로그인 | 첫 화면 |
| [02-found-list.png](02-found-list.png) | 분실물 대장 | 로그인 직후 |
| [03-found-new.png](03-found-new.png) | 분실물 접수 | 대장에서 **+ 분실물 접수** |
| [04-found-detail.png](04-found-detail.png) | 분실물 상세 | 대장에서 줄 누름 |
| [05-found-edit.png](05-found-edit.png) | 분실물 수정 | 상세에서 **수정** |
| [06-found-return.png](06-found-return.png) | 반환 처리 | 상세에서 **반환 처리** |
| [07-lost-list.png](07-lost-list.png) | 분실신고 대장 | 왼쪽 메뉴 |
| [08-lost-new.png](08-lost-new.png) | 분실 신고 접수 | 대장에서 **+ 분실 신고** |
| [09-lost-detail.png](09-lost-detail.png) | 분실 신고 상세 | 대장에서 줄 누름 |
| [10-lost-edit.png](10-lost-edit.png) | 분실 신고 수정 | 상세에서 **수정** |
| [11-lost-match.png](11-lost-match.png) | 분실물 찾아 연결 | 상세에서 **분실물 찾기** |
| [12-settings.png](12-settings.png) | 설정값 변경 | 왼쪽 메뉴 |

## 다시 만들기

`.html` 파일이 원본이다. 고친 뒤 아래처럼 다시 그림으로 만든다.

```bash
swift tools/shot.swift docs/ui/02-found-list.html docs/ui/02-found-list.png 1440 1024 "$(pwd)"
```

## 시안에서 쓴 색

본문 색은 지정하신 값을 그대로 쓴다. 왼쪽 메뉴만 메인 컬러를 어둡게 한 `#004567` 을 썼다.

| 쓰임 | 색 |
| --- | --- |
| 메인 | `#006EAA` |
| 배경 | `#F7F8FB` |
| 테두리·구분선 | `#E3E7ED` |
| 관리번호 상자 | `#E3ECF7` |
| 왼쪽 메뉴 | `#004567` (메인을 어둡게 한 색) |
