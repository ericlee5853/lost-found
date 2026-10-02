// src/data/auth.js
// 화면 확인용 로그인. 서버가 붙기 전까지는 아이디와 비밀번호를 적으면 들어간다.

import { read } from "./db";

const KEY = "lf_demo_user";

/** 아이디와 비밀번호가 비어 있지 않으면 통과시킨다. */
export function login(loginId, password) {
  if (!loginId.trim() || !password.trim()) {
    throw new Error("아이디와 비밀번호를 입력하세요.");
  }
  localStorage.setItem(KEY, loginId.trim());
  return true;
}

export function logout() {
  localStorage.removeItem(KEY);
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem(KEY));
}

/** 지금 로그인한 담당자. 화면 확인 단계에서는 첫 번째 사람으로 본다. */
export function currentUser() {
  return read().users[0];
}
