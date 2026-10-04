import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import { dayRange } from "../utils/space";

const NotesListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, activeSpaceCode: spaceCode, loading: userLoading } = useAuth();

  const selectedDateKey =
    location.state?.date ||
    sessionStorage.getItem("notes:selectedDate") ||
    null;

  useEffect(() => {
    if (selectedDateKey) {
      sessionStorage.setItem("notes:selectedDate", selectedDateKey);
    }
  }, [selectedDateKey]);

  const [shared, setShared] = useState([]);
  const [mine, setMine] = useState([]);
  const [activeTab, setActiveTab] = useState("shared");

  const uid = user?.uid;

  /*
   * Two separate queries: shared letters, and MY drafts.
   * Other people's drafts are never requested, so they never reach this browser
   * (firestore.rules enforces the same thing on the server).
   */
  useEffect(() => {
    if (userLoading || !spaceCode || !uid) return;

    const dateConstraints = [];
    if (selectedDateKey) {
      const range = dayRange(selectedDateKey);
      dateConstraints.push(
        where("created_at", ">=", range.start),
        where("created_at", "<=", range.end)
      );
    }

    const base = [
      where("spaceCode", "==", spaceCode),
      where("is_deleted", "==", false),
    ];

    const sharedQ = query(
      collection(db, "notes"),
      ...base,
      where("is_shared", "==", true),
      ...dateConstraints,
      orderBy("created_at", "desc")
    );

    const mineQ = query(
      collection(db, "notes"),
      ...base,
      where("author_id", "==", uid),
      where("is_shared", "==", false),
      ...dateConstraints,
      orderBy("created_at", "desc")
    );

    const toList = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const onError = (err) => console.error("Failed to load letters:", err);

    const unsubShared = onSnapshot(sharedQ, (snap) => setShared(toList(snap)), onError);
    const unsubMine = onSnapshot(mineQ, (snap) => setMine(toList(snap)), onError);

    return () => {
      unsubShared();
      unsubMine();
    };
  }, [spaceCode, selectedDateKey, userLoading, uid]);

  if (userLoading) return <div>Loading notes...</div>;

  const list = activeTab === "shared" ? shared : mine;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: 20,
        minHeight: "100vh",
        overflowY: "auto",
      }}
    >
      <h2 style={{ textAlign: "center" }}>📚 Letters & Notes</h2>

      <Link to="/notes/new" state={{ date: selectedDateKey }}>
        + Write a New Letter
      </Link>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setActiveTab("shared")}>
          Shared ({shared.length})
        </button>
        <button onClick={() => setActiveTab("mine")}>
          My Drafts ({mine.length})
        </button>
      </div>

      {list.map((note) => (
        <div
          key={note.id}
          onClick={() =>
            navigate(`/notes/${note.id}`, {
              state: { date: selectedDateKey },
            })
          }
          style={{ border: "1px solid #ccc", padding: 15, marginTop: 10, cursor: "pointer" }}
        >
          <strong>{note.title || "Untitled Letter"}</strong>
        </div>
      ))}
    </div>
  );
};

export default NotesListPage;
