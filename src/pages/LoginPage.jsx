import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { toMessage } from "../api/client";

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    try {
      await login(loginId, password);
      navigate("/", { replace: true });
    } catch (err) {
      // 아이디·비밀번호가 틀리면 서버가 401 을 준다.
      setError(err?.response?.status === 401
        ? "아이디 또는 비밀번호가 올바르지 않습니다."
        : toMessage(err, "로그인하지 못했습니다."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-box" onSubmit={handleSubmit}>
        <h1 className="login-title">유실물 관리 프로그램</h1>
        {/* 아이디·비밀번호 두 칸을 한 상자로 묶는다 */}
        <div className="login-fields">
          <input className="login-input" type="text" placeholder="아이디" autoComplete="username"
            value={loginId} onChange={(e) => setLoginId(e.target.value)} />
          <input className="login-input" type="password" placeholder="비밀번호" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="login-btn" disabled={sending}>
          {sending ? "로그인 중..." : "로그인"}
        </button>
        {error && <p className="form-error">{error}</p>}
      </form>
    </div>
  );
}
