import React, { useState } from "react";

export default function AddTextModal({ onClose, onSave }) {
  const [text, setText] = useState("");

  return (
    <div className="scrap-preview-overlay">
      <div className="scrap-preview-card">
        <h3>Add Text Memory</h3>

        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write something..."
          style={{ width: "100%" }}
        />

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={() => {
              if (text.trim()) onSave(text.trim());
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
