#!/usr/bin/env node
/*
 * Phase 1 migration: copies each space's existing memories into one book.
 *
 *   space            -> books/memories-<spaceCode>   "Our memories"
 *   each day         -> spreads/day-YYYY-MM-DD       titled "18 Apr 2025"
 *   each memory post -> elements/<postId>            position turned into page fractions
 *
 * It only COPIES: memory_posts stay untouched (the old screens keep using them until
 * Phase 2 replaces those screens). A space that already has its migrated book is skipped,
 * so running it twice is safe; --force rebuilds those books (overwrites edits made since).
 * --add-new: for books that already exist, copy ONLY memories that aren't in the book yet
 * (new days get new spreads); existing elements and spreads are never touched, including
 * ones deleted in the editor.
 *
 * Needs admin access: serviceAccountKey.json in the project root (git-ignored), or
 * GOOGLE_APPLICATION_CREDENTIALS. Delete/revoke the key afterwards.
 *
 * Usage:
 *   node scripts/migrate-memories-to-books.js                 # dry run, all spaces
 *   node scripts/migrate-memories-to-books.js --space ABC123  # dry run, one space
 *   node scripts/migrate-memories-to-books.js --add-new       # dry run: only memories added since
 *   node scripts/migrate-memories-to-books.js --yes           # write
 */

const fs = require("fs");
const path = require("path");
const { initializeApp, cert, applicationDefault } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "ourspace-dev";
const TIME_ZONE = process.env.MIGRATION_TZ || "Asia/Kolkata";
const APPLY = process.argv.includes("--yes");
const FORCE = process.argv.includes("--force");
const ADD_NEW = process.argv.includes("--add-new");
const ONLY_SPACE = (() => {
  const i = process.argv.indexOf("--space");
  return i > -1 ? process.argv[i + 1] : null;
})();

// The old scrapbook was one wide canvas; treat it as a two-page spread of this size.
const PAGE_W = 620;
const PAGE_H = 620; // pages are square (see src/model/geometry.js)

const keyPath = path.join(__dirname, "..", "serviceAccountKey.json");
initializeApp({
  projectId: PROJECT_ID,
  credential: fs.existsSync(keyPath) ? cert(require(keyPath)) : applicationDefault(),
});
const db = getFirestore();

const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));

/* Same fallback the old scrapbook used for posts saved without a position */
const fallbackPosition = (id) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return { x: 80 + (h % 420), y: 80 + ((h >> 9) % 270), rotate: ((h >> 18) % 13) - 6 };
};

const dayKey = (date) => date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE }); // YYYY-MM-DD
const dayTitle = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
};

/* Old memory post -> new element fields */
const toElement = (post) => {
  const pos = post.position || fallbackPosition(post.id);
  const onRight = pos.x >= PAGE_W;
  const pageX = onRight ? pos.x - PAGE_W : pos.x;
  const type = post.type || "text";

  const base = {
    page: onRight ? "right" : "left",
    x: clamp01(pageX / PAGE_W),
    y: clamp01(pos.y / PAGE_H),
    h: null,
    rotate: Number(pos.rotate) || 0,
    style: {},
    createdBy: post.sender_id || null,
    createdAt: post.created_at || Timestamp.now(),
    updatedAt: Timestamp.now(),
    is_deleted: false,
    migratedFrom: post.id,
  };
  const mediaWidth = clamp01((post.size?.width || 220) / PAGE_W);

  switch (type) {
    case "image":
      return { ...base, type: "photo", w: mediaWidth, z: 10, content: { mediaUrl: post.media_url, caption: post.text || "" } };
    case "video":
      return { ...base, type: "video", w: mediaWidth, z: 10, content: { mediaUrl: post.media_url, caption: post.text || "" } };
    case "document":
      return { ...base, type: "document", w: 0.3, z: 20, content: { mediaUrl: post.media_url, fileName: post.file_name || "" } };
    case "letter":
    case "note":
      return { ...base, type: "letter", w: 0.3, z: 40, content: { noteId: post.noteId || null, title: post.title || "Untitled Letter", text: post.text || "" } };
    default:
      return { ...base, type: "text", w: 0.35, z: 40, content: { text: post.text || "" } };
  }
};

async function commitInBatches(writes) {
  for (let i = 0; i < writes.length; i += 450) {
    const batch = db.batch();
    writes.slice(i, i + 450).forEach(([ref, data]) => batch.set(ref, data));
    await batch.commit();
  }
}

