import { els } from '../dom.js';
import { state } from '../state.js';
import { todayStr, getPunchDate } from '../dates.js';

export const getView = () => {
  const start = Math.max(0, Math.min(24 * 60, state.viewStartMin | 0));
  const end = Math.max(0, Math.min(24 * 60, state.viewEndMin | 0));
  const s = Math.min(start, end);
  const e = Math.max(start, end);
  const minutes = Math.max(1, e - s);
  return { start: s, end: e, minutes };
};

export const pxToMinutes = (clientX) => {
  const rect = els.track.getBoundingClientRect();
  const x = clientX - rect.left;
  const pct = Math.min(1, Math.max(0, x / rect.width));
  const view = getView();
  const mins = view.start + pct * view.minutes;
  return Math.max(view.start, Math.min(view.end, Math.round(mins)));
};

export const overlapsAny = (start, end, excludeId = null) => {
  const day = state.currentDate || todayStr();
  return state.punches.some(
    (p) => p.id !== excludeId && getPunchDate(p) === day && start < p.end && end > p.start
  );
};

export const nearestBounds = (forId) => {
  const day = state.currentDate || todayStr();
  const sorted = [...state.punches]
    .filter((p) => p.id !== forId && getPunchDate(p) === day)
    .sort((a, b) => a.start - b.start);
  return {
    leftLimitAt: (start) => {
      const leftNeighbor = [...sorted].filter((p) => p.end <= start).pop();
      return leftNeighbor ? leftNeighbor.end : getView().start;
    },
    rightLimitAt: (end) => {
      const rightNeighbor = [...sorted].find((p) => p.start >= end);
      return rightNeighbor ? rightNeighbor.start : getView().end;
    },
  };
};
