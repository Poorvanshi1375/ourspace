import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import { dayRange } from "../utils/space";

/* random position helper */
const rand = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const NewNotePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, activeSpaceCode: spaceCode, loading: userLoading } = useAuth();

  const selectedDateKey = location.state?.date; // yyyy-mm-dd

  const [title, setTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [isShared, setIsShared] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !spaceCode || !noteText.trim()) {
      setError("Please write some content for your letter.");
      return;
    }

    if (!selectedDateKey) {
      setError("Date missing. Please go back and select a date.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const createdAt = dayRange(selectedDateKey).noon;
      const finalTitle = title.trim() || "Untitled Letter";

      /* 1️⃣ Create NOTE */
      const noteRef = await addDoc(collection(db, "notes"), {
        spaceCode,
        author_id: user.uid,
        title: finalTitle,
        text: noteText.trim(),
        is_shared: isShared,
        created_at: createdAt,
        updated_at: serverTimestamp(),
        is_deleted: false,
      });

      /* 2️⃣ Shared letters also go on that day's scrapbook page (drafts stay private) */
      if (isShared) {
        await addDoc(collection(db, "memory_posts"), {
          spaceCode,
          sender_id: user.uid,
          type: "letter",
          noteId: noteRef.id,
          title: finalTitle,
          text: noteText.trim(),
          created_at: createdAt,
          is_deleted: false,
          position: {
            x: rand(100, 500),
            y: rand(120, 400),
            rotate: rand(-5, 5),
          },
        });
      }

      /* redirect back */
      navigate("/notes", {
        state: { date: selectedDateKey },
      });

    } catch (err) {
      console.error("Error saving letter:", err);
      setError("Failed to save the letter. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) {
    return <div style={{ textAlign: "center" }}>Loading…</div>;
  }

  if (!spaceCode) {
    return (
      <div style={{ textAlign: "center" }}>
        Please join a space to write letters.
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        background: "#fdf7f7",
        borderRadius: "12px",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#a78bfa" }}>
        ✍️ Write a New Letter
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "bold" }}>Title (Optional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A title for your letter…"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "bold" }}>Your Letter *</label>
          <textarea
            rows={12}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            required
            placeholder="Pour your heart out…"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>
            <input
              type="checkbox"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
            />{" "}
            Share this letter
          </label>
        </div>

        {error && (
          <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "12px",
            background: "#ff9a9e",
            color: "#fff",
            border: "none",
            borderRadius: "24px",
            fontWeight: "bold",
          }}
        >
          {isSubmitting ? "Saving…" : "Send Letter"}
        </button>
      </form>
    </div>
  );
};

export default NewNotePage;
