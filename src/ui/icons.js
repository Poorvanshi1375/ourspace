// src/ui/icons.js — small stroke icons (currentColor)
import React from "react";

const Icon = ({ size = 18, children, fill = "none" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const IconBack = (p) => <Icon {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></Icon>;
export const IconPrev = (p) => <Icon {...p}><path d="M15 18l-6-6 6-6" /></Icon>;
export const IconNext = (p) => <Icon {...p}><path d="M9 18l6-6-6-6" /></Icon>;
export const IconUndo = (p) => <Icon {...p}><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></Icon>;
export const IconRedo = (p) => <Icon {...p}><path d="M15 14l5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h3" /></Icon>;
export const IconPlus = (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
export const IconCheck = (p) => <Icon {...p}><path d="M20 6L9 17l-5-5" /></Icon>;
export const IconTrash = (p) => <Icon {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></Icon>;
export const IconCopy = (p) => <Icon {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></Icon>;
export const IconForward = (p) => <Icon {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V6a2 2 0 0 1 2-2h10" /></Icon>;
export const IconPhoto = (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></Icon>;
export const IconText = (p) => <Icon {...p}><path d="M4 7V4h16v3M9 20h6M12 4v16" /></Icon>;
export const IconSticker = (p) => <Icon {...p}><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5z" /><path d="M15 3v6h6" /></Icon>;
export const IconTape = (p) => <Icon {...p}><rect x="2" y="8" width="20" height="8" rx="1" transform="rotate(-8 12 12)" /></Icon>;
export const IconMusic = (p) => <Icon {...p}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></Icon>;
export const IconDoodle = (p) => <Icon {...p}><path d="M3 17c3-3 5 3 8 0s5-9 10-6" /></Icon>;
export const IconMail = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Icon>;
export const IconEye = (p) => <Icon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Icon>;
export const IconGift = (p) => <Icon {...p}><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S9 8 12 8zm0 0c2-4 6-4 6-1.5S15 8 12 8z" /></Icon>;
export const IconPin = (p) => (
  <svg width={p?.size || 13} height={p?.size || 13} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
  </svg>
);
export const IconHeartFill = (p) => (
  <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 21s-7-4.6-9.3-9C1 8.6 3 5 6.5 5c2 0 3.5 1.2 5.5 3.5C14 6.2 15.5 5 17.5 5 21 5 23 8.6 21.3 12 19 16.4 12 21 12 21z" />
  </svg>
);

export const Logo = () => (
  <svg width="30" height="34" viewBox="0 0 30 34" aria-hidden="true">
    <rect x="3" y="2" width="24" height="30" rx="4" fill="#FBFAF8" stroke="#4E7A3A" strokeWidth="1.5" />
    <rect x="3" y="2" width="7" height="30" rx="3" fill="#84B067" />
    <path d="M19 12.5c-1.7-2.6-5.4 0-2.7 2.8L19 17.8l2.7-2.5c2.7-2.8-1-5.4-2.7-2.8z" fill="#4E7A3A" />
    <rect x="11" y="21" width="13" height="5" rx="1" fill="#D7E6C8" transform="rotate(-12 17 23)" />
  </svg>
);
