// src/api/auth.js
// 로그인 · 사용자 관련 API (/auth)

import { api, setToken, clearToken, getToken } from "./client";

/**
 * 로그인하고 받은 토큰을 저장한다.
 * @param {string} loginId 로그인 아이디
 * @param {string} password 비밀번호
 */
export async function login(loginId, password) {
  const { data } = await api.post("/auth/login", {
    login_id: loginId,
    password,
  });
  setToken(data.access_token);
  return data;
}

/** 저장된 토큰을 지운다(서버 호출 없음). */
export function logout() {
  clearToken();
}

/** 토큰이 있으면 로그인된 것으로 본다. 실제 유효성은 첫 API 호출에서 확인된다. */
export function isLoggedIn() {
  return Boolean(getToken());
}

/** 지금 로그인한 사용자 정보 */
export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

/**
 * 사용자 목록. 확인자 선택 목록에 쓴다.
 * ADMIN 만 부를 수 있어서, 권한이 없으면 빈 배열을 돌려준다(화면은 계속 동작).
 */
export async function getUsers() {
  try {
    const { data } = await api.get("/auth/users", { params: { active_only: true } });
    return data;
  } catch (error) {
    if (error?.response?.status === 403) return [];
    throw error;
  }
}
