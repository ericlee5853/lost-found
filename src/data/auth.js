// src/data/auth.js
// 로그인 · 담당자 조회.

import { api, setToken, clearToken, getToken, toList } from "../api/client";

/** 로그인하고 받은 토큰을 저장한다. */
export async function login(loginId, password) {
  if (!loginId.trim() || !password.trim()) {
    throw new Error("아이디와 비밀번호를 입력하세요.");
  }
  const { data } = await api.post("/auth/login", { login_id: loginId.trim(), password });
  setToken(data.access_token);
  return data;
}

export function logout() {
  clearToken();
}

/** 토큰이 있으면 로그인된 것으로 본다. 실제 유효성은 첫 요청에서 확인된다. */
export function isLoggedIn() {
  return Boolean(getToken());
}

/** 지금 로그인한 담당자 */
export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

/**
 * 담당자 목록. 확인자 선택과 이름 표시에 쓴다.
 * 권한이 없어 막히면 빈 목록을 돌려주고 화면은 계속 동작한다.
 */
export async function getUsers() {
  try {
    const { data } = await api.get("/auth/users", { params: { active_only: true } });
    return toList(data).items;
  } catch (error) {
    if (error?.response?.status === 403) return [];
    throw error;
  }
}
