// src/pages/CreateSpacePage.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

/* Generate a 6-character space code */
function generateSpaceCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function CreateSpacePage() {
  const navigate = useNavigate();

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [maxMembers, setMaxMembers] = useState(2);

  useEffect(() => {
    if (!auth.currentUser) navigate("/login");
  }, [navigate]);

  const handleCreateSpace = async () => {
    const user = auth.currentUser;
    if (!user) return navigate("/login");

    setCreating(true);
    setError("");

    try {
      /* 1️⃣ Generate unique space code */
      let code;
      while (true) {
        code = generateSpaceCode();
        const snap = await getDoc(doc(db, "spaces", code));
        if (!snap.exists()) break;
      }

      /* 2️⃣ Create space document */
      await setDoc(doc(db, "spaces", code), {
        spaceCode: code,
        userIds: [user.uid],
        maxMembers: Number(maxMembers),
        created_at: serverTimestamp(),
        name: null,
        is_locked: false,
      });

      /* 3️⃣ Load user document */
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      const prevSpaces =
        userSnap.exists() && Array.isArray(userSnap.data().spaces)
          ? userSnap.data().spaces
          : [];

      /* 4️⃣ Update user document (🔥 FIXED) */
      await setDoc(
        userRef,
        {
          id: user.uid,
          email: user.email || null,

          // legacy support
          spaceCode: code,
          roleInSpace: "creator",

          // ✅ NO serverTimestamp inside array
          spaces: [
            ...prevSpaces,
            {
              spaceCode: code,
              role: "creator",
              joinedAt: new Date(), // ✅ THIS FIXES EVERYTHING
            },
          ],

          activeSpaceCode: code,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      /* 5️⃣ Success */
      navigate("/dashboard");
    } catch (err) {
      console.error("Create space setup failed:", err);
      setError("Space created, but setup failed. Please refresh.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Create Your Shared Space ✨</h1>

      <p style={styles.subtitle}>
        This will generate a unique code your partner can use to join.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: "#555" }}>
          How many people can access this space?
        </label>
        <select
          value={maxMembers}
          onChange={(e) => setMaxMembers(Number(e.target.value))}
          style={styles.select}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} member{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button
        onClick={handleCreateSpace}
        disabled={creating}
        style={styles.button}
      >
        {creating ? "Creating..." : "Create Our Space"}
      </button>

      <button style={styles.backButton} onClick={() => navigate("/space")}>
        ← Back
      </button>
    </div>
  );
}

/* Styles */
const styles = {
  container: {
    maxWidth: 480,
    margin: "40px auto",
    padding: 24,
    textAlign: "center",
    borderRadius: 16,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    background: "#fff",
  },
  title: { marginBottom: 12 },
  subtitle: { marginBottom: 24, color: "#555", fontSize: 14 },
  error: { color: "crimson", marginBottom: 16 },
  select: {
    marginTop: 6,
    width: "100%",
    padding: 10,
    borderRadius: 999,
    border: "1px solid #ccc",
    textAlign: "center",
  },
  button: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: 999,
    border: "none",
    background: "#ff7eb3",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 12,
  },
  backButton: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "none",
    background: "#eee",
    fontSize: 13,
    cursor: "pointer",
  },
};