async function migrateSpace(spaceDoc) {
  const code = spaceDoc.id;
  const bookRef = db.collection("books").doc(`memories-${code}`);

  const bookExists = (await bookRef.get()).exists;
  if (bookExists && !FORCE && !ADD_NEW) {
    console.log(`  ${code}: already migrated, skipped (--add-new copies only new memories)`);
    return { skipped: 1 };
  }
  const onlyNew = bookExists && ADD_NEW && !FORCE;

  const postsSnap = await db
    .collection("memory_posts")
    .where("spaceCode", "==", code)
    .where("is_deleted", "==", false)
    .get();
  let posts = postsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.created_at?.toDate);

  // --add-new: drop memories already copied (an element with the post's id exists in any spread)
  if (onlyNew) {
    const existing = new Set();
    const spreads = await bookRef.collection("spreads").get();
    for (const sp of spreads.docs) {
      (await sp.ref.collection("elements").select().get()).docs.forEach((d) => existing.add(d.id));
    }
    posts = posts.filter((p) => !existing.has(p.id));
    if (!posts.length) {
      console.log(`  ${code}: nothing new since the last migration`);
      return { skipped: 1 };
    }
  }

  if (!posts.length) {
    console.log(`  ${code}: no memories, nothing to do`);
    return { empty: 1 };
  }

  // group by day
  const days = new Map();
  posts.forEach((p) => {
    const key = dayKey(p.created_at.toDate());
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(p);
  });

  const members = spaceDoc.get("userIds") || [];
  const earliest = posts.reduce((a, p) => (p.created_at.toMillis() < a.toMillis() ? p.created_at : a), posts[0].created_at);
  const writes = [];

  if (!onlyNew) writes.push([
    bookRef,
    {
      spaceCode: code,
      title: "Our memories",
      recipient: null,
      occasion: null,
      theme: { paper: "off-white" },
      cover: null,
      status: "draft",
      giftEnabled: false,
      giftToken: null,
      unlockAt: null,
      allowReplies: false,
      createdBy: members[0] || null,
      createdAt: earliest,
      updatedAt: Timestamp.now(),
      is_deleted: false,
      source: "migration",
    },
  ]);

  for (const [key, dayPosts] of days) {
    const spreadRef = bookRef.collection("spreads").doc(`day-${key}`);
    const spreadMissing = !onlyNew || !(await spreadRef.get()).exists;
    if (spreadMissing) writes.push([
      spreadRef,
      {
        title: dayTitle(key),
        date: key,
        location: null,
        template: "blank",
        order: Date.parse(`${key}T12:00:00Z`),
        createdBy: members[0] || null,
        createdAt: dayPosts[0].created_at,
        updatedAt: Timestamp.now(),
        is_deleted: false,
      },
    ]);
    dayPosts.forEach((p) => writes.push([spreadRef.collection("elements").doc(p.id), toElement(p)]));
  }

  const types = posts.reduce((m, p) => ((m[p.type || "text"] = (m[p.type || "text"] || 0) + 1), m), {});
  console.log(
    `  ${code}: ${onlyNew ? "NEW ONLY: " : "book + "}${days.size} day(s) + ${posts.length} elements  (${Object.entries(types)
      .map(([t, n]) => `${n} ${t}`)
      .join(", ")})`
  );

  if (APPLY) await commitInBatches(writes);
  return { spreads: days.size, elements: posts.length, books: onlyNew ? 0 : 1 };
}

(async () => {
  console.log(APPLY ? "MIGRATING (writing)…\n" : "DRY RUN (nothing is written; add --yes to write)\n");

  const spaces = ONLY_SPACE
    ? [await db.collection("spaces").doc(ONLY_SPACE).get()].filter((s) => s.exists)
    : (await db.collection("spaces").get()).docs;

  console.log(`Spaces: ${spaces.length}`);
  const total = { books: 0, spreads: 0, elements: 0, skipped: 0, empty: 0 };
  for (const s of spaces) {
    const r = await migrateSpace(s);
    Object.keys(r).forEach((k) => (total[k] += r[k]));
  }

  console.log(
    `\nTotal: ${total.books} books, ${total.spreads} spreads, ${total.elements} elements` +
      ` · ${total.skipped} already migrated · ${total.empty} empty spaces`
  );
  console.log(APPLY ? "Done." : "Dry run complete. Run again with --yes to write.");
})().catch((err) => {
  if (/credential|Could not load the default credentials/i.test(err.message)) {
    console.error(
      "No Firebase admin credentials found. Save a service account key as serviceAccountKey.json\n" +
        "in the project root (Firebase Console → Project settings → Service accounts)."
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
