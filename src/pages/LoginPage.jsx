import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../data/auth";

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    try {
      login(loginId, password);
      navigate("/found", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-page">
      <form className="login-box" onSubmit={handleSubmit}>
        <h1 className="login-title">유실물 관리 프로그램</h1>
        <div className="login-fields">
          <input className="login-input" type="text" placeholder="아이디" autoComplete="username"
            value={loginId} onChange={(e) => setLoginId(e.target.value)} />
          <input className="login-input" type="password" placeholder="비밀번호" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="login-btn">로그인</button>
        {error && <p className="form-error">{error}</p>}
        <p className="login-hint">화면 확인용입니다. 아이디와 비밀번호를 적으면 들어갑니다.</p>
      </form>
    </div>
  );
}
