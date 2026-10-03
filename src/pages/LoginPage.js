import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth";

function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      await login(form.email, form.password);
      navigate("/app");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/app");
    } catch (err) {
      console.error(err);
      setError("Google sign-in failed.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fff7ed, #fffaf3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fffaf3",
          borderRadius: 24,
          padding: "36px 32px",
          boxShadow: "0 20px 40px rgba(107,78,61,0.18)",
          border: "1px solid rgba(107,78,61,0.25)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 600,
              color: "#3a2a1e",
            }}
          >
            Welcome back 🤍
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#6b4e3d",
            }}
          >
            Log in to your shared little world
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                fontSize: 13,
                color: "#6b4e3d",
                display: "block",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                fontSize: 13,
                color: "#6b4e3d",
                display: "block",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <p
              style={{
                color: "#b91c1c",
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              {error}
            </p>
          )}

          <button type="submit" style={primaryBtn}>
            Log in
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            margin: "22px 0",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "#e5d3c2" }} />
          <span style={{ fontSize: 12, color: "#8b6f5a" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#e5d3c2" }} />
        </div>

        {/* Google Login */}
        <button onClick={handleGoogleLogin} style={googleBtn}>
          <span style={{ fontSize: 16 }}>🔐</span>
          Sign in with Google
        </button>

        {/* Footer */}
        <p
          style={{
            marginTop: 22,
            fontSize: 14,
            textAlign: "center",
            color: "#6b4e3d",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            style={{
              color: "#a86f5a",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ───────── Styles ───────── */

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(107,78,61,0.35)",
  fontSize: 14,
  outline: "none",
  background: "#fffdf9",
};

const primaryBtn = {
  width: "100%",
  padding: "12px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #a86f5a, #8b5a44)",
  color: "#fff",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const googleBtn = {
  width: "100%",
  padding: "12px",
  borderRadius: 999,
  border: "1px solid rgba(107,78,61,0.35)",
  background: "#fff",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

export default LoginPage;
