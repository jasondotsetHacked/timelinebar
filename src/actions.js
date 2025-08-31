import { els } from './dom.js';
import { state } from './state.js';
import { time } from './time.js';
import { ui } from './ui.js';
import { idb } from './storage.js';
import { VIEW_START_MIN, VIEW_END_MIN, VIEW_MINUTES } from './config.js';

const pxToMinutes = (clientX) => {
  const rect = els.track.getBoundingClientRect();
  const x = clientX - rect.left;
  const pct = Math.min(1, Math.max(0, x / rect.width));
  const mins = VIEW_START_MIN + pct * VIEW_MINUTES;
  return Math.max(VIEW_START_MIN, Math.min(VIEW_END_MIN, Math.round(mins)));
};

const overlapsAny = (start, end, excludeId = null) =>
  state.punches.some((p) => p.id !== excludeId && start < p.end && end > p.start);

const nearestBounds = (forId) => {
  const sorted = [...state.punches].filter((p) => p.id !== forId).sort((a, b) => a.start - b.start);
  return {
    leftLimitAt: (start) => {
      const leftNeighbor = [...sorted].filter((p) => p.end <= start).pop();
      return leftNeighbor ? leftNeighbor.end : VIEW_START_MIN;
    },
    rightLimitAt: (end) => {
      const rightNeighbor = [...sorted].find((p) => p.start >= end);
      return rightNeighbor ? rightNeighbor.start : VIEW_END_MIN;
    },
  };
};

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
  const leftPct = ((Math.max(newStart, VIEW_START_MIN) - VIEW_START_MIN) / VIEW_MINUTES) * 100;
  const widthPctRaw = ((Math.min(newEnd, VIEW_END_MIN) - Math.max(newStart, VIEW_START_MIN)) / VIEW_MINUTES) * 100;
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
  const leftPct = ((Math.max(newStart, VIEW_START_MIN) - VIEW_START_MIN) / VIEW_MINUTES) * 100;
  const widthPct = ((Math.min(newEnd, VIEW_END_MIN) - Math.max(newStart, VIEW_START_MIN)) / VIEW_MINUTES) * 100;
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

const saveNewFromModal = async (e) => {
  e.preventDefault();
  if (!state.pendingRange) return;
  const { startMin, endMin } = state.pendingRange;
  const s = time.snap(startMin);
  const eMin = time.snap(endMin);
  if (eMin - s < 1) {
    ui.closeModal();
    return;
  }
  const payload = {
    start: s,
    end: eMin,
    caseNumber: els.caseField.value.trim(),
    note: els.noteField.value.trim(),
  };
  if (state.editingId) {
    const idx = state.punches.findIndex((p) => p.id === state.editingId);
    if (idx === -1) {
      ui.toast('Could not find item to update.');
      ui.closeModal();
      return;
    }
    const updated = { ...state.punches[idx], ...payload };
    if (overlapsAny(updated.start, updated.end, updated.id)) {
      ui.toast('That range overlaps another block.');
      return;
    }
    state.punches[idx] = updated;
    await idb.put(updated);
  } else {
    if (overlapsAny(payload.start, payload.end)) {
      ui.toast('That range overlaps another block.');
      return;
    }
    const toAdd = { ...payload, createdAt: new Date().toISOString() };
    await idb.add(toAdd);
  }
  state.punches = await idb.all();
  state.editingId = null;
  ui.closeModal();
  ui.renderAll();
};

const closeModal = () => ui.closeModal();

