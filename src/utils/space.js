// src/utils/space.js
import { Timestamp } from "firebase/firestore";

/* Prefer the multi-space field, fall back to the legacy single-space one */
export const getActiveSpaceCode = (userData) =>
  userData?.activeSpaceCode || userData?.spaceCode || null;

/* "2025-04-18" -> local Date at midnight */
export const parseDateKey = (dateKey) => {
  if (!dateKey) return null;
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/* Timestamps covering one calendar day, plus noon (what new items are stamped with) */
export const dayRange = (dateKey) => {
  const day = parseDateKey(dateKey);
  if (!day) return null;
  const y = day.getFullYear();
  const m = day.getMonth();
  const d = day.getDate();
  return {
    start: Timestamp.fromDate(new Date(y, m, d, 0, 0, 0)),
    end: Timestamp.fromDate(new Date(y, m, d, 23, 59, 59, 999)),
    noon: Timestamp.fromDate(new Date(y, m, d, 12, 0, 0)),
  };
};
