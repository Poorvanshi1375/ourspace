import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../auth";

/**
 * GLOBAL Scrapbook Chat
 * - Persists across all dates
 * - Firestore-backed
 * - Space-based
 */
export default function ScrapbookChat({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const { activeSpaceCode: spaceCode } = useAuth();
  const [contextMenu, setContextMenu] = useState(null);

  /* Listen to chat messages */
  useEffect(() => {
    if (!spaceCode) return;

    const q = query(
      collection(db, "scrapbook_chat", spaceCode, "messages"),
      orderBy("created_at", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, [spaceCode]);

  /* Send message */
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !spaceCode) return;

    setInput(""); // clear right away; the message shows instantly from the local write
    try {
      await addDoc(collection(db, "scrapbook_chat", spaceCode, "messages"), {
        text,
        sender: auth.currentUser?.uid,
        created_at: serverTimestamp(),
      });
    } catch (e) {
      console.error("Sending failed", e);
      setInput(text); // give the words back so nothing is lost
    }
  };

  /* Delete message */
  const deleteMessage = async (id) => {
    if (!spaceCode) return;

    await deleteDoc(
      doc(db, "scrapbook_chat", spaceCode, "messages", id)
    );

    setContextMenu(null);
  };

  if (!open) return null;

  return (
    <div
      onClick={() => setContextMenu(null)} // ✅ close menu on outside click
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 360,
        height: 460,
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          fontWeight: 600,
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--pistachio-50)",
          fontFamily: "var(--font-ui)",
        }}
      >
        <span className="font-title" style={{ fontSize: 20, fontWeight: 400 }}>Our chat</span>
        <button
          onClick={onClose}
          aria-label="Close chat"
          style={{
            border: "none",
            background: "transparent",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: 14,
          overflowY: "auto",
          fontSize: 14,
        }}
      >
        {messages.map((m) => {
          const mine = m.sender === auth.currentUser?.uid;

          return (
            <div
              key={m.id}
              style={{
                textAlign: mine ? "right" : "left",
                marginBottom: 8,
              }}
              onContextMenu={(e) => {
                if (!mine) return;
                e.preventDefault();

                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  messageId: m.id,
                });
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: 14,
                  background: mine ? "var(--pistachio-700)" : "var(--pistachio-50)",
                  color: mine ? "#fff" : "var(--ink)",
                  maxWidth: "80%",
                  cursor: mine ? "context-menu" : "default",
                }}
              >
                {m.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            zIndex: 10000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => deleteMessage(contextMenu.messageId)}
            style={{
              padding: "10px 14px",
              fontSize: 14,
              cursor: "pointer",
              color: "#e53935",
              whiteSpace: "nowrap",
            }}
          >
            🗑 Delete message
          </div>
        </div>
      )}

      {/* Input */}
      <div
        style={{
          display: "flex",
          borderTop: "1px solid #eee",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Write something…"
          style={{
            flex: 1,
            border: "none",
            padding: "12px",
            outline: "none",
            fontSize: 14,
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            border: "none",
            padding: "0 18px",
            background: "var(--pistachio-700)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
