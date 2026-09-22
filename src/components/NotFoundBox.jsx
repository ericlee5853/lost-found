// src/components/NotFoundBox.jsx
// 없는 관리번호로 들어왔을 때 보여 주는 안내 화면.

import { useNavigate } from "react-router-dom";

export default function NotFoundBox({ manageNo }) {
  const navigate = useNavigate();
  return (
    <div className="notfound-box">
      <p>관리번호 {manageNo} 데이터를 찾을 수 없습니다.</p>
      <button className="btn" onClick={() => navigate("/")}>목록으로</button>
    </div>
  );
}
