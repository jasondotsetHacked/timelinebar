import { els } from '../dom.js';
import { state } from '../state.js';
import { time } from '../time.js';
import { ui } from '../ui.js';
import { idb } from '../storage.js';
import { pxToMinutes, nearestBounds, overlapsAny, getView } from './helpers.js';

const startResize = (e) => {
  const handle = e.target.closest('.handle');
  if (!handle) return;
  const punchEl = handle.closest('.punch');
  const id = Number(punchEl.dataset.id);
  const p = state.punches.find((x) => x.id === id);
  state.resizing = { id, edge: handle.dataset.edge, startStart: p.start, startEnd: p.end };
  if (handle.dataset.edge === 'left') punchEl.classList.add('resizing-left');
  if (handle.dataset.edge === 'right') punchEl.classList.add('resizing-right');
  window.addEventListener('mousemove', onResizeMove);
  window.addEventListener('touchmove', onResizeMove, { passive: false });
  window.addEventListener('mouseup', endResize);
  window.addEventListener('touchend', endResize);
  e.stopPropagation();
};

const onResizeMove = (e) => {
  if (!state.resizing) return;
  if (e.cancelable) e.preventDefault();
  const { id, edge, startStart, startEnd } = state.resizing;
  const raw = e.touches ? pxToMinutes(e.touches[0].clientX) : pxToMinutes(e.clientX);
  const m = time.snap(raw);
  const bounds = nearestBounds(id);
  let newStart = startStart;
  let newEnd = startEnd;
  if (edge === 'left') {
    const minL = bounds.leftLimitAt(startStart);
    const maxL = startEnd - 1;
    newStart = Math.min(maxL, Math.max(minL, m));
    newStart = time.snap(newStart);
  }
  if (edge === 'right') {
    const minR = startStart + 1;
    const maxR = bounds.rightLimitAt(startEnd);
    newEnd = Math.max(minR, Math.min(maxR, m));
    newEnd = time.snap(newEnd);
  }
  const invalid = overlapsAny(newStart, newEnd, id) || newEnd <= newStart;
  const el = els.track.querySelector(`.punch[data-id="${id}"]`);
  const view = getView();
  const leftPct = ((Math.max(newStart, view.start) - view.start) / view.minutes) * 100;
  const widthPctRaw = ((Math.min(newEnd, view.end) - Math.max(newStart, view.start)) / view.minutes) * 100;
  const widthPct = Math.max(0, widthPctRaw);
  el.style.left = leftPct + '%';
  el.style.width = widthPct + '%';
  el.classList.toggle('invalid', invalid);
  state.resizing.preview = { newStart, newEnd, invalid };
  ui.showTips(newStart, newEnd);
};

const endResize = async () => {
  if (!state.resizing) return;
  const { id } = state.resizing;
  const preview = state.resizing.preview;
  const punchEl = els.track.querySelector(`.punch[data-id="${id}"]`);
  if (punchEl) punchEl.classList.remove('resizing-left', 'resizing-right');
  state.resizing = null;
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('touchmove', onResizeMove);
  window.removeEventListener('mouseup', endResize);
  window.removeEventListener('touchend', endResize);
  ui.hideTips();
  if (!preview || preview.invalid) {
    ui.renderTimeline();
    if (preview?.invalid) ui.toast('Adjust would overlap another block.');
    return;
  }
  const idx = state.punches.findIndex((p) => p.id === id);
  state.punches[idx] = { ...state.punches[idx], start: preview.newStart, end: preview.newEnd };
  await idb.put(state.punches[idx]);
  ui.renderAll();
};

export const resizeActions = {
  attach: () => {
    els.track.addEventListener('mousedown', startResize);
    els.track.addEventListener('touchstart', startResize, { passive: true });
  },
};
