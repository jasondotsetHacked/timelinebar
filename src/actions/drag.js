import { els } from '../dom.js';
import { state } from '../state.js';
import { time } from '../time.js';
import { ui } from '../ui.js';
import { idb } from '../storage.js';
import { getView, pxToMinutes, overlapsAny, nearestBounds } from './helpers.js';

const startDrag = (e) => {
  if (e.target.closest('.handle')) return;
  if (e.target.closest('.punch')) return; // don't start new-range drag when interacting with an existing block
  const raw = e.touches ? pxToMinutes(e.touches[0].clientX) : pxToMinutes(e.clientX);
  const snapped = time.snap(raw);
  state.dragging = { anchor: snapped, last: snapped };
  ui.showGhost(snapped, snapped);
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('touchmove', onDragMove, { passive: false });
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);
};

const onDragMove = (e) => {
  if (!state.dragging) return;
  if (e.cancelable) e.preventDefault();
  const raw = e.touches ? pxToMinutes(e.touches[0].clientX) : pxToMinutes(e.clientX);
  const snapped = time.snap(raw);
  state.dragging.last = snapped;
  ui.showGhost(state.dragging.anchor, snapped);
};

const endDrag = () => {
  if (!state.dragging) return;
  const a = state.dragging.anchor;
  const b = state.dragging.last;
  state.dragging = null;
  ui.hideGhost();
  const startMin = Math.min(a, b);
  const endMin = Math.max(a, b);
  if (endMin - startMin < 1) return;
  if (overlapsAny(startMin, endMin)) {
    ui.toast('That range overlaps another block.');
    return;
  }
  ui.openModal({ startMin, endMin });
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('touchmove', onDragMove);
  window.removeEventListener('mouseup', endDrag);
  window.removeEventListener('touchend', endDrag);
};

// Move entire block by dragging anywhere on the block (excluding handles)
const startMove = (e) => {
  const handle = e.target.closest('.handle');
  if (handle) return; // handled by startResize
  const punchEl = e.target.closest('.punch');
  if (!punchEl) return;
  const id = Number(punchEl.dataset.id);
  const p = state.punches.find((x) => x.id === id);
  if (!p) return;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const pointerMin = pxToMinutes(clientX);
  const duration = p.end - p.start;
  const offset = pointerMin - p.start;
  state.moving = {
    id,
    duration,
    offset,
    startStart: p.start,
    startEnd: p.end,
    startClientX: clientX,
    moved: false,
  };
  window.addEventListener('mousemove', onMoveMove);
  window.addEventListener('touchmove', onMoveMove, { passive: false });
  window.addEventListener('mouseup', endMove);
  window.addEventListener('touchend', endMove);
};

const onMoveMove = (e) => {
  if (!state.moving) return;
  if (e.cancelable) e.preventDefault();
  const { id, duration, offset, startClientX } = state.moving;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  if (Math.abs(clientX - startClientX) > 3) state.moving.moved = true;
  const m = time.snap(pxToMinutes(clientX));
  let desiredStart = m - offset;
  desiredStart = time.snap(desiredStart);
  const desiredEnd = desiredStart + duration;
  const bounds = nearestBounds(id);
  const leftLimit = bounds.leftLimitAt(desiredStart);
  const rightLimit = bounds.rightLimitAt(desiredEnd);
  const minStart = leftLimit;
  const maxStart = rightLimit - duration;
  const clampedStart = Math.max(minStart, Math.min(maxStart, desiredStart));
  const newStart = time.snap(clampedStart);
  const newEnd = newStart + duration;
  const invalid = overlapsAny(newStart, newEnd, id) || newEnd <= newStart;
  const el = els.track.querySelector(`.punch[data-id="${id}"]`);
  const view = getView();
  const leftPct = ((Math.max(newStart, view.start) - view.start) / view.minutes) * 100;
  const widthPct = ((Math.min(newEnd, view.end) - Math.max(newStart, view.start)) / view.minutes) * 100;
  el.style.left = leftPct + '%';
  el.style.width = widthPct + '%';
  el.classList.toggle('invalid', invalid);
  state.moving.preview = { newStart, newEnd, invalid };
  ui.showTips(newStart, newEnd);
};

const endMove = async () => {
  if (!state.moving) return;
  const { id, moved } = state.moving;
  const preview = state.moving.preview;
  state.moving = null;
  window.removeEventListener('mousemove', onMoveMove);
  window.removeEventListener('touchmove', onMoveMove);
  window.removeEventListener('mouseup', endMove);
  window.removeEventListener('touchend', endMove);
  ui.hideTips();
  if (!moved) return; // treat as click; don't change
  // Record that a move just happened to suppress subsequent click-open
  state.lastMoveAt = Date.now();
  if (!preview || preview.invalid) {
    ui.renderTimeline();
    if (preview?.invalid) ui.toast('Move would overlap another block.');
    return;
  }
  const idx = state.punches.findIndex((p) => p.id === id);
  state.punches[idx] = { ...state.punches[idx], start: preview.newStart, end: preview.newEnd };
  await idb.put(state.punches[idx]);
  ui.renderAll();
};

const onWheel = (e) => {
  if (!state.overTrack) return; // only handle when hovering the track
  // prevent page scroll while interacting
  e.preventDefault();
  const rect = els.track.getBoundingClientRect();
  const view = getView();
  const pointerX = e.clientX - rect.left;
  const pct = Math.min(1, Math.max(0, pointerX / Math.max(1, rect.width)));

  if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    // pan horizontally
    const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
    const panMin = delta * 0.03; // ~3 minutes per 100 delta
    let newStart = view.start + panMin;
    let newEnd = view.end + panMin;
    const span = view.minutes;
    if (newStart < 0) {
      newStart = 0;
      newEnd = span;
    } else if (newEnd > 24 * 60) {
      newEnd = 24 * 60;
      newStart = newEnd - span;
    }
    state.viewStartMin = Math.floor(newStart);
    state.viewEndMin = Math.floor(newEnd);
    ui.renderAll();
    return;
  }

  // zoom in/out around pointer (also when Ctrl is held)
  const delta = e.ctrlKey ? e.deltaY : e.deltaY;
  const factor = Math.exp(delta * 0.0007); // gentler zoom per tick
  const minSpan = 45; // 45 min minimum for usability
  const maxSpan = 24 * 60; // full day
  let newSpan = Math.min(maxSpan, Math.max(minSpan, Math.round(view.minutes * factor)));
  const anchorMin = view.start + pct * view.minutes;
  let newStart = Math.round(anchorMin - pct * newSpan);
  let newEnd = newStart + newSpan;
  if (newStart < 0) {
    newStart = 0;
    newEnd = newSpan;
  }
  if (newEnd > 24 * 60) {
    newEnd = 24 * 60;
    newStart = newEnd - newSpan;
  }
  state.viewStartMin = newStart;
  state.viewEndMin = newEnd;
  ui.renderAll();
};

export const dragActions = {
  attach: () => {
    els.track.addEventListener('mousedown', startDrag);
    els.track.addEventListener('touchstart', startDrag, { passive: true });
    els.track.addEventListener('mousedown', startMove);
    els.track.addEventListener('touchstart', startMove, { passive: true });
    els.track.addEventListener('mouseenter', () => (state.overTrack = true));
    els.track.addEventListener('mouseleave', () => (state.overTrack = false));
    window.addEventListener('wheel', onWheel, { passive: false });
  },
};
