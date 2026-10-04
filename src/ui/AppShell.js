// src/ui/AppShell.js — top navigation + page frame for the redesigned screens
import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Logo } from "./icons";
import ScrapbookChat from "../components/ScrapbookChat";
import "./ui.css";

const NAV = [
  { to: "/home", label: "My Space" },
  { to: "/books", label: "Books" },
  { to: "/timeline", label: "Timeline" },
  { to: "/letters", label: "Letters" },
];

export default function AppShell({ children }) {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <div className="ui-root">
      <header className="ui-nav">
        <div className="ui-nav-inner">
          <Link to="/home" className="ui-logo">
            <Logo />
            <span>OurSpace</span>
          </Link>
          <nav aria-label="Main" className="ui-nav-pills">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => `ui-nav-pill${isActive ? " active" : ""}`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      {children}
      {!chatOpen && (
        <button
          className="ui-btn ui-btn-primary"
          onClick={() => setChatOpen(true)}
          style={{ position: "fixed", right: 24, bottom: 24, boxShadow: "0 10px 24px rgba(43,48,38,.22)", zIndex: 50 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Our chat
        </button>
      )}
      <ScrapbookChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
