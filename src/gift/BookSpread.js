// src/gift/BookSpread.js — a read-only two-page spread (what the recipient sees)
import React from "react";
import { PAGE } from "../model";
import ElementView from "../editor/ElementView";

/* only = "left" | "right" shows a single page (phones); otherwise the whole spread */
export default function BookSpread({ elements, pageWidth, pageNumber = 1, onOpenLetter, only = null }) {
  const pw = pageWidth;
  const ph = (pw * PAGE.height) / PAGE.width;
  const scale = pw / PAGE.width;
  const sorted = [...elements]
    .filter((el) => !only || el.page === only)
    .sort((a, b) => (a.z || 0) - (b.z || 0));
  const offset = only === "right" ? pw : 0; // shift the right page to x = 0 when shown alone

  return (
    <div data-testid="gift-spread" style={{ position: "relative", width: only ? pw : pw * 2, height: ph, overflow: only ? "hidden" : "visible", borderRadius: only ? 12 : 0 }}>
      {(!only || only === "left") && <div className="ui-page left" style={{ left: 0, width: pw, height: ph }} />}
      {(!only || only === "right") && <div className="ui-page right" style={{ left: only ? 0 : pw, width: pw, height: ph }} />}
      {sorted.map((el, i) => {
        const gx = (el.page === "right" ? pw : 0) + el.x * pw - offset;
        const clickable = el.type === "letter";
        return (
          <div
            key={el.id}
            data-el={el.id}
            data-type={el.type}
            onClick={clickable ? () => onOpenLetter?.(el) : undefined}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={clickable ? (e) => e.key === "Enter" && onOpenLetter?.(el) : undefined}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: el.w * pw,
              transform: `translate(${gx}px, ${el.y * ph}px) rotate(${el.rotate || 0}deg)`,
              zIndex: i + 1,
              cursor: clickable ? "pointer" : "default",
            }}
          >
            <ElementView el={el.type === "letter" ? { ...el, content: { ...el.content } } : el} scale={scale} />
          </div>
        );
      })}
      {!only && <div className="ui-spine" style={{ left: pw - 30, height: ph }} />}
      {(!only || only === "left") && (
        <span className="muted" style={{ position: "absolute", left: 28 * scale, bottom: 18 * scale, fontSize: 11 * Math.max(scale, 0.8), letterSpacing: ".2em" }}>
          PAGE {pageNumber}
        </span>
      )}
      {(!only || only === "right") && (
        <span className="muted" style={{ position: "absolute", right: 28 * scale, bottom: 18 * scale, fontSize: 11 * Math.max(scale, 0.8), letterSpacing: ".2em" }}>
          PAGE {only ? pageNumber : pageNumber + 1}
        </span>
      )}
    </div>
  );
}
