import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// 서버의 /founder/ 아래에 올린다. 다른 경로에 올릴 때만 VITE_BASE_PATH 로 바꾼다.
const DEFAULT_BASE = "/founder/";

// 백엔드 API 의 경로들. 같은 /founder/ 아래를 쓰므로 이 셋만 서버(API)로 보내고
// 나머지 /founder/... 주소는 화면(index.html)이 받는다.
const API_PREFIXES = ["auth", "things", "health"];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE_PATH || DEFAULT_BASE;
  // 개발 중에는 운영 API 로 넘겨 준다(같은 주소처럼 보이므로 CORS 문제가 없다).
  const apiTarget = env.VITE_DEV_API_TARGET || "https://campuslife.dongyang.ac.kr";

  return {
    base,
    plugins: [react()],
    server: {
      proxy: Object.fromEntries(
        API_PREFIXES.map((name) => [base + name, {
          target: apiTarget,
          changeOrigin: true,
          // 운영 서버가 중간 인증서를 함께 보내지 않아 Node 가 인증서를 확인하지 못한다.
          // 개발 중에만 확인을 건너뛴다. (서버에 fullchain 인증서를 설치하면 지워도 된다.)
          secure: false,
        }])
      ),
    },
  };
});
