import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import { dayRange, parseDateKey } from "../utils/space";

const MEDIA_TYPES = ["image", "video", "document"];

export default function GalleryPage() {
  const navigate = useNavigate();
  const { date } = useParams(); // YYYY-MM-DD (optional)
  const { activeSpaceCode: spaceCode, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const selectedDate = useMemo(() => parseDateKey(date), [date]);
  const range = useMemo(() => dayRange(date), [date]);

  /* ───────── Load gallery ───────── */
  useEffect(() => {
    if (authLoading) return;
    if (!spaceCode) {
      setError("No shared space found.");
      setLoading(false);
      return;
    }

    const constraints = [
      where("spaceCode", "==", spaceCode),
      where("is_deleted", "==", false),
    ];
    if (range) {
      constraints.push(
        where("created_at", ">=", range.start),
        where("created_at", "<=", range.end)
      );
    }

    const q = query(
      collection(db, "memory_posts"),
      ...constraints,
      orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setItems(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((m) => MEDIA_TYPES.includes(m.type))
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to load gallery.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [spaceCode, range, authLoading]);

  const formatDate = (ts) => {
    if (!ts?.toDate) return "";
    return ts.toDate().toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) return <div style={{ padding: 24 }}>Loading gallery…</div>;

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Header */}
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          marginBottom: 12,
          padding: "6px 12px",
          borderRadius: 999,
          border: "none",
          background: "#eee",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <h1 style={{ marginBottom: 6 }}>Gallery</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        {selectedDate ? (
          <>
            Memories from <strong>{selectedDate.toDateString()}</strong>
          </>
        ) : (
          "All photos, videos and documents"
        )}
      </p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {items.length === 0 ? (
        <p style={{ color: "#777" }}>
          No photos, videos or documents for this day 💭
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#fff",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              {/* MEDIA */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "3 / 4",
                  background: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.type === "image" && (
                  <img
                    src={item.media_url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}

                {item.type === "video" && (
                  <video
                    src={item.media_url}
                    muted
                    playsInline
                    controls
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}

                {item.type === "document" && (
                  <a
                    href={item.media_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#fff",
                      fontSize: 14,
                      textDecoration: "none",
                    }}
                  >
                    📄 Open document
                  </a>
                )}
              </div>

              {/* META */}
              <div style={{ padding: "8px 10px" }}>
                {item.text && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={item.text}
                  >
                    {item.text}
                  </p>
                )}
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 11,
                    color: "#888",
                  }}
                >
                  {formatDate(item.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
