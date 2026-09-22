import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../auth";

export default function LoginPage() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (login(id, pw)) navigate("/");
    else setError("아이디 또는 비밀번호가 올바르지 않습니다.");
  }

  return (
    <div className="login-page">
      <form className="login-box" onSubmit={handleSubmit}>
        <h1 className="login-title">유실물 관리 프로그램</h1>
        {/* 아이디·비밀번호 두 칸을 한 상자로 묶는다 */}
        <div className="login-fields">
          <input className="login-input" type="text" placeholder="아이디" autoComplete="username"
            value={id} onChange={(e) => setId(e.target.value)} />
          <input className="login-input" type="password" placeholder="비밀번호" autoComplete="current-password"
            value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <button type="submit" className="login-btn">로그인</button>
        {error && <p className="form-error">{error}</p>}
      </form>
    </div>
  );
}
