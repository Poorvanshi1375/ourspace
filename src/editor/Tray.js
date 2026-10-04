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
  const [open, setOpen] = useState(true); // clicking the active tool again folds the panel away
  const current = TABS.find((t) => t.key === tab);
  const [category, setCategory] = useState("All");
  const fileRef = useRef(null);

  return (
    <aside aria-label="Add to spread" style={{ display: "flex", flex: "none", height: "100%", minHeight: 0, background: "var(--paper)", borderRight: "1px solid var(--line)" }}>
      <div role="tablist" aria-label="Tools" aria-orientation="vertical" style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 8px", width: 84, flex: "none", background: "var(--pistachio-50)", overflowY: "auto" }}>
        {TABS.map(({ key, label, Icon, soon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            disabled={soon}
            title={soon ? "Coming soon" : undefined}
            onClick={() => {
              if (key === tab) setOpen((o) => !o);
              else {
                setTab(key);
                setOpen(true);
              }
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "10px 4px",
              border: "none",
              borderRadius: 12,
              cursor: soon ? "not-allowed" : "pointer",
              opacity: soon ? 0.5 : 1,
              background: tab === key && open ? "var(--pistachio-700)" : tab === key ? "var(--pistachio-100)" : "transparent",
              color: tab === key && open ? "#fff" : "#3f443a",
              font: "500 11.5px var(--font-ui)",
              lineHeight: 1.15,
              textAlign: "center",
            }}
          >
            <Icon size={20} />
            {label}
            {soon && <span style={{ fontSize: 10 }}>soon</span>}
          </button>
        ))}
      </div>

      {open && (
      <div role="tabpanel" aria-label={current?.label} style={{ width: 252, flex: "none", overflowY: "auto", padding: "16px 16px 24px", display: "flex", flexWrap: "wrap", gap: 12, alignContent: "flex-start" }}>
        <h2 className="font-title" style={{ width: "100%", margin: "0 0 4px", fontSize: 22 }}>{current?.label}</h2>
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
            <button style={{ ...tileStyle, border: "2px dashed #c9d3be", background: "transparent", width: "100%", height: 120 }} onClick={() => fileRef.current?.click()} disabled={uploading}>
              <IconPlus size={22} />
              {uploading ? "Uploading…" : "Upload photos or videos"}
            </button>
            <span className="muted" style={{ fontSize: 13, lineHeight: 1.4 }}>
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
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
      )}
    </aside>
  );
}
