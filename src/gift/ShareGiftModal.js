// src/gift/ShareGiftModal.js — the creator sets up the gift page and its link
import React, { useEffect, useRef, useState } from "react";
import * as M from "../model";
import { uploadMedia } from "../utils/cloudinary";
import { IconPlus, IconTrash, IconCopy } from "../ui/icons";

const field = { display: "block", width: "100%", boxSizing: "border-box", font: "15px var(--font-ui)", padding: "9px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--paper)", marginTop: 4 };
const label = { display: "block", fontSize: 13, fontWeight: 600, marginTop: 14 };
const toDateInput = (ts) => {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const giftUrl = (token) => `${window.location.origin}/gift/${token}`;

export default function ShareGiftModal({ book, onClose, onSaved }) {
  const g = book.gift || {};
  const [on, setOn] = useState(book.giftEnabled || !book.giftToken);
  const [to, setTo] = useState(book.recipient?.name || "");
  const [from, setFrom] = useState(g.from || "");
  const [heading, setHeading] = useState(g.heading || "");
  const [forLine, setForLine] = useState(g.forLine || "");
  const [note, setNote] = useState(g.note || "");
  const [lockDate, setLockDate] = useState(toDateInput(book.unlockAt));
  // a brand-new gift lets the recipient reply; after that, keep what was chosen
  const [allowReplies, setAllowReplies] = useState(book.giftToken ? !!book.allowReplies : true);
  const [story, setStory] = useState(g.story?.length ? g.story : [{ when: "", text: "" }]);
  const [song, setSong] = useState(g.song || { title: "", artist: "", audioUrl: "" });
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState(book.giftEnabled ? book.giftToken : null);
  const [copied, setCopied] = useState(false);
  // what just happened, shown under the form: { kind: "created" | "updated" | "off", unlockAt }
  const [result, setResult] = useState(null);
  const [flash, setFlash] = useState(false);
  const resultRef = useRef(null);
  const onThisComputerOnly = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  useEffect(() => {
    if (result) resultRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [result]);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 2500);
    return () => clearTimeout(t);
  }, [flash]);

  const save = async () => {
    setError("");
    setResult(null);
    if (on && !to.trim()) return setError("Who is this gift for? Add their name.");
    let unlockAt = null;
    if (lockDate) {
      unlockAt = new Date(`${lockDate}T00:00:00`);
      if (on && unlockAt <= new Date()) unlockAt = null; // a past date means: open now
    }
    setBusy(true);
    try {
      const counts = await M.countBook(book.id);
      const gift = {
        heading: heading.trim(),
        from: from.trim(),
        forLine: forLine.trim(),
        note: note.trim(),
        story: story.map((s) => ({ when: s.when.trim(), text: s.text.trim() })).filter((s) => s.when || s.text),
        song: song.title.trim() ? { title: song.title.trim(), artist: song.artist.trim(), audioUrl: song.audioUrl || "" } : null,
        counts,
      };
      await M.updateBook(book.id, { recipient: { ...(book.recipient || {}), name: to.trim() }, gift });
      if (on) {
        const t = await M.enableGift({ ...book }, { unlockAt, allowReplies });
        setResult({ kind: token ? "updated" : "created", unlockAt });
        setToken(t);
        setCopied(false);
      } else {
        if (book.giftEnabled) await M.disableGift(book);
        setToken(null);
        setResult({ kind: "off" });
      }
      setFlash(true);
      onSaved?.();
    } catch (e) {
      console.error(e);
      setError("Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const uploadSong = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { url, type } = await uploadMedia(file);
      if (type !== "audio") throw new Error("That file isn't audio.");
      setSong((s) => ({ ...s, audioUrl: url }));
    } catch (e) {
      setError(e.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div role="dialog" aria-label="Share gift" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(43,48,38,.45)", display: "grid", placeItems: "center", zIndex: 200000, padding: 24 }}>
      <div ref={resultRef} onClick={(e) => e.stopPropagation()} style={{ background: "var(--paper)", width: "100%", maxWidth: 720, maxHeight: "90vh", overflow: "auto", borderRadius: 18, padding: "26px 30px", boxShadow: "0 30px 60px rgba(0,0,0,.25)" }}>
        <h2 className="font-title" style={{ margin: 0, fontSize: 32 }}>Share as a gift</h2>
        <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
          The link opens this book as a sealed envelope, no login needed. It shows the book as it is, so later edits show up too.
        </p>

        <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, fontSize: 15, fontWeight: 600 }}>
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
          Gift link is on
        </label>
        {token && on && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, background: "var(--pistachio-50)", borderRadius: 12, padding: "10px 12px" }}>
            <code data-testid="gift-link" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13 }}>{giftUrl(token)}</code>
            <button
              className="ui-btn ui-btn-outline"
              style={{ minHeight: 36, padding: "6px 14px" }}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(giftUrl(token));
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              <IconCopy size={14} /> {copied ? "Copied" : "Copy link"}
            </button>
            <a className="ui-btn ui-btn-outline" style={{ minHeight: 36, padding: "6px 14px" }} href={giftUrl(token)} target="_blank" rel="noreferrer">Preview</a>
          </div>
        )}

        {result && (
          <div role="status" data-testid="share-result" style={{ marginTop: 18, background: "var(--pistachio-50)", border: "1px solid #cfddbf", borderRadius: 14, padding: "16px 18px" }}>
            {result.kind === "off" ? (
              <>
                <div style={{ fontWeight: 700, color: "var(--pistachio-900)" }}>✓ Saved. The gift link is off.</div>
                <p style={{ margin: "6px 0 0", fontSize: 14 }}>
                  The old link no longer opens. Turn it back on any time and you'll get a new link to send.
                </p>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, color: "var(--pistachio-900)" }}>
                  ✓ {result.kind === "created" ? `Your gift for ${to.trim()} is ready.` : "Changes saved to the same link."}
                </div>
                <ol style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
                  <li><b>Copy the link</b> (the box just above).</li>
                  <li><b>Send it to {to.trim()}</b> however you like: WhatsApp, Instagram, email.</li>
                  <li>
                    They open it without logging in and see the sealed envelope
                    {result.unlockAt
                      ? `, with a countdown until ${result.unlockAt.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}. The pages unlock that day.`
                      : ", ready to open right away."}
                  </li>
                </ol>
                <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
                  Edits you make to the book later show up in the same link. Use Preview to see exactly what they'll see.
                </p>
              </>
            )}
            {onThisComputerOnly && result.kind !== "off" && (
              <p style={{ margin: "10px 0 0", fontSize: 13, color: "#7a5a1e", background: "#fbf3df", borderRadius: 8, padding: "8px 10px" }}>
                Heads up: the app is only running on this computer right now, so this link opens here but not for {to.trim() || "them"} yet.
                Once the app is online, links like this will work for them.
              </p>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0 18px" }}>
          <label style={label}>For (their name)<input style={field} value={to} onChange={(e) => setTo(e.target.value)} placeholder="Ishu" /></label>
          <label style={label}>From (your name)<input style={field} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Poorvanshi" /></label>
        </div>
        <label style={label}>Heading<input style={field} value={heading} onChange={(e) => setHeading(e.target.value)} placeholder={`a little something for your 20th, ${to || "Ishu"}`} /></label>
        <label style={label}>On the tag, "for:"<input style={field} value={forLine} onChange={(e) => setForLine(e.target.value)} placeholder="your 20th, with all my love" /></label>
        <label style={label}>
          A note before they open it
          <textarea style={{ ...field, minHeight: 90, fontFamily: "var(--font-hand)", fontSize: 21 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="make a chai, put your headphones on and take your time…" />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0 18px" }}>
          <label style={label}>
            Keep it sealed until (optional)
            <input type="date" style={field} value={lockDate} onChange={(e) => setLockDate(e.target.value)} aria-label="Sealed until" />
          </label>
          <label style={{ ...label, display: "flex", alignItems: "center", gap: 10, marginTop: 38 }}>
            <input type="checkbox" checked={allowReplies} onChange={(e) => setAllowReplies(e.target.checked)} />
            Let them leave notes and hearts
          </label>
        </div>

        <div style={{ ...label, marginTop: 20 }}>Our little story so far <span className="muted" style={{ fontWeight: 400 }}>(the last one is highlighted)</span></div>
        {story.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input aria-label={`Milestone ${i + 1} when`} style={{ ...field, width: 110, marginTop: 0 }} value={s.when} placeholder={i === story.length - 1 ? "today" : "2020"} onChange={(e) => setStory((list) => list.map((x, j) => (j === i ? { ...x, when: e.target.value } : x)))} />
            <input aria-label={`Milestone ${i + 1} what`} style={{ ...field, flex: 1, marginTop: 0 }} value={s.text} placeholder={i === story.length - 1 ? "you turn 20 ♡" : "met in 8th grade"} onChange={(e) => setStory((list) => list.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
            <button className="ui-icon-btn" aria-label={`Remove milestone ${i + 1}`} onClick={() => setStory((list) => list.filter((_, j) => j !== i))} disabled={story.length === 1}><IconTrash size={16} /></button>
          </div>
        ))}
        <button className="ui-btn ui-btn-outline" style={{ marginTop: 8, minHeight: 36, padding: "6px 14px" }} onClick={() => setStory((list) => [...list, { when: "", text: "" }])}>
          <IconPlus size={14} /> Add a milestone
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 18px" }}>
          <label style={label}>Song (optional)<input style={field} value={song.title} onChange={(e) => setSong((x) => ({ ...x, title: e.target.value }))} placeholder="short n' sweet" /></label>
          <label style={label}>Artist<input style={field} value={song.artist} onChange={(e) => setSong((x) => ({ ...x, artist: e.target.value }))} placeholder="Sabrina Carpenter" /></label>
        </div>
        <label style={label}>
          Audio file to play after the seal is broken (optional)
          <input type="file" accept="audio/*" style={{ ...field, padding: 8 }} onChange={(e) => uploadSong(e.target.files[0])} disabled={uploading} />
          <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>
            {uploading ? "Uploading…" : song.audioUrl ? "Audio attached ✓" : "Use music you have the right to share."}
          </span>
        </label>

        {error && <p role="alert" style={{ color: "#a23b2c", fontSize: 14 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="ui-btn ui-btn-primary" onClick={save} disabled={busy || uploading}>
            {busy ? "Saving…" : flash ? "Saved ✓" : on ? (token ? "Save changes" : "Create gift link") : "Save (link off)"}
          </button>
          <button className="ui-btn ui-btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
