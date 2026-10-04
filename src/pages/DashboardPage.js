// src/pages/DashboardPage.js
import React, { useEffect, useState, useMemo } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { getCountFromServer } from "firebase/firestore";

/* ─────────────────────────────
   Date helpers
───────────────────────────── */
const makeKeyFromDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const formatPrettyDate = (d) =>
  d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/* ─────────────────────────────
   Dashboard
───────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [totalMemories, setTotalMemories] = useState(0);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const todayKey = makeKeyFromDate(new Date());
  const selectedDateKey = selectedDate
    ? makeKeyFromDate(selectedDate)
    : null;

  /* ───────── Load memories ───────── */
  useEffect(() => {
    let unsubscribe = null;

    const load = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists()) {
          setLoading(false);
          return;
        }

        const data = userSnap.data();

        const activeSpace =
          data.activeSpaceCode ||
          data.spaceCode || null;

        if (!activeSpace) {
          navigate("/");
          return;
        }

        /* 🔢 COUNT MEMORIES (SAFE & FAST) */
        const countQuery = query(
          collection(db, "memory_posts"),
          where("spaceCode", "==", activeSpace),
          where("is_deleted", "==", false)
        );


        const countSnap = await getCountFromServer(countQuery);
        setTotalMemories(countSnap.data().count);

        /* 📡 LIVE MEMORY LIST (FOR CALENDAR DOTS) */
        const q = query(
          collection(db, "memory_posts"),
          where("spaceCode", "==", activeSpace),
          where("is_deleted", "==", false),
          orderBy("created_at", "desc")
        );

        unsubscribe = onSnapshot(q, (snap) => {
          setMemories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        });
      } catch (err) {
        console.error("Dashboard load failed:", err);
        setLoading(false);
      }
    };

    load();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigate]);


  /* ───────── Calendar counts ───────── */
  const memoriesByDate = useMemo(() => {
    const map = {};
    memories.forEach((m) => {
      if (!m.created_at?.toDate) return;
      const k = makeKeyFromDate(m.created_at.toDate());
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [memories]);

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const start = first.getDay();
    const days = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < start; i++) cells.push(null);

    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month, d);
      const key = makeKeyFromDate(date);
      cells.push({
        date,
        key,
        count: memoriesByDate[key] || 0,
      });
    }
    return cells;
  }, [currentMonth, memoriesByDate]);

  /* ───────── Require date helper ───────── */
  const requireDate = (cb) => {
    if (!selectedDate) {
      alert("Please select a date first 💙");
      return;
    }
    cb();
  };

  if (loading) return <div>Loading your space…</div>;

  /* ─────────────────────────────
     RENDER
  ───────────────────────────── */
  return (
    <div className="planner-page">
      <div className="planner-inner">

        {/* Header */}
        <div className="planner-top-row">
          <div>
            <div className="planner-kicker">For my favourite person</div>
            <div className="planner-title">
              Our little timeline for{" "}
              <span className="planner-title-accent">you &amp; me.</span>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="planner-overview-grid">
          <div className="planner-mini-card">
            <div className="planner-mini-label">TODAY</div>
            <div className="planner-mini-main">
              {formatPrettyDate(new Date())}
            </div>
          </div>

          <div className="planner-mini-card">
            <div className="planner-mini-label">TOTAL MEMORIES</div>
            <div className="planner-mini-main">{totalMemories}</div>
          </div>

          <div className="planner-mini-card">
            <div className="planner-mini-label">SELECTED DAY</div>
            <div className="planner-mini-main">
              {selectedDate ? formatPrettyDate(selectedDate) : "None"}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="planner-actions">
          <button
            className="os-btn os-btn-primary"
            onClick={() => navigate("/books")}
          >
            📖 Our books (new)
          </button>

          <button
            className="os-btn os-btn-primary"
            onClick={() =>
              requireDate(() =>
                navigate("/memory/new", {
                  state: { date: selectedDateKey },
                })
              )
            }
          >
            ✨ Write memory
          </button>

          <button
            className="os-btn os-btn-soft"
            onClick={() =>
              requireDate(() =>
                navigate("/notes", {
                  state: { date: selectedDateKey },
                })
              )
            }
          >
            📚 Letters & notes
          </button>

          <button
            className="os-btn os-btn-soft"
            onClick={() =>
              requireDate(() =>
                navigate("/upload/memory", {
                  state: { date: selectedDateKey },
                })
              )
            }
          >
            📎 Upload memory
          </button>

          <button
            className="os-btn os-btn-outline"
            onClick={() =>
              requireDate(() =>
                navigate(`/scrapbook/${selectedDateKey}`)
              )
            }
          >
            📖 View Scrapbook
          </button>

          <button
            className="os-btn os-btn-soft"
            onClick={() =>
              requireDate(() =>
                navigate(`/gallery/${selectedDateKey}`)
              )
            }
          >
            🖼 View Gallery
          </button>

        </div>

        {/* Calendar */}
        <div className="planner-card">
          <div className="planner-calendar-header">
            <div className="planner-month-label">
              {currentMonth.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </div>
            <div>
              <button
                onClick={() => {
                  const d = new Date(currentMonth);
                  d.setMonth(d.getMonth() - 1);
                  setCurrentMonth(d);
                }}
              >
                ‹
              </button>
              <button
                onClick={() => {
                  const d = new Date(currentMonth);
                  d.setMonth(d.getMonth() + 1);
                  setCurrentMonth(d);
                }}
              >
                ›
              </button>
            </div>
          </div>

          <div className="planner-calendar-grid">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="planner-calendar-weekday">
                {d}
              </div>
            ))}

            {calendarCells.map((cell, i) =>
              cell ? (
                <button
                  key={cell.key}
                  className={`planner-calendar-cell ${
                    cell.key === todayKey ? "today" : ""
                  } ${
                    cell.key === selectedDateKey ? "selected" : ""
                  }`}
                  onClick={() => setSelectedDate(cell.date)}
                >
                  {cell.date.getDate()}
                  {cell.count > 0 && (
                    <span className="planner-day-dot">{cell.count}</span>
                  )}
                </button>
              ) : (
                <div key={i} />
              )
            )}
          </div>
        </div>

        {/* ───────── Us over the years ───────── */}
        <div className="planner-card" style={{ marginTop: "28px" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginBottom: "14px",
              color: "var(--os-navy)",
            }}
          >
            Us over the years 💙
          </div>

          <div
            style={{
              display: "flex",
              gap: "14px",
              overflowX: "auto",
              paddingBottom: "4px",
            }}
          >
            {[
              { label: "Year 1", routeDate: "2023-12-21" },
              { label: "Year 2", routeDate: "2024-12-21" },
              { label: "Year 3", routeDate: "2025-12-22" },
            ].map(({ label, routeDate }) => (
              <button
                key={label}
                onClick={() => navigate(`/scrapbook/${routeDate}`)}
                style={{
                  minWidth: "220px",
                  padding: "22px",
                  borderRadius: "18px",
                  border: "1px solid var(--os-card-border)",
                  background: "var(--os-card-bg)",
                  boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "var(--os-navy)",
                    marginBottom: "6px",
                  }}
                >
                  {label}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--os-muted-text)",
                  }}
                >
                  Open scrapbook →
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
