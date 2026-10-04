// src/pages/CameraPage.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../auth";
import { uploadMedia } from "../utils/cloudinary";
import { dayRange } from "../utils/space";

const CameraPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeSpaceCode: spaceCode } = useAuth();

  const selectedDateKey = location.state?.date || null;
  const mode = location.state?.mode || "photo";

  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");

  /* ───────── Date helper ───────── */
  const getCreatedAt = () =>
    selectedDateKey ? dayRange(selectedDateKey).noon : serverTimestamp();

  /* ───────── Upload helper ───────── */
  const uploadAndSave = async (file) => {
    if (!file) return;
    if (!spaceCode) {
      setError("Join or create a space first.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const { url, type } = await uploadMedia(file);

      await addDoc(collection(db, "memory_posts"), {
        spaceCode,
        sender_id: auth.currentUser.uid,
        type,
        media_url: url,
        text: caption || null,
        created_at: getCreatedAt(),
        is_deleted: false,
      });

      navigate("/dashboard");
    } catch (e) {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate(-1)}>← Back</button>

      <h2>
        {mode === "photo" ? "Capture Photo" : "Record Video"} for{" "}
        {selectedDateKey}
      </h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        placeholder="Caption (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <input
        type="file"
        accept={mode === "photo" ? "image/*" : "video/*"}
        onChange={(e) => uploadAndSave(e.target.files[0])}
        disabled={uploading}
      />
    </div>
  );
};

export default CameraPage;
