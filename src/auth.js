// src/auth.js
// 로그인 상태를 브라우저(localStorage)에 기억하는 도우미

const KEY = "lf_logged_in";

export function login(id, pw) {
  if (id === "dytc" && pw === "dytc") {
    localStorage.setItem(KEY, "true");
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(KEY);
}

export function isLoggedIn() {
  return localStorage.getItem(KEY) === "true";
}