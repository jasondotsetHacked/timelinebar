import { DAY_MIN, SNAP_MIN } from './config.js';

const clamp = (min) => Math.max(0, Math.min(DAY_MIN, Math.round(min)));
// Snap to nearest interval (defaults to SNAP_MIN). Interval must be >= 1.
const snap = (min, interval = SNAP_MIN) => {
  const step = Math.max(1, Math.round(interval || SNAP_MIN));
  return Math.max(0, Math.min(DAY_MIN, Math.round(min / step) * step));
};

const toLabel = (mins) => {
  const m = clamp(mins);
  const h24 = Math.floor(m / 60) % 24;
  const mm = (m % 60).toString().padStart(2, '0');
  const ampm = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm}${ampm}`;
};

const durationLabel = (mins) => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}h${m}m`;
};

const hourLabel = (h) => {
  const ampm = h >= 12 ? 'pm' : 'am';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${ampm}`;
};

// Parse a wide range of time strings to minutes since midnight.
// Supported examples:
// - 9, 09, 9am, 9 am, 9:30, 9.30, 930, 0930
// - 2p, 2pm, 12am (00:00), 12pm (12:00)
// - 14, 14:15 (24h)
// Returns null when unparseable.
const parse = (input) => {
  if (input == null) return null;
  let s = String(input).trim().toLowerCase();
  if (!s) return null;
  // Normalize separators
  s = s.replace(/\u2013|\u2014|–|—/g, '-');
  // Extract am/pm if present
  let ampm = null;
  const mAm = s.match(/\b(a\.?m?\.?|am)\b/);
  const mPm = s.match(/\b(p\.?m?\.?|pm)\b/);
  if (mAm && mPm) return null; // conflicting
  if (mAm) ampm = 'am';
  if (mPm) ampm = 'pm';
  s = s.replace(/\b(a\.?m?\.?|am|p\.?m?\.?|pm)\b/g, '').trim();
  // Common forms:
  // h, hh, h:mm, hh:mm, h.mm, hh.mm, hmm, hhmm
  let h = 0, m = 0;
  const colon = s.match(/^\s*(\d{1,2})\s*[:\.]\s*(\d{1,2})\s*$/);
  if (colon) {
    h = Number(colon[1]); m = Number(colon[2]);
  } else {
    const compact = s.match(/^\s*(\d{1,4})\s*$/);
    if (!compact) return null;
    const raw = compact[1];
    if (raw.length <= 2) { h = Number(raw); m = 0; }
    else if (raw.length === 3) { h = Number(raw.slice(0,1)); m = Number(raw.slice(1)); }
    else { h = Number(raw.slice(0,2)); m = Number(raw.slice(2)); }
  }
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (m < 0 || m > 59) return null;
  // Interpret hour with am/pm or 24h fallback
  if (ampm === 'am') {
    if (h === 12) h = 0;
  } else if (ampm === 'pm') {
    if (h !== 12) h += 12;
  }
  // If no am/pm: accept 0..23 directly; for 1..12 we assume 24h-style if >12, else leave as-is
  if (ampm == null) {
    if (h < 0) return null;
    if (h > 24) return null;
  }
  let mins = h * 60 + m;
  if (mins < 0) mins = 0;
  if (mins > DAY_MIN) mins = DAY_MIN;
  return Math.round(mins);
};

export const time = { clamp, snap, toLabel, durationLabel, hourLabel, parse };
