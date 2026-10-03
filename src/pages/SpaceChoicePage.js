// src/pages/SpaceChoicePage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function SpaceChoicePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError("User profile not found.");
          setLoading(false);
          return;
        }

        setUserDoc({ id: user.uid, ...snap.data() });
      } catch (err) {
        console.error("Error loading user for space setup:", err);
        setError("Something went wrong while loading your profile.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const handleCreateSpace = () => {
    navigate("/space/create");
  };

  const handleJoinSpace = () => {
    navigate("/space/join");
  };

  const handleGoDashboard = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return <div style={{ padding: "24px" }}>Loading your space info…</div>;
  }

  /**
   * 🔑 IMPORTANT UPGRADE (BACKWARD COMPATIBLE)
   * - Old users: spaceCode (single)
   * - New users: spaces[] (multiple)
   */
  const rawSpaces = Array.isArray(userDoc?.spaces)
    ? userDoc.spaces
    : [];

  const spaces = rawSpaces
    .map((s) =>
      typeof s === "string"
        ? { spaceCode: s }
        : s?.spaceCode
        ? s
        : null
    )
    .filter(Boolean);

  // legacy fallback
  if (spaces.length === 0 && userDoc?.spaceCode) {
    spaces.push({
      spaceCode: userDoc.spaceCode,
      role: userDoc.roleInSpace || "member",
    });
  }

  const hasSpaces = spaces.length > 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff7ed",
        padding: "24px 16px 40px",
      }}
    >
      {/* Header */}
      <header
        style={{
          maxWidth: 1120,
          margin: "0 auto 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#f97362",
            }}
          >
            OurSpace
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Manage your private memory spaces
          </div>
        </div>

        {hasSpaces && (
          <button
            onClick={handleGoDashboard}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid rgba(248, 187, 150, 0.9)",
              background: "#fffaf3",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ← Go to Dashboard
          </button>
        )}
      </header>

      <main
        style={{
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        {/* Hero */}
        <section
          style={{
            marginBottom: 24,
            padding: 20,
            borderRadius: 22,
            border: "1px solid rgba(248, 187, 150, 0.5)",
            background:
              "radial-gradient(circle at top left, #fff1e6, #fff7ed 55%, #fffaf5)",
            boxShadow: "0 18px 40px rgba(248, 187, 150, 0.25)",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 8,
            }}
          >
            Your private memory spaces
          </p>
          <h1 style={{ fontSize: 28, margin: 0 }}>
            {hasSpaces
              ? "Your shared spaces"
              : "Set up your first shared space"}
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#6b7280",
              marginTop: 8,
            }}
          >
            Create a new space or join an existing one using a secret code.
          </p>
        </section>

        {/* Main cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {/* LEFT: Joined spaces */}
          <div
            style={{
              padding: 20,
              borderRadius: 20,
              border: "1px solid rgba(248, 187, 150, 0.55)",
              background: "#fffdf9",
              boxShadow: "0 10px 24px rgba(248, 187, 150, 0.18)",
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>
              {hasSpaces ? "Your spaces" : "No spaces yet"}
            </h2>

            {hasSpaces ? (
              spaces.map((space) => (
                <div
                  key={space.spaceCode}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(248, 187, 150, 0.4)",
                    marginBottom: 10,
                    background: "#fffaf3",
                  }}
                >
                  <strong>Space Code:</strong> {space.spaceCode}
                </div>
              ))
            ) : (
              <p style={{ fontSize: 14, color: "#6b7280" }}>
                You haven&apos;t joined or created any space yet.
              </p>
            )}
          </div>

          {/* RIGHT: Actions */}
          <div
            style={{
              padding: 20,
              borderRadius: 20,
              border: "1px solid rgba(248, 187, 150, 0.55)",
              background: "#fffdf9",
              boxShadow: "0 10px 24px rgba(248, 187, 150, 0.18)",
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>
              Space actions
            </h2>

            {error && (
              <p style={{ fontSize: 13, color: "#b91c1c" }}>{error}</p>
            )}

            <button
              onClick={handleCreateSpace}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: 999,
                border: "none",
                background: "linear-gradient(135deg, #ff6b4a, #ff7b64)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                marginBottom: 10,
              }}
            >
              + Create New Space
            </button>

            <button
              onClick={handleJoinSpace}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid rgba(248, 187, 150, 0.9)",
                background: "#fffaf3",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Join Space with Code
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
