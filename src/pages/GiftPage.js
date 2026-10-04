// src/pages/GiftPage.js — what the recipient opens from a gift link (no login).
// envelope (ribbon, packing slip, sealed envelope, note, our story) -> cover -> reading the book
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as M from "../model";
import { PAGE } from "../model";
import BookSpread from "../gift/BookSpread";
import { IconPrev, IconNext, IconHeartFill } from "../ui/icons";
import { usePageTurn, PageFlip, PageCorners, PAGE_TURN_HINT } from "../ui/pageTurn";
import "../ui/ui.css";

const fmtDay = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
const until = (d) => {
  const ms = Math.max(0, d.getTime() - Date.now());
  return { d: Math.floor(ms / 864e5), h: Math.floor((ms % 864e5) / 36e5), m: Math.floor((ms % 36e5) / 6e4) };
};
const initial = (s) => (s || "").trim().charAt(0).toUpperCase();

/* ---------- pieces of the envelope page ---------- */

function Sprig({ flip }) {
  return (
    <svg aria-hidden="true" width="110" height="60" viewBox="0 0 120 64" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M116 34 C86 32 50 30 6 40" fill="none" stroke="#84B067" strokeWidth="2.2" strokeLinecap="round" />
      <g fill="#B8D49E" stroke="#84B067" strokeWidth="1.4">
        <path d="M92 33 q-6 -16 -20 -18 q4 14 20 18z" /><path d="M70 32 q-6 -16 -20 -18 q4 14 20 18z" /><path d="M48 33 q-6 -15 -20 -16 q4 13 20 16z" />
        <path d="M84 34 q-4 14 -18 18 q2 -12 18 -18z" /><path d="M60 34 q-4 14 -18 18 q2 -12 18 -18z" /><path d="M36 37 q-4 13 -17 16 q2 -11 17 -16z" />
      </g>
      <circle cx="10" cy="40" r="3.5" fill="#4E7A3A" />
    </svg>
  );
}

