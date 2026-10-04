// src/pages/UploadMemoryPage.js
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../auth";
import { uploadMedia } from "../utils/cloudinary";
import { dayRange } from "../utils/space";

const rand = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export default function UploadMemoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDateKey = location.state?.date;
  const { activeSpaceCode: spaceCode } = useAuth();

  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* Correct created_at for scrapbook */
  const getCreatedAt = () =>
    selectedDateKey ? dayRange(selectedDateKey).noon : Timestamp.now();

  /* Save memory */
  const handleUpload = async () => {
    if (!spaceCode) {
      setError("Join or create a space first.");
      return;
    }
    if (!file) {
      setError("Please choose a file.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { url, type } = await uploadMedia(file);

      await addDoc(collection(db, "memory_posts"), {
        spaceCode,
        sender_id: auth.currentUser.uid,

        // 👇 IMPORTANT
        type,
        media_url: url,
        file_name: file.name,

        created_at: getCreatedAt(),
        is_deleted: false,

        // 👇 REQUIRED FOR SCRAPBOOK
        position: {
          x: rand(100, 450),
          y: rand(120, 320),
          rotate: rand(-6, 6),
        },

        size:
          type === "image" || type === "video"
            ? { width: 220 }
            : null,
      });


      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Upload failed. Check file type or size.");
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 500 }}>
      <h2>Upload memory for {selectedDateKey}</h2>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        accept="image/*,video/*,.pdf,.doc,.docx"
      />

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <button
        onClick={handleUpload}
        disabled={saving}
        style={{
          marginTop: 12,
          padding: "10px 16px",
          borderRadius: 10,
          background: "#111",
          color: "#fff",
          border: "none",
        }}
      >
        {saving ? "Uploading..." : "Save memory"}
      </button>
    </div>
  );
}
