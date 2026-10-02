"""사진 업로드 API.

분실물 관리대장의 image_path 에 넣을 사진 파일을 받아 서버에 저장한다.

main.py 에 아래처럼 연결한다.

    from uploads import router as uploads_router, mount_uploads

    app.include_router(uploads_router)
    mount_uploads(app)          # 저장한 사진을 /uploads/... 로 열 수 있게 한다

저장 위치는 환경변수 UPLOAD_DIR 로 바꿀 수 있다(기본값: 실행 폴더의 uploads).

사진 주소에 로그인 토큰을 붙일 수 없어서(<img> 태그의 한계) 저장된 사진은
주소만 알면 열 수 있다. 그래서 파일 이름을 추측할 수 없는 임의 문자열로 바꿔 저장한다.
"""

from __future__ import annotations

import os
import secrets
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.staticfiles import StaticFiles

# 프로젝트의 로그인 확인 의존성 이름에 맞춰 바꾼다.
from auth import get_current_user

router = APIRouter(prefix="/things", tags=["uploads"])

# 사진을 저장할 폴더와, 그 폴더를 여는 주소
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads")).resolve()
URL_PREFIX = "/uploads"

# 허용 확장자. 아이폰(HEIC/HEIF)과 안드로이드에서 올라오는 형식을 포함한다.
# 실제 제한 안내는 화면에서 하고, 여기서는 마지막 안전장치로만 확인한다.
ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".jpe", ".jfif",   # 가장 흔한 사진
    ".png", ".gif", ".bmp",
    ".webp",                             # 안드로이드 기본 저장 형식 중 하나
    ".heic", ".heif", ".hif",            # 아이폰 기본 사진 형식
    ".avif",
    ".tif", ".tiff",
}

# 화면에서 줄여서 올리므로 실제로는 훨씬 작다. 비정상적으로 큰 파일만 막는 값이다.
MAX_UPLOAD_BYTES = 25 * 1024 * 1024
CHUNK_SIZE = 1024 * 1024


def mount_uploads(app) -> None:
    """저장한 사진을 /uploads/... 주소로 열 수 있게 한다."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    app.mount(URL_PREFIX, StaticFiles(directory=UPLOAD_DIR), name="uploads")


def _safe_extension(filename: str) -> str:
    """파일 이름에서 확장자만 꺼내 허용 목록과 대조한다."""
    ext = Path(filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"올릴 수 없는 파일 형식입니다. 허용 형식: {allowed}",
        )
    return ext


def _resolve_inside_upload_dir(image_path: str) -> Path:
    """저장 폴더 바깥을 가리키는 경로를 막는다."""
    relative = image_path.replace(URL_PREFIX, "", 1).lstrip("/")
    target = (UPLOAD_DIR / relative).resolve()
    try:
        target.relative_to(UPLOAD_DIR)  # 저장 폴더 안쪽인지 확인
    except ValueError:
        raise HTTPException(status_code=400, detail="잘못된 경로입니다.")
    return target


@router.post("/uploads", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """사진 한 장을 저장하고 image_path 에 넣을 경로를 돌려준다.

    응답 예시: {"image_path": "/uploads/2026/10/3f9a...c1.jpg", "size": 182734}
    """
    ext = _safe_extension(file.filename)

    # 연/월 폴더로 나눠 한 폴더에 파일이 너무 많이 쌓이지 않게 한다.
    now = datetime.now()
    folder = UPLOAD_DIR / f"{now:%Y}" / f"{now:%m}"
    folder.mkdir(parents=True, exist_ok=True)

    # 추측할 수 없는 이름으로 저장한다(원본 파일 이름은 쓰지 않는다).
    target = folder / f"{secrets.token_hex(16)}{ext}"

    written = 0
    try:
        with target.open("wb") as out:
            while chunk := await file.read(CHUNK_SIZE):
                written += len(chunk)
                if written > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"파일이 너무 큽니다. {MAX_UPLOAD_BYTES // (1024 * 1024)}MB 이하만 올릴 수 있습니다.",
                    )
                out.write(chunk)
    except Exception:
        target.unlink(missing_ok=True)  # 저장하다 실패하면 조각 파일을 지운다
        raise

    image_path = f"{URL_PREFIX}/{target.relative_to(UPLOAD_DIR).as_posix()}"
    return {"image_path": image_path, "size": written}


@router.delete("/uploads")
def delete_image(image_path: str, current_user=Depends(get_current_user)):
    """더 이상 쓰지 않는 사진 파일을 지운다.

    대장에서 참조하지 않는 파일만 지워야 한다(화면에서는 자동으로 부르지 않는다).
    """
    target = _resolve_inside_upload_dir(image_path)
    if not target.is_file():
        raise HTTPException(status_code=404, detail="사진 파일을 찾을 수 없습니다.")
    target.unlink()
    return {"message": "사진 파일이 삭제되었습니다."}
