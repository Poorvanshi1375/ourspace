// src/ui/stickers.js — flat, die-cut stickers (white outline + soft shadow via .ui-sticker)
import React from "react";

const Tulip = () => (
  <svg viewBox="0 0 62 96" className="ui-sticker" aria-hidden="true">
    <g stroke="#fff" strokeWidth="3" strokeLinejoin="round">
      <path d="M31 92 C31 70 30 54 31 40" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
      <path d="M31 92 C31 70 30 54 31 40" fill="none" stroke="#5E8A49" strokeWidth="4" strokeLinecap="round" />
      <path d="M31 80 C14 76 8 62 10 52 C24 56 30 66 31 80z" fill="#7FAA62" />
      <path d="M33 86 C48 82 54 70 52 60 C40 64 34 72 33 86z" fill="#7FAA62" />
      <path d="M16 14 L24 24 L31 8 L38 24 L46 14 C50 30 44 44 31 44 C18 44 12 30 16 14z" fill="#EBA5B5" />
    </g>
  </svg>
);

const EvilEye = () => (
  <svg viewBox="0 0 64 64" className="ui-sticker" aria-hidden="true">
    <circle cx="32" cy="32" r="28" fill="#2F5FA8" stroke="#fff" strokeWidth="3" />
    <circle cx="32" cy="32" r="20" fill="#FBFAF8" />
    <circle cx="32" cy="32" r="13" fill="#7FB3E3" />
    <circle cx="32" cy="32" r="6" fill="#1D2433" />
    <circle cx="29" cy="29" r="2" fill="#fff" />
  </svg>
);

const Bow = () => (
  <svg viewBox="0 0 70 50" className="ui-sticker" aria-hidden="true">
    <g stroke="#fff" strokeWidth="3" strokeLinejoin="round" fill="#EFB3C2">
      <path d="M35 24 C24 6 6 6 6 18 C6 30 24 30 35 24z" />
      <path d="M35 24 C46 6 64 6 64 18 C64 30 46 30 35 24z" />
      <path d="M31 26 L20 46 L28 44 L33 30z" />
      <path d="M39 26 L50 46 L42 44 L37 30z" />
      <circle cx="35" cy="24" r="6" fill="#E592A6" />
    </g>
  </svg>
);

const Vinyl = () => (
  <svg viewBox="0 0 64 64" className="ui-sticker" aria-hidden="true">
    <circle cx="32" cy="32" r="28" fill="#1E1F1C" stroke="#fff" strokeWidth="3" />
    <circle cx="32" cy="32" r="21" fill="none" stroke="#3A3C36" strokeWidth="1.5" />
    <circle cx="32" cy="32" r="15" fill="none" stroke="#3A3C36" strokeWidth="1.5" />
    <circle cx="32" cy="32" r="9" fill="#B8D49E" />
    <circle cx="32" cy="32" r="2" fill="#1E1F1C" />
  </svg>
);

const Chai = () => (
  <svg viewBox="0 0 44 60" className="ui-sticker" aria-hidden="true">
    <path d="M6 10 H38 L34 54 H10z" fill="#EEF3F2" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
    <path d="M8 22 H36 L33.5 52 H10.5z" fill="#C88A4E" />
    <path d="M10 26 H34" stroke="#E7C29A" strokeWidth="2" />
  </svg>
);

const Stamp = () => (
  <svg viewBox="0 0 50 60" className="ui-sticker" aria-hidden="true">
    <rect x="3" y="3" width="44" height="54" fill="#FBFAF8" stroke="#fff" strokeWidth="3" />
    <rect x="3" y="3" width="44" height="54" fill="none" stroke="#C9D3BE" strokeWidth="3" strokeDasharray="3 3" />
    <rect x="10" y="10" width="30" height="30" fill="#E3EDD9" />
    <path d="M25 34 V18 M25 24 q-7 -2 -8 -8 q7 1 8 8z M25 22 q7 -2 8 -8 q-7 1 -8 8z" stroke="#4E7A3A" strokeWidth="2" fill="#84B067" />
  </svg>
);

const Daisy = () => (
  <svg viewBox="-30 -30 60 60" className="ui-sticker" aria-hidden="true">
    <g fill="#FBFAF8" stroke="#fff" strokeWidth="2">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
        <ellipse key={r} rx="7" ry="16" cy="-14" transform={`rotate(${r})`} />
      ))}
    </g>
    <g fill="none" stroke="#DDD9CF" strokeWidth="1">
      {[0, 90, 180, 270].map((r) => (
        <ellipse key={r} rx="7" ry="16" cy="-14" transform={`rotate(${r})`} />
      ))}
    </g>
    <circle r="8" fill="#E9C46A" />
  </svg>
);

const Heart = () => (
  <svg viewBox="0 0 24 22" className="ui-sticker" aria-hidden="true">
    <path d="M12 21s-7-4.6-9.3-9C1 8.6 3 5 6.5 5c2 0 3.5 1.2 5.5 3.5C14 6.2 15.5 5 17.5 5 21 5 23 8.6 21.3 12 19 16.4 12 21 12 21z" fill="#84B067" stroke="#fff" strokeWidth="1.5" />
  </svg>
);

const Lavender = () => (
  <svg viewBox="0 0 62 96" className="ui-sticker" aria-hidden="true">
    <g stroke="#fff" strokeWidth="3">
      <path d="M31 92 V30" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
      <path d="M31 92 V30" stroke="#6E8F5C" strokeWidth="3" strokeLinecap="round" />
      <g fill="#A79BD0">
        <ellipse cx="31" cy="12" rx="5" ry="7" />
        <ellipse cx="25" cy="22" rx="5" ry="7" />
        <ellipse cx="37" cy="22" rx="5" ry="7" />
        <ellipse cx="25" cy="34" rx="5" ry="7" />
        <ellipse cx="37" cy="34" rx="5" ry="7" />
        <ellipse cx="25" cy="46" rx="5" ry="7" />
        <ellipse cx="37" cy="46" rx="5" ry="7" />
      </g>
    </g>
  </svg>
);

const Sparkle = () => (
  <svg viewBox="0 0 50 50" className="ui-sticker" aria-hidden="true">
    <path d="M25 4 L28 20 L44 24 L28 28 L25 44 L22 28 L6 24 L22 20Z" fill="#84B067" stroke="#fff" strokeWidth="2" />
  </svg>
);

/* key -> { label, category, Component } ; the key is what an element stores in content.key */
export const STICKERS = {
  tulip: { label: "Tulip", category: "Florals", Component: Tulip },
  daisy: { label: "Daisy", category: "Florals", Component: Daisy },
  lavender: { label: "Lavender", category: "Florals", Component: Lavender },
  heart: { label: "Heart", category: "Hearts", Component: Heart },
  bow: { label: "Silk bow", category: "Hearts", Component: Bow },
  sparkle: { label: "Sparkle", category: "Hearts", Component: Sparkle },
  "evil-eye": { label: "Evil eye", category: "Travel & stamps", Component: EvilEye },
  stamp: { label: "Postage stamp", category: "Travel & stamps", Component: Stamp },
  chai: { label: "Chai glass", category: "Cafe", Component: Chai },
  vinyl: { label: "Vinyl", category: "Music", Component: Vinyl },
};

export const STICKER_CATEGORIES = ["All", ...new Set(Object.values(STICKERS).map((s) => s.category))];

export function Sticker({ name }) {
  const s = STICKERS[name] || STICKERS.heart;
  const C = s.Component;
  return <C />;
}
