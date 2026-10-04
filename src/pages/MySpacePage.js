// src/pages/MySpacePage.js — the new Home: greeting, what's coming up, a memory, the shelf
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import * as M from "../model";
import AppShell from "../ui/AppShell";
import BookCover from "../ui/BookCover";
import { Polaroid } from "../ui/paper";
import { IconPlus, IconGift, IconPhoto } from "../ui/icons";

const dayLabel = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const countdown = (date) => {
  const ms = date.getTime() - Date.now();
  const d = Math.floor(ms / 864e5);
  const h = Math.floor((ms % 864e5) / 36e5);
  return d > 0 ? `${d} day${d === 1 ? "" : "s"} ${h} h` : `${h} h`;
};

/*
 * "On this day": a photo from a spread dated today's day + month in an earlier year.
 * Otherwise the newest photo in any book, labelled with its own date.
 */
async function findMemory(books) {
  const today = new Date();
  const mmdd = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const all = [];
  for (const b of books) {
    const spreads = await M.listSpreads(b.id);
    spreads.forEach((s) => all.push({ book: b, spread: s }));
  }
  const dated = all.filter((x) => x.spread.date);
  const sameDay = dated.filter((x) => x.spread.date.slice(5) === mmdd && x.spread.date.slice(0, 4) < String(today.getFullYear()));
  const candidates = sameDay.length
    ? sameDay
    : [...dated].sort((a, b) => b.spread.date.localeCompare(a.spread.date));

  for (const c of candidates.slice(0, 6)) {
    const els = await M.listElements(c.book.id, c.spread.id);
    const photo = els.find((e) => e.type === "photo" && e.content?.mediaUrl);
    if (photo) {
      const years = today.getFullYear() - Number(c.spread.date.slice(0, 4));
      return { ...c, photo, onThisDay: sameDay.length > 0, years };
    }
  }
  return null;
}

