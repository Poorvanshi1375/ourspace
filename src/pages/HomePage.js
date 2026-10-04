// src/pages/HomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

/* ───────── Daily content ───────── */
const DAILY_QUOTES = [
  "You are my favourite ordinary day.",
  "With you, even silence feels warm.",
  "Some days are softer just because of you.",
  "You feel like home in human form.",
  "Loving you is my calm place.",
  "You make the little moments matter.",
  "You are my always, in small ways.",
];

const DAILY_REMINDERS = [
  "Drink water, breathe slowly, think of us 🌙",
  "Eat on time and don’t skip smiling today 🤍",
  "Rest your eyes. I’m proud of you.",
  "Send me a tiny update when you can 💌",
  "Be gentle with yourself today.",
  "You don’t have to do everything at once.",
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [spaces, setSpaces] = useState([]);
  const [activeSpaceCode, setActiveSpaceCode] = useState(null);
  const [loadingSpaces, setLoadingSpaces] = useState(true);

  /* ───────── Load user spaces (SAFE & BACKWARD COMPATIBLE) ───────── */
  useEffect(() => {
    if (!user) {
      setSpaces([]);
      setActiveSpaceCode(null);
      setLoadingSpaces(false);
      return;
    }

    const loadSpaces = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        setLoadingSpaces(false);
        return;
      }

      const data = snap.data();

      const rawSpaces = Array.isArray(data.spaces) ? data.spaces : [];

      const normalizedSpaces = rawSpaces
        .map((s) =>
          typeof s === "string"
            ? { spaceCode: s }
            : s?.spaceCode
            ? s
            : null
        )
        .filter(Boolean);

      // BACKWARD COMPATIBILITY (single-space legacy)
      if (normalizedSpaces.length === 0 && data.spaceCode) {
        normalizedSpaces.push({ spaceCode: data.spaceCode });
      }

      setSpaces(normalizedSpaces);
      setActiveSpaceCode(data.activeSpaceCode || data.spaceCode || null);
      setLoadingSpaces(false);

    };

    loadSpaces();
  }, [user]);

  /* ───────── Select space ───────── */
  const selectSpace = async (spaceCode) => {
    if (!user || !spaceCode) return;

    await updateDoc(doc(db, "users", user.uid), {
      activeSpaceCode: spaceCode,
    });

    setActiveSpaceCode(spaceCode);
  };

  /* ───────── Open space ───────── */
  const openSpace = () => {
    if (!activeSpaceCode) return;
    navigate("/home");
  };

  /* ───────── Calendar helpers ───────── */
  const today = useMemo(() => new Date(), []);

  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  /* ───────── Daily deterministic pick ───────── */
  const todaySeed = useMemo(() => {
    return today.getFullYear() * 1000 + today.getMonth() * 50 + today.getDate();
  }, [today]);


  const todayQuote = DAILY_QUOTES[todaySeed % DAILY_QUOTES.length];
  const todayReminder = DAILY_REMINDERS[todaySeed % DAILY_REMINDERS.length];

  return (
    <div className="os-home-root" style={{ background: "#fff7ed", color: "#3f2d1c" }}>
      {/* NAV */}
      <div className="os-home-nav">
        <div className="os-home-logo">
          <div className="os-home-logo-dot" style={{ background: "#f4b8a6" }} />
          <span className="os-home-logo-text">OurSpace</span>
        </div>

        <div className="os-home-nav-actions" style={{ display: "flex", gap: 10 }}>
          {!user && (
            <>
              <button
                onClick={() => navigate("/login")}
                style={navGhostBtn}
              >
                Login
              </button>

              <button
                onClick={() => navigate("/signup")}
                style={navPrimaryBtn}
              >
                Sign up
              </button>
            </>
          )}

          {user && (
            <button
              onClick={logout}
              style={navGhostBtn}
            >
              Logout
            </button>
          )}
        </div>

      </div>

      {/* MAIN */}
      <div className="os-home-main">
        <div className="os-home-shell">
          {/* LEFT */}
          <div className="os-home-left">
            <span className="os-home-chip">FOR MY FAVOURITE PERSON</span>

            <h1 className="os-home-heading">
              A tiny corner of the world <span>just for us.</span>
            </h1>

            <p className="os-home-sub">
              A quiet corner for our tiny jokes, late-night thoughts, soft plans
              and the kind of moments only we understand.
            </p>

            {/* 🌸 YOUR SPACES (FIXED — NEVER VANISHES) */}
            {!loadingSpaces && (
              <div
                style={{
                  marginTop: 28,
                  maxWidth: 360,
                  padding: 16,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.7)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    opacity: 0.6,
                    marginBottom: 8,
                  }}
                >
                  YOUR SPACES
                </div>

                {spaces.length === 0 ? (
                  <div style={{ fontSize: 13, marginBottom: 8 }}>
                    You haven’t joined a space yet.
                  </div>
                ) : (
                  <>
                    <select
                      value={activeSpaceCode || ""}
                      onChange={(e) => selectSpace(e.target.value)}
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid rgba(0,0,0,0.15)",
                        background: "#fff",
                      }}
                    >
                      {spaces.map((s) => (
                        <option key={s.spaceCode} value={s.spaceCode}>
                          💞 {s.spaceCode}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={openSpace}
                      disabled={!activeSpaceCode}
                      style={{
                        ...openSpaceBtn,
                        opacity: activeSpaceCode ? 1 : 0.5,
                        cursor: activeSpaceCode ? "pointer" : "not-allowed",
                      }}
                    >
                      Enter our space →
                    </button>

                  </>
                )}

                <button
                  onClick={() => navigate("/space")}
                  style={{
                    marginTop: 8,
                    background: "transparent",
                    color: "#a86f5a",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  + Create / Join space
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="os-home-right">
            <div className="os-home-panel" style={{ background: "#272028", color: "#fff" }}>
              <div className="os-home-panel-header">
                <span>Today in our console</span>
              </div>

              <div className="os-home-mini-card">
                <div className="os-home-mini-label">Today’s quote</div>
                <div>“{todayQuote}”</div>
              </div>

              <div className="os-home-mini-card">
                <div className="os-home-mini-label">Today’s reminder</div>
                <div>{todayReminder}</div>
              </div>

              {/* CALENDAR (UNCHANGED, TODAY HIGHLIGHTED) */}
              <div className="os-home-mini-card">
                <div className="os-home-mini-label">
                  {today.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 6,
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} style={{ opacity: 0.6 }}>
                      {d}
                    </div>
                  ))}

                  {calendarCells.map((d, i) =>
                    d ? (
                      <div
                        key={i}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          background:
                            d === today.getDate()
                              ? "#f4b8a6"
                              : "rgba(255,255,255,0.08)",
                          color: d === today.getDate() ? "#000" : "#fff",
                          textAlign: "center",
                        }}
                      >
                        {d}
                      </div>
                    ) : (
                      <div key={i} />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Button Styles ───────── */

const navPrimaryBtn = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #a86f5a, #8b5a44)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const navGhostBtn = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "1px solid rgba(168,111,90,0.6)",
  background: "transparent",
  color: "#8b5a44",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const openSpaceBtn = {
  marginTop: 12,
  width: "100%",
  padding: "12px",
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(135deg, #f4b8a6, #f1a38b)",
  color: "#2b1d14",
  fontSize: 15,
  fontWeight: 700,
  boxShadow: "0 8px 20px rgba(244,184,166,0.45)",
};
