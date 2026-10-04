// src/ui/pageTurn.js — turn a book's pages like a real book: swipe, trackpad scroll, arrow keys, page corners
import React, { useCallback, useEffect, useRef, useState } from "react";

const SWIPE_MIN = 60; // px of sideways travel that counts as a swipe
const WHEEL_MIN = 70; // accumulated scroll that turns a page
const FLIP_MS = 620;

const typing = () => ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;

/*
 * usePageTurn({ canNext, canPrev, onNext, onPrev, front, wheelVertical, swipeFrom, keys })
 *   front(dir)       -> what is on the page being turned (drawn on the flipping sheet)
 *   wheelVertical    -> a plain mouse wheel turns pages too (only while nothing scrolls)
 *   swipeFrom(event) -> false to ignore a swipe that starts there (e.g. on an item being dragged)
 *   keys()           -> false while arrow keys belong to something else
 * Returns { ref, turn, flip, endFlip }: put `ref` on the area that listens for swipes and scrolls.
 */
export function usePageTurn(opts) {
  const latest = useRef(opts);
  latest.current = opts;
  const [node, setNode] = useState(null);
  const [flip, setFlip] = useState(null);

  const turn = useCallback((dir) => {
    const o = latest.current;
    if (dir === "next" ? !o.canNext : !o.canPrev) return false;
    setFlip({ dir, id: Date.now(), front: o.front ? o.front(dir) : null });
    dir === "next" ? o.onNext() : o.onPrev();
    return true;
  }, []);
  const endFlip = useCallback((id) => setFlip((f) => (f && f.id === id ? null : f)), []);

  // trackpad swipes and scrolling
  useEffect(() => {
    if (!node) return;
    let acc = 0;
    let quietUntil = 0;
    let reset;
    const onWheel = (e) => {
      if (e.ctrlKey) return; // pinch zoom
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      let d;
      if (sideways) d = e.deltaX;
      else if (latest.current.wheelVertical && node.scrollHeight <= node.clientHeight + 1) d = e.deltaY;
      else return;
      e.preventDefault(); // also stops the browser's swipe-to-go-back
      const now = performance.now();
      if (now < quietUntil) {
        quietUntil = Math.max(quietUntil, now + 180); // let a trackpad's momentum die out: one swipe, one page
        return;
      }
      acc += d;
      clearTimeout(reset);
      reset = setTimeout(() => (acc = 0), 220);
      if (Math.abs(acc) >= WHEEL_MIN) {
        turn(acc > 0 ? "next" : "prev");
        acc = 0;
        quietUntil = now + 450;
      }
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", onWheel);
      clearTimeout(reset);
    };
  }, [node, turn]);

  // finger or mouse swipes: drag the page left for the next one, right for the previous
  useEffect(() => {
    if (!node) return;
    let start = null;
    const onDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const ok = latest.current.swipeFrom ? latest.current.swipeFrom(e) : true;
      start = ok ? { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId } : null;
    };
    const onUp = (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const quick = performance.now() - start.t < 900;
      start = null;
      if (!quick || Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (turn(dx < 0 ? "next" : "prev")) {
        // the swipe ended on the page: don't let it also count as a click on whatever is under it
        const swallow = (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        window.addEventListener("click", swallow, { capture: true, once: true });
        setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
      }
    };
    const onCancel = () => (start = null);
    node.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      node.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [node, turn]);

  // arrow keys
  useEffect(() => {
    const onKey = (e) => {
      if (typing() || e.altKey || e.ctrlKey || e.metaKey) return;
      if (latest.current.keys && !latest.current.keys()) return;
      if (e.key === "ArrowRight" && turn("next")) e.preventDefault();
      else if (e.key === "ArrowLeft" && turn("prev")) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn]);

  return { ref: setNode, turn, flip, endFlip };
}

/*
 * The sheet that turns over the spine. On a spread the right page swings to the left (next)
 * or the left page to the right (prev); on a single page (phones) the page peels away.
 */
export function PageFlip({ flip, pw, ph, single = false, onDone }) {
  if (!flip) return null;
  const next = flip.dir === "next";
  const left = single ? 0 : next ? pw : 0;
  const origin = single ? (next ? "left center" : "right center") : next ? "left center" : "right center";
  const anim = single ? (next ? "ui-peel-next" : "ui-peel-prev") : next ? "ui-flip-next" : "ui-flip-prev";
  const face = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    overflow: "hidden",
    borderRadius: next ? "3px 12px 12px 3px" : "12px 3px 3px 12px",
    background: "var(--paper)",
  };
  return (
    <div
      key={flip.id}
      aria-hidden="true"
      onAnimationEnd={() => onDone(flip.id)}
      style={{
        position: "absolute",
        left,
        top: 0,
        width: pw,
        height: ph,
        zIndex: 6000,
        pointerEvents: "none",
        transformOrigin: origin,
        transformStyle: "preserve-3d",
        animation: `${anim} ${FLIP_MS}ms cubic-bezier(.45,.05,.35,1) both`,
      }}
    >
      <div style={face}>
        {flip.front}
        <div style={{ position: "absolute", inset: 0, animation: `ui-flip-shade ${FLIP_MS}ms ease-in both`, background: next ? "linear-gradient(to left, rgba(43,48,38,0) 40%, rgba(43,48,38,.18))" : "linear-gradient(to right, rgba(43,48,38,0) 40%, rgba(43,48,38,.18))" }} />
      </div>
      <div style={{ ...face, transform: "rotateY(180deg)", borderRadius: next ? "12px 3px 3px 12px" : "3px 12px 12px 3px", backgroundImage: "linear-gradient(135deg, rgba(132,176,103,.05), transparent 60%)" }} />
    </div>
  );
}

/* Folded page corners at the outer bottom edges; click one to turn the page */
export function PageCorners({ pw, ph, single = false, canNext, canPrev, onTurn }) {
  const size = Math.max(26, Math.min(42, pw * 0.07));
  const corner = (side) => ({
    position: "absolute",
    top: ph - size,
    left: side === "right" ? (single ? pw : pw * 2) - size : 0,
    width: size,
    height: size,
    border: "none",
    padding: 0,
    cursor: "pointer",
    zIndex: 5000,
    background: side === "right"
      ? "linear-gradient(135deg, transparent 50%, #e9ecdf 50%, #dfe4d3 70%, #f4f6ee 100%)"
      : "linear-gradient(225deg, transparent 50%, #e9ecdf 50%, #dfe4d3 70%, #f4f6ee 100%)",
    borderRadius: side === "right" ? "0 0 12px 0" : "0 0 0 12px",
    filter: "drop-shadow(-1px -1px 1px rgba(43,48,38,.12))",
  });
  return (
    <>
      {canPrev && <button className="ui-page-corner" aria-label="Turn the page back" title="Turn the page back" onClick={() => onTurn("prev")} style={corner("left")} />}
      {canNext && <button className="ui-page-corner" aria-label="Turn the page forward" title="Turn the page forward" onClick={() => onTurn("next")} style={corner("right")} />}
    </>
  );
}

export const PAGE_TURN_HINT = "swipe, scroll sideways or use ← → to turn the page";

export default function PageTurnHint({ style }) {
  return (
    <p className="muted" style={{ margin: 0, fontSize: 12, textAlign: "center", ...style }}>
      {PAGE_TURN_HINT}
    </p>
  );
}
