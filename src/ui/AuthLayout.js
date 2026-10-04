// src/ui/AuthLayout.js — shared frame for welcome, login, signup and space setup screens
import React from "react";
import { Link } from "react-router-dom";
import { Logo, IconHeartFill } from "./icons";
import { Tape, WaxSeal } from "./paper";
import "./ui.css";

/* The scrapbook collage on the left */
function Collage() {
  return (
    <div aria-hidden="true" style={{ position: "relative", width: "100%", maxWidth: 440, height: 440, margin: "0 auto" }}>
      <div className="ui-polaroid" style={{ position: "absolute", left: 30, top: 20, width: 210, transform: "rotate(-6deg)" }}>
        <Tape style={{ width: 80, left: 65, top: -11 }} />
        <div style={{ height: 180, background: "linear-gradient(160deg,#DCE5DF 0%,#B3C6A9 45%,#87A576 70%,#62845A 100%)" }} />
        <div className="ui-polaroid-caption" style={{ fontSize: 22 }}>us, always</div>
      </div>
      <div className="ui-polaroid" style={{ position: "absolute", right: 20, top: 70, width: 190, transform: "rotate(5deg)" }}>
        <Tape solid style={{ width: 70, left: 60, top: -11 }} />
        <div style={{ height: 160, background: "linear-gradient(180deg,#F0C9A6 0%,#E6AFA6 55%,#6F8FA6 56%,#6F8FA6 100%)" }} />
        <div className="ui-polaroid-caption" style={{ fontSize: 22 }}>marine drive</div>
      </div>
      <div className="ui-envelope" style={{ position: "absolute", left: 80, bottom: 10, width: 280, height: 168, transform: "rotate(-2deg)" }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "55%" }}>
          <path d="M0 0 L50 100 L100 0Z" fill="#ECE9E2" />
          <path d="M0 0 L50 100 L100 0" fill="none" stroke="#D6D2C9" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        <span style={{ position: "absolute", left: "50%", top: "55%", transform: "translate(-50%,-50%)" }}>
          <WaxSeal size={46} />
        </span>
        <div className="font-hand" style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", fontSize: 22 }}>
          for you ♡
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children, footer, wide = false }) {
  return (
    <div className="ui-root" style={{ display: "flex", flexDirection: "column" }}>
      <header style={{ maxWidth: 1240, width: "100%", margin: "0 auto", padding: "18px 32px", boxSizing: "border-box" }}>
        <Link to="/" className="ui-logo">
          <Logo />
          <span>OurSpace</span>
        </Link>
      </header>
      <main style={{ flex: 1, maxWidth: 1240, width: "100%", margin: "0 auto", padding: "8px 32px 40px", boxSizing: "border-box", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 40 }}>
        <section style={{ flex: "1 1 420px", minWidth: 0 }} className="ui-panel">
          <Collage />
          <p className="font-hand" style={{ textAlign: "center", fontSize: 26, color: "var(--pistachio-800)", margin: "14px 0 0" }}>
            memories you can almost hold <span style={{ color: "var(--pistachio-700)", display: "inline-flex", verticalAlign: "middle" }}><IconHeartFill size={18} /></span>
          </p>
        </section>
        <section style={{ flex: wide ? "1 1 520px" : "1 1 380px", minWidth: 0, maxWidth: wide ? 620 : 460, margin: "0 auto" }}>
          <h1 className="font-title" style={{ margin: 0, fontSize: 44, lineHeight: 1.05 }}>{title}</h1>
          {subtitle && <p className="font-hand" style={{ margin: "8px 0 0", fontSize: 26, color: "var(--pistachio-800)" }}>{subtitle}</p>}
          <div style={{ marginTop: 24 }}>{children}</div>
          {footer && <div style={{ marginTop: 20, fontSize: 14 }} className="muted">{footer}</div>}
        </section>
      </main>
    </div>
  );
}

/* Form bits shared by these screens */
export const fieldStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  font: "15px var(--font-ui)",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid var(--line)",
  background: "var(--paper)",
  marginTop: 6,
  color: "var(--ink)",
};
export const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, marginTop: 14 };

export function GoogleButton({ onClick, children }) {
  return (
    <button type="button" className="ui-btn ui-btn-outline" onClick={onClick} style={{ width: "100%", justifyContent: "center" }}>
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.2 44 33 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      {children}
    </button>
  );
}
