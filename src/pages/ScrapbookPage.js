import interact from "interactjs";
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../auth";
import { uploadMedia } from "../utils/cloudinary";
import { dayRange } from "../utils/space";

import ScrapbookChat from "../components/ScrapbookChat";
import ScrapbookMenu from "../components/ScrapbookMenu";

import AddTextModal from "../components/modals/AddTextModal";
import AddPhotoModal from "../components/modals/AddPhotoModal";
import AddVideoModal from "../components/modals/AddVideoModal";
import AddLetterModal from "../components/modals/AddLetterModal";
import AddDocumentModal from "../components/modals/AddDocumentModal";

/* random helper (for newly added items) */
const rand = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/* Stable fallback position for items saved without one, so they don't jump on every update */
const fallbackPosition = (id) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return {
    x: 80 + (h % 420),
    y: 80 + ((h >> 9) % 270),
    rotate: ((h >> 18) % 13) - 6,
  };
};

/* "note" is the legacy type written by the Notes page; it is the same thing as a letter */
const isLetter = (item) => item.type === "letter" || item.type === "note";

export default function ScrapbookPage() {
  const { date } = useParams();
  const { activeSpaceCode: spaceCode, loading: authLoading } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  // "text" | "photo" | "video" | "letter" | "document" | null

  const range = useMemo(() => dayRange(date), [date]);

  /* LOAD DATA — only this day's memories */
  useEffect(() => {
    if (authLoading) return;
    if (!spaceCode || !range) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "memory_posts"),
      where("spaceCode", "==", spaceCode),
      where("is_deleted", "==", false),
      where("created_at", ">=", range.start),
      where("created_at", "<=", range.end)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const memories = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            type: data.type || "text",
            position: data.position || fallbackPosition(d.id),
          };
        });

        setItems(memories);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load scrapbook:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [spaceCode, range, authLoading]);

  /* DRAG */
  useEffect(() => {
    interact(".scrap-item").draggable({
      listeners: {
        move(event) {
          const t = event.target;
          const x = (parseFloat(t.dataset.x) || 0) + event.dx;
          const y = (parseFloat(t.dataset.y) || 0) + event.dy;
          const r = parseFloat(t.dataset.rotate) || 0;

          t.dataset.x = x;
          t.dataset.y = y;
          t.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
        },
        end(event) {
          const id = event.target.dataset.id;
          if (!id) return;

          updateDoc(doc(db, "memory_posts", id), {
            position: {
              x: Number(event.target.dataset.x),
              y: Number(event.target.dataset.y),
              rotate: Number(event.target.dataset.rotate),
            },
          }).catch((e) => console.warn("Saving position failed", e));
        },
      },
    });

    return () => interact(".scrap-item").unset();
  }, []);

  /* RESIZE */
  useEffect(() => {
    interact(".scrap-item.media").resizable({
      edges: { right: true, bottom: true },
      modifiers: [
        interact.modifiers.restrictSize({
          min: { width: 120, height: 120 },
          max: { width: 520, height: 520 },
        }),
      ],
      listeners: {
        move(event) {
          const target = event.target;
          const width = event.rect.width;

          target.style.width = `${width}px`;
          target.dataset.width = width;
        },
        end(event) {
          const id = event.target.dataset.id;
          const width = Number(event.target.dataset.width);
          if (!id || !width) return;

          updateDoc(doc(db, "memory_posts", id), {
            size: { width },
          }).catch((e) => console.warn("Saving size failed", e));
        },
      },
    });

    return () => interact(".scrap-item.media").unset();
  }, []);

  /* ROTATE — update the element right away, then save */
  const rotateItem = (id, delta) => {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (!el) return;

    const x = Number(el.dataset.x) || 0;
    const y = Number(el.dataset.y) || 0;
    const next = (parseFloat(el.dataset.rotate) || 0) + delta;
    el.dataset.rotate = next;
    el.style.transform = `translate(${x}px, ${y}px) rotate(${next}deg)`;

    updateDoc(doc(db, "memory_posts", id), {
      position: { x, y, rotate: next },
    }).catch((e) => console.warn("Saving rotation failed", e));
  };

  /* DELETE — soft delete, so nothing is lost by accident */
  const deleteItem = async (item) => {
    try {
      await updateDoc(doc(db, "memory_posts", item.id), {
        is_deleted: true,
        deleted_at: Timestamp.now(),
      });

      if (isLetter(item) && item.noteId) {
        await updateDoc(doc(db, "notes", item.noteId), {
          is_deleted: true,
          updated_at: Timestamp.now(),
        });
      }
    } catch (e) {
      console.warn("Delete failed", e);
      alert("Couldn't delete that item. Please try again.");
      return;
    }

    setActiveId(null);
  };

  /* ADD ITEM */
  const addItem = async (payload) => {
    if (!spaceCode || !range) {
      alert("Scrapbook date missing");
      return;
    }

    const position = {
      x: rand(100, 450),
      y: rand(120, 320),
      rotate: rand(-6, 6),
    };

    const size =
      payload.type === "image" || payload.type === "video"
        ? { width: 220 }
        : null;

    await addDoc(collection(db, "memory_posts"), {
      ...payload,
      spaceCode,
      sender_id: auth.currentUser?.uid || null,
      created_at: range.noon,
      is_deleted: false,
      position,
      size,
    });
  };

  /* Upload any file and place it on the page */
  const addUploadedFile = async (file, caption) => {
    const { url, type, fileName } = await uploadMedia(file);
    await addItem({
      type,
      media_url: url,
      file_name: fileName,
      text: caption || null,
    });
  };

  if (authLoading || loading)
    return <div className="scrapbook-page">Loading…</div>;

  return (
    <>
      {/* HEADER */}
      <div className="scrapbook-header">
        <button
          className="scrapbook-menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <h2>{date}</h2>
      </div>

      {/* CANVAS */}
      <div className="scrapbook-page" onClick={() => setActiveId(null)}>
        <div className="scrapbook-canvas">
          {items.map((item) => (
            <div
              key={item.id}
              className={`scrap-item ${
                item.type === "image" ||
                item.type === "video" ||
                item.type === "document"
                  ? "media"
                  : ""
              } ${activeId === item.id ? "active" : ""}`}
              data-id={item.id}
              data-x={item.position.x}
              data-y={item.position.y}
              data-rotate={item.position.rotate}
              style={{
                transform: `translate(${item.position.x}px, ${item.position.y}px)
                            rotate(${item.position.rotate}deg)`,
                zIndex: item.type === "text" || isLetter(item) ? 40 : 10,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveId(item.id);
              }}
              onDoubleClick={() => setPreviewItem(item)}
            >
              {activeId === item.id && (
                <div className="scrap-controls">
                  <button
                    onClick={() => rotateItem(item.id, -5)}
                    aria-label="Rotate left"
                  >
                    ⟲
                  </button>
                  <button
                    onClick={() => rotateItem(item.id, 5)}
                    aria-label="Rotate right"
                  >
                    ⟳
                  </button>
                  <button
                    onClick={() => deleteItem(item)}
                    aria-label="Delete"
                  >
                    🗑
                  </button>
                </div>
              )}

              {item.type === "text" && (
                <div className="scrap-memory-text">{item.text}</div>
              )}

              {isLetter(item) && (
                <div className="scrap-memory-text note">
                  <strong>
                    {item.title || "Untitled Letter"}
                    <span className="note-dot" />
                  </strong>
                </div>
              )}

              {item.type === "image" && (
                <img
                  src={item.media_url}
                  alt={item.text || ""}
                  style={{ width: item.size?.width || 220 }}
                />
              )}

              {item.type === "video" && (
                <video
                  src={item.media_url}
                  controls
                  style={{ width: item.size?.width || 220 }}
                />
              )}

              {item.type === "document" && (
                <a
                  href={item.media_url}
                  target="_blank"
                  rel="noreferrer"
                  className="scrap-memory-text"
                >
                  📄 {item.file_name || "Open document"}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MENU */}
      <ScrapbookMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onChat={() => {
          setMenuOpen(false);
          setChatOpen(true);
        }}
        onAddText={() => {
          setMenuOpen(false);
          setActiveModal("text");
        }}
        onAddPhoto={() => {
          setMenuOpen(false);
          setActiveModal("photo");
        }}
        onAddVideo={() => {
          setMenuOpen(false);
          setActiveModal("video");
        }}
        onAddLetter={() => {
          setMenuOpen(false);
          setActiveModal("letter");
        }}
        onAddDocument={() => {
          setMenuOpen(false);
          setActiveModal("document");
        }}
      />

      {/* MODALS */}
      {activeModal === "text" && (
        <AddTextModal
          onClose={() => setActiveModal(null)}
          onSave={(text) => {
            // Text saves almost instantly and shows up right away, so close first
            setActiveModal(null);
            addItem({ type: "text", text }).catch((e) => {
              console.warn("Adding text failed", e);
              alert("Couldn't save that memory. Please try again.");
            });
          }}
        />
      )}

      {activeModal === "photo" && (
        <AddPhotoModal
          onClose={() => setActiveModal(null)}
          onSave={async (file, caption) => {
            await addUploadedFile(file, caption);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === "video" && (
        <AddVideoModal
          onClose={() => setActiveModal(null)}
          onSave={async (file) => {
            await addUploadedFile(file);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === "document" && (
        <AddDocumentModal
          onClose={() => setActiveModal(null)}
          onSave={async (file) => {
            await addUploadedFile(file);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === "letter" && (
        <AddLetterModal
          onClose={() => setActiveModal(null)}
          onSave={async (title, body) => {
            if (!spaceCode || !range) return;

            const user = auth.currentUser;
            if (!user) return;

            // 1️⃣ CREATE NOTE (THIS IS WHAT NOTES PAGE READS)
            const noteRef = await addDoc(collection(db, "notes"), {
              spaceCode,
              author_id: user.uid,
              title: title || "Untitled Letter",
              text: body,
              is_shared: true,
              created_at: range.noon,
              updated_at: Timestamp.now(),
              is_deleted: false,
            });

            // 2️⃣ CREATE SCRAPBOOK ITEM (VISUAL)
            await addItem({
              type: "letter",
              title,
              text: body,
              noteId: noteRef.id,
            });

            setActiveModal(null);
          }}
        />
      )}

      {/* PREVIEW */}
      {previewItem && (
        <div
          className="scrap-preview-overlay"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="scrap-preview-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="scrap-preview-close"
              onClick={() => setPreviewItem(null)}
              aria-label="Close preview"
            >
              ✕
            </button>

            {isLetter(previewItem) && (
              <>
                <h2>{previewItem.title || "Untitled Letter"}</h2>
                {previewItem.text ? (
                  <div className="scrap-note big">{previewItem.text}</div>
                ) : (
                  previewItem.noteId && (
                    <Link to={`/notes/${previewItem.noteId}`}>
                      Read this letter →
                    </Link>
                  )
                )}
              </>
            )}

            {previewItem.type === "text" && (
              <div className="scrap-note big">{previewItem.text}</div>
            )}

            {previewItem.type === "image" && (
              <img src={previewItem.media_url} alt={previewItem.text || ""} />
            )}

            {previewItem.type === "video" && (
              <video src={previewItem.media_url} controls autoPlay />
            )}
          </div>
        </div>
      )}

      {/* GLOBAL CHAT */}
      <ScrapbookChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