function PackingSlip({ counts = {}, song, narrow }) {
  const rows = [
    counts.spreads && `${counts.spreads} handmade spread${counts.spreads === 1 ? "" : "s"}`,
    counts.photos && `${counts.photos} polaroid${counts.photos === 1 ? "" : "s"} of us`,
    counts.notes && `${counts.notes} little note${counts.notes === 1 ? "" : "s"}`,
    counts.letters && `${counts.letters} letter${counts.letters === 1 ? "" : "s"} to open`,
    counts.videos && `${counts.videos} video${counts.videos === 1 ? "" : "s"}`,
    song?.title && "1 song, picked for you",
  ].filter(Boolean);
  return (
    <aside aria-label="What's inside" style={{ flex: narrow ? "0 1 auto" : "0 0 270px", width: narrow ? "min(340px, 100%)" : undefined, position: "relative", transform: "rotate(-2deg)" }}>
      <span className="ui-tape" style={{ width: 90, left: 90, top: -12, transform: "rotate(3deg)", zIndex: 1 }} />
      <div style={{ background: "var(--paper)", borderRadius: 4, boxShadow: "0 14px 28px rgba(43,48,38,.12), 0 2px 4px rgba(43,48,38,.06)", padding: "30px 24px 22px" }}>
        <div style={{ fontSize: 11, letterSpacing: ".2em", fontWeight: 700 }} className="muted">PACKING SLIP</div>
        <h2 className="font-title" style={{ margin: "6px 0 0", fontSize: 28, lineHeight: 1 }}>what's inside</h2>
        <div style={{ borderTop: "2px dashed #d6dccb", margin: "16px 0 6px" }} />
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {(rows.length ? rows : ["a book made just for you"]).map((r) => (
            <li key={r} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0" }}>
              <span style={{ width: 30, height: 30, borderRadius: 999, background: "var(--pistachio-100)", color: "var(--pistachio-800)", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <IconHeartFill size={13} />
              </span>
              <span className="font-hand" style={{ fontSize: 23, lineHeight: 1.05 }}>{r}</span>
            </li>
          ))}
        </ul>
        <div style={{ borderTop: "2px dashed #d6dccb", margin: "8px 0 12px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="font-hand" style={{ fontSize: 20, color: "var(--pistachio-800)" }}>packed with love</span>
          <span style={{ border: "2px solid var(--pistachio-700)", color: "var(--pistachio-800)", padding: "2px 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", transform: "rotate(-8deg)", display: "inline-block" }}>FRAGILE ♡</span>
        </div>
      </div>
    </aside>
  );
}

function NoteCard({ note, from, narrow }) {
  return (
    <aside aria-label="A note before you open" style={{ flex: narrow ? "0 1 auto" : "0 0 270px", width: narrow ? "min(340px, 100%)" : undefined, position: "relative", transform: "rotate(2deg)" }}>
      <svg aria-hidden="true" style={{ position: "absolute", left: 30, top: -18, zIndex: 1 }} width="22" height="52" viewBox="0 0 22 52">
        <path d="M7 14 V40 a4 4 0 0 0 8 0 V8 a6 6 0 0 0 -12 0 V38" fill="none" stroke="#8A9283" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <div style={{ background: "var(--paper)", backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 33px, #DCE7D0 33px 34px)", backgroundPosition: "0 54px", borderRadius: 4, boxShadow: "0 14px 28px rgba(43,48,38,.12), 0 2px 4px rgba(43,48,38,.06)", padding: "26px 24px 22px" }}>
        <div style={{ fontSize: 11, letterSpacing: ".2em", fontWeight: 700 }} className="muted">BEFORE YOU OPEN</div>
        <p className="font-hand" style={{ margin: "12px 0 0", fontSize: 24, lineHeight: "34px", whiteSpace: "pre-wrap" }}>
          {note || "take your time with this one ♡"}
        </p>
        {from && <p className="font-hand" style={{ margin: "6px 0 0", fontSize: 26, lineHeight: "34px", textAlign: "right", color: "var(--pistachio-900)", fontWeight: 700 }}>— {from} ♡</p>}
      </div>
    </aside>
  );
}

/* drawn at 760x470 and scaled to fit (0.921 on a laptop, the screen width on a phone) */
function Envelope({ to, from, forLine, initials, onSeal, sealDisabled, scale = 0.921 }) {
  return (
    <div style={{ flex: "none", width: 760 * scale, height: 470 * scale, position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 470, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <div style={{ position: "absolute", inset: 0, transform: "rotate(-1deg)" }}>
          <div style={{ position: "absolute", inset: 0, background: "#FAF8F3", borderRadius: 10, boxShadow: "0 34px 60px rgba(43,48,38,.20), 0 4px 10px rgba(43,48,38,.10)", overflow: "hidden" }}>
            <svg style={{ position: "absolute", left: 0, top: 0 }} width="760" height="470" viewBox="0 0 760 470" aria-hidden="true">
              <defs>
                <pattern id="giftLiner" width="16" height="16" patternUnits="userSpaceOnUse">
                  <rect width="16" height="16" fill="#D9E6CA" /><circle cx="8" cy="8" r="2.2" fill="#FDFDFA" />
                  <circle cx="0" cy="0" r="1.4" fill="#C2D6AE" /><circle cx="16" cy="16" r="1.4" fill="#C2D6AE" />
                </pattern>
              </defs>
              <path d="M0 470 L380 250 L760 470Z" fill="#F2EFE8" />
              <path d="M0 0 L360 255 L0 470Z" fill="#F6F3ED" />
              <path d="M760 0 L400 255 L760 470Z" fill="#F6F3ED" />
              <path d="M0 470 L380 250 L760 470 M0 0 L360 255 M760 0 L400 255" fill="none" stroke="#DCD8CF" strokeWidth="1.2" />
              <path d="M0 0 L380 272 L760 0Z" fill="url(#giftLiner)" />
              <path d="M18 0 L380 256 L742 0Z" fill="#F9F7F1" />
              <path d="M0 0 L380 272 L760 0" fill="none" stroke="#CFCBC1" strokeWidth="1.2" />
            </svg>
          </div>
          <svg aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width="760" height="470" viewBox="0 0 760 470">
            <g transform="translate(560 272) rotate(-62)">
              <path d="M0 70 V-60" stroke="#6E8F5C" strokeWidth="3" strokeLinecap="round" />
              <g fill="#A79BD0" stroke="#FAF8F3" strokeWidth="1.5">
                <ellipse cx="0" cy="-70" rx="6" ry="8" /><ellipse cx="-6" cy="-58" rx="6" ry="8" /><ellipse cx="6" cy="-58" rx="6" ry="8" />
                <ellipse cx="-6" cy="-44" rx="6" ry="8" /><ellipse cx="6" cy="-44" rx="6" ry="8" /><ellipse cx="-6" cy="-30" rx="6" ry="8" /><ellipse cx="6" cy="-30" rx="6" ry="8" />
              </g>
            </g>
            <path d="M380 0 V470 M0 272 H760" stroke="#84B067" strokeWidth="6" />
            <path d="M380 0 V470 M0 272 H760" stroke="#E3EDD9" strokeWidth="2" strokeDasharray="3 5" />
            <path d="M380 272 C330 210 280 236 318 270 C338 288 362 280 380 272 M380 272 C430 210 480 236 442 270 C422 288 398 280 380 272" fill="none" stroke="#84B067" strokeWidth="6" strokeLinecap="round" />
            <path d="M376 276 C366 318 350 340 336 358 M384 276 C396 316 414 338 430 352" fill="none" stroke="#84B067" strokeWidth="6" strokeLinecap="round" />
            <path d="M372 280 C340 300 300 320 266 346" fill="none" stroke="#B9AF9C" strokeWidth="1.5" />
          </svg>
          <div style={{ position: "absolute", left: 36, top: 304, width: 206, transform: "rotate(-6deg)", background: "var(--paper)", padding: "18px 34px 16px 20px", boxShadow: "0 8px 18px rgba(43,48,38,.16)", clipPath: "polygon(0 0,calc(100% - 16px) 0,100% 16px,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)" }}>
            <span style={{ position: "absolute", right: 12, top: "calc(50% - 7px)", width: 10, height: 10, borderRadius: 999, border: "2px solid #C9D3BE", background: "#F2F0EF" }} />
            <div className="font-title" style={{ fontSize: 30, lineHeight: 1 }}>to: {to} ♡</div>
            {from && <div className="font-hand" style={{ fontSize: 24, lineHeight: 1.1, marginTop: 8 }}>from: {from}</div>}
            {forLine && <div className="font-hand" style={{ fontSize: 22, lineHeight: 1.1, color: "var(--pistachio-800)" }}>for: {forLine}</div>}
          </div>
        </div>
        <button
          aria-label={sealDisabled ? "Sealed until its opening day" : "Break the seal to open your gift"}
          onClick={onSeal}
          disabled={sealDisabled}
          className="ui-wax-seal"
          style={{ position: "absolute", left: "calc(50% - 48px)", top: 224, width: 96, height: 96, border: "none", cursor: sealDisabled ? "not-allowed" : "pointer", zIndex: 2 }}
        >
          <span style={{ width: 70, height: 70, borderRadius: 999, border: "2px solid rgba(227,237,217,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="font-title" style={{ fontSize: 22, color: "#E3EDD9", lineHeight: 1 }}>{initials}</span>
          </span>
        </button>
      </div>
    </div>
  );
}

function Story({ story = [], narrow }) {
  if (!story.length) return null;
  return (
    <section aria-label="Our little story so far" style={{ width: "100%", maxWidth: 1100, marginTop: 40, background: "rgba(236,240,228,.75)", borderRadius: 24, padding: narrow ? "18px 16px 20px" : "20px 34px 22px", boxSizing: "border-box" }}>
      <div className="muted" style={{ textAlign: "center", fontSize: 11, letterSpacing: ".22em", fontWeight: 700 }}>OUR LITTLE STORY SO FAR</div>
      <div style={{ position: "relative", marginTop: 10 }}>
        <div aria-hidden="true" style={narrow
          ? { position: "absolute", left: "50%", top: 13, bottom: 20, borderLeft: "2.5px dashed var(--pistachio-400)" }
          : { position: "absolute", left: "10%", right: "10%", top: 13, borderTop: "2.5px dashed var(--pistachio-400)" }} />
        <ol style={{ position: "relative", listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: narrow ? "column" : "row", gap: narrow ? 18 : 12 }}>
          {story.map((s, i) => {
            const last = i === story.length - 1;
            return (
              <li key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, minWidth: 0, background: narrow ? "rgba(236,240,228,.95)" : "transparent", position: "relative" }}>
                <span style={{ height: 26, display: "flex", alignItems: "center" }}>
                  <span style={last
                    ? { display: "block", width: 22, height: 22, borderRadius: 999, background: "var(--pistachio-700)", boxShadow: "0 0 0 6px rgba(132,176,103,.25)" }
                    : { display: "block", width: 16, height: 16, borderRadius: 999, background: "var(--paper)", border: "3px solid var(--pistachio-400)", boxSizing: "border-box" }} />
                </span>
                <span className="font-title" style={{ fontSize: 18, marginTop: 8, color: last ? "var(--pistachio-900)" : "var(--ink)" }}>{s.when}</span>
                <span className="font-hand" style={{ fontSize: 22, lineHeight: 1.05, fontWeight: last ? 700 : 400, color: last ? "var(--pistachio-900)" : "var(--ink)" }}>{s.text}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ---------- the page ---------- */

export default function GiftPage() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true });
  const [stage, setStage] = useState("envelope"); // envelope | cover | read
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState("left"); // phones show one page of the spread at a time
  const [elements, setElements] = useState({});
  const [letter, setLetter] = useState(null);
  const [muted, setMuted] = useState(false);
  const [reply, setReply] = useState({ text: "", sent: false, busy: false, error: "" });
  const [hearted, setHearted] = useState({});
  const [replies, setReplies] = useState([]);
  const [, tick] = useState(0);
  const [view, setView] = useState({ w: window.innerWidth, h: window.innerHeight });
  const notesRef = useRef(null);
  const audio = useRef(null);

  const load = useCallback(() => {
    M.openGift(token)
      .then((g) => setState(g ? { loading: false, ...g } : { loading: false, missing: true }))
      .catch(() => setState({ loading: false, missing: true }));
  }, [token]);
  useEffect(load, [load]);

  // notes and hearts left on this book, shown stuck under each spread (live)
  const bookIdForReplies = state.book?.id;
  const canReply = !!state.book?.allowReplies && !state.locked;
  useEffect(() => {
    if (!bookIdForReplies || !canReply) return;
    return M.subscribeReplies(bookIdForReplies, setReplies, () => setReplies([]));
  }, [bookIdForReplies, canReply]);

  useEffect(() => {
    const onResize = () => setView({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    const t = setInterval(() => tick((n) => n + 1), 30000); // countdown refresh
    return () => {
      window.removeEventListener("resize", onResize);
      clearInterval(t);
    };
  }, []);

  const { book, locked, spreads = [] } = state;
  const spread = spreads[index];

  // load the open spread's elements (and the next one, so page turns feel instant)
  useEffect(() => {
    if (stage !== "read" || !book) return;
    [spreads[index], spreads[index + 1]].filter(Boolean).forEach((s) => {
      if (elements[s.id]) return;
      M.listElements(book.id, s.id)
        .then((els) => setElements((m) => ({ ...m, [s.id]: els })))
        .catch(() => setElements((m) => ({ ...m, [s.id]: [] })));
    });
  }, [stage, index, book, spreads, elements]);

  const narrow = view.w < 760; // a phone, or a very narrow window
  // the open book fits the window (room above for the title, below for the controls)
  const pw = narrow
    ? Math.min(560, view.w - 32)
    : Math.max(260, Math.min(560, (view.w - 200) / 2, ((view.h - 260) * PAGE.width) / PAGE.height));
  const envScale = narrow ? Math.min(0.921, (view.w - 32) / 760) : 0.921;
  const coverW = Math.min(420, view.w * 0.86);

  // page turning: whole spreads on a laptop, single pages on a phone
  const atStart = index === 0 && (!narrow || side === "left");
  const atEnd = index >= spreads.length - 1 && (!narrow || side === "right");
  const goPrev = () => {
    if (narrow && side === "right") return setSide("left");
    if (index > 0) {
      setIndex((i) => i - 1);
      setSide("right");
    }
  };
  const goNext = () => {
    if (narrow && side === "left") return setSide("right");
    if (index < spreads.length - 1) {
      setIndex((i) => i + 1);
      setSide("left");
    }
  };

  const pages = usePageTurn({
    canNext: stage === "read" && !atEnd,
    canPrev: stage === "read" && !atStart,
    onNext: goNext,
    onPrev: goPrev,
    front: (dir) => {
      const els = spread && elements[spread.id];
      if (!els) return null;
      const page = narrow ? side : dir === "next" ? "right" : "left";
      return <BookSpread ghost elements={els} pageWidth={pw} only={page} pageNumber={index * 2 + (page === "right" ? 2 : 1)} />;
    },
    keys: () => !letter,
  });

  if (state.loading) {
    return <div className="ui-root" style={{ display: "grid", placeItems: "center" }}><p className="font-hand" style={{ fontSize: 28 }}>a little something is on its way…</p></div>;
  }
  if (state.missing) {
    return (
      <div className="ui-root" style={{ display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <h1 className="font-title" style={{ fontSize: 40, margin: 0 }}>This gift link isn't active</h1>
          <p className="font-hand" style={{ fontSize: 26 }}>ask whoever sent it for a fresh link ♡</p>
        </div>
      </div>
    );
  }

  const gift = book.gift || {};
  const to = book.recipient?.name || "you";
  const from = gift.from || "";
  const heading = gift.heading || `a little something for you, ${to}`;
  const unlockAt = book.unlockAt?.toDate?.() || null;
  const ribbonDate = unlockAt || (book.updatedAt?.toDate?.() ?? new Date());
  const initials = from ? `${initial(from)}&${initial(to)}` : initial(to);
  const t = locked && unlockAt ? until(unlockAt) : null;

  const breakSeal = () => {
    if (locked) return;
    if (gift.song?.audioUrl && audio.current) {
      audio.current.play().catch(() => {});
    }
    setStage("cover");
  };

  return (
    <div className="ui-root" style={{ position: "relative", overflowX: "hidden" }}>
      {gift.song?.audioUrl && <audio ref={audio} src={gift.song.audioUrl} loop muted={muted} preload="auto" />}
      {gift.song?.title && (
        <div style={{ ...(narrow ? { position: "relative", margin: "14px auto 0", width: "fit-content", maxWidth: "calc(100% - 32px)" } : { position: "absolute", top: 24, right: 24, whiteSpace: "nowrap" }), display: "flex", alignItems: "center", gap: 12, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 999, padding: "6px 8px 6px 18px", boxShadow: "0 4px 12px rgba(43,48,38,.06)", zIndex: 3 }}>
          <span style={{ fontSize: 14 }}>
            {stage !== "envelope" && gift.song.audioUrl && !muted ? "Playing " : "Song: "}<b>{gift.song.title}</b>{gift.song.artist ? ` · ${gift.song.artist}` : ""}
          </span>
          {gift.song.audioUrl && (
            <button className="ui-icon-btn" aria-label={muted ? "Unmute music" : "Mute music"} onClick={() => setMuted((m) => !m)} style={{ width: 34, height: 34, background: "var(--pistachio-100)", borderRadius: 999 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--pistachio-900)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M11 5L6 9H2v6h4l5 4z" />
                {muted ? <path d="M23 9l-6 6M17 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
              </svg>
            </button>
          )}
        </div>
      )}

      {stage === "envelope" && (
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: narrow ? "24px 16px 40px" : "90px 24px 56px", boxSizing: "border-box", background: "radial-gradient(ellipse at 50% 52%, rgba(255,255,255,.9) 0%, rgba(255,255,255,0) 60%)" }}>
          <div style={{ textAlign: "center", marginBottom: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="ribbon" style={{ display: "inline-flex", alignItems: "center", height: 36, padding: narrow ? "0 26px" : "0 40px", background: "var(--pistachio-100)", color: "var(--pistachio-900)", fontSize: narrow ? 10 : 12, letterSpacing: narrow ? ".12em" : ".22em", fontWeight: 700, clipPath: "polygon(0 0,100% 0,calc(100% - 14px) 50%,100% 100%,0 100%,14px 50%)" }}>
              {fmtDay(ribbonDate)} · SENT WITH LOVE
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 18 }}>
              {!narrow && <Sprig />}
              <h1 className="font-hand" style={{ margin: 0, fontSize: "clamp(34px, 4vw, 58px)", fontWeight: 700, lineHeight: 1 }}>
                {heading} <span style={{ color: "var(--pistachio-700)" }}>♡</span>
              </h1>
              {!narrow && <Sprig flip />}
            </div>
          </div>

          {narrow ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30, width: "100%" }}>
              <Envelope to={to} from={from} forLine={gift.forLine} initials={initials} onSeal={breakSeal} sealDisabled={locked} scale={envScale} />
              <NoteCard note={gift.note} from={from} narrow />
              <PackingSlip counts={gift.counts} song={gift.song} narrow />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 44, width: "100%", maxWidth: 1360, flexWrap: "wrap" }}>
              <PackingSlip counts={gift.counts} song={gift.song} />
              <Envelope to={to} from={from} forLine={gift.forLine} initials={initials} onSeal={breakSeal} sealDisabled={locked} />
              <NoteCard note={gift.note} from={from} />
            </div>
          )}

          {locked && unlockAt ? (
            <div role="status" style={{ marginTop: 48, textAlign: "center" }}>
              <p className="font-hand" style={{ margin: 0, fontSize: 30, color: "var(--pistachio-800)" }}>sealed until {unlockAt.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }} data-testid="countdown">
                {[[t.d, "DAYS"], [t.h, "HRS"], [t.m, "MIN"]].map(([n, l]) => (
                  <span key={l} style={{ background: "var(--pistachio-50)", borderRadius: 8, padding: "8px 12px", minWidth: 52 }}>
                    <span style={{ display: "block", fontSize: 24, fontWeight: 700, color: "var(--pistachio-900)" }}>{String(n).padStart(2, "0")}</span>
                    <span className="muted" style={{ fontSize: 10, letterSpacing: ".1em" }}>{l}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <>
              <p className="font-hand" style={{ margin: narrow ? "30px 0 0" : "56px 0 0", fontSize: 30, color: "var(--pistachio-800)", textAlign: "center" }}>tap the seal to open ✦</p>
              {gift.song?.audioUrl && <p className="muted" style={{ margin: "4px 0 0", fontSize: 14 }}>{from || "Someone"} picked a song for this moment — turn your sound on</p>}
            </>
          )}

          <Story story={gift.story} narrow={narrow} />
        </main>
      )}

      {stage === "cover" && (
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box" }}>
          <p className="font-hand" style={{ margin: "0 0 22px", fontSize: 30, color: "var(--pistachio-800)" }}>something made just for you…</p>
          <div style={{ position: "relative", width: coverW, height: (coverW * 540) / 420, transform: "rotate(-1.5deg)" }}>
            <span aria-hidden="true" style={{ position: "absolute", right: -10, top: 12, bottom: 8, width: 16, borderRadius: "0 5px 5px 0", background: "repeating-linear-gradient(to bottom,#fff 0 2px,#E7E4DE 2px 3px)" }} />
            <div style={{ position: "absolute", inset: "0 6px 0 0", backgroundColor: "#D7E5C6", backgroundImage: "repeating-linear-gradient(45deg,rgba(255,255,255,.22) 0 1px,transparent 1px 4px)", borderRadius: "8px 14px 14px 8px", boxShadow: "0 30px 50px rgba(43,48,38,.22)" }}>
              <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 38, background: "#3B5C2C", borderRadius: "8px 0 0 8px" }}>
                <span style={{ position: "absolute", left: 18, top: 18, bottom: 18, borderLeft: "2px dashed rgba(255,255,255,.55)" }} />
              </span>
              <span className="ui-tape" style={{ width: 100, left: 150, top: 70, transform: "rotate(-3deg)" }} />
              <div style={{ position: "absolute", left: 66, right: 28, bottom: 44 }}>
                <div className="font-title" style={{ fontSize: 42, lineHeight: 1.05 }}>{book.title}</div>
                <div className="font-hand" style={{ fontSize: 26, color: "var(--pistachio-900)", marginTop: 8 }}>
                  {from ? `from ${from}, ` : ""}with love
                </div>
              </div>
            </div>
          </div>
          <button className="ui-btn ui-btn-primary" style={{ marginTop: 36 }} onClick={() => setStage("read")} disabled={!spreads.length}>
            {spreads.length ? "Open the book →" : "This book has no pages yet"}
          </button>
        </main>
      )}

      {stage === "read" && spread && (
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: narrow ? "20px 16px 32px" : "80px 24px 40px", boxSizing: "border-box" }}>
          <h1 className="font-title" style={{ margin: "0 0 18px", fontSize: narrow ? 24 : 30, textAlign: "center" }}>{spread.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 20, justifyContent: "center" }}>
            {!narrow && (
              <button className="ui-icon-btn" aria-label="Previous pages" disabled={atStart} onClick={() => pages.turn("prev")} style={{ width: 48, height: 48, borderRadius: 999, border: "1px solid var(--line)", background: "var(--paper)" }}>
                <IconPrev size={20} />
              </button>
            )}
            <div ref={pages.ref} className="gift-turn" style={{ position: "relative", touchAction: "pan-y", userSelect: "none" }}>
              {elements[spread.id] ? (
                <BookSpread
                  elements={elements[spread.id]}
                  pageWidth={pw}
                  pageNumber={index * 2 + (narrow && side === "right" ? 2 : 1)}
                  onOpenLetter={setLetter}
                  only={narrow ? side : null}
                />
              ) : (
                <div style={{ width: narrow ? pw : pw * 2, height: (pw * PAGE.height) / PAGE.width, display: "grid", placeItems: "center" }} className="muted">turning the page…</div>
              )}
              <PageCorners pw={pw} ph={(pw * PAGE.height) / PAGE.width} single={narrow} canNext={!atEnd} canPrev={!atStart} onTurn={pages.turn} />
              <PageFlip flip={pages.flip} pw={pw} ph={(pw * PAGE.height) / PAGE.width} single={narrow} onDone={pages.endFlip} />
            </div>
            {!narrow && (
              <button className="ui-icon-btn" aria-label="Next pages" disabled={atEnd} onClick={() => pages.turn("next")} style={{ width: 48, height: 48, borderRadius: 999, border: "1px solid var(--line)", background: "var(--paper)" }}>
                <IconNext size={20} />
              </button>
            )}
          </div>
          {narrow && (
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button className="ui-btn ui-btn-outline" aria-label="Previous page" disabled={atStart} onClick={() => pages.turn("prev")}><IconPrev size={16} /> Back</button>
              <button className="ui-btn ui-btn-primary" aria-label="Next page" disabled={atEnd} onClick={() => pages.turn("next")}>Next page <IconNext size={16} /></button>
            </div>
          )}

          {spreads.length > 1 && (
            <p className="muted" style={{ margin: "14px 0 0", fontSize: 13, textAlign: "center" }}>{narrow ? "swipe the page to turn it" : PAGE_TURN_HINT}</p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: narrow ? 18 : 22, flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: 8 }} aria-label={`Spread ${index + 1} of ${spreads.length}`}>
              {spreads.map((s, i) => (
                <span key={s.id} style={{ width: i === index ? 22 : 8, height: 8, borderRadius: 999, background: i === index ? "var(--pistachio-700)" : "#C9D3BE", transition: "width .2s" }} />
              ))}
            </div>
            {book.allowReplies && (
              <>
                <button
                  className="ui-btn ui-btn-outline"
                  disabled={hearted[spread.id]}
                  onClick={async () => {
                    setHearted((h) => ({ ...h, [spread.id]: true }));
                    try {
                      await M.addReply(book.id, { spreadId: spread.id, reaction: "heart", name: to, text: "" });
                    } catch {
                      setHearted((h) => ({ ...h, [spread.id]: false }));
                    }
                  }}
                >
                  <span style={{ color: "var(--pistachio-700)", display: "inline-flex" }}><IconHeartFill size={16} /></span>
                  {hearted[spread.id] ? "Loved ♡" : "Love this page"}
                </button>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!reply.text.trim()) return;
                    setReply((r) => ({ ...r, busy: true, error: "" }));
                    try {
                      await M.addReply(book.id, { spreadId: spread.id, text: reply.text.trim(), name: to });
                      setReply({ text: "", sent: true, busy: false, error: "" });
                      // show where it went: the note sticks just under the book
                      setTimeout(() => notesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
                    } catch {
                      setReply((r) => ({ ...r, busy: false, error: "Couldn't send. Try again?" }));
                    }
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: narrow ? "wrap" : "nowrap", width: narrow ? "100%" : "auto", boxSizing: "border-box", background: "#E9F1DD", padding: "8px 8px 8px 18px", borderRadius: 6, transform: "rotate(-1deg)", boxShadow: "0 6px 14px rgba(43,48,38,.1)" }}
                >
                  <label htmlFor="gift-reply" className="font-hand" style={{ fontSize: 22, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {reply.sent ? "stuck ♡ write another?" : `a note for ${from || "them"}:`}
                  </label>
                  <input id="gift-reply" value={reply.text} maxLength={500} onChange={(e) => setReply((r) => ({ ...r, text: e.target.value, sent: false }))} placeholder="I cried at this one…" className="font-hand" style={{ width: narrow ? "100%" : 240, flex: narrow ? "1 1 100%" : "none", border: "none", background: "transparent", fontSize: 22, outline: "none", borderBottom: "1.5px dashed var(--pistachio-400)", padding: "4px 2px" }} />
                  <button type="submit" className="ui-btn ui-btn-primary" style={{ minHeight: 36, padding: "8px 16px" }} disabled={reply.busy}>Stick it</button>
                  {reply.error && <span role="alert" style={{ color: "#a23b2c", fontSize: 13 }}>{reply.error}</span>}
                </form>
              </>
            )}
          </div>
          {book.allowReplies && (() => {
            const here = replies.filter((r) => r.spreadId === spread.id);
            const notes = here.filter((r) => r.text);
            const hearts = here.filter((r) => r.reaction === "heart").length;
            if (!notes.length && !hearts) return null;
            return (
              <section ref={notesRef} aria-label="Notes stuck on this page" data-testid="page-notes" style={{ marginTop: 26, width: "100%", maxWidth: pw * 2, textAlign: "center" }}>
                <div className="muted" style={{ fontSize: 11, letterSpacing: ".2em", fontWeight: 700 }}>
                  STUCK ON THIS PAGE{hearts ? ` · ${hearts} ♡` : ""}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", marginTop: 14 }}>
                  {notes.map((r, i) => (
                    <figure key={r.id} className="gift-note" style={{ margin: 0, position: "relative", width: 220, background: "#E9F1DD", padding: "20px 16px 12px", boxShadow: "0 8px 16px rgba(43,48,38,.12)", transform: `rotate(${[-3, 2, -1.5, 3][i % 4]}deg)`, textAlign: "left" }}>
                      <span className="ui-tape solid" style={{ width: 70, left: 75, top: -10, height: 20 }} />
                      <blockquote className="font-hand" style={{ margin: 0, fontSize: 24, lineHeight: 1.1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{r.text}</blockquote>
                      <figcaption className="font-hand" style={{ fontSize: 18, color: "var(--pistachio-800)", textAlign: "right", marginTop: 8 }}>— {r.name || to}</figcaption>
                    </figure>
                  ))}
                </div>
                <p className="muted" style={{ fontSize: 12, margin: "12px 0 0" }}>{from ? `${from} sees these too.` : "The sender sees these too."}</p>
              </section>
            );
          })()}
          <button onClick={() => { setStage("envelope"); setIndex(0); setSide("left"); }} style={{ marginTop: 22, border: "none", background: "transparent", fontSize: 13, color: "var(--ink-muted)", cursor: "pointer", textDecoration: "underline" }}>
            Replay the opening
          </button>
        </main>
      )}

      {letter && (
        <div role="dialog" aria-label="Letter" onClick={() => setLetter(null)} style={{ position: "fixed", inset: 0, background: "rgba(43,48,38,.45)", display: "grid", placeItems: "center", zIndex: 10, padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--paper)", backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 33px, #dce7d0 33px 34px)", maxWidth: 620, width: "100%", maxHeight: "80vh", overflow: "auto", padding: "28px 32px", borderRadius: 6 }}>
            <h2 className="font-title" style={{ margin: 0, fontSize: 30 }}>{letter.content?.title || "A letter"}</h2>
            <p className="font-hand" style={{ fontSize: 26, lineHeight: "34px", whiteSpace: "pre-wrap" }}>{letter.content?.text || "♡"}</p>
            <button className="ui-btn ui-btn-primary" onClick={() => setLetter(null)}>Close</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes giftTurn { from { opacity: 0; transform: perspective(1600px) rotateY(-12deg) translateX(30px); } to { opacity: 1; transform: none; } }
        .gift-turn { animation: giftTurn .55s ease both; }
        @keyframes giftStick { from { opacity: 0; transform: translateY(-18px) rotate(-8deg) scale(1.06); } }
        .gift-note { animation: giftStick .45s ease both; }
      `}</style>
    </div>
  );
}
