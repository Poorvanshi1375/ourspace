// src/pages/WelcomePage.js — the front door. Logged in -> straight into your space.
import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth";
import AuthLayout from "../ui/AuthLayout";

export default function WelcomePage() {
  const { user, loading } = useAuth();
  if (loading) return <div className="ui-root" />;
  if (user) return <Navigate to="/app" replace />;

  return (
    <AuthLayout title="Make memories they can almost hold" subtitle="a handmade-feeling scrapbook for your favourite people">
      <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
        Share a private space with the people you love. Fill books with polaroids, notes and stickers,
        seal letters until a special day, and send a book as a gift that opens like a real envelope.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <Link to="/signup" className="ui-btn ui-btn-primary">Create an account</Link>
        <Link to="/login" className="ui-btn ui-btn-outline">Log in</Link>
      </div>
      <div style={{ marginTop: 28, background: "var(--pistachio-50)", borderRadius: 14, padding: "14px 16px", fontSize: 14 }}>
        <b>Got a gift link?</b> Just open it: no account needed.
      </div>
      <ul style={{ margin: "22px 0 0", paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }} className="muted">
        <li>Each space is private and opens only with its code.</li>
        <li>Members can lock a space so no one new can join.</li>
      </ul>
    </AuthLayout>
  );
}
