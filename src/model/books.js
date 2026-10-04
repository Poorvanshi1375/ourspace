// src/model/books.js
//
// Books -> spreads -> elements, plus gift links and recipient replies.
//
//   books/{bookId}                               one scrapbook or gift
//   books/{bookId}/spreads/{spreadId}            a two-page layout
//   books/{bookId}/spreads/{spreadId}/elements/{elementId}
//   books/{bookId}/replies/{replyId}             sticky notes from the recipient
//   gifts/{token}                                secret link -> bookId (readable without login)
//
// Access rules live in firestore.rules. Nothing is hard-deleted: is_deleted marks removal.

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { clamp01, clampPos } from "./geometry";

export const ELEMENT_TYPES = [
  "photo",
  "video",
  "document",
  "text",
  "sticker",
  "tape",
  "letter",
  "stamp",
  "location",
  "list",
  "song",
  "voice",
  "ticket",
];

export const BOOK_STATUS = { DRAFT: "draft", GIFTED: "gifted" };

/* ---------- references ---------- */

export const bookRef = (bookId) => doc(db, "books", bookId);
export const spreadsCol = (bookId) => collection(db, "books", bookId, "spreads");
export const spreadRef = (bookId, spreadId) => doc(db, "books", bookId, "spreads", spreadId);
export const elementsCol = (bookId, spreadId) =>
  collection(db, "books", bookId, "spreads", spreadId, "elements");
export const elementRef = (bookId, spreadId, elementId) =>
  doc(db, "books", bookId, "spreads", spreadId, "elements", elementId);
export const repliesCol = (bookId) => collection(db, "books", bookId, "replies");
export const giftRef = (token) => doc(db, "gifts", token);

const withId = (snap) => ({ id: snap.id, ...snap.data() });
const listOf = (snap) => snap.docs.map(withId);

/* ---------- books ---------- */

const booksQuery = (spaceCode) =>
  query(
    collection(db, "books"),
    where("spaceCode", "==", spaceCode),
    where("is_deleted", "==", false),
    orderBy("createdAt", "desc")
  );

export const subscribeBooks = (spaceCode, onChange, onError) =>
  onSnapshot(booksQuery(spaceCode), (snap) => onChange(listOf(snap)), onError);

export const listBooks = async (spaceCode) => listOf(await getDocs(booksQuery(spaceCode)));

export const getBook = async (bookId) => {
  const snap = await getDoc(bookRef(bookId));
  return snap.exists() ? withId(snap) : null;
};

export const createBook = async (
  spaceCode,
  uid,
  { title, recipient = null, occasion = null, theme = null, cover = null } = {}
) => {
  if (!spaceCode || !uid) throw new Error("createBook needs a space and a user");

  const ref = await addDoc(collection(db, "books"), {
    spaceCode,
    title: (title || "Untitled book").trim(),
    recipient, // { name, nickname }
    occasion, // "birthday" | "anniversary" | "trip" | ...
    theme: theme || { paper: "off-white" },
    cover, // { photoUrl, sticker }
    status: BOOK_STATUS.DRAFT,
    // gift link (see enableGift)
    giftEnabled: false,
    giftToken: null,
    unlockAt: null,
    allowReplies: false,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    is_deleted: false,
  });
  return ref.id;
};

const BOOK_EDITABLE = ["title", "recipient", "occasion", "theme", "cover", "status"];

export const updateBook = (bookId, patch) => {
  const clean = {};
  BOOK_EDITABLE.forEach((k) => {
    if (k in patch) clean[k] = patch[k];
  });
  return updateDoc(bookRef(bookId), { ...clean, updatedAt: serverTimestamp() });
};

export const deleteBook = (bookId) =>
  updateDoc(bookRef(bookId), { is_deleted: true, updatedAt: serverTimestamp() });

/* ---------- spreads ---------- */

const spreadsQuery = (bookId) =>
  query(spreadsCol(bookId), where("is_deleted", "==", false), orderBy("order", "asc"));

export const subscribeSpreads = (bookId, onChange, onError) =>
  onSnapshot(spreadsQuery(bookId), (snap) => onChange(listOf(snap)), onError);

export const listSpreads = async (bookId) => listOf(await getDocs(spreadsQuery(bookId)));

export const createSpread = async (
  bookId,
  uid,
  { title = "", date = null, location = null, template = "blank", order } = {}
) => {
  const ref = await addDoc(spreadsCol(bookId), {
    title,
    date, // "YYYY-MM-DD" or null
    location, // free text, e.g. "Mumbai"
    template,
    order: order ?? Date.now(), // ascending; reorder by writing a value between neighbours
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    is_deleted: false,
  });
  return ref.id;
};

export const updateSpread = (bookId, spreadId, patch) => {
  const clean = {};
  ["title", "date", "location", "template", "order"].forEach((k) => {
    if (k in patch) clean[k] = patch[k];
  });
  return updateDoc(spreadRef(bookId, spreadId), { ...clean, updatedAt: serverTimestamp() });
};

export const deleteSpread = (bookId, spreadId) =>
  updateDoc(spreadRef(bookId, spreadId), { is_deleted: true, updatedAt: serverTimestamp() });

