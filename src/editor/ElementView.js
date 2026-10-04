// src/editor/ElementView.js — what one element looks like on a page
import React from "react";
import { Polaroid, StickyNote, LetterEnvelope, DateStamp, LocationChip, DocCard, Tape } from "../ui/paper";
import { Sticker } from "../ui/stickers";

/* Types whose box keeps its proportions when resized */
export const KEEPS_RATIO = new Set(["photo", "video", "sticker", "letter", "document", "stamp", "location"]);

export default function ElementView({ el, scale, editing, onEditDone }) {
  const c = el.content || {};

  if (editing && (el.type === "text" || el.type === "photo" || el.type === "video")) {
    const field = el.type === "text" ? "text" : "caption";
    return (
      <textarea
        autoFocus
        defaultValue={c[field] || ""}
        aria-label={el.type === "text" ? "Edit note" : "Edit caption"}
        onBlur={(e) => onEditDone({ ...c, [field]: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.currentTarget.blur();
        }}
        className="font-hand"
        style={{
          width: "100%",
          minHeight: 90 * scale,
          fontSize: 24 * scale,
          border: "1.5px dashed var(--pistachio-700)",
          background: "var(--paper)",
          padding: 8,
          boxSizing: "border-box",
          resize: "vertical",
          outline: "none",
        }}
      />
    );
  }

  switch (el.type) {
    case "photo":
      return <Polaroid src={c.mediaUrl} caption={c.caption} scale={scale} />;
    case "video":
      return <Polaroid src={c.mediaUrl} video caption={c.caption} scale={scale} />;
    case "text":
      return el.style?.variant === "sticky" ? (
        <StickyNote text={c.text} scale={scale} />
      ) : (
        <div
          className="font-hand"
          style={{
            fontSize: 26 * scale * (el.style?.size || 1),
            lineHeight: 1.1,
            color: el.style?.color || "var(--ink)",
            fontWeight: el.style?.bold ? 700 : 500,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {c.text}
        </div>
      );
    case "letter":
      return <LetterEnvelope title={c.title} subtitle="double-click to read" scale={scale} />;
    case "document":
      return <DocCard href={c.mediaUrl} name={c.fileName} scale={scale} />;
    case "sticker":
      return <Sticker name={c.key} />;
    case "tape":
      return (
        <div style={{ position: "relative", height: 24 * scale }}>
          <Tape solid={el.style?.pattern === "solid"} style={{ left: 0, top: 0, width: "100%", height: 24 * scale }} />
        </div>
      );
    case "stamp":
      return <DateStamp date={c.date} place={c.place} scale={scale} />;
    case "location":
      return <LocationChip label={c.label} scale={scale} />;
    default:
      return <StickyNote text={c.text || el.type} scale={scale} />;
  }
}
