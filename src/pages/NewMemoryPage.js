// src/pages/NewMemoryPage.js
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../auth";
import { dayRange } from "../utils/space";

export default function NewMemoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeSpaceCode: spaceCode, loading: authLoading } = useAuth();

  const selectedDateKey = location.state?.date || null;

  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [existingMemories, setExistingMemories] = useState([]);

  const range = useMemo(() => dayRange(selectedDateKey), [selectedDateKey]);

  /* Load existing TEXT memories for the day */
  useEffect(() => {
    if (authLoading) return;
    if (!spaceCode || !range) {
      setLoading(false);
      return;
    }

    const loadMemories = async () => {
      const q = query(
        collection(db, "memory_posts"),
        where("spaceCode", "==", spaceCode),
        where("is_deleted", "==", false),
        where("created_at", ">=", range.start),
        where("created_at", "<=", range.end)
      );

      try {
        const snap = await getDocs(q);
        const texts = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => m.type === "text")
          .sort((a, b) => a.created_at?.toDate() - b.created_at?.toDate());

        setExistingMemories(texts);
      } catch (err) {
        console.error("Failed to load memories:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMemories();
  }, [spaceCode, range, authLoading]);

  /* Timestamp for the selected day */
  const getCreatedAt = () => (range ? range.noon : serverTimestamp());

  /* Save new memory */
  const save = async () => {
    if (!text.trim()) {
      setError("Write something.");
      return;
    }
    if (!spaceCode) {
      setError("Join or create a space first.");
      return;
    }

    await addDoc(collection(db, "memory_posts"), {
      spaceCode,
      sender_id: auth.currentUser.uid,
      type: "text",
      text: text.trim(),
      created_at: getCreatedAt(),
      is_deleted: false,
    });

    navigate("/dashboard");
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2 style={{ marginBottom: 16 }}>
        Write Memory for {selectedDateKey}
      </h2>

      {/* EXISTING MEMORIES */}
      {existingMemories.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {existingMemories.map((m) => (
            <div
              key={m.id}
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "10px 14px",
                marginBottom: 10,
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              {m.text}
            </div>
          ))}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <p style={{ color: "red", marginBottom: 8 }}>{error}</p>
      )}

      {/* INPUT */}
      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write something sweet…"
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          border: "1px solid #ddd",
          fontSize: 15,
          resize: "vertical",
          marginBottom: 12,
        }}
      />

      <button
        onClick={save}
        style={{
          padding: "10px 18px",
          borderRadius: 10,
          border: "none",
          background: "#111",
          color: "#fff",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Save
      </button>
    </div>
  );
}