/* ---------- elements ---------- */

/* Keep stored elements well-formed: known type, fractions on the page, sane rotation */
export const normalizeElement = (el) => {
  if (!ELEMENT_TYPES.includes(el.type)) throw new Error(`Unknown element type: ${el.type}`);
  return {
    type: el.type,
    page: el.page === "right" ? "right" : "left",
    x: clampPos(el.x),
    y: clampPos(el.y),
    w: clamp01(el.w ?? 0.3),
    h: el.h == null ? null : clamp01(el.h),
    rotate: Math.max(-180, Math.min(180, Number(el.rotate) || 0)),
    z: Number.isFinite(el.z) ? el.z : Date.now(),
    style: el.style || {}, // frame, font, color, ...
    content: el.content || {}, // text, mediaUrl, caption, noteId, ...
  };
};

const elementsQuery = (bookId, spreadId) =>
  query(elementsCol(bookId, spreadId), where("is_deleted", "==", false), orderBy("z", "asc"));

export const subscribeElements = (bookId, spreadId, onChange, onError) =>
  onSnapshot(elementsQuery(bookId, spreadId), (snap) => onChange(listOf(snap)), onError);

export const listElements = async (bookId, spreadId) =>
  listOf(await getDocs(elementsQuery(bookId, spreadId)));

export const addElement = async (bookId, spreadId, uid, element) => {
  const ref = await addDoc(elementsCol(bookId, spreadId), {
    ...normalizeElement(element),
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    is_deleted: false,
  });
  return ref.id;
};

/* Position / size / rotation / style / content changes; fractions are clamped */
export const updateElement = (bookId, spreadId, elementId, patch) => {
  const clean = {};
  ["x", "y"].forEach((k) => {
    if (k in patch) clean[k] = clampPos(patch[k]);
  });
  if ("w" in patch) clean.w = clamp01(patch.w);
  if ("h" in patch) clean.h = patch.h == null ? null : clamp01(patch.h);
  if ("rotate" in patch) clean.rotate = Math.max(-180, Math.min(180, Number(patch.rotate) || 0));
  if ("page" in patch) clean.page = patch.page === "right" ? "right" : "left";
  ["z", "style", "content"].forEach((k) => {
    if (k in patch) clean[k] = patch[k];
  });
  return updateDoc(elementRef(bookId, spreadId, elementId), {
    ...clean,
    updatedAt: serverTimestamp(),
  });
};

export const deleteElement = (bookId, spreadId, elementId) =>
  updateDoc(elementRef(bookId, spreadId, elementId), {
    is_deleted: true,
    updatedAt: serverTimestamp(),
  });

/* Undo for a delete */
export const restoreElement = (bookId, spreadId, elementId) =>
  updateDoc(elementRef(bookId, spreadId, elementId), {
    is_deleted: false,
    updatedAt: serverTimestamp(),
  });

/* ---------- gift links ---------- */

const randomToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

/*
 * Turn on the no-login gift link for a book. The link shows the LIVE book.
 * unlockAt (Date | null): before it, the link shows only the cover (pages stay locked).
 */
export const enableGift = async (book, { unlockAt = null, allowReplies = true } = {}) => {
  const token = book.giftToken || randomToken();

  await setDoc(giftRef(token), {
    bookId: book.id,
    spaceCode: book.spaceCode,
    createdAt: serverTimestamp(),
  });

  await updateDoc(bookRef(book.id), {
    giftEnabled: true,
    giftToken: token,
    unlockAt: unlockAt ? Timestamp.fromDate(unlockAt) : null,
    allowReplies,
    status: BOOK_STATUS.GIFTED,
    updatedAt: serverTimestamp(),
  });

  return token;
};

/* Turn the link off: the old token stops working immediately */
export const disableGift = async (book) => {
  if (book.giftToken) await deleteDoc(giftRef(book.giftToken));
  await updateDoc(bookRef(book.id), {
    giftEnabled: false,
    giftToken: null,
    updatedAt: serverTimestamp(),
  });
};

export const isUnlocked = (book, now = new Date()) =>
  !book.unlockAt || book.unlockAt.toDate() <= now;

/*
 * What the recipient's link opens (works without login).
 * Returns { book, locked, spreads } — spreads is [] while the time capsule is locked.
 */
export const openGift = async (token) => {
  const gift = await getDoc(giftRef(token));
  if (!gift.exists()) return null;

  const book = await getBook(gift.data().bookId);
  if (!book || !book.giftEnabled || book.is_deleted) return null;

  const locked = !isUnlocked(book);
  const spreads = locked ? [] : await listSpreads(book.id);
  return { book, locked, spreads };
};

/* ---------- replies (from the recipient) ---------- */

export const addReply = async (bookId, { spreadId = null, text = "", reaction = null, name = "" }) => {
  const ref = await addDoc(repliesCol(bookId), {
    spreadId,
    text: text.slice(0, 500),
    reaction, // e.g. "heart"
    name: name.slice(0, 60),
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const subscribeReplies = (bookId, onChange, onError) =>
  onSnapshot(
    query(repliesCol(bookId), orderBy("createdAt", "asc")),
    (snap) => onChange(listOf(snap)),
    onError
  );
