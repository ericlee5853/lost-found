import { Fragment } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { isLoggedIn } from "./api/auth";
import ReferenceProvider from "./components/ReferenceProvider";
import LoginPage from "./pages/LoginPage";
import ListPage from "./pages/ListPage";
import FoundItemPage from "./pages/FoundItemPage";
import LostReportPage from "./pages/LostReportPage";
import SettingsPage from "./pages/SettingsPage";

/**
 * 로그인이 필요한 화면들의 바깥 틀.
 * - 로그인하지 않았으면 로그인 화면으로 보낸다.
 * - 설정·사용자 목록(기준 정보)을 한 번만 받아 아래 화면들에 넘긴다.
 *   이 틀은 화면을 옮겨도 그대로 있으므로 매번 다시 받아오지 않는다.
 * - 안쪽은 경로가 바뀔 때마다 새로 만든다. 상세와 수정이 같은 컴포넌트라서,
 *   수정하다 취소한 값이 상세 화면에 남지 않게 하기 위해서다.
 */
function ProtectedLayout() {
  const { pathname } = useLocation();
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return (
    <ReferenceProvider>
      <Fragment key={pathname}><Outlet /></Fragment>
    </ReferenceProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<ListPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* 분실물 */}
        <Route path="/found/new" element={<FoundItemPage mode="edit" />} />
        <Route path="/found/:manageNo" element={<FoundItemPage mode="view" />} />
        <Route path="/found/:manageNo/edit" element={<FoundItemPage mode="edit" />} />

        {/* 분실신고 */}
        <Route path="/lost/new" element={<LostReportPage mode="edit" />} />
        <Route path="/lost/:manageNo" element={<LostReportPage mode="view" />} />
        <Route path="/lost/:manageNo/edit" element={<LostReportPage mode="edit" />} />
      </Route>
    </Routes>
  );
}
