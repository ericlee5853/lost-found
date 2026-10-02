// src/components/AppLayout.jsx
// 로그인한 뒤 모든 화면을 감싸는 틀.
// 왼쪽에 메뉴, 오른쪽 위에 로그인한 사람과 로그아웃 버튼을 둔다.

import { Fragment } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { isLoggedIn, logout } from "../data/auth";
import { useReference } from "../referenceContext";
import ReferenceProvider from "./ReferenceProvider";

const MENUS = [
  { to: "/found", label: "분실물 대장" },
  { to: "/lost", label: "분실신고 대장" },
  { to: "/settings", label: "설정값 변경" },
];

/** 로그인하지 않았으면 로그인 화면으로 보낸다. */
export default function AppLayout() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return (
    <ReferenceProvider>
      <Shell />
    </ReferenceProvider>
  );
}

function Shell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { me } = useReference();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="side">
        <div className="brand">
          <b>동양미래대학교</b>
          <span>유실물 관리</span>
        </div>
        <nav className="nav">
          {MENUS.map((menu) => (
            <NavLink key={menu.to} to={menu.to}
              className={({ isActive }) => "nav-item" + (isActive ? " on" : "")}>
              <i aria-hidden="true" />{menu.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="top">
          <span className="who">{me.dept} {me.name} 님</span>
          <button className="btn" onClick={handleLogout}>로그아웃</button>
        </header>
        {/* 경로가 바뀌면 화면을 새로 만든다.
            상세와 수정이 같은 구성을 쓰므로, 고치다 취소한 값이 남지 않게 하기 위해서다. */}
        <div className="content">
          <Fragment key={pathname}><Outlet /></Fragment>
        </div>
      </div>
    </div>
  );
}
