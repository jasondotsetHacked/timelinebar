import { els } from '../dom.js';
import { state } from '../state.js';
import { time } from '../time.js';
import { ui } from '../ui.js';
import { idb } from '../storage.js';
import { todayStr, getPunchDate } from '../dates.js';
import { getView, pxToMinutes, overlapsAny, nearestBounds } from './helpers.js';

// Determine active schedule filter (mirrors ui.js filtering logic)
const getActiveScheduleIds = () => {
  const vid = state.currentScheduleViewId;
  if (vid != null) {
    const v = (state.scheduleViews || []).find((x) => Number(x.id) === Number(vid));
    if (v && Array.isArray(v.scheduleIds) && v.scheduleIds.length) return v.scheduleIds.map(Number);
    return null; // All
  }
  const id = state.currentScheduleId;
  return id == null ? null : [Number(id)];
};

const startDrag = (e) => {
  if (e.target.closest('.handle')) return;
  if (e.target.closest('.punch')) return; // don't start new-range drag when interacting with an existing block
  const raw = e.touches ? pxToMinutes(e.touches[0].clientX) : pxToMinutes(e.clientX);
  const snapped = time.snap(raw, e.shiftKey ? 1 : undefined);
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
  const snapped = time.snap(raw, e.shiftKey ? 1 : undefined);
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
  // Always detach listeners after finishing a drag
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('touchmove', onDragMove);
  window.removeEventListener('mouseup', endDrag);
  window.removeEventListener('touchend', endDrag);

  // Soft-selection: if range touches existing blocks, select them
  const day = state.currentDate || todayStr();
  const schedIds = getActiveScheduleIds();
  const schedSet = schedIds ? new Set(schedIds.map(Number)) : null;
  const touched = (state.punches || []).filter((p) =>
    getPunchDate(p) === day && (!schedSet || schedSet.has(Number(p.scheduleId))) && startMin < (p.end || 0) && endMin > (p.start || 0)
  );
  if (touched.length > 0) {
    state.selectedIds = new Set(touched.map((p) => p.id));
    ui.renderTimeline();
    return;
  }
  // No overlap: proceed to create new block
  ui.openModal({ startMin, endMin });
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
  const offset = pointerMin - p.start;

  // Determine if we are moving a selected group
  const sel = (state.selectedIds instanceof Set) ? state.selectedIds : new Set();
  const isGroup = sel.size > 0 && sel.has(id);
  const day = state.currentDate || todayStr();
  const items = isGroup
    ? (state.punches || [])
        .filter((x) => sel.has(x.id) && getPunchDate(x) === day)
        .map((x) => ({ id: x.id, start: x.start, end: x.end, duration: (x.end || 0) - (x.start || 0), rel: (x.start || 0) - p.start }))
    : [{ id, start: p.start, end: p.end, duration: (p.end || 0) - (p.start || 0), rel: 0 }];

  state.moving = {
    id, // anchor id
    groupIds: items.map((it) => it.id),
    items,
    anchorStart: p.start,
    offset,
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
  const { id, items, offset, startClientX, anchorStart, groupIds } = state.moving;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  if (Math.abs(clientX - startClientX) > 3) state.moving.moved = true;
  const m = time.snap(pxToMinutes(clientX), e.shiftKey ? 1 : undefined);
  let desiredStart = time.snap(m - offset, e.shiftKey ? 1 : undefined);

  // If group move (2+ ids), compute rigid delta with group-level clamping
  if (Array.isArray(groupIds) && groupIds.length > 1) {
    const desiredDelta = desiredStart - anchorStart;
    // Determine allowable delta across all items based on nearest bounds at desired positions
    let deltaMin = -Infinity;
    let deltaMax = Infinity;
    for (const it of items) {
      const desiredStartI = it.start + desiredDelta;
      const desiredEndI = desiredStartI + it.duration;
      const b = nearestBounds(it.id, groupIds);
      const leftLimit = b.leftLimitAt(desiredStartI);
      const rightLimit = b.rightLimitAt(desiredEndI);
      const minStartI = leftLimit;
      const maxStartI = rightLimit - it.duration;
      deltaMin = Math.max(deltaMin, minStartI - it.start);
      deltaMax = Math.min(deltaMax, maxStartI - it.start);
    }
    const clampedDelta = Math.max(deltaMin, Math.min(deltaMax, desiredDelta));
    const view = getView();
    const positions = [];
    for (const it of items) {
      const ns = time.snap(it.start + clampedDelta, e.shiftKey ? 1 : undefined);
      const ne = ns + it.duration;
      const el = els.track.querySelector(`.punch[data-id="${it.id}"]`);
      if (el) {
        const leftPct = ((Math.max(ns, view.start) - view.start) / view.minutes) * 100;
        const widthPct = ((Math.min(ne, view.end) - Math.max(ns, view.start)) / view.minutes) * 100;
        el.style.left = leftPct + '%';
        el.style.width = widthPct + '%';
        el.classList.remove('invalid');
      }
      positions.push({ id: it.id, newStart: ns, newEnd: ne });
    }
    // For tips, use anchor's preview
    const anchorPos = positions.find((p) => p.id === id) || positions[0];
    if (anchorPos) ui.showTips(anchorPos.newStart, anchorPos.newEnd);
    state.moving.preview = { group: true, positions };
    return;
  }

  // Single-item move (default)
  const it = items[0];
  const duration = it.duration;
  const desiredEnd = desiredStart + duration;
  const bounds = nearestBounds(id);
  const leftLimit = bounds.leftLimitAt(desiredStart);
  const rightLimit = bounds.rightLimitAt(desiredEnd);
  const minStart = leftLimit;
  const maxStart = rightLimit - duration;
  const clampedStart = Math.max(minStart, Math.min(maxStart, desiredStart));
  const newStart = time.snap(clampedStart, e.shiftKey ? 1 : undefined);
  const newEnd = newStart + duration;
  const invalid = overlapsAny(newStart, newEnd, id) || newEnd <= newStart;
  const el = els.track.querySelector(`.punch[data-id="${id}"]`);
  const view = getView();
  const leftPct = ((Math.max(newStart, view.start) - view.start) / view.minutes) * 100;
  const widthPct = ((Math.min(newEnd, view.end) - Math.max(newStart, view.start)) / view.minutes) * 100;
  if (el) {
    el.style.left = leftPct + '%';
    el.style.width = widthPct + '%';
    el.classList.toggle('invalid', invalid);
  }
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
  if (!preview) {
    ui.renderTimeline();
    return;
  }
  // Commit group move
  if (preview.group && Array.isArray(preview.positions)) {
    for (const pos of preview.positions) {
      const idx = state.punches.findIndex((p) => p.id === pos.id);
      if (idx === -1) continue;
      const updated = { ...state.punches[idx], start: pos.newStart, end: pos.newEnd };
      state.punches[idx] = updated;
      await idb.put(updated);
    }
    ui.renderAll();
    return;
  }
  // Commit single move
  if (preview.invalid) {
    ui.renderTimeline();
    return;
  }
  {
    const idx = state.punches.findIndex((p) => p.id === id);
    if (idx !== -1) {
      state.punches[idx] = { ...state.punches[idx], start: preview.newStart, end: preview.newEnd };
      await idb.put(state.punches[idx]);
    }
    ui.renderAll();
  }
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
    // Clicking outside any selected punch clears selection (soft-selection exit)
    const clearSelectionIfOutside = (e) => {
      try {
        if (!(state.selectedIds instanceof Set) || state.selectedIds.size === 0) return;
        const insideSelected = !!e.target.closest('.punch.selected');
        if (!insideSelected) {
          state.selectedIds.clear();
          ui.renderTimeline();
        }
      } catch {}
    };
    document.addEventListener('mousedown', clearSelectionIfOutside, true);
    document.addEventListener('touchstart', clearSelectionIfOutside, { passive: true, capture: true });
  },
};
