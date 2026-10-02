import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// 지금은 화면만 확인하는 단계라 Vercel 의 최상위 경로(/)에 올린다.
// 나중에 학교 서버의 /founder/ 아래로 옮길 때는 VITE_BASE_PATH 만 바꾸면 된다.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react()],
  };
});
