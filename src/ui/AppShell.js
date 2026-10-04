// src/ui/AppShell.js — top navigation + page frame for the redesigned screens
import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Logo } from "./icons";
import "./ui.css";

const NAV = [
  { to: "/dashboard", label: "My Space" },
  { to: "/books", label: "Books" },
  { to: "/notes", label: "Letters" },
];

export default function AppShell({ children }) {
  return (
    <div className="ui-root">
      <header className="ui-nav">
        <div className="ui-nav-inner">
          <Link to="/books" className="ui-logo">
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
    </div>
  );
}
