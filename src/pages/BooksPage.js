// src/pages/BooksPage.js — the shelf of books in the active space
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import * as M from "../model";
import AppShell from "../ui/AppShell";
import { Tape } from "../ui/paper";
import { IconPlus } from "../ui/icons";

const COVERS = [
  { cloth: "#ECE8E0", spine: "#4E7A3A" },
  { cloth: "#D7E5C6", spine: "#3B5C2C" },
  { cloth: "#FBFAF8", spine: "#2B3026" },
];

function BookCover({ book, index }) {
  const c = COVERS[index % COVERS.length];
  return (
    <Link
      to={`/books/${book.id}`}
      data-book={book.id}
      style={{ display: "block", position: "relative", height: 340, textDecoration: "none", color: "var(--ink)" }}
    >
      <span aria-hidden="true" style={{ position: "absolute", right: -8, top: 10, bottom: 6, width: 14, borderRadius: "0 4px 4px 0", background: "repeating-linear-gradient(to bottom,#fff 0 2px,#E7E4DE 2px 3px)" }} />
      <div
        style={{
          position: "absolute",
          inset: "0 6px 0 0",
          backgroundColor: c.cloth,
          backgroundImage: "repeating-linear-gradient(45deg,rgba(255,255,255,.22) 0 1px,transparent 1px 4px)",
          borderRadius: "6px 10px 10px 6px",
          boxShadow: "0 14px 24px rgba(43,48,38,.16), 0 2px 4px rgba(43,48,38,.1)",
        }}
      >
        <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 28, background: c.spine, borderRadius: "6px 0 0 6px" }}>
          <span style={{ position: "absolute", left: 13, top: 14, bottom: 14, borderLeft: "2px dashed rgba(255,255,255,.55)" }} />
        </span>
        <Tape style={{ width: 80, left: 70, top: 40, transform: "rotate(-4deg)" }} />
        <div style={{ position: "absolute", left: 46, right: 16, bottom: 22 }}>
          <div className="font-title" style={{ fontSize: 26, lineHeight: 1.1 }}>{book.title}</div>
          {book.recipient?.name && (
            <div className="font-hand" style={{ fontSize: 22, color: "#4a5044" }}>for {book.recipient.name} ♡</div>
          )}
          <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
            {book.status === "gifted" ? "Gifted" : "Draft"}
            {book.source === "migration" ? " · from your old scrapbook" : ""}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BooksPage() {
  const navigate = useNavigate();
  const { user, activeSpaceCode, loading } = useAuth();
  const [books, setBooks] = useState(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (loading || !activeSpaceCode) return;
    return M.subscribeBooks(activeSpaceCode, setBooks, (e) => {
      console.error(e);
      setError("Couldn't load your books.");
    });
  }, [activeSpaceCode, loading]);

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

  return (
    <AppShell>
      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 32px" }}>
        <h1 className="font-title" style={{ margin: 0, fontSize: 56 }}>Our shelf</h1>
        <p className="font-hand" style={{ fontSize: 28, color: "var(--pistachio-800)", margin: "6px 0 0" }}>
          every book you're making, together
        </p>

        {!activeSpaceCode && !loading && (
          <p style={{ marginTop: 24 }}>
            Join or create a space first. <Link to="/space">Go to spaces →</Link>
          </p>
        )}
        {error && <p role="alert" style={{ color: "#a23b2c" }}>{error}</p>}

        {activeSpaceCode && (
          <section className="ui-panel" style={{ marginTop: 32 }}>
            {books === null ? (
              <p className="muted">Loading your books…</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 36 }}>
                {books.map((b, i) => (
                  <BookCover key={b.id} book={b} index={i} />
                ))}
                <button
                  onClick={startBook}
                  disabled={creating}
                  style={{ height: 340, border: "2px dashed #c9d3be", borderRadius: 12, background: "rgba(253,253,250,.6)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, font: "inherit", color: "var(--ink)" }}
                >
                  <span style={{ width: 64, height: 64, borderRadius: 999, background: "var(--pistachio-100)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--pistachio-800)" }}>
                    <IconPlus size={28} />
                  </span>
                  <span className="font-title" style={{ fontSize: 24 }}>{creating ? "Starting…" : "Start a new book"}</span>
                  <span className="font-hand" style={{ fontSize: 22, color: "#4a5044" }}>every journey begins with an unwritten page</span>
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </AppShell>
  );
}
