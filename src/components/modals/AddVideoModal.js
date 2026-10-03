// src/components/modals/AddVideoModal.js
import React, { useState } from "react";

export default function AddVideoModal({ onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="scrap-preview-overlay">
      <div className="scrap-preview-card">
        <h3>Add Video</h3>

        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files[0])}
        />

        {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button
            disabled={!file || loading}
            onClick={async () => {
              setLoading(true);
              setError("");
              try {
                await onSave(file);
              } catch (e) {
                setError(e.message || "Upload failed. Please try again.");
                setLoading(false);
              }
            }}
          >
            {loading ? "Uploading…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
