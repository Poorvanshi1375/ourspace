// src/editor/Tray.js — bottom tray: add photos, text, stickers and tape to the spread
import React, { useRef, useState } from "react";
import { STICKERS, STICKER_CATEGORIES } from "../ui/stickers";
import { IconPhoto, IconText, IconSticker, IconTape, IconMail, IconMusic, IconDoodle, IconPlus } from "../ui/icons";

const TABS = [
  { key: "photos", label: "Photos", Icon: IconPhoto },
  { key: "text", label: "Text & notes", Icon: IconText },
  { key: "stickers", label: "Stickers", Icon: IconSticker },
  { key: "tape", label: "Washi tape", Icon: IconTape },
  { key: "letters", label: "Letters", Icon: IconMail, soon: true },
  { key: "music", label: "Music & voice", Icon: IconMusic, soon: true },
  { key: "doodles", label: "Doodles", Icon: IconDoodle, soon: true },
];

const tileStyle = {
  width: 104,
  height: 104,
  borderRadius: 14,
  background: "var(--paper)",
  border: "1px solid var(--line)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  cursor: "pointer",
  font: "500 12px var(--font-ui)",
  color: "#3f443a",
  flex: "none",
};

export default function Tray({ onAdd, onUpload, uploading }) {
  const [tab, setTab] = useState("photos");
  const [category, setCategory] = useState("All");
  const fileRef = useRef(null);

  return (
    <section aria-label="Add to spread" style={{ background: "var(--paper)", borderTop: "1px solid var(--line)" }}>
      <div role="tablist" aria-label="Tools" style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "10px 24px", background: "var(--pistachio-50)" }}>
        {TABS.map(({ key, label, Icon, soon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            disabled={soon}
            title={soon ? "Coming soon" : undefined}
            onClick={() => setTab(key)}
            className="ui-btn"
            style={{
              minHeight: 40,
              padding: "8px 16px",
              background: tab === key ? "var(--pistachio-700)" : "transparent",
              color: tab === key ? "#fff" : "#3f443a",
              fontWeight: 500,
            }}
          >
            <Icon size={16} />
            {label}
            {soon && <span style={{ fontSize: 11, opacity: 0.8 }}>· soon</span>}
          </button>
        ))}
      </div>

      <div style={{ padding: "14px 24px 18px", display: "flex", gap: 12, overflowX: "auto", alignItems: "center", minHeight: 112 }}>
        {tab === "photos" && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={(e) => {
                onUpload([...e.target.files]);
                e.target.value = "";
              }}
            />
            <button style={{ ...tileStyle, border: "2px dashed #c9d3be", background: "transparent", width: 180 }} onClick={() => fileRef.current?.click()} disabled={uploading}>
              <IconPlus size={22} />
              {uploading ? "Uploading…" : "Upload photos or videos"}
            </button>
            <span className="muted" style={{ fontSize: 13 }}>
              They land on the left page as polaroids. Double-click a polaroid to write its caption.
            </span>
          </>
        )}

        {tab === "text" && (
          <>
            <button style={tileStyle} onClick={() => onAdd({ type: "text", w: 0.38, style: { variant: "sticky" }, content: { text: "write something sweet…" } })}>
              <span className="font-hand" style={{ fontSize: 22, background: "#e9f1dd", padding: "4px 10px" }}>note</span>
              Sticky note
            </button>
            <button style={tileStyle} onClick={() => onAdd({ type: "text", w: 0.5, style: { variant: "hand" }, content: { text: "a little caption" } })}>
              <span className="font-hand" style={{ fontSize: 24 }}>hello!</span>
              Handwriting
            </button>
            <button style={tileStyle} onClick={() => onAdd({ type: "text", w: 0.7, style: { variant: "hand", size: 1.6, bold: true, color: "var(--pistachio-900)" }, content: { text: "a big title" } })}>
              <span className="font-hand" style={{ fontSize: 26, fontWeight: 700, color: "var(--pistachio-900)" }}>Title</span>
              Big title
            </button>
            <button
              style={tileStyle}
              onClick={() => {
                const d = new Date();
                const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
                onAdd({ type: "stamp", w: 0.36, rotate: -7, content: { date: label, place: "" } });
              }}
            >
              <span style={{ border: "2px dashed var(--pistachio-700)", padding: "2px 6px", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: "var(--pistachio-900)" }}>★ DATE ★</span>
              Date stamp
            </button>
            <button style={tileStyle} onClick={() => onAdd({ type: "location", w: 0.34, rotate: -8, content: { label: "MUMBAI" } })}>
              <span className="ui-location" style={{ fontSize: 10, padding: "3px 8px" }}>PLACE</span>
              Location chip
            </button>
          </>
        )}

        {tab === "stickers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {STICKER_CATEGORIES.map((cat) => (
                <button key={cat} className={`ui-chip${category === cat ? " active" : ""}`} onClick={() => setCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
              {Object.entries(STICKERS)
                .filter(([, s]) => category === "All" || s.category === category)
                .map(([key, s]) => (
                  <button key={key} style={tileStyle} onClick={() => onAdd({ type: "sticker", w: 0.13, content: { key } })}>
                    <span style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <s.Component />
                    </span>
                    {s.label}
                  </button>
                ))}
            </div>
          </div>
        )}

        {tab === "tape" && (
          <>
            <button style={tileStyle} onClick={() => onAdd({ type: "tape", w: 0.28, rotate: -6, style: { pattern: "dots" } })}>
              <span className="ui-tape" style={{ position: "static", display: "block", width: 70 }} />
              Polka dots
            </button>
            <button style={tileStyle} onClick={() => onAdd({ type: "tape", w: 0.28, rotate: 5, style: { pattern: "solid" } })}>
              <span className="ui-tape solid" style={{ position: "static", display: "block", width: 70 }} />
              Pistachio
            </button>
          </>
        )}
      </div>
    </section>
  );
}
