import React, { useState } from "react";

export default function AddLetterModal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="scrap-preview-overlay">
      <div className="scrap-preview-card">
        <h3>Write a Letter</h3>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <textarea
          rows={6}
          placeholder="Your letter..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ width: "100%" }}
        />

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={() => {
              if (body.trim()) onSave(title || "Untitled", body.trim());
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
