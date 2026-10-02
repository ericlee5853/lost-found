import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import FoundListPage from "./pages/FoundListPage";
import FoundItemPage from "./pages/FoundItemPage";
import FoundReturnPage from "./pages/FoundReturnPage";
import LostListPage from "./pages/LostListPage";
import LostReportPage from "./pages/LostReportPage";
import LostMatchPage from "./pages/LostMatchPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* 로그인한 뒤의 모든 화면은 왼쪽 메뉴가 있는 틀 안에서 열린다 */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/found" replace />} />

        {/* 분실물 */}
        <Route path="/found" element={<FoundListPage />} />
        <Route path="/found/new" element={<FoundItemPage mode="edit" />} />
        <Route path="/found/:manageNo" element={<FoundItemPage mode="view" />} />
        <Route path="/found/:manageNo/edit" element={<FoundItemPage mode="edit" />} />
        <Route path="/found/:manageNo/return" element={<FoundReturnPage />} />

        {/* 분실신고 */}
        <Route path="/lost" element={<LostListPage />} />
        <Route path="/lost/new" element={<LostReportPage mode="edit" />} />
        <Route path="/lost/:manageNo" element={<LostReportPage mode="view" />} />
        <Route path="/lost/:manageNo/edit" element={<LostReportPage mode="edit" />} />
        <Route path="/lost/:manageNo/match" element={<LostMatchPage />} />

        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/found" replace />} />
    </Routes>
  );
}
