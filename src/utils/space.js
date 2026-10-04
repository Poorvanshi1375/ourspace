// src/utils/space.js

/* Prefer the multi-space field, fall back to the legacy single-space one */
export const getActiveSpaceCode = (userData) =>
  userData?.activeSpaceCode || userData?.spaceCode || null;
