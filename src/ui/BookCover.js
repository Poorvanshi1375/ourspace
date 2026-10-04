// src/ui/BookCover.js — a book on the shelf (cloth cover, stitched spine, page block)
import React from "react";
import { Link } from "react-router-dom";
import { Tape } from "./paper";

const COVERS = [
  { cloth: "#ECE8E0", spine: "#4E7A3A" },
  { cloth: "#D7E5C6", spine: "#3B5C2C" },
  { cloth: "#FBFAF8", spine: "#2B3026" },
];

export default function BookCover({ book, index }) {
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

