import { DAY_MIN, SNAP_MIN } from './config.js';

const clamp = (min) => Math.max(0, Math.min(DAY_MIN, Math.round(min)));
const snap = (min) => Math.max(0, Math.min(DAY_MIN, Math.round(min / SNAP_MIN) * SNAP_MIN));

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

export const time = { clamp, snap, toLabel, durationLabel, hourLabel };

