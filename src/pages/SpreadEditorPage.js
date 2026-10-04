// src/pages/SpreadEditorPage.js — edit one book, one two-page spread at a time
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Moveable from "react-moveable";
import { useAuth } from "../auth";
import * as M from "../model";
import { uploadMedia } from "../utils/cloudinary";
import ElementView, { KEEPS_RATIO } from "../editor/ElementView";
import Tray from "../editor/Tray";
import {
  IconBack,
  IconUndo,
  IconRedo,
  IconPrev,
  IconNext,
  IconPlus,
  IconCheck,
  IconForward,
  IconCopy,
  IconTrash,
  IconEye,
  IconGift,
} from "../ui/icons";
import "../ui/ui.css";

const GUTTER = 56; // space beside the book for page edges and shadows

const pick = (el) => ({ page: el.page, x: el.x, y: el.y, w: el.w, rotate: el.rotate || 0, z: el.z || 0 });

export default function SpreadEditorPage() {
  const { bookId } = useParams();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [spreads, setSpreads] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pending, setPending] = useState(0);
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState({ w: 1200, h: 800 });

  // undo/redo lives in a ref (updaters must stay pure); `bump` re-renders the buttons
  const history = useRef({ undo: [], redo: [] });
  const [, bump] = useState(0);
  const frame = useRef(null);
  const moveableRef = useRef(null);
  const resizeObs = useRef(null);

  /* ---------- data ---------- */
  useEffect(() => {
    M.getBook(bookId)
      .then((b) => (b ? setBook(b) : setLoadError("This book doesn't exist, or you don't have access to it.")))
      .catch(() => setLoadError("This book doesn't exist, or you don't have access to it."));
    return M.subscribeSpreads(bookId, setSpreads, () =>
      setLoadError("This book doesn't exist, or you don't have access to it.")
    );
  }, [bookId]);

  const spreadId = params.get("spread") || spreads?.[0]?.id || null;
  const spreadIndex = spreads ? spreads.findIndex((s) => s.id === spreadId) : -1;
  const spread = spreadIndex > -1 ? spreads[spreadIndex] : null;

  useEffect(() => {
    if (!spreadId) return;
    setSelectedId(null);
    setEditingId(null);
    history.current = { undo: [], redo: [] };
    setElements([]);
    return M.subscribeElements(bookId, spreadId, setElements, (e) => console.error(e));
  }, [bookId, spreadId]);

  /* ---------- size: the book scales to the window ---------- */
  const stageRef = useCallback((node) => {
    if (resizeObs.current) resizeObs.current.disconnect();
    if (!node) return;
    resizeObs.current = new ResizeObserver(([entry]) =>
      setStage({ w: entry.contentRect.width, h: entry.contentRect.height })
    );
    resizeObs.current.observe(node);
  }, []);

  const byWidth = (stage.w - GUTTER * 2) / 2;
  const byHeight = ((stage.h - 56) * M.PAGE.width) / M.PAGE.height; // 56 = room for the toolbar below
  const pw = Math.max(240, Math.min(M.PAGE.width, byWidth, byHeight));
  const ph = (pw * M.PAGE.height) / M.PAGE.width;
  const scale = pw / M.PAGE.width;

  /* ---------- saving ---------- */
  const save = useCallback(async (promise) => {
    setPending((n) => n + 1);
    try {
      await promise;
      setSaveError("");
    } catch (e) {
      console.error(e);
      setSaveError("Couldn't save. Check your connection and try again.");
    } finally {
      setPending((n) => n - 1);
    }
  }, []);

  /* ---------- geometry: page fractions <-> pixels on the whole spread ---------- */
  const toGlobal = (el) => ({
    gx: (el.page === "right" ? pw : 0) + el.x * pw,
    gy: el.y * ph,
    w: el.w * pw,
    rotate: el.rotate || 0,
  });
  const fromGlobal = (gx, gy, w) => {
    const page = gx + w / 2 >= pw ? "right" : "left"; // the page holding the centre
    const lx = gx - (page === "right" ? pw : 0);
    return { page, x: M.clampPos(lx / pw), y: M.clampPos(gy / ph), w: M.clamp01(w / pw) };
  };

  const sorted = useMemo(() => [...elements].sort((a, b) => (a.z || 0) - (b.z || 0)), [elements]);
  const selected = elements.find((e) => e.id === selectedId) || null;
  const maxZ = elements.reduce((m, e) => Math.max(m, e.z || 0), 0);

  /* ---------- history ---------- */
  const push = (entry) => {
    history.current = { undo: [...history.current.undo.slice(-49), entry], redo: [] };
    bump((n) => n + 1);
  };
  const apply = (entry, direction) => {
    const back = direction === "undo";
    if (entry.kind === "change") {
      const patch = back ? entry.before : entry.after;
      setElements((list) => list.map((e) => (e.id === entry.id ? { ...e, ...patch } : e)));
      save(M.updateElement(bookId, spreadId, entry.id, patch));
    } else {
      const remove = (entry.kind === "add") === back; // undo add / redo delete -> remove
      save(remove ? M.deleteElement(bookId, spreadId, entry.id) : M.restoreElement(bookId, spreadId, entry.id));
      if (remove && selectedId === entry.id) setSelectedId(null);
    }
  };
  const undo = () => {
    const entry = history.current.undo.at(-1);
    if (!entry) return;
    history.current = { undo: history.current.undo.slice(0, -1), redo: [...history.current.redo, entry] };
    bump((n) => n + 1);
    apply(entry, "undo");
  };
  const redo = () => {
    const entry = history.current.redo.at(-1);
    if (!entry) return;
    history.current = { undo: [...history.current.undo, entry], redo: history.current.redo.slice(0, -1) };
    bump((n) => n + 1);
    apply(entry, "redo");
  };

  /* ---------- element actions ---------- */
  const changeElement = (el, patch) => {
    push({ kind: "change", id: el.id, before: pick(el), after: { ...pick(el), ...patch } });
    setElements((list) => list.map((e) => (e.id === el.id ? { ...e, ...patch } : e)));
    save(M.updateElement(bookId, spreadId, el.id, patch));
  };

  const addElement = async (partial) => {
    if (!spreadId || !user) return;
    const el = {
      page: "left",
      x: 0.1 + Math.random() * 0.4,
      y: 0.12 + Math.random() * 0.45,
      rotate: Math.round(Math.random() * 8) - 4,
      ...partial,
      z: maxZ + 1,
    };
    setPending((n) => n + 1);
    try {
      const id = await M.addElement(bookId, spreadId, user.uid, el);
      push({ kind: "add", id });
      setSelectedId(id);
    } catch (e) {
      console.error(e);
      setSaveError("Couldn't add that. Please try again.");
    } finally {
      setPending((n) => n - 1);
    }
  };

  const removeSelected = () => {
    if (!selected) return;
    push({ kind: "delete", id: selected.id });
    save(M.deleteElement(bookId, spreadId, selected.id));
    setSelectedId(null);
  };

  const duplicateSelected = () =>
    selected &&
    addElement({
      ...pick(selected),
      type: selected.type,
      style: selected.style,
      content: selected.content,
      x: Math.min(0.9, selected.x + 0.04),
      y: Math.min(0.9, selected.y + 0.04),
    });

  const onUpload = async (files) => {
    setUploading(true);
    try {
      for (const file of files) {
        const { url, type } = await uploadMedia(file);
        if (type !== "image" && type !== "video") continue;
        await addElement({ type: type === "image" ? "photo" : "video", w: 0.42, content: { mediaUrl: url, caption: "" } });
      }
    } catch (e) {
      setSaveError(e.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  /* ---------- spreads ---------- */
  const goTo = (i) => spreads?.[i] && setParams({ spread: spreads[i].id });
  const addSpread = async () => {
    const last = spreads[spreads.length - 1];
    const id = await M.createSpread(bookId, user.uid, { title: "New spread", order: (last?.order || 0) + 1 });
    setParams({ spread: id });
  };

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
      if (typing) return;
      const mod = e.ctrlKey || e.metaKey;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        removeSelected();
      } else if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // keep the handles on the element when its size changes (fonts, images loading, snapshots)
  useEffect(() => {
    moveableRef.current?.updateRect();
  }, [elements, pw, selectedId]);

  /* ---------- drag / resize / rotate ---------- */
  const startFrame = () => {
    const g = toGlobal(selected);
    frame.current = { translate: [g.gx, g.gy], width: g.w, rotate: g.rotate };
  };
  const paint = (target) => {
    const f = frame.current;
    target.style.width = `${f.width}px`;
    target.style.transform = `translate(${f.translate[0]}px, ${f.translate[1]}px) rotate(${f.rotate}deg)`;
  };
  const commit = () => {
    const f = frame.current;
    if (!f || !selected) return;
    const geo = fromGlobal(f.translate[0], f.translate[1], f.width);
    changeElement(selected, { ...geo, rotate: Math.round(f.rotate * 10) / 10 });
  };

  /* An open text box saves on blur; blur it before a click elsewhere unmounts it */
  const finishEditing = () => {
    if (editingId && document.activeElement?.tagName === "TEXTAREA") document.activeElement.blur();
  };

  /* ---------- render ---------- */
  if (loadError) {
    return (
      <div className="ui-root" style={{ display: "grid", placeItems: "center", padding: 40 }}>
        <div style={{ textAlign: "center" }}>
          <p className="font-hand" style={{ fontSize: 28 }}>{loadError}</p>
          <Link className="ui-btn ui-btn-outline" to="/books">Back to books</Link>
        </div>
      </div>
    );
  }
  if (!book || !spreads) {
    return <div className="ui-root" style={{ padding: 40 }}>Opening your book…</div>;
  }

  const target = selectedId && !editingId ? document.querySelector(`[data-el="${selectedId}"]`) : null;
  const selG = selected ? toGlobal(selected) : null;
  const selH = target ? target.offsetHeight : 0;
  const canUndo = history.current.undo.length > 0;
  const canRedo = history.current.redo.length > 0;

  return (
    <div className="ui-root" style={{ display: "flex", flexDirection: "column", height: "100vh", minHeight: 640 }}>
      {/* ---------- top bar ---------- */}
      <header style={{ background: "#fafbf7", borderBottom: "1px solid #e4e8dc" }}>
        <div style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <Link to="/books" aria-label="Back to books" className="ui-icon-btn" style={{ border: "1px solid var(--line)", borderRadius: 999, width: 44, height: 44, background: "var(--paper)" }}>
            <IconBack />
          </Link>
          <div style={{ minWidth: 0 }}>
            {spread ? (
              <input
                key={spread.id}
                defaultValue={spread.title}
                aria-label="Spread title"
                onBlur={(e) => e.target.value !== spread.title && save(M.updateSpread(bookId, spread.id, { title: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                className="font-title"
                style={{ fontSize: 26, border: "none", background: "transparent", color: "var(--ink)", padding: 0, outline: "none", width: 380, maxWidth: "60vw" }}
              />
            ) : (
              <div className="font-title" style={{ fontSize: 26 }}>{book.title}</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, flexWrap: "wrap" }}>
              {spread?.date && <span className="font-hand" style={{ fontSize: 20, color: "var(--pistachio-800)" }}>{spread.date.split("-").reverse().join("/")}</span>}
              <span className="muted">{book.title}</span>
              {saveError ? (
                <span role="alert" style={{ color: "#a23b2c", fontWeight: 600 }}>{saveError}</span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--pistachio-900)", background: "var(--pistachio-100)", padding: "2px 9px", borderRadius: 999, fontWeight: 600, fontSize: 12 }}>
                  {pending > 0 ? "Saving…" : (<><IconCheck size={12} /> Saved</>)}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 auto", flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: 2 }}>
              <button className="ui-icon-btn" aria-label="Undo" onClick={undo} disabled={!canUndo}><IconUndo /></button>
              <button className="ui-icon-btn" aria-label="Redo" onClick={redo} disabled={!canRedo}><IconRedo /></button>
            </div>
            <div style={{ display: "flex", alignItems: "center", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: 2 }}>
              <button className="ui-icon-btn" aria-label="Previous spread" onClick={() => goTo(spreadIndex - 1)} disabled={spreadIndex <= 0}><IconPrev /></button>
              <span style={{ fontSize: 14, fontWeight: 600, padding: "0 6px", whiteSpace: "nowrap" }}>
                Spread {spreadIndex + 1} <span className="muted" style={{ fontWeight: 400 }}>of {spreads.length}</span>
              </span>
              <button className="ui-icon-btn" aria-label="Next spread" onClick={() => goTo(spreadIndex + 1)} disabled={spreadIndex >= spreads.length - 1}><IconNext /></button>
            </div>
            <button className="ui-btn ui-btn-outline" onClick={addSpread}><IconPlus size={16} /> New spread</button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="ui-btn ui-btn-outline" disabled title="Arrives with the gift viewer"><IconEye size={16} /> Preview</button>
            <button className="ui-btn ui-btn-primary" disabled title="Arrives with the gift viewer"><IconGift size={16} /> Share gift</button>
          </div>
        </div>
      </header>

      {/* ---------- the book ---------- */}
      <main ref={stageRef} style={{ flex: 1, minHeight: 0, padding: "24px 0 32px", overflow: "auto" }}>
        {!spread ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <p className="font-hand" style={{ fontSize: 30 }}>This book has no pages yet.</p>
            <button className="ui-btn ui-btn-primary" onClick={addSpread}><IconPlus size={16} /> Add the first spread</button>
          </div>
        ) : (
          <div
            data-testid="spread"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget || e.target.dataset.page) {
                finishEditing();
                setSelectedId(null);
              }
            }}
            style={{ position: "relative", width: pw * 2, height: ph, margin: "0 auto" }}
          >
            <div className="ui-page left" data-page="left" style={{ left: 0, width: pw, height: ph }} />
            <div className="ui-page right" data-page="right" style={{ left: pw, width: pw, height: ph }} />
            <span className="muted" style={{ position: "absolute", left: 28 * scale, bottom: 18 * scale, fontSize: 11 * Math.max(scale, 0.8), letterSpacing: ".2em", pointerEvents: "none" }}>
              PAGE {spreadIndex * 2 + 1}
            </span>
            <span className="muted" style={{ position: "absolute", right: 28 * scale, bottom: 18 * scale, fontSize: 11 * Math.max(scale, 0.8), letterSpacing: ".2em", pointerEvents: "none" }}>
              PAGE {spreadIndex * 2 + 2}
            </span>

            {sorted.map((el, i) => {
              const g = toGlobal(el);
              return (
                <div
                  key={el.id}
                  data-el={el.id}
                  data-type={el.type}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (editingId && editingId !== el.id) finishEditing();
                    setSelectedId(el.id);
                  }}
                  onDoubleClick={() => {
                    if (el.type === "letter") setPreview(el);
                    else if (["text", "photo", "video"].includes(el.type)) setEditingId(el.id);
                  }}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: g.w,
                    transform: `translate(${g.gx}px, ${g.gy}px) rotate(${g.rotate}deg)`,
                    zIndex: i + 1,
                    cursor: editingId === el.id ? "text" : "grab",
                    userSelect: "none",
                    touchAction: "none",
                  }}
                >
                  <ElementView
                    el={el}
                    scale={scale}
                    editing={editingId === el.id}
                    onEditDone={(content) => {
                      setEditingId(null);
                      if (JSON.stringify(content) !== JSON.stringify(el.content)) {
                        setElements((list) => list.map((e) => (e.id === el.id ? { ...e, content } : e)));
                        save(M.updateElement(bookId, spreadId, el.id, { content }));
                      }
                    }}
                  />
                </div>
              );
            })}

            <div className="ui-spine" style={{ left: pw - 30, height: ph }} />

            {selected && !editingId && selG && (
              <div
                role="toolbar"
                aria-label="Selected item"
                style={{
                  position: "absolute",
                  left: Math.max(0, Math.min(selG.gx, pw * 2 - 180)),
                  top: Math.min(ph - 8, selG.gy + selH + 18),
                  zIndex: 100001,
                  display: "flex",
                  gap: 2,
                  background: "var(--ink)",
                  borderRadius: 12,
                  padding: 4,
                  boxShadow: "0 6px 16px rgba(0,0,0,.18)",
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button className="ui-icon-btn" style={{ color: "#fff" }} aria-label="Bring to front" title="Bring to front" onClick={() => changeElement(selected, { z: maxZ + 1 })}><IconForward size={16} /></button>
                <button className="ui-icon-btn" style={{ color: "#fff" }} aria-label="Duplicate" title="Duplicate" onClick={duplicateSelected}><IconCopy size={16} /></button>
                <button className="ui-icon-btn" style={{ color: "#f2a7a0" }} aria-label="Delete" title="Delete" onClick={removeSelected}><IconTrash size={16} /></button>
              </div>
            )}

            <Moveable
              ref={moveableRef}
              target={target}
              draggable
              resizable
              rotatable
              keepRatio={selected ? KEEPS_RATIO.has(selected.type) : false}
              renderDirections={selected && KEEPS_RATIO.has(selected.type) ? ["nw", "ne", "sw", "se"] : ["w", "e"]}
              origin={false}
              throttleRotate={1}
              onDragStart={({ set }) => {
                startFrame();
                set(frame.current.translate);
              }}
              onDrag={({ target: t, beforeTranslate }) => {
                frame.current.translate = beforeTranslate;
                paint(t);
              }}
              onDragEnd={({ lastEvent }) => lastEvent && commit()}
              onResizeStart={({ setOrigin, dragStart }) => {
                startFrame();
                setOrigin(["%", "%"]);
                dragStart && dragStart.set(frame.current.translate);
              }}
              onResize={({ target: t, width, drag }) => {
                frame.current.width = width;
                frame.current.translate = drag.beforeTranslate;
                paint(t);
              }}
              onResizeEnd={({ lastEvent }) => lastEvent && commit()}
              onRotateStart={({ set }) => {
                startFrame();
                set(frame.current.rotate);
              }}
              onRotate={({ target: t, beforeRotate }) => {
                frame.current.rotate = beforeRotate;
                paint(t);
              }}
              onRotateEnd={({ lastEvent }) => lastEvent && commit()}
            />
          </div>
        )}
      </main>

      {spread && <Tray onAdd={addElement} onUpload={onUpload} uploading={uploading} />}

      {/* ---------- reading a letter ---------- */}
      {preview && (
        <div role="dialog" aria-label="Letter" onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(43,48,38,.45)", display: "grid", placeItems: "center", zIndex: 200000, padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--paper)", backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 33px, #dce7d0 33px 34px)", maxWidth: 620, width: "100%", maxHeight: "80vh", overflow: "auto", padding: "28px 32px", borderRadius: 6, boxShadow: "0 30px 60px rgba(0,0,0,.25)" }}>
            <h2 className="font-title" style={{ margin: 0, fontSize: 30 }}>{preview.content?.title || "A letter"}</h2>
            <p className="font-hand" style={{ fontSize: 26, lineHeight: "34px", whiteSpace: "pre-wrap" }}>{preview.content?.text || "This letter's text lives in Letters."}</p>
            <div style={{ display: "flex", gap: 10 }}>
              {preview.content?.noteId && <Link className="ui-btn ui-btn-outline" to={`/notes/${preview.content.noteId}`}>Open in Letters</Link>}
              <button className="ui-btn ui-btn-primary" onClick={() => setPreview(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
