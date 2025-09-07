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
  // Determine which schedule to check overlaps against:
  // - If editing/moving an existing item (excludeId present), use that item's schedule.
  // - Else use the currently selected schedule if any.
  // - Else fall back to first known schedule (same logic used on create).
  let schedId = null;
  if (excludeId != null) {
    const base = state.punches.find((x) => x.id === excludeId);
    if (base && base.scheduleId != null) schedId = Number(base.scheduleId);
  }
  if (schedId == null) {
    if (state.currentScheduleId != null) schedId = Number(state.currentScheduleId);
    else {
      const first = state.schedules?.[0]?.id;
      if (first != null) schedId = Number(first);
    }
  }
  return state.punches.some(
    (p) => p.id !== excludeId
      && getPunchDate(p) === day
      && (schedId == null || Number(p.scheduleId) === schedId)
      && start < (p.end || 0)
      && end > (p.start || 0)
  );
};

export const nearestBounds = (forId) => {
  const day = state.currentDate || todayStr();
  const base = state.punches.find((x) => x.id === forId);
  const schedId = base && base.scheduleId != null ? Number(base.scheduleId) : null;
  const sorted = [...state.punches]
    .filter((p) => p.id !== forId && getPunchDate(p) === day && (schedId == null || Number(p.scheduleId) === schedId))
    .sort((a, b) => a.start - b.start);
  return {
    leftLimitAt: (start) => {
      const leftNeighbor = [...sorted].filter((p) => (p.end || 0) <= start).pop();
      return leftNeighbor ? (leftNeighbor.end || getView().start) : getView().start;
    },
    rightLimitAt: (end) => {
      const rightNeighbor = [...sorted].find((p) => (p.start || 0) >= end);
      return rightNeighbor ? (rightNeighbor.start || getView().end) : getView().end;
    },
  };
};
