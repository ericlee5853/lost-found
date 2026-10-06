// src/data/uploads.js
// 사진 올리기.

import { api } from "../api/client";

/**
 * 사진 한 장을 올리고 서버에 저장된 경로를 돌려준다.
 * 그 경로를 분실물의 사진 목록에 넣어 저장한다.
 * @param {File} file
 * @returns {Promise<string>} 예) "/uploads/2026/10/a1b2.jpg"
 */
export async function uploadImage(file) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post("/things/uploads", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.image_path;
}
