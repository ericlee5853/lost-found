import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
// 디자인 시안의 글꼴(Pretendard). 패키지로 들여와 인터넷 없이도 나온다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);