export default function MySpacePage() {
  const navigate = useNavigate();
  const { user, userDoc, activeSpaceCode, loading } = useAuth();
  const [books, setBooks] = useState(null);
  const [memory, setMemory] = useState(undefined); // undefined = loading, null = none
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (loading || !activeSpaceCode) return;
    return M.subscribeBooks(activeSpaceCode, setBooks, (e) => {
      console.error(e);
      setError("Couldn't load your books.");
    });
  }, [activeSpaceCode, loading]);

  // look for a memory once per set of books
  const bookIds = (books || []).map((b) => b.id).join(",");
  useEffect(() => {
    if (!books) return;
    let alive = true;
    findMemory(books)
      .then((m) => alive && setMemory(m))
      .catch(() => alive && setMemory(null));
    return () => {
      alive = false;
    };
  }, [bookIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const sealed = useMemo(
    () =>
      (books || [])
        .filter((b) => b.giftEnabled && b.unlockAt && b.unlockAt.toDate() > new Date())
        .sort((a, b) => a.unlockAt.toMillis() - b.unlockAt.toMillis()),
    [books]
  );
  const recent = useMemo(
    () => [...(books || [])].sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0))[0],
    [books]
  );

  const startBook = async () => {
    setCreating(true);
    try {
      const id = await M.createBook(activeSpaceCode, user.uid, { title: "Untitled book" });
      await M.createSpread(id, user.uid, { title: "Page one" });
      navigate(`/books/${id}`);
    } catch (e) {
      console.error(e);
      setError("Couldn't create the book. Please try again.");
      setCreating(false);
    }
  };

  const firstName = (userDoc?.name || "").trim().split(/\s+/)[0] || "there";

  if (!loading && !activeSpaceCode) {
    return (
      <AppShell>
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 32px", textAlign: "center" }}>
          <h1 className="font-title" style={{ fontSize: 48, margin: 0 }}>Hi {firstName}</h1>
          <p className="font-hand" style={{ fontSize: 28 }}>start by creating a space, or join a friend's with their code</p>
          <Link className="ui-btn ui-btn-primary" to="/space">Create or join a space</Link>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "36px 32px 24px" }}>
        {error && <p role="alert" style={{ color: "#a23b2c" }}>{error}</p>}

        <section style={{ display: "flex", flexWrap: "wrap", gap: 48, alignItems: "flex-start" }}>
          <div style={{ flex: "999 1 560px", minWidth: 0 }}>
            <h1 className="font-title" style={{ margin: 0, fontSize: 60, lineHeight: 1.05 }}>
              Hi {firstName} <span style={{ color: "var(--pistachio-400)" }}>✿</span>
            </h1>
            <p className="font-hand" style={{ margin: "8px 0 0", fontSize: 30, color: "var(--pistachio-800)" }}>
              your cozy little memory library
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
              <span className="ui-chip" style={{ cursor: "default" }}>{books ? books.length : "…"} book{books?.length === 1 ? "" : "s"}</span>
              <span className="ui-chip active" style={{ cursor: "default" }}>
                {sealed.length} sealed gift{sealed.length === 1 ? "" : "s"} waiting
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 24 }}>
              {recent && (
                <Link to={`/books/${recent.id}`} style={{ flex: "1 1 280px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", textDecoration: "none", color: "var(--ink)" }}>
                  <span style={{ width: 46, height: 46, borderRadius: 999, background: "var(--pistachio-700)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <IconPhoto />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 15 }}>Continue <b>{recent.title}</b></span>
                    <span className="muted" style={{ fontSize: 13 }}>pick up where you left off</span>
                  </span>
                </Link>
              )}
              <button onClick={startBook} disabled={creating} style={{ flex: "1 1 280px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", cursor: "pointer", font: "inherit", color: "var(--ink)", textAlign: "left" }}>
                <span style={{ width: 46, height: 46, borderRadius: 999, background: "var(--pistachio-100)", color: "var(--pistachio-800)", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <IconPlus />
                </span>
                <span>
                  <span style={{ display: "block", fontSize: 15 }}><b>{creating ? "Starting…" : "Start a new book"}</b></span>
                  <span className="muted" style={{ fontSize: 13 }}>a birthday, a trip, a year together</span>
                </span>
              </button>
            </div>

            <h2 className="font-title" style={{ margin: "36px 0 0", fontSize: 28 }}>Coming up</h2>
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {sealed.slice(0, 3).map((b) => (
                <Link key={b.id} to={`/books/${b.id}`} style={{ background: "var(--pistachio-700)", color: "#fff", borderRadius: 16, padding: "18px 20px", textDecoration: "none" }}>
                  <div style={{ fontSize: 12, letterSpacing: ".14em", fontWeight: 600, opacity: 0.85 }}>
                    {b.unlockAt.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase()}
                  </div>
                  <div className="font-hand" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.05, marginTop: 6 }}>
                    {b.title} unlocks
                  </div>
                  <div style={{ fontSize: 13, marginTop: 10, opacity: 0.9 }}>in {countdown(b.unlockAt.toDate())}</div>
                </Link>
              ))}
              {sealed.length === 0 && (
                <div style={{ background: "var(--paper)", border: "1px dashed #c9d3be", borderRadius: 16, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center" }}>
                  <span style={{ color: "var(--pistachio-800)" }}><IconGift size={26} /></span>
                  <span className="font-hand" style={{ fontSize: 22, lineHeight: 1.1 }}>
                    no sealed gifts yet: make one for someone you love
                  </span>
                </div>
              )}
            </div>

            <p style={{ marginTop: 28, fontSize: 14 }} className="muted">
              Looking for the old calendar, letters and gallery? <Link to="/dashboard">Open the old calendar view</Link>
            </p>
          </div>

          <figure style={{ flex: "1 1 340px", maxWidth: 420, margin: 0, transform: "rotate(1.6deg)" }}>
            {memory === undefined ? (
              <div className="ui-polaroid" style={{ padding: 18 }}><p className="muted">Finding a memory…</p></div>
            ) : memory ? (
              <Link to={`/books/${memory.book.id}?spread=${memory.spread.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <div className="muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 12, letterSpacing: ".14em", fontWeight: 600, margin: "0 6px 8px" }}>
                  <span>{memory.onThisDay ? "ON THIS DAY" : "A MEMORY"}</span>
                  <span>{memory.onThisDay ? `${memory.years} year${memory.years === 1 ? "" : "s"} ago` : dayLabel(memory.spread.date)}</span>
                </div>
                <Polaroid src={memory.photo.content.mediaUrl} caption={memory.photo.content.caption || memory.spread.title} scale={1.1} />
                <figcaption className="font-hand" style={{ fontSize: 20, margin: "10px 6px 0", color: "var(--pistachio-800)" }}>
                  from {memory.book.title} · open this spread →
                </figcaption>
              </Link>
            ) : (
              <div className="ui-polaroid" style={{ padding: 22 }}>
                <p className="font-hand" style={{ fontSize: 24, margin: 0 }}>your photos will show up here once a book has some</p>
              </div>
            )}
          </figure>
        </section>

        <section className="ui-panel" style={{ marginTop: 44 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <h2 className="font-title" style={{ margin: 0, fontSize: 36 }}>Our shelf</h2>
            <Link to="/books" style={{ fontWeight: 600, fontSize: 14 }}>See all books →</Link>
          </div>
          <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 36 }}>
            {(books || []).slice(0, 4).map((b, i) => (
              <BookCover key={b.id} book={b} index={i} />
            ))}
            {books && books.length === 0 && <p className="font-hand" style={{ fontSize: 24 }}>no books yet: start your first one above</p>}
          </div>
        </section>
      </main>
      <footer style={{ marginTop: 48, borderTop: "1px solid #e4e8dc", background: "var(--bg-panel)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "20px 32px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", fontSize: 13 }} className="muted">
          <span>© 2026 OurSpace</span>
          <span className="font-hand" style={{ fontSize: 20, color: "var(--pistachio-800)" }}>memories you can almost hold</span>
        </div>
      </footer>
    </AppShell>
  );
}
