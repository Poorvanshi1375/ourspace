// src/model/letters.js — letters ("notes") between people in a space.
//
//   notes/{noteId}                 title, author, shared or draft, dates
//   notes/{noteId}/sealed/body     the text of a SEALED letter (time capsule)
//
// An ordinary letter keeps its text on the note itself (as the older screens expect).
// A sealed letter keeps an empty `text` and stores the real text in sealed/body, which
// firestore.rules release to other members only once `openAt` has passed.

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

const notesCol = () => collection(db, "notes");
const bodyRef = (noteId) => doc(db, "notes", noteId, "sealed", "body");
const listOf = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

/* Shared letters in a space, newest first */
export const subscribeSharedLetters = (spaceCode, onChange, onError) =>
  onSnapshot(
    query(
      notesCol(),
      where("spaceCode", "==", spaceCode),
      where("is_deleted", "==", false),
      where("is_shared", "==", true),
      orderBy("created_at", "desc")
    ),
    (snap) => onChange(listOf(snap)),
    onError
  );

/* My private drafts in a space, newest first */
export const subscribeMyDrafts = (spaceCode, uid, onChange, onError) =>
  onSnapshot(
    query(
      notesCol(),
      where("spaceCode", "==", spaceCode),
      where("is_deleted", "==", false),
      where("author_id", "==", uid),
      where("is_shared", "==", false),
      orderBy("created_at", "desc")
    ),
    (snap) => onChange(listOf(snap)),
    onError
  );

export const isSealed = (note, now = new Date()) =>
  !!note.sealed && !!note.openAt && note.openAt.toDate() > now;

/*
 * Write a letter. openAt (Date | null): seal it until then (shared letters only).
 * Returns the new note id.
 */
export const createLetter = async ({ spaceCode, uid, title, text, isShared = true, openAt = null }) => {
  const ref = doc(notesCol());
  const sealed = !!(isShared && openAt);
  const batch = writeBatch(db);

  batch.set(ref, {
    spaceCode,
    author_id: uid,
    title: (title || "").trim() || "Untitled Letter",
    text: sealed ? "" : text,
    is_shared: isShared,
    sealed,
    openAt: sealed ? Timestamp.fromDate(openAt) : null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    is_deleted: false,
  });
  if (sealed) batch.set(bodyRef(ref.id), { text, created_at: serverTimestamp() });

  await batch.commit();
  return ref.id;
};

/* The letter's text, or { locked: true } while a sealed letter is still closed to this reader */
export const readLetterText = async (note) => {
  if (!note.sealed) return { text: note.text || note.body || "" };
  try {
    const snap = await getDoc(bodyRef(note.id));
    return { text: snap.exists() ? snap.data().text : "" };
  } catch (e) {
    if (e.code === "permission-denied") return { locked: true };
    throw e;
  }
};

/* Authors can remove their own letters (soft delete) */
export const deleteLetter = (noteId) =>
  updateDoc(doc(db, "notes", noteId), { is_deleted: true, updated_at: serverTimestamp() });
