import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth";
import AuthLayout, { fieldStyle, labelStyle, GoogleButton } from "../ui/AuthLayout";

function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.username || !form.email || !form.password) {
      setError("Please fill in every field.");
      return;
    }
    if (form.password.length < 6) {
      setError("Your password needs at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      await signup(form);
      navigate("/space");
    } catch (err) {
      console.error(err);
      setError(
        err.code === "auth/email-already-in-use"
          ? "There's already an account with this email. Try logging in."
          : err.message || "Sign-up didn't work. Please try again."
      );
      setBusy(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await loginWithGoogle();
      // An existing Google user may already have a space; /app decides
      navigate("/app");
    } catch (err) {
      console.error(err);
      setError("Google sign-up didn't work. Please try again.");
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="then make a space for you and your favourite people"
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0 14px" }}>
          <label style={labelStyle}>
            Your name
            <input name="name" type="text" autoComplete="name" value={form.name} onChange={handleChange} placeholder="Poorvanshi" style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            Username
            <input name="username" type="text" autoComplete="username" value={form.username} onChange={handleChange} placeholder="a cute username" style={fieldStyle} />
          </label>
        </div>
        <label style={labelStyle}>
          Email
          <input name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="you@example.com" style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Password
          <input name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} placeholder="at least 6 characters" style={fieldStyle} />
        </label>
        {error && <p role="alert" style={{ color: "#a23b2c", fontSize: 14, margin: "12px 0 0" }}>{error}</p>}
        <button type="submit" className="ui-btn ui-btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <div className="muted" style={{ textAlign: "center", fontSize: 13, margin: "16px 0" }}>or</div>
      <GoogleButton onClick={handleGoogleSignup}>Sign up with Google</GoogleButton>
    </AuthLayout>
  );
}

export default SignupPage;
