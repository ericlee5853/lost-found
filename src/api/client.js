// src/api/client.js
// 백엔드 API 를 부르는 axios 인스턴스.
// - 주소는 환경변수 VITE_API_BASE_URL 로 바꿀 수 있다(없으면 운영 주소).
// - 로그인 토큰(JWT)을 모든 요청 헤더에 자동으로 붙인다.
// - 오류를 화면에 그대로 보여줄 수 있는 한국어 문구로 바꾼다.

import axios from "axios";

/**
 * API 기본 주소.
 * 화면과 API 를 같은 서버의 같은 경로(/founder/)에 올리므로 기본값은 그 경로다.
 * 다른 서버의 API 를 보려면 .env 의 VITE_API_BASE_URL 에 전체 주소를 넣는다.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL;

const TOKEN_KEY = "lf_access_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// 요청마다 Authorization: Bearer {토큰} 을 붙인다.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 토큰이 없거나 만료되면(401) 토큰을 지우고 로그인 화면으로 보낸다.
// 로그인 요청 자체의 401(비밀번호 오류)은 화면에서 문구로 알려야 하므로 제외한다.
api.interceptors.response.use(null, (error) => {
  const url = error.config?.url ?? "";
  if (error.response?.status === 401 && !url.includes("/auth/login")) {
    clearToken();
    // 화면이 /founder/ 아래에 있으므로 그 경로를 붙여 로그인 화면으로 보낸다.
    const loginPath = import.meta.env.BASE_URL.replace(/\/+$/, "") + "/login";
    if (!window.location.pathname.startsWith(loginPath)) {
      window.location.replace(loginPath);
    }
  }
  return Promise.reject(error);
});

// 상태 코드별 기본 안내 문구 (API 가이드의 오류 규칙과 같다)
const STATUS_MESSAGES = {
  401: "로그인이 필요합니다. 다시 로그인해 주세요.",
  403: "권한이 없습니다. 관리자에게 문의하세요.",
  404: "요청한 데이터를 찾을 수 없습니다.",
  409: "이미 있는 값입니다. 다른 값을 입력하세요.",
  422: "입력값을 확인해 주세요.",
};

/**
 * axios 오류를 사람이 읽는 한 줄 문구로 바꾼다.
 * 서버가 detail 을 보내면 그 내용을 함께 보여 준다.
 */
export function toMessage(error, fallback = "요청을 처리하지 못했습니다.") {
  if (!error?.response) {
    return "서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.";
  }
  const { status, data } = error.response;
  const detail = data?.detail;
  // FastAPI 의 422 는 detail 이 배열로 온다.
  const detailText = Array.isArray(detail)
    ? detail.map((d) => d.msg).filter(Boolean).join(", ")
    : typeof detail === "string" ? detail : "";

  const base = STATUS_MESSAGES[status] ?? fallback;
  return detailText ? `${base} (${detailText})` : base;
}

/** 서버에 저장된 이미지 경로를 화면에서 쓸 주소로 바꾼다. */
export function imageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return API_BASE_URL.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
}
