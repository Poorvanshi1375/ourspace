// src/pages/ReadNotePage.js
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function ReadNotePage() {
  const { id } = useParams(); // note id in /notes/:id
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [noAccess, setNoAccess] = useState(false);
  const [note, setNote] = useState(null);

  useEffect(() => {
    const loadNote = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        // 1) Load current user to get their spaceCode
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const userData = userSnap.data();
        const mySpaceCode =
          userData.activeSpaceCode ||
          userData.spaceCode ||
          userData.space_code ||
          null;

        if (!mySpaceCode) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // 2) Load the note document
        const noteRef = doc(db, "notes", id);
        const noteSnap = await getDoc(noteRef);

        if (!noteSnap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const raw = noteSnap.data();

        // 3) Normalise field names so it works with both
        const isDeleted = raw.is_deleted ?? raw.isDeleted ?? false;
        const authorId = raw.authorId || raw.author_id || null;
        const spaceCode = raw.spaceCode || raw.space_code || null;
        const isShared = raw.is_shared ?? raw.isShared ?? false;

        if (isDeleted) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // 4) Check same space
        if (!spaceCode || spaceCode !== mySpaceCode) {
          setNoAccess(true);
          setLoading(false);
          return;
        }

        // 5) Allow if shared OR I am the author
        const iAmAuthor = authorId === user.uid;

        if (!isShared && !iAmAuthor) {
          setNoAccess(true);
          setLoading(false);
          return;
        }

        // All good – show note
        setNote({
          id: noteSnap.id,
          ...raw,
          _normalized: { isDeleted, authorId, spaceCode, isShared },
        });
        setLoading(false);
      } catch (err) {
        console.error("Error loading note:", err);
        setNotFound(true);
        setLoading(false);
      }
    };

    loadNote();
  }, [id, navigate]);

  // ───────── UI helpers ─────────
  const formatDate = (ts) => {
    if (!ts) return "";
    if (ts.toDate) {
      return ts
        .toDate()
        .toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
    }
    return "";
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#e7eff8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        Loading letter...
      </div>
    );
  }

  if (notFound) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#e7eff8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <p style={{ fontSize: 18, color: "#64748b" }}>
          Letter not found or has been deleted.
        </p>
      </div>
    );
  }

  if (noAccess) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#e7eff8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <p style={{ fontSize: 18, color: "#64748b" }}>
          You don&apos;t have permission to view this letter.
        </p>
      </div>
    );
  }

  // Safe because notFound & loading are false now
  const isShared =
    note._normalized?.isShared ??
    note.is_shared ??
    note.isShared ??
    false;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#e7eff8",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "40px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 24,
          boxShadow: "0 20px 50px rgba(148, 163, 184, 0.35)",
          border: "1px solid #e2e8f0",
          padding: "24px 26px 30px",
        }}
      >
        <button
          onClick={() =>
            navigate("/notes", {
              state: {
                date: sessionStorage.getItem("notes:selectedDate"),
              },
            })
          }
          style={{
            borderRadius: 999,
            border: "1px solid #cbd5f5",
            padding: "6px 14px",
            fontSize: 13,
            cursor: "pointer",
            background: "#f1f5ff",
            color: "#475569",
            marginBottom: 16,
          }}
        >
          ← Back to letters
        </button>

        <div style={{ marginBottom: 10 }}>
          <p
            style={{
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "#94a3b8",
              marginBottom: 6,
            }}
          >
            {isShared ? "Shared Letter" : "Private Draft"}
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#0f172a",
              margin: 0,
            }}
          >
            {note.title || "(no title)"}
          </h1>
          <p
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "#94a3b8",
            }}
          >
            {formatDate(note.created_at || note.createdAt)}
          </p>
        </div>

        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #e2e8f0",
            fontSize: 15,
            lineHeight: 1.7,
            color: "#1f2933",
            whiteSpace: "pre-wrap",
          }}
        >
          {note.text || note.body || ""}
        </div>
      </div>
    </div>
  );
}
