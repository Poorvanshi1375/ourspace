// src/pages/JoinSpacePage.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

export default function JoinSpacePage() {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.currentUser) navigate("/login");
  }, [navigate]);

  const handleJoinSpace = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return navigate("/login");

    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter a space code.");
      return;
    }

    setJoining(true);
    setError("");

    try {
      /* 1️⃣ Load space */
      const spaceRef = doc(db, "spaces", trimmed);
      const spaceSnap = await getDoc(spaceRef);

      if (!spaceSnap.exists()) {
        setError("No space found with that code.");
        return;
      }

      const space = spaceSnap.data();

      /* 2️⃣ Load user document */
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      const prevSpaces =
        userSnap.exists() && Array.isArray(userSnap.data().spaces)
          ? userSnap.data().spaces
          : [];

      const alreadyInUserSpaces = prevSpaces.some(
        (s) => s.spaceCode === trimmed
      );

      const alreadyInSpace = Array.isArray(space.userIds)
        ? space.userIds.includes(user.uid)
        : false;

      /* 3️⃣ If already a member → just switch space (BUT SYNC spaces[]) */
      if (alreadyInSpace) {
        const nextSpaces = alreadyInUserSpaces
          ? prevSpaces
          : [
              ...prevSpaces,
              {
                spaceCode: trimmed,
                role: "member",
                joinedAt: new Date(),
              },
            ];

        await setDoc(
          userRef,
          {
            spaces: nextSpaces,
            activeSpaceCode: trimmed,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        navigate("/app");
        return;
      }

      /* 4️⃣ Capacity check */
      if (
        Array.isArray(space.userIds) &&
        space.userIds.length >= space.maxMembers
      ) {
        setError("This space has reached its member limit.");
        return;
      }

      /* 5️⃣ Add user to space */
      await updateDoc(spaceRef, {
        userIds: [...(space.userIds || []), user.uid],
      });

      /* 6️⃣ Add space to user + activate it */
      const nextSpaces = alreadyInUserSpaces
        ? prevSpaces
        : [
            ...prevSpaces,
            {
              spaceCode: trimmed,
              role: "member",
              joinedAt: new Date(),
            },
          ];

      await setDoc(
        userRef,
        {
          // legacy support
          spaceCode: trimmed,
          roleInSpace: "member",

          // multi-space
          spaces: nextSpaces,
          activeSpaceCode: trimmed,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      /* 7️⃣ Done */
      navigate("/app");
    } catch (err) {
      console.error("Error joining space:", err);
      setError("Something went wrong while joining the space.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Join Your Space 🤝</h1>

      <p style={styles.subtitle}>
        Enter the code your best friend shared with you.
      </p>

      <form onSubmit={handleJoinSpace}>
        <input
          style={styles.input}
          type="text"
          placeholder="Enter space code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} disabled={joining}>
          {joining ? "Joining..." : "Join Space"}
        </button>
      </form>

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
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid #ccc",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: "2px",
    textTransform: "uppercase",
  },
  error: { color: "crimson", marginBottom: 12 },
  button: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: 999,
    border: "none",
    background: "#ff7eb3",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  backButton: {
    marginTop: 12,
    padding: "8px 12px",
    borderRadius: 999,
    border: "none",
    background: "#eee",
    fontSize: 13,
    cursor: "pointer",
  },
};
