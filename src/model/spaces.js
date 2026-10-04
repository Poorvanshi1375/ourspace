// src/model/spaces.js — private spaces, entered only with their code.
//
//   spaces/{code}   name, userIds, maxMembers, is_locked, created_at
//   users/{uid}     spaces: [{ spaceCode, role, joinedAt }], activeSpaceCode (+ legacy spaceCode)
//
// firestore.rules: only members read a space's books, letters and chat; joining can only add
// yourself, only while there is room and the space isn't locked.

import { arrayUnion, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I to misread
export const CODE_LENGTH = 10;

const newCode = () => {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
};

/* What people type: any case, with or without spaces or dashes */
export const normalizeCode = (raw) => (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/* 10-character codes read more easily in two halves: ABCDE-FGHJK */
export const formatCode = (code) => (code && code.length === 10 ? `${code.slice(0, 5)}-${code.slice(5)}` : code || "");

export const getSpace = async (code) => {
  const snap = await getDoc(doc(db, "spaces", code));
  return snap.exists() ? { code: snap.id, ...snap.data() } : null;
};

const userSpaces = (userData) =>
  Array.isArray(userData?.spaces)
    ? userData.spaces.map((s) => (typeof s === "string" ? { spaceCode: s } : s)).filter((s) => s?.spaceCode)
    : [];

/* All spaces the user belongs to (old single-space accounts included) */
export const spaceCodesOf = (userData) => {
  const list = userSpaces(userData).map((s) => s.spaceCode);
  if (!list.length && userData?.spaceCode) list.push(userData.spaceCode);
  return [...new Set(list)];
};

export const setActiveSpace = (uid, code) =>
  setDoc(doc(db, "users", uid), { activeSpaceCode: code, updatedAt: serverTimestamp() }, { merge: true });

export const createSpace = async ({ uid, email = null, name, maxMembers = 2 }) => {
  let code;
  do {
    code = newCode();
  } while (await getSpace(code)); // collisions are astronomically unlikely, but check anyway

  await setDoc(doc(db, "spaces", code), {
    spaceCode: code,
    name: (name || "").trim() || "Our space",
    userIds: [uid],
    maxMembers: Number(maxMembers) || 2,
    is_locked: false,
    created_at: serverTimestamp(),
  });

  const userRef = doc(db, "users", uid);
  const prev = userSpaces((await getDoc(userRef)).data());
  await setDoc(
    userRef,
    {
      id: uid,
      email,
      spaceCode: code, // legacy field, still read by older data
      roleInSpace: "creator",
      spaces: [...prev, { spaceCode: code, role: "creator", joinedAt: new Date() }],
      activeSpaceCode: code,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return code;
};

/*
 * Join with a code. Resolves to the code; rejects with a friendly message:
 * not found / locked / full.
 */
export const joinSpace = async ({ uid, rawCode }) => {
  const code = normalizeCode(rawCode);
  if (!code) throw new Error("Type the code you were given.");

  let space;
  try {
    space = await getSpace(code);
  } catch {
    space = null;
  }
  if (!space) throw new Error("No space found with that code. Check it with whoever shared it.");

  const userRef = doc(db, "users", uid);
  const prev = userSpaces((await getDoc(userRef)).data());
  const alreadyMember = (space.userIds || []).includes(uid);

  if (!alreadyMember) {
    if (space.is_locked) throw new Error("This space is locked: its members have closed it to new people.");
    if ((space.userIds || []).length >= (space.maxMembers || 2)) {
      throw new Error("This space is full.");
    }
    await updateDoc(doc(db, "spaces", code), { userIds: arrayUnion(uid) });
  }

  await setDoc(
    userRef,
    {
      spaceCode: code,
      roleInSpace: alreadyMember ? prev.find((s) => s.spaceCode === code)?.role || "member" : "member",
      spaces: prev.some((s) => s.spaceCode === code)
        ? prev
        : [...prev, { spaceCode: code, role: "member", joinedAt: new Date() }],
      activeSpaceCode: code,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return code;
};

/* Members can rename a space and lock / unlock it */
export const updateSpaceSettings = (code, { name, is_locked }) => {
  const patch = {};
  if (name !== undefined) patch.name = (name || "").trim() || "Our space";
  if (is_locked !== undefined) patch.is_locked = !!is_locked;
  return updateDoc(doc(db, "spaces", code), patch);
};
