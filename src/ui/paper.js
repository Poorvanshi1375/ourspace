// src/ui/paper.js — the physical-looking pieces scrapbook pages are made of.
// Sizes are relative: pass `scale` (rendered page width / 620) so a piece looks the
// same on a large or small screen.
import React from "react";
import { IconHeartFill, IconPin } from "./icons";

export function Tape({ style, solid = false }) {
  return <span className={`ui-tape${solid ? " solid" : ""}`} style={style} aria-hidden="true" />;
}

export function Polaroid({ src, video = false, caption, scale = 1, tape = true, alt = "" }) {
  return (
    <figure className="ui-polaroid" style={{ margin: 0 }}>
      {tape && (
        <Tape style={{ width: "38%", left: "31%", top: -11 * scale, height: 22 * scale, transform: "rotate(-3deg)" }} />
      )}
      <div className="ui-polaroid-photo">
        {video ? (
          <video src={src} muted playsInline preload="metadata" />
        ) : src ? (
          <img src={src} alt={alt || caption || ""} draggable="false" />
        ) : (
          <div style={{ aspectRatio: "4 / 3" }} />
        )}
      </div>
      <figcaption className="ui-polaroid-caption" style={{ fontSize: 24 * scale, minHeight: 18 * scale }}>
        {caption}
      </figcaption>
    </figure>
  );
}

export function StickyNote({ text, scale = 1 }) {
  return (
    <div className="ui-sticky" style={{ fontSize: 26 * scale }}>
      <Tape solid style={{ width: "34%", left: "33%", top: -10 * scale, height: 20 * scale }} />
      {text}
    </div>
  );
}

export function WaxSeal({ size = 44, children }) {
  return (
    <span className="ui-wax-seal" style={{ width: size, height: size }}>
      {children || (
        <span style={{ color: "#E3EDD9", display: "inline-flex" }}>
          <IconHeartFill size={size * 0.4} />
        </span>
      )}
    </span>
  );
}

/* A sealed letter as it sits on a page */
export function LetterEnvelope({ title, subtitle, scale = 1 }) {
  return (
    <div className="ui-envelope" style={{ aspectRatio: "5 / 3" }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "54%" }}
        aria-hidden="true"
      >
        <path d="M0 0 L50 100 L100 0Z" fill="#ECE9E2" />
        <path d="M0 0 L50 100 L100 0" fill="none" stroke="#D6D2C9" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <span style={{ position: "absolute", left: "50%", top: "54%", transform: "translate(-50%, -50%)" }}>
        <WaxSeal size={44 * scale} />
      </span>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "8%", textAlign: "center", padding: "0 8%" }}>
        <div className="font-title" style={{ fontSize: 17 * scale, lineHeight: 1.1 }}>
          {title || "a letter"} ♡
        </div>
        {subtitle && (
          <div className="font-hand muted" style={{ fontSize: 18 * scale, lineHeight: 1 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export function DateStamp({ date, place, scale = 1 }) {
  return (
    <div className="ui-date-stamp" style={{ fontSize: 13 * scale }}>
      <div>★ {date} ★</div>
      {place && <div style={{ fontSize: 10 * scale, letterSpacing: "0.24em", marginTop: 2 }}>{place}</div>}
    </div>
  );
}

export function LocationChip({ label, scale = 1 }) {
  return (
    <span className="ui-location" style={{ fontSize: 12 * scale }}>
      <IconPin size={13 * scale} />
      {label}
    </span>
  );
}

export function DocCard({ href, name, scale = 1 }) {
  return (
    <a className="ui-doc-card" href={href} target="_blank" rel="noreferrer" style={{ fontSize: 14 * scale }}>
      <svg width={22 * scale} height={22 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
      <span className="font-hand" style={{ fontSize: 22 * scale, lineHeight: 1.05 }}>
        {name || "a document"}
      </span>
    </a>
  );
}
