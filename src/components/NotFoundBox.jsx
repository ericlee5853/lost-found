// src/components/NotFoundBox.jsx
// 없는 관리번호로 들어왔을 때 보여 주는 안내.

import { useNavigate } from "react-router-dom";

export default function NotFoundBox({ manageNo, backTo = "/found" }) {
  const navigate = useNavigate();
  return (
    <div className="status-box">
      <p className="form-error">관리번호 {manageNo} 자료를 찾을 수 없습니다.</p>
      <button className="btn" onClick={() => navigate(backTo)}>목록으로</button>
    </div>
  );
}
