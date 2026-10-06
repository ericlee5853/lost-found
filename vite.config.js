import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// 화면과 API 를 학교 서버의 같은 경로(/founder/)에 올린다.
const DEFAULT_BASE = "/founder/";

// 백엔드가 맡는 경로. 개발 서버에서는 이 셋만 서버로 넘기고
// 나머지 /founder/... 주소는 화면(index.html)이 받는다.
const API_PREFIXES = ["auth", "things", "health", "uploads"];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE_PATH || DEFAULT_BASE;
  const apiTarget = env.VITE_DEV_API_TARGET || "https://campuslife.dongyang.ac.kr";
  // 백엔드를 직접(예: localhost:8000) 띄워 보면 그 서버에는 /founder 가 없다.
  // 그럴 때만 앞의 /founder 를 떼고 넘긴다.
  // 운영 서버로 넘길 때는 nginx 가 이미 떼므로 그대로 보낸다.
  const stripBase = env.VITE_DEV_API_STRIP_BASE === "true";

  return {
    base,
    plugins: [react()],
    server: {
      proxy: Object.fromEntries(
        API_PREFIXES.map((name) => [base + name, {
          target: apiTarget,
          changeOrigin: true,
          ...(stripBase ? { rewrite: (path) => path.replace(base, "/") } : {}),
          // 운영 서버가 중간 인증서를 함께 보내지 않아 Node 가 확인하지 못한다.
          // 개발 중에만 확인을 건너뛴다. (서버에 fullchain 인증서를 넣으면 지워도 된다.)
          secure: false,
        }])
      ),
    },
  };
});
