// src/pages/LettersPage.js — letters as envelopes; sealed time capsules; write and read
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth";
import * as M from "../model";
import AppShell from "../ui/AppShell";
import { WaxSeal } from "../ui/paper";
import { IconPlus, IconMail } from "../ui/icons";

const PAPERS = ["#FDFDFA", "#EEF3E7", "#F4F1EA"];
const FLAPS = ["#F2F0EA", "#E3EDD9", "#EAE6DD"];

const fmt = (ts) =>
  ts?.toDate ? ts.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

const until = (date) => {
  const ms = Math.max(0, date.getTime() - Date.now());
  return { d: Math.floor(ms / 864e5), h: Math.floor((ms % 864e5) / 36e5), m: Math.floor((ms % 36e5) / 6e4) };
};

const Lock = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#E3EDD9" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

function Envelope({ note, index, mine, onOpen }) {
  const sealed = M.isSealed(note);
  const t = sealed ? until(note.openAt.toDate()) : null;
  return (
    <button
      data-letter={note.id}
      onClick={() => onOpen(note)}
      style={{
        position: "relative",
        height: 290,
        border: "1px solid #dfdcd5",
        borderRadius: 8,
        background: PAPERS[index % 3],
        boxShadow: "0 12px 24px rgba(43,48,38,.12), 0 2px 4px rgba(43,48,38,.08)",
        overflow: "hidden",
        transform: `rotate(${[-1.4, 1.1, -0.7][index % 3]}deg)`,
        cursor: "pointer",
        textAlign: "left",
        font: "inherit",
        color: "var(--ink)",
        padding: 0,
      }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: 130 }} aria-hidden="true">
        <path d="M0 0 L50 100 L100 0Z" fill={FLAPS[index % 3]} />
        <path d="M0 0 L50 100 L100 0" fill="none" stroke="#d9d5cc" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <span style={{ position: "absolute", left: "calc(50% - 29px)", top: 101 }}>
        <WaxSeal size={58}>{sealed ? <Lock /> : null}</WaxSeal>
      </span>
      {sealed && (
        <span style={{ position: "absolute", right: 14, top: 14, background: "var(--paper)", border: "1px solid #dad7d0", borderRadius: 6, padding: "6px 10px", transform: "rotate(4deg)", boxShadow: "0 4px 10px rgba(43,48,38,.12)", textAlign: "center" }}>
          <span className="font-hand" style={{ display: "block", fontSize: 16, color: "var(--pistachio-800)" }}>opens on</span>
          <span className="font-title" style={{ display: "block", fontSize: 17 }}>{note.openAt.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--pistachio-900)" }}>{t.d}d {t.h}h {t.m}m</span>
        </span>
      )}
      <span style={{ position: "absolute", left: 24, right: 24, top: 176 }}>
        <span className="font-hand" style={{ display: "block", fontSize: 20, color: "var(--pistachio-800)" }}>
          {mine ? "from you" : "for you"} ♡
        </span>
        <span className="font-hand" style={{ display: "block", fontSize: 29, fontWeight: 700, lineHeight: 1.05 }}>{note.title || "Untitled Letter"}</span>
        <span className="muted" style={{ display: "block", fontSize: 13, marginTop: 6 }}>
          {sealed ? "Sealed" : note.is_shared ? "Written" : "Draft"} {fmt(note.created_at)}
        </span>
      </span>
    </button>
  );
}

function Modal({ label, onClose, children }) {
  return (
    <div role="dialog" aria-label={label} onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(43,48,38,.45)", display: "grid", placeItems: "center", zIndex: 1000, padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--paper)", backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 33px, #dce7d0 33px 34px)", maxWidth: 640, width: "100%", maxHeight: "85vh", overflow: "auto", padding: "28px 32px", borderRadius: 6, boxShadow: "0 30px 60px rgba(0,0,0,.25)" }}>
        {children}
      </div>
    </div>
  );
}

