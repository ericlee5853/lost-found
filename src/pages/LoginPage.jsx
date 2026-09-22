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
    <div className="login-box">
      <h1>유실물 관리 프로그램</h1>
      <form onSubmit={handleSubmit}>
        <input className="input login-input" type="text" placeholder="아이디"
          value={id} onChange={(e) => setId(e.target.value)} />
        <input className="input login-input" type="password" placeholder="비밀번호"
          value={pw} onChange={(e) => setPw(e.target.value)} />
        <button type="submit" className="btn primary login-btn">로그인</button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}