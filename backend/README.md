# 사진 업로드 API 붙이기

`uploads.py` 를 백엔드 프로젝트(= `main.py`, `auth.py`, `things.py` 가 있는 폴더)에 복사한다.

## 1. main.py 에 연결

```python
from uploads import router as uploads_router, mount_uploads

app.include_router(uploads_router)
mount_uploads(app)      # 저장한 사진을 /uploads/... 로 열 수 있게 한다
```

`uploads.py` 맨 위의 `from auth import get_current_user` 는 프로젝트에서 쓰는
로그인 확인 함수 이름에 맞춰 바꾼다.

## 2. 저장 폴더

기본값은 실행 폴더 아래 `uploads/` 이며, 환경변수 `UPLOAD_DIR` 로 바꿀 수 있다.
서버를 다시 배포해도 지워지지 않는 경로를 쓰고, 백업 대상에 넣는다.

```bash
UPLOAD_DIR=/var/lib/lost-found/uploads
```

## 3. nginx 경로 연결

화면과 API 가 모두 `/founder/` 아래에 있으므로, 사진 주소도 같은 규칙을 따른다.

```nginx
location ^~ /founder/uploads/ { proxy_pass http://127.0.0.1:8000; }
```

## API

### POST /founder/things/uploads

사진 한 장을 저장한다. 로그인 토큰이 필요하다.

- 요청: `multipart/form-data`, 필드 이름 `file`
- 응답(201): `{"image_path": "/uploads/2026/10/3f9a...c1.jpg", "size": 182734}`
- 받은 `image_path` 를 대장의 `image_path` 에 그대로 넣는다.

### DELETE /founder/things/uploads?image_path=...

쓰지 않는 사진 파일을 지운다. 로그인 토큰이 필요하다.
화면에서는 자동으로 부르지 않는다. 대장이 참조하지 않는 파일을 정리할 때만 쓴다.

## 알아 둘 점

- 파일 크기와 확장자 안내는 화면에서 처리한다. 서버의 확장자 목록과 25MB 제한은
  화면을 거치지 않은 요청을 막기 위한 마지막 안전장치다.
- `<img>` 태그에는 로그인 토큰을 붙일 수 없어서, 저장된 사진은 주소만 알면 열린다.
  그래서 파일 이름을 추측할 수 없는 임의 문자열로 바꿔 저장한다.
- 사진을 바꾸거나 글을 지워도 예전 파일은 서버에 남는다. 주기적으로 정리하려면
  대장의 `image_path` 에 없는 파일을 찾아 DELETE 로 지우면 된다.