function ReadLetter({ note, mine, onClose, onDelete }) {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    M.readLetterText(note)
      .then((r) => setState(r))
      .catch(() => setState({ error: true }));
  }, [note]);

  const sealed = M.isSealed(note);
  return (
    <Modal label="Letter" onClose={onClose}>
      <h2 className="font-title" style={{ margin: 0, fontSize: 32 }}>{note.title || "Untitled Letter"}</h2>
      <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
        {mine ? "From you" : "For you"} · {fmt(note.created_at)}
        {sealed && ` · sealed until ${fmt(note.openAt)}`}
      </div>
      {state.loading && <p className="muted">Opening…</p>}
      {state.locked && (
        <p className="font-hand" style={{ fontSize: 28, lineHeight: "34px" }}>
          This letter is sealed until {fmt(note.openAt)}. Come back then ♡
        </p>
      )}
      {state.error && <p style={{ color: "#a23b2c" }}>Couldn't open this letter.</p>}
      {state.text !== undefined && (
        <p className="font-hand" data-testid="letter-text" style={{ fontSize: 26, lineHeight: "34px", whiteSpace: "pre-wrap" }}>{state.text}</p>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button className="ui-btn ui-btn-primary" onClick={onClose}>Close</button>
        {mine && (
          <button className="ui-btn ui-btn-outline" onClick={() => onDelete(note)}>Delete letter</button>
        )}
      </div>
    </Modal>
  );
}

function WriteLetter({ onClose, onSend }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [shared, setShared] = useState(true);
  const [sealOn, setSealOn] = useState(false);
  const [openDate, setOpenDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (!text.trim()) return setError("Write something first.");
    let openAt = null;
    if (shared && sealOn) {
      if (!openDate) return setError("Pick the day it opens.");
      openAt = new Date(`${openDate}T00:00:00`);
      if (openAt <= new Date()) return setError("The opening day has to be in the future.");
    }
    setBusy(true);
    try {
      await onSend({ title, text: text.trim(), isShared: shared, openAt });
    } catch (e) {
      console.error(e);
      setError("Couldn't save the letter. Please try again.");
      setBusy(false);
    }
  };

  return (
    <Modal label="Write a letter" onClose={onClose}>
      <h2 className="font-title" style={{ margin: 0, fontSize: 30 }}>Write a letter</h2>
      <label style={{ display: "block", marginTop: 16, fontSize: 13, fontWeight: 600 }}>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="open when you feel lonely" className="font-hand" style={{ display: "block", width: "100%", boxSizing: "border-box", fontSize: 26, border: "none", borderBottom: "1.5px dashed var(--pistachio-400)", background: "transparent", padding: "4px 2px", outline: "none" }} />
      </label>
      <label style={{ display: "block", marginTop: 14, fontSize: 13, fontWeight: 600 }}>
        Your letter
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="pour your heart out…" className="font-hand" style={{ display: "block", width: "100%", boxSizing: "border-box", fontSize: 24, lineHeight: "34px", border: "none", background: "transparent", padding: "0 2px", outline: "none", resize: "vertical" }} />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 14 }}>
        <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
        Share with my space (unticked = private draft only you can see)
      </label>
      {shared && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, fontSize: 14, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={sealOn} onChange={(e) => setSealOn(e.target.checked)} />
            Seal it until a date (time capsule)
          </label>
          {sealOn && (
            <input type="date" aria-label="Opens on" value={openDate} onChange={(e) => setOpenDate(e.target.value)} style={{ font: "inherit", padding: "6px 8px", borderRadius: 8, border: "1px solid var(--line)" }} />
          )}
        </div>
      )}
      {error && <p role="alert" style={{ color: "#a23b2c", fontSize: 14 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button className="ui-btn ui-btn-primary" onClick={send} disabled={busy}>
          {busy ? "Sealing…" : shared && sealOn ? "Seal the letter" : shared ? "Send the letter" : "Save draft"}
        </button>
        <button className="ui-btn ui-btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

export default function LettersPage() {
  const { user, activeSpaceCode, loading } = useAuth();
  const [tab, setTab] = useState("shared");
  const [shared, setShared] = useState(null);
  const [drafts, setDrafts] = useState(null);
  const [reading, setReading] = useState(null);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !activeSpaceCode || !user) return;
    const onErr = (e) => {
      console.error(e);
      setError("Couldn't load letters.");
    };
    const a = M.subscribeSharedLetters(activeSpaceCode, setShared, onErr);
    const b = M.subscribeMyDrafts(activeSpaceCode, user.uid, setDrafts, onErr);
    return () => {
      a();
      b();
    };
  }, [activeSpaceCode, user, loading]);

  const list = tab === "shared" ? shared : drafts;
  const sealedCount = useMemo(() => (shared || []).filter((n) => M.isSealed(n)).length, [shared]);

  return (
    <AppShell>
      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 32px 48px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 20 }}>
          <div>
            <h1 className="font-title" style={{ margin: 0, fontSize: 60, lineHeight: 1 }}>Letters</h1>
            <p className="font-hand" style={{ margin: "8px 0 0", fontSize: 28, color: "var(--pistachio-800)" }}>
              sealed with love, opened when needed
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div role="tablist" aria-label="Letter type" style={{ display: "flex", background: "var(--bg-panel)", borderRadius: 999, padding: 4 }}>
              {[
                ["shared", `Shared (${shared ? shared.length : "…"})`],
                ["drafts", `My drafts (${drafts ? drafts.length : "…"})`],
              ].map(([key, label]) => (
                <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} style={{ border: "none", borderRadius: 999, padding: "9px 16px", background: tab === key ? "var(--pistachio-700)" : "transparent", color: tab === key ? "#fff" : "#3f443a", font: `${tab === key ? 600 : 500} 14px var(--font-ui)`, cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
            <button className="ui-btn ui-btn-primary" onClick={() => setWriting(true)}>
              <IconPlus size={16} /> Write a letter
            </button>
          </div>
        </div>

        {error && <p role="alert" style={{ color: "#a23b2c" }}>{error}</p>}
        {tab === "shared" && sealedCount > 0 && (
          <p className="muted" style={{ marginTop: 14, fontSize: 14 }}>
            {sealedCount} sealed letter{sealedCount === 1 ? "" : "s"}: they open by themselves on their day.
          </p>
        )}

        <section className="ui-panel" style={{ marginTop: 24, padding: "40px 36px" }}>
          {list === null ? (
            <p className="muted">Loading letters…</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "40px 32px" }}>
              {list.map((n, i) => (
                <Envelope key={n.id} note={n} index={i} mine={n.author_id === user?.uid} onOpen={setReading} />
              ))}
              <button onClick={() => setWriting(true)} style={{ height: 290, border: "2px dashed #c9d3be", borderRadius: 10, background: "rgba(253,253,250,.6)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, font: "inherit", color: "var(--ink)" }}>
                <span style={{ width: 56, height: 56, borderRadius: 999, background: "var(--pistachio-100)", color: "var(--pistachio-800)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <IconMail size={24} />
                </span>
                <span className="font-title" style={{ fontSize: 22 }}>Write a new letter</span>
                <span className="font-hand" style={{ fontSize: 21, color: "#4a5044" }}>fold it, seal it, choose when it opens</span>
              </button>
            </div>
          )}
        </section>
      </main>

      {reading && (
        <ReadLetter
          note={reading}
          mine={reading.author_id === user?.uid}
          onClose={() => setReading(null)}
          onDelete={async (n) => {
            await M.deleteLetter(n.id);
            setReading(null);
          }}
        />
      )}
      {writing && (
        <WriteLetter
          onClose={() => setWriting(false)}
          onSend={async (letter) => {
            await M.createLetter({ ...letter, spaceCode: activeSpaceCode, uid: user.uid });
            setWriting(false);
            setTab(letter.isShared ? "shared" : "drafts");
          }}
        />
      )}
    </AppShell>
  );
}
