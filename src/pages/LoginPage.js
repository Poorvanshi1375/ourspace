import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth";
import AuthLayout, { fieldStyle, labelStyle, GoogleButton } from "../ui/AuthLayout";

function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate("/app");
    } catch (err) {
      console.error(err);
      setError("That email and password don't match.");
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/app");
    } catch (err) {
      console.error(err);
      setError("Google sign-in didn't work. Please try again.");
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="your memories missed you"
      footer={<>New here? <Link to="/signup">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>
          Email
          <input name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="you@example.com" style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Password
          <input name="password" type="password" autoComplete="current-password" value={form.password} onChange={handleChange} placeholder="••••••••" style={fieldStyle} />
        </label>
        {error && <p role="alert" style={{ color: "#a23b2c", fontSize: 14, margin: "12px 0 0" }}>{error}</p>}
        <button type="submit" className="ui-btn ui-btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
      <div className="muted" style={{ textAlign: "center", fontSize: 13, margin: "16px 0" }}>or</div>
      <GoogleButton onClick={handleGoogleLogin}>Continue with Google</GoogleButton>
    </AuthLayout>
  );
}

export default LoginPage;
