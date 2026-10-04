// src/pages/TimelinePage.js — every dated spread from every book, by year and month
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import * as M from "../model";
import AppShell from "../ui/AppShell";
import { Polaroid, Tape } from "../ui/paper";
import { IconPrev, IconNext, IconHeartFill } from "../ui/icons";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayLabel = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

async function loadEntries(books) {
  const entries = [];
  for (const book of books) {
    const spreads = (await M.listSpreads(book.id)).filter((s) => s.date);
    for (const spread of spreads) {
      const els = await M.listElements(book.id, spread.id);
      entries.push({
        key: `${book.id}/${spread.id}`,
        book,
        spread,
        photos: els.filter((e) => e.type === "photo" && e.content?.mediaUrl),
        notes: els.filter((e) => e.type === "text" && (e.content?.text || "").trim()),
        letters: els.filter((e) => e.type === "letter"),
        videos: els.filter((e) => e.type === "video"),
      });
    }
  }
  return entries.sort((a, b) => b.spread.date.localeCompare(a.spread.date));
}

function Entry({ e, index }) {
  const quote = e.notes.map((n) => n.content.text.trim()).sort((a, b) => b.length - a.length)[0];
  const short = quote && quote.length > 160 ? `${quote.slice(0, 157)}…` : quote;
  return (
    <article style={{ position: "relative", paddingLeft: 56, marginTop: 22 }} data-entry={e.key}>
      <span aria-hidden="true" style={{ position: "absolute", left: 15, top: 34, width: 20, height: 20, borderRadius: 999, background: "var(--paper)", border: "4px solid var(--pistachio-700)", boxSizing: "border-box", zIndex: 1 }} />
      <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: "26px 28px", boxShadow: "0 10px 22px rgba(43,48,38,.07)", position: "relative", display: "flex", flexWrap: "wrap", gap: 28 }}>
        <Tape style={{ width: 90, right: 40, top: -11, transform: `rotate(${index % 2 ? 4 : -3}deg)` }} />
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span className="ui-chip" style={{ cursor: "default" }}>{dayLabel(e.spread.date)}</span>
            <span className="ui-chip" style={{ cursor: "default" }}>{e.book.title}</span>
            {e.spread.location && <span className="ui-chip" style={{ cursor: "default" }}>{e.spread.location}</span>}
          </div>
          <h3 className="font-title" style={{ margin: "14px 0 0", fontSize: 28, lineHeight: 1.1 }}>{e.spread.title || dayLabel(e.spread.date)}</h3>
          <p className="muted" style={{ margin: "8px 0 0", fontSize: 15 }}>
            {[
              e.photos.length && `${e.photos.length} photo${e.photos.length === 1 ? "" : "s"}`,
              e.videos.length && `${e.videos.length} video${e.videos.length === 1 ? "" : "s"}`,
              e.notes.length && `${e.notes.length} note${e.notes.length === 1 ? "" : "s"}`,
              e.letters.length && `${e.letters.length} letter${e.letters.length === 1 ? "" : "s"}`,
            ]
              .filter(Boolean)
              .join(" · ") || "an empty page, waiting"}
          </p>
          {short && (
            <p className="font-hand" style={{ margin: "14px 0 0", fontSize: 25, lineHeight: 1.15, color: "var(--pistachio-900)" }}>“{short}”</p>
          )}
          <Link to={`/books/${e.book.id}?spread=${e.spread.id}`} style={{ display: "inline-flex", marginTop: 14, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Open this spread →
          </Link>
        </div>
        {e.photos.length > 0 && (
          <div style={{ flex: "1 1 320px", display: "grid", gridTemplateColumns: `repeat(${Math.min(3, e.photos.length)}, minmax(0, 180px))`, justifyContent: "end", gap: 14, alignContent: "start" }}>
            {e.photos.slice(0, 3).map((p, i) => (
              <div key={p.id} style={{ transform: `rotate(${[-3, 2, -1][i]}deg)`, marginTop: i === 1 ? 14 : 0 }}>
                <Polaroid src={p.content.mediaUrl} caption={p.content.caption} scale={0.75} tape={false} />
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default function TimelinePage() {
  const { activeSpaceCode, loading } = useAuth();
  const [entries, setEntries] = useState(null);
  const [year, setYear] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !activeSpaceCode) return;
    let alive = true;
    M.listBooks(activeSpaceCode)
      .then(loadEntries)
      .then((list) => {
        if (!alive) return;
        setEntries(list);
        if (list.length) setYear(Number(list[0].spread.date.slice(0, 4)));
      })
      .catch((e) => {
        console.error(e);
        setError("Couldn't load the timeline.");
      });
    return () => {
      alive = false;
    };
  }, [activeSpaceCode, loading]);

  const years = useMemo(
    () => [...new Set((entries || []).map((e) => Number(e.spread.date.slice(0, 4))))].sort((a, b) => b - a),
    [entries]
  );
  const inYear = useMemo(() => (entries || []).filter((e) => Number(e.spread.date.slice(0, 4)) === year), [entries, year]);
  const byMonth = useMemo(() => {
    const m = new Map();
    inYear.forEach((e) => {
      const k = Number(e.spread.date.slice(5, 7)) - 1;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(e);
    });
    return [...m.entries()];
  }, [inYear]);
  const totals = useMemo(
    () => ({
      days: inYear.length,
      photos: inYear.reduce((n, e) => n + e.photos.length, 0),
      notes: inYear.reduce((n, e) => n + e.notes.length, 0),
      letters: inYear.reduce((n, e) => n + e.letters.length, 0),
    }),
    [inYear]
  );
  const yi = years.indexOf(year);

  return (
    <AppShell>
      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 32px 48px" }}>
        <h1 className="font-title" style={{ margin: 0, fontSize: 60, lineHeight: 1 }}>Timeline</h1>
        <p className="font-hand" style={{ margin: "8px 0 0", fontSize: 28, color: "var(--pistachio-800)" }}>
          every day you've kept, in order
        </p>
        {error && <p role="alert" style={{ color: "#a23b2c" }}>{error}</p>}

        {entries === null ? (
          <p className="muted" style={{ marginTop: 32 }}>Gathering your days…</p>
        ) : entries.length === 0 ? (
          <p className="font-hand" style={{ fontSize: 26, marginTop: 32 }}>
            nothing dated yet: give a spread a date in a book and it shows up here
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 36, marginTop: 32, alignItems: "flex-start" }}>
            <aside style={{ flex: "1 1 260px", maxWidth: 320 }}>
              <div className="ui-panel" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 className="font-title" style={{ margin: 0, fontSize: 28 }} data-testid="year">{year}</h2>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="ui-icon-btn" aria-label="Earlier year" disabled={yi >= years.length - 1} onClick={() => setYear(years[yi + 1])}><IconPrev size={16} /></button>
                    <button className="ui-icon-btn" aria-label="Later year" disabled={yi <= 0} onClick={() => setYear(years[yi - 1])}><IconNext size={16} /></button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 16 }}>
                  {[
                    [totals.days, totals.days === 1 ? "day kept" : "days kept"],
                    [totals.photos, "photos"],
                    [totals.notes, "notes"],
                    [totals.letters, "letters"],
                  ].map(([n, label]) => (
                    <div key={label} style={{ background: "var(--paper)", borderRadius: 14, padding: "12px 14px" }}>
                      <div className="font-title" style={{ fontSize: 28, color: "var(--pistachio-800)" }}>{n}</div>
                      <div className="muted" style={{ fontSize: 13 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div className="muted" style={{ fontSize: 12, letterSpacing: ".14em", fontWeight: 600, margin: "22px 0 8px" }}>JUMP TO</div>
                <nav aria-label="Months" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {byMonth.map(([m, list]) => (
                    <a key={m} href={`#month-${m}`} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, textDecoration: "none", color: "var(--ink)", fontSize: 15, background: "var(--paper)" }}>
                      {MONTHS[m]} <span className="muted" style={{ fontSize: 13 }}>{list.length}</span>
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div style={{ flex: "999 1 600px", minWidth: 0, position: "relative" }}>
              <div aria-hidden="true" style={{ position: "absolute", left: 24, top: 20, bottom: 70, borderLeft: "2.5px dashed var(--pistachio-400)" }} />
              {byMonth.map(([m, list], gi) => (
                <section key={m} id={`month-${m}`} style={{ marginTop: gi ? 40 : 0 }}>
                  <div style={{ paddingLeft: 56 }}>
                    <span className="font-title" style={{ display: "inline-block", padding: "6px 26px", fontSize: 24, backgroundColor: "rgba(200,220,180,.95)", backgroundImage: "radial-gradient(rgba(255,255,255,.9) 1.6px, transparent 2px)", backgroundSize: "10px 10px", transform: `rotate(${gi % 2 ? 1.5 : -2}deg)` }}>
                      {MONTHS[m]} {year}
                    </span>
                  </div>
                  {list.map((e, i) => (
                    <Entry key={e.key} e={e} index={i + gi} />
                  ))}
                </section>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 40, paddingLeft: 4 }}>
                <span style={{ width: 44, height: 44, borderRadius: 999, background: "var(--pistachio-700)", color: "#E3EDD9", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <IconHeartFill size={20} />
                </span>
                <div>
                  <div className="font-title" style={{ fontSize: 22 }}>{yi < years.length - 1 ? `more in ${years[yi + 1]}` : "where it all began"}</div>
                  <div className="font-hand muted" style={{ fontSize: 20 }}>more pages are on their way</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