const attachEvents = () => {
  els.track.addEventListener('mousedown', startDrag);
  els.track.addEventListener('touchstart', startDrag, { passive: true });
  els.track.addEventListener('mousedown', startMove);
  els.track.addEventListener('touchstart', startMove, { passive: true });
  els.track.addEventListener('mousedown', startResize);
  els.track.addEventListener('touchstart', startResize, { passive: true });

  els.rows.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.row-action.delete');
    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      if (!confirm('Delete this time entry?')) return;
      await idb.remove(id);
      state.punches = await idb.all();
      ui.renderAll();
      ui.toast('Deleted');
      return;
    }
    const editBtn = e.target.closest('.row-action.edit');
    const row = e.target.closest('tr');
    if (editBtn || row) {
      const id = Number(editBtn?.dataset.id || row?.dataset.id);
      if (!id) return;
      const p = state.punches.find((px) => px.id === id);
      if (!p) return;
      state.editingId = id;
      state.pendingRange = { startMin: p.start, endMin: p.end };
      els.startField.value = time.toLabel(p.start);
      els.endField.value = time.toLabel(p.end);
      els.caseField.value = p.caseNumber || '';
      els.noteField.value = p.note || '';
      if (els.modalTitle) els.modalTitle.textContent = 'Edit Time Block';
      els.modal.style.display = 'flex';
      els.caseField.focus();
      return;
    }
  });

  els.track.addEventListener('click', async (e) => {
    const lbl = e.target.closest('.punch-label');
    if (lbl) {
      const id = Number(lbl.dataset.id);
      const p = state.punches.find((px) => px.id === id);
      if (!p) return;
      state.editingId = id;
      state.pendingRange = { startMin: p.start, endMin: p.end };
      els.startField.value = time.toLabel(p.start);
      els.endField.value = time.toLabel(p.end);
      els.caseField.value = p.caseNumber || '';
      els.noteField.value = p.note || '';
      if (els.modalTitle) els.modalTitle.textContent = 'Edit Time Block';
      els.modal.style.display = 'flex';
      els.caseField.focus();
      return;
    }
    const editBtn = e.target.closest('.control-btn.edit');
    if (editBtn) {
      const id = Number(editBtn.dataset.id);
      const p = state.punches.find((px) => px.id === id);
      if (!p) return;
      state.editingId = id;
      state.pendingRange = { startMin: p.start, endMin: p.end };
      els.startField.value = time.toLabel(p.start);
      els.endField.value = time.toLabel(p.end);
      els.caseField.value = p.caseNumber || '';
      els.noteField.value = p.note || '';
      if (els.modalTitle) els.modalTitle.textContent = 'Edit Time Block';
      els.modal.style.display = 'flex';
      els.caseField.focus();
      return;
    }
    const delBtn = e.target.closest('.control-btn.delete');
    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      if (!confirm('Delete this time entry?')) return;
      await idb.remove(id);
      state.punches = await idb.all();
      ui.renderAll();
      ui.toast('Deleted');
      return;
    }
    const popEdit = e.target.closest('.label-popper .control-btn.edit');
    if (popEdit) {
      const pop = e.target.closest('.label-popper');
      const id = Number(pop.dataset.id);
      const p = state.punches.find((px) => px.id === id);
      if (!p) return;
      state.editingId = id;
      state.pendingRange = { startMin: p.start, endMin: p.end };
      els.startField.value = time.toLabel(p.start);
      els.endField.value = time.toLabel(p.end);
      els.caseField.value = p.caseNumber || '';
      els.noteField.value = p.note || '';
      if (els.modalTitle) els.modalTitle.textContent = 'Edit Time Block';
      els.modal.style.display = 'flex';
      els.caseField.focus();
      return;
    }
    const popDel = e.target.closest('.label-popper .control-btn.delete');
    if (popDel) {
      const pop = e.target.closest('.label-popper');
      const id = Number(pop.dataset.id);
      if (!confirm('Delete this time entry?')) return;
      await idb.remove(id);
      state.punches = await idb.all();
      ui.renderAll();
      ui.toast('Deleted');
      return;
    }
  });

  els.modalForm.addEventListener('submit', saveNewFromModal);
  els.modalCancel.addEventListener('click', closeModal);
  els.modalClose.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
  window.addEventListener('resize', () => ui.renderTimeline());

  els.track.addEventListener('mouseover', (e) => {
    const punch = e.target.closest('.punch');
    if (!punch) return;
    punch.classList.add('is-hovered');
    const id = Number(punch.dataset.id);
    if (!id) return;
    const row = els.rows.querySelector(`tr[data-id="${id}"]`);
    if (row) row.classList.add('is-hovered');
  });
  els.track.addEventListener('mouseout', (e) => {
    const punch = e.target.closest('.punch');
    if (!punch) return;
    punch.classList.remove('is-hovered');
    const id = Number(punch.dataset.id);
    if (!id) return;
    const row = els.rows.querySelector(`tr[data-id="${id}"]`);
    if (row) row.classList.remove('is-hovered');
  });

  els.rows.addEventListener('mouseover', (e) => {
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    row.classList.add('is-hovered');
    const id = Number(row.dataset.id);
    if (!id) return;
    const punch = els.track.querySelector(`.punch[data-id="${id}"]`);
    if (punch) punch.classList.add('is-hovered');
  });
  els.rows.addEventListener('mouseout', (e) => {
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    row.classList.remove('is-hovered');
    const id = Number(row.dataset.id);
    if (!id) return;
    const punch = els.track.querySelector(`.punch[data-id="${id}"]`);
    if (punch) punch.classList.remove('is-hovered');
  });
};

export const actions = {
  attachEvents,
};
