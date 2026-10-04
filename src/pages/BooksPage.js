// src/pages/BooksPage.js — the shelf of books in the active space
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import * as M from "../model";
import AppShell from "../ui/AppShell";
import BookCover from "../ui/BookCover";
import { IconPlus } from "../ui/icons";

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
