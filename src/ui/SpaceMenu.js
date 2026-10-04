// src/ui/SpaceMenu.js — current space in the top bar: switch, settings (name, code, lock), log out
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import * as M from "../model";
import { IconCopy } from "./icons";

const LockIcon = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d={open ? "M8 11V7a4 4 0 0 1 7.5-2" : "M8 11V7a4 4 0 0 1 8 0v4"} />
  </svg>
);

export default function SpaceMenu() {
  const navigate = useNavigate();
  const { user, userDoc, activeSpaceCode, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [active, setActive] = useState(null);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");
  const ref = useRef(null);

  const codes = M.spaceCodesOf(userDoc).join(",");
  const load = () =>
    Promise.all((codes ? codes.split(",") : []).map((c) => M.getSpace(c).catch(() => null))).then((list) => {
      const ok = list.filter(Boolean);
      setSpaces(ok);
      const a = ok.find((s) => s.code === activeSpaceCode) || null;
      setActive(a);
      setName(a?.name || "");
    });
  useEffect(() => {
    load();
  }, [codes, activeSpaceCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const save = async (patch, message) => {
    setStatus("");
    try {
      await M.updateSpaceSettings(active.code, patch);
      await load();
      setStatus(message);
    } catch (e) {
      console.error(e);
      setStatus("Couldn't save that. Please try again.");
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="ui-btn ui-btn-outline"
        style={{ maxWidth: 260 }}
        data-testid="space-menu"
      >
        <span style={{ width: 26, height: 26, borderRadius: 999, background: "var(--pistachio-700)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, flex: "none" }}>
          {(active?.name || "S").trim().charAt(0).toUpperCase()}
        </span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{active?.name || "Your space"}</span>
        {active?.is_locked && <LockIcon />}
      </button>

      {open && (
        <div role="dialog" aria-label="Space settings" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 340, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "0 18px 40px rgba(43,48,38,.18)", padding: 16, zIndex: 1000 }}>
          {active && (
            <>
              <div className="muted" style={{ fontSize: 11, letterSpacing: ".16em", fontWeight: 700 }}>THIS SPACE</div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  save({ name }, "Name saved.");
                }}
                style={{ display: "flex", gap: 8, marginTop: 8 }}
              >
                <input aria-label="Space name" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1, minWidth: 0, font: "15px var(--font-ui)", padding: "8px 10px", borderRadius: 10, border: "1px solid var(--line)" }} />
                <button className="ui-btn ui-btn-outline" style={{ minHeight: 36, padding: "6px 12px" }} disabled={name.trim() === (active.name || "")}>Rename</button>
              </form>

              <div style={{ marginTop: 12, background: "var(--pistachio-50)", borderRadius: 12, padding: "10px 12px" }}>
                <div className="muted" style={{ fontSize: 12 }}>Code: the only way into this space</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <b data-testid="active-space-code" style={{ letterSpacing: ".1em", fontSize: 16, flex: 1 }}>{M.formatCode(active.code)}</b>
                  <button
                    className="ui-icon-btn"
                    aria-label="Copy code"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(active.code);
                        setCopied(true);
                      } catch {
                        setCopied(false);
                      }
                    }}
                  >
                    <IconCopy size={15} />
                  </button>
                </div>
                {copied && <div style={{ fontSize: 12, color: "var(--pistachio-900)" }}>Copied</div>}
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {(active.userIds || []).length} of {active.maxMembers || 2} members
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 12, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={!!active.is_locked}
                  onChange={(e) =>
                    save(
                      { is_locked: e.target.checked },
                      e.target.checked ? "Locked: no one new can join, even with the code." : "Unlocked: people with the code can join while there's room."
                    )
                  }
                  style={{ marginTop: 3 }}
                />
                <span>
                  <b>Lock this space</b>
                  <span className="muted" style={{ display: "block", fontSize: 12 }}>No one new can join, even with the code. Members stay.</span>
                </span>
              </label>
              {status && <p role="status" style={{ fontSize: 13, color: "var(--pistachio-900)", margin: "8px 0 0" }}>{status}</p>}
            </>
          )}

          {spaces.length > 1 && (
            <>
              <div className="muted" style={{ fontSize: 11, letterSpacing: ".16em", fontWeight: 700, marginTop: 16 }}>SWITCH SPACE</div>
              {spaces
                .filter((s) => s.code !== activeSpaceCode)
                .map((s) => (
                  <button
                    key={s.code}
                    onClick={async () => {
                      await M.setActiveSpace(user.uid, s.code);
                      setOpen(false);
                      navigate("/home");
                    }}
                    style={{ display: "block", width: "100%", textAlign: "left", marginTop: 6, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--paper)", cursor: "pointer", font: "14px var(--font-ui)", color: "var(--ink)" }}
                  >
                    {s.name || "Our space"}
                  </button>
                ))}
            </>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <button className="ui-btn ui-btn-outline" style={{ flex: 1, justifyContent: "center", minHeight: 38 }} onClick={() => navigate("/space")}>Create or join</button>
            <button className="ui-btn ui-btn-outline" style={{ minHeight: 38 }} onClick={async () => {
              await logout();
              // a full load of the welcome page, so no screen sees the old login for a moment
              window.location.assign("/");
            }}>Log out</button>
          </div>
        </div>
      )}
    </div>
  );
}
