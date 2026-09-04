import { useState } from "react";
import { login } from "../api/auth";

export default function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await login(form);
      const { token, email, role, userId } = res.data;
      if (role !== "ROLE_ADMIN") {
        setMsg("Access denied. This account is not an admin.");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", token);
      localStorage.setItem("email", email);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", userId);
      onLogin({ email, token, role, userId });
    } catch (err) {
      const errMsg = err.response?.data
        ? (typeof err.response.data === "string" ? err.response.data : err.response.data?.message || "Invalid credentials")
        : err.message === "Network Error"
          ? "Cannot reach server. Check your connection."
          : "Login failed. Check your credentials.";
      setMsg(errMsg);
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 8,
    background: "#FFF7E6", border: "1px solid #E8DCC8",
    color: "#1A1A1A", fontSize: 14, outline: "none",
    fontFamily: "'JetBrains Mono', monospace",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#FFFBF0", color: "#1A1A1A", fontFamily: "'Inter', sans-serif",
      padding: 24,
    }}>
      <form onSubmit={handleSubmit} style={{
        background: "#FFFFFF", border: "1px solid #E8DCC8", borderRadius: 20,
        padding: 40, width: "100%", maxWidth: 400,
        boxShadow: "0 20px 50px -15px rgba(0,0,0,0.08)",
      }}>
        <h1 style={{ fontFamily: "'Kalam', cursive", fontSize: 28, marginBottom: 4 }}>Admin Login</h1>
        <p style={{ color: "#6B6B6B", fontSize: 14, marginBottom: 24 }}>codewith_kk notes panel</p>
        {msg && (
          <div style={{
            color: "#DC2626", fontSize: 13, marginBottom: 16,
            padding: "10px 14px", background: "#FEF2F2", borderRadius: 8,
            border: "1px solid #FECACA", lineHeight: 1.5,
          }}>{msg}</div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#6B6B6B", display: "block", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>EMAIL</label>
          <input
            name="email" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, color: "#6B6B6B", display: "block", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>PASSWORD</label>
          <input
            name="password" type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required style={inputStyle}
          />
        </div>
        <button type="submit" disabled={loading} style={{
          width: "100%", padding: 14, borderRadius: 8,
          background: loading ? "#D9770699" : "#D97706", color: "#FFFFFF",
          fontWeight: 700, fontSize: 14, border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <a href="/" style={{ color: "#6B6B6B", fontSize: 13, textDecoration: "none" }}>← Back to home</a>
        </div>
      </form>
    </div>
  );
}
