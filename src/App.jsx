import { Routes, Route, Navigate } from "react-router-dom";
import { isLoggedIn } from "./auth";
import LoginPage from "./pages/LoginPage";
import ListPage from "./pages/ListPage";
import DetailPage from "./pages/DetailPage";
import FoundFormPage from "./pages/FoundFormPage";
import LostFormPage from "./pages/LostFormPage";
import SettingsPage from "./pages/SettingsPage";

/** 로그인하지 않았으면 로그인 화면으로 보낸다. */
function RequireLogin({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  // 로그인 화면을 뺀 모든 경로는 로그인이 필요하다.
  const guard = (element) => <RequireLogin>{element}</RequireLogin>;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={guard(<ListPage />)} />
      <Route path="/settings" element={guard(<SettingsPage />)} />

      {/* 분실물 */}
      <Route path="/found/new" element={guard(<FoundFormPage />)} />
      <Route path="/found/:manageNo" element={guard(<DetailPage type="found" />)} />
      <Route path="/found/:manageNo/edit" element={guard(<FoundFormPage />)} />

      {/* 분실신고 */}
      <Route path="/lost/new" element={guard(<LostFormPage />)} />
      <Route path="/lost/:manageNo" element={guard(<DetailPage type="lost" />)} />
      <Route path="/lost/:manageNo/edit" element={guard(<LostFormPage />)} />
    </Routes>
  );
}
