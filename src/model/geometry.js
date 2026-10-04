// src/model/geometry.js
// Elements store their position as fractions of ONE page (0 = left/top edge, 1 = right/bottom),
// so a spread looks the same at any screen size. PAGE is the logical size used to convert.

export const PAGE = { width: 620, height: 820 };

export const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));

/* Positions may overhang their page (a photo straddling the spine): -1 .. 1 */
export const clampPos = (n) => Math.min(1, Math.max(-1, Number(n) || 0));

/* Fractions -> pixels for a page rendered at `pageWidth` (height follows the page ratio) */
export const toPixels = (el, pageWidth = PAGE.width) => {
  const pageHeight = (pageWidth * PAGE.height) / PAGE.width;
  return {
    x: el.x * pageWidth,
    y: el.y * pageHeight,
    w: el.w * pageWidth,
    h: el.h == null ? null : el.h * pageHeight,
  };
};

/* Pixels on a page rendered at `pageWidth` -> fractions (clamped onto the page) */
export const toFractions = ({ x, y, w, h }, pageWidth = PAGE.width) => {
  const pageHeight = (pageWidth * PAGE.height) / PAGE.width;
  return {
    x: clamp01(x / pageWidth),
    y: clamp01(y / pageHeight),
    w: clamp01(w / pageWidth),
    h: h == null ? null : clamp01(h / pageHeight),
  };
};
