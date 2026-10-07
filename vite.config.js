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
  // 개발 서버(npm run dev)가 API 요청을 넘겨줄 서버. 주소 그대로 넘긴다.
  // (웹서버가 앞의 /founder 를 떼고 백엔드로 보낸다.)
  const apiTarget = env.VITE_DEV_API_TARGET || "https://campuslife.dongyang.ac.kr";

  return {
    base,
    plugins: [react()],
    server: {
      proxy: Object.fromEntries(
        API_PREFIXES.map((name) => [base + name, {
          target: apiTarget,
          changeOrigin: true,
          // 운영 서버가 중간 인증서를 함께 보내지 않아 Node 가 확인하지 못한다.
          // 개발 중에만 확인을 건너뛴다. (서버에 fullchain 인증서를 넣으면 지워도 된다.)
          secure: false,
        }])
      ),
    },
  };
});
