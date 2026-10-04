import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";

function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    username: "",
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setForm({
          name: data.name || "",
          username: data.username || "",
          avatarUrl: data.avatar_url || "",
        });
      }
      setLoading(false);
    };

    loadProfile();
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        name: form.name,
        username: form.username,
        avatar_url: form.avatarUrl,
        updatedAt: new Date(),
      });
      setMessage("Profile updated ✔");
    } catch (err) {
      console.error(err);
      setMessage("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div style={{ maxWidth: 400 }}>
      <h2>Your Profile</h2>

      {form.avatarUrl && (
        <img
          src={form.avatarUrl}
          alt="avatar"
          style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", marginBottom: 10 }}
        />
      )}

      <form onSubmit={handleSave}>
        <label>
          Name
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
          />
        </label>
        <br />

        <label>
          Username
          <input
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
          />
        </label>
        <br />

        <label>
          Avatar URL (optional)
          <input
            name="avatarUrl"
            type="text"
            value={form.avatarUrl}
            onChange={handleChange}
          />
        </label>
        <br />

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </form>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
}

export default ProfilePage;
