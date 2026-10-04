import React, { useState } from "react";

export default function AddDocumentModal({ onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="scrap-preview-overlay">
      <div className="scrap-preview-card">
        <h3>Add Document</h3>

        <input
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: 10 }}
        />

        {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} disabled={loading}>
            Cancel
          </button>

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
