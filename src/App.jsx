import { Fragment } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "./auth";
import LoginPage from "./pages/LoginPage";
import ListPage from "./pages/ListPage";
import FoundItemPage from "./pages/FoundItemPage";
import LostReportPage from "./pages/LostReportPage";
import SettingsPage from "./pages/SettingsPage";

/**
 * 로그인하지 않았으면 로그인 화면으로 보낸다.
 * 상세와 수정은 같은 컴포넌트라서, 경로가 바뀔 때마다 화면을 새로 만들어
 * 수정하다 취소한 값이 상세 화면에 남지 않게 한다.
 */
function RequireLogin({ children }) {
  const { pathname } = useLocation();
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return <Fragment key={pathname}>{children}</Fragment>;
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
      <Route path="/found/new" element={guard(<FoundItemPage mode="edit" />)} />
      <Route path="/found/:manageNo" element={guard(<FoundItemPage mode="view" />)} />
      <Route path="/found/:manageNo/edit" element={guard(<FoundItemPage mode="edit" />)} />

      {/* 분실신고 */}
      <Route path="/lost/new" element={guard(<LostReportPage mode="edit" />)} />
      <Route path="/lost/:manageNo" element={guard(<LostReportPage mode="view" />)} />
      <Route path="/lost/:manageNo/edit" element={guard(<LostReportPage mode="edit" />)} />
    </Routes>
  );
}
