// src/api/uploads.js
// 사진 업로드 API (/things/uploads)

import { api } from "./client";

/**
 * 사진 한 장을 올리고 서버에 저장된 경로를 돌려준다.
 * 그 경로를 대장의 image_path 에 저장한다.
 * @param {File} file 올릴 사진
 * @returns {Promise<string>} 예) "/uploads/2026/10/3f9a...c1.jpg"
 */
export async function uploadImage(file) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post("/things/uploads", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.image_path;
}
