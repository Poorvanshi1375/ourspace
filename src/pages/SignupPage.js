import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth";

function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.username || !form.email || !form.password) {
      setError("Please fill all fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      await signup(form);
      navigate("/space");
    } catch (err) {
      console.error(err);
      setError(err.message || "Signup failed.");
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await loginWithGoogle();
      // An existing Google user may already have a space; /app decides
      navigate("/app");
    } catch (err) {
      console.error(err);
      setError("Google sign-up failed.");
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
          maxWidth: 440,
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
            Create your space ✨
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#6b4e3d",
            }}
          >
            A tiny corner of the world, just for you two
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Name</label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Username</label>
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="A cute username"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
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
            <label style={labelStyle}>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
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
            Create account
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

        {/* Google Signup */}
        <button onClick={handleGoogleSignup} style={googleBtn}>
          <span style={{ fontSize: 16 }}>🌐</span>
          Sign up with Google
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
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#a86f5a",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ───────── Styles ───────── */

const labelStyle = {
  fontSize: 13,
  color: "#6b4e3d",
  display: "block",
  marginBottom: 6,
};

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

export default SignupPage;
