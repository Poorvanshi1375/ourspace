// src/pages/SpaceChoicePage.js — your spaces; create one, or join with a code
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import * as M from "../model";
import AuthLayout, { fieldStyle, labelStyle } from "../ui/AuthLayout";

const card = { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px", marginTop: 16 };

export default function SpaceChoicePage() {
  const navigate = useNavigate();
  const { user, userDoc, activeSpaceCode } = useAuth();
  const [spaces, setSpaces] = useState(null);
  const [name, setName] = useState("");
  const [maxMembers, setMaxMembers] = useState(2);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState({ create: "", join: "" });

  // names and member counts of the spaces this account belongs to
  const codes = M.spaceCodesOf(userDoc).join(",");
  useEffect(() => {
    let alive = true;
    Promise.all(
      (codes ? codes.split(",") : []).map((c) => M.getSpace(c).catch(() => null))
    ).then((list) => alive && setSpaces(list.filter(Boolean)));
    return () => {
      alive = false;
    };
  }, [codes]);

  const open = async (c) => {
    await M.setActiveSpace(user.uid, c);
    navigate("/home");
  };

  const create = async (e) => {
    e.preventDefault();
    setBusy("create");
    setError({ create: "", join: "" });
    try {
      await M.createSpace({ uid: user.uid, email: user.email, name, maxMembers });
      navigate("/home");
    } catch (err) {
      console.error(err);
      setError((x) => ({ ...x, create: "Couldn't create the space. Please try again." }));
      setBusy("");
    }
  };

  const join = async (e) => {
    e.preventDefault();
    setBusy("join");
    setError({ create: "", join: "" });
    try {
      await M.joinSpace({ uid: user.uid, rawCode: code });
      navigate("/home");
    } catch (err) {
      // not found / locked / full are expected answers, shown to the person, not errors
      setError((x) => ({ ...x, join: err.message || "Couldn't join that space." }));
      setBusy("");
    }
  };

  const has = spaces && spaces.length > 0;

  return (
    <AuthLayout
      wide
      title={has ? "Your spaces" : "Make your space"}
      subtitle="a private corner that opens only with its code"
    >
      {has && (
        <div>
          {spaces.map((s) => (
            <div key={s.code} style={{ ...card, display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-title" style={{ fontSize: 22 }}>{s.name || "Our space"}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  code <b data-testid="space-code" style={{ letterSpacing: ".08em", color: "var(--ink)" }}>{M.formatCode(s.code)}</b>
                  {" · "}{(s.userIds || []).length} of {s.maxMembers || 2} members{s.is_locked ? " · locked" : ""}
                </div>
              </div>
              <button className={`ui-btn ${s.code === activeSpaceCode ? "ui-btn-primary" : "ui-btn-outline"}`} onClick={() => open(s.code)}>
                {s.code === activeSpaceCode ? "Open" : "Switch to it"}
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={create} style={card} aria-label="Create a space">
        <div className="font-title" style={{ fontSize: 22 }}>{has ? "Create another space" : "Create a space"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0 12px" }}>
          <label style={labelStyle}>
            Name it
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Poorvanshi & Ishu" style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            Members
            <select value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))} style={fieldStyle}>
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} people</option>
              ))}
            </select>
          </label>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: "10px 0 0" }}>You'll get a 10-character code to share with the people you want in it.</p>
        {error.create && <p role="alert" style={{ color: "#a23b2c", fontSize: 14, margin: "8px 0 0" }}>{error.create}</p>}
        <button type="submit" className="ui-btn ui-btn-primary" disabled={!!busy} style={{ marginTop: 14 }}>
          {busy === "create" ? "Creating…" : "Create our space"}
        </button>
      </form>

      <form onSubmit={join} style={card} aria-label="Join a space">
        <div className="font-title" style={{ fontSize: 22 }}>Join with a code</div>
        <label style={labelStyle}>
          The code someone shared with you
          <input aria-label="Space code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCDE-FGHJK" autoCapitalize="characters" style={{ ...fieldStyle, letterSpacing: ".12em", textTransform: "uppercase" }} />
        </label>
        {error.join && <p role="alert" style={{ color: "#a23b2c", fontSize: 14, margin: "8px 0 0" }}>{error.join}</p>}
        <button type="submit" className="ui-btn ui-btn-outline" disabled={!!busy || !code.trim()} style={{ marginTop: 14 }}>
          {busy === "join" ? "Joining…" : "Join space"}
        </button>
      </form>
    </AuthLayout>
  );
}
