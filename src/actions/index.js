import { els } from '../dom.js';
import { state } from '../state.js';
import { time } from '../time.js';
import { ui } from '../ui.js';
import { idb } from '../storage.js';
import { todayStr } from '../dates.js';
import { dragActions } from './drag.js';
import { resizeActions } from './resize.js';
import { calendarActions } from './calendar.js';
import { overlapsAny } from './helpers.js';

// helpers for modal note preview
const escapeHtml = (s) => (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
const mdToHtml = (text) => {
  const t = String(text || '');
  if (!t.trim()) return '';
  try {
    if (window.marked && typeof window.marked.parse === 'function') {
      const raw = window.marked.parse(t);
      if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') return window.DOMPurify.sanitize(raw);
      return raw;
    }
  } catch {}
  return escapeHtml(t).replace(/\n/g, '<br>');
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
    bucket: els.bucketField.value.trim(),
    note: els.noteField.value.trim(),
    date: state.currentDate || todayStr(),
    status: (() => {
      const val = els.modalStatusBtn?.dataset.value || 'default';
      return val === 'default' ? null : val;
    })(),
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
  dragActions.attach();
  resizeActions.attach();
  calendarActions.attach();

  els.rows.addEventListener('click', async (e) => {
    // Status swatch open/close
    const btn = e.target.closest('.status-btn');
    if (btn) {
      const wrap = btn.closest('.status-wrap');
      els.rows.querySelectorAll('.status-wrap.open').forEach((w) => {
        if (w !== wrap) w.classList.remove('open');
      });
      const willOpen = !wrap.classList.contains('open');
      wrap.classList.toggle('open');
      wrap.classList.remove('up');
      if (willOpen) {
        const menu = wrap.querySelector('.status-menu');
        if (menu) {
          const prev = menu.style.display;
          if (!wrap.classList.contains('open')) menu.style.display = 'grid';
          const menuRect = menu.getBoundingClientRect();
          const wrapRect = wrap.getBoundingClientRect();
          const tableCard = document.querySelector('.table-card');
          const cardRect = tableCard ? tableCard.getBoundingClientRect() : { bottom: window.innerHeight };
          const spaceBelow = cardRect.bottom - wrapRect.bottom;
          const needed = menuRect.height + 12;
          if (spaceBelow < needed) wrap.classList.add('up');
          menu.style.display = prev;
        }
      }
      e.stopPropagation();
      return;
    }
    const opt = e.target.closest('.status-option');
    if (opt) {
      const tr = e.target.closest('tr[data-id]');
      const id = Number(tr?.dataset.id);
      if (!id) return;
      const value = opt.dataset.value; // default | green | yellow | red
      const idx = state.punches.findIndex((p) => p.id === id);
      if (idx !== -1) {
        const updated = { ...state.punches[idx] };
        updated.status = value === 'default' ? null : value;
        state.punches[idx] = updated;
        await idb.put(updated);
        ui.renderAll();
      }
      return;
    }
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
      els.bucketField.value = p.bucket || '';
      els.noteField.value = p.note || '';
      try {
        if (els.notePreview) {
          els.notePreview.style.display = 'none';
          els.notePreview.innerHTML = '';
        }
        if (els.notePreviewToggle) els.notePreviewToggle.textContent = 'Preview';
        if (els.noteField) {
          els.noteField.style.height = 'auto';
          const h = Math.max(72, Math.min(320, els.noteField.scrollHeight || 72));
          els.noteField.style.height = h + 'px';
        }
      } catch {}
      if (els.modalStatusBtn) {
        const st = p.status || 'default';
        els.modalStatusBtn.dataset.value = st;
        els.modalStatusBtn.className = `status-btn status-${st}`;
      }
      if (els.modalStatusWrap) els.modalStatusWrap.classList.remove('open');
      if (els.modalDelete) els.modalDelete.style.display = '';
      if (els.modalTitle) els.modalTitle.textContent = 'Edit Time Block';
      els.modal.style.display = 'flex';
      els.bucketField.focus();
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
      els.bucketField.value = p.bucket || '';
      els.noteField.value = p.note || '';
      if (els.modalStatusBtn) {
        const st = p.status || 'default';
        els.modalStatusBtn.dataset.value = st;
        els.modalStatusBtn.className = `status-btn status-${st}`;
      }
      if (els.modalStatusWrap) els.modalStatusWrap.classList.remove('open');
      if (els.modalDelete) els.modalDelete.style.display = '';
      if (els.modalTitle) els.modalTitle.textContent = 'Edit Time Block';
      els.modal.style.display = 'flex';
      els.bucketField.focus();
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
      els.bucketField.value = p.bucket || '';
      els.noteField.value = p.note || '';
      if (els.modalStatusBtn) {
        const st = p.status || 'default';
        els.modalStatusBtn.dataset.value = st;
        els.modalStatusBtn.className = `status-btn status-${st}`;
      }
      if (els.modalStatusWrap) els.modalStatusWrap.classList.remove('open');
      if (els.modalDelete) els.modalDelete.style.display = '';
      if (els.modalTitle) els.modalTitle.textContent = 'Edit Time Block';
      els.modal.style.display = 'flex';
      els.bucketField.focus();
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
      els.bucketField.value = p.bucket || '';
      els.noteField.value = p.note || '';
      if (els.modalStatusBtn) {
        const st = p.status || 'default';
        els.modalStatusBtn.dataset.value = st;
        els.modalStatusBtn.className = `status-btn status-${st}`;
      }
      if (els.modalStatusWrap) els.modalStatusWrap.classList.remove('open');
      if (els.modalDelete) els.modalDelete.style.display = '';
      if (els.modalTitle) els.modalTitle.textContent = 'Edit Time Block';
      els.modal.style.display = 'flex';
      els.bucketField.focus();
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
  els.modalDelete?.addEventListener('click', async () => {
    if (!state.editingId) return;
    if (!confirm('Delete this time entry?')) return;
    await idb.remove(state.editingId);
    state.punches = await idb.all();
    state.editingId = null;
    ui.closeModal();
    ui.renderAll();
    ui.toast('Deleted');
  });
  els.modalStatusBtn?.addEventListener('click', () => {
    els.modalStatusWrap?.classList.toggle('open');
  });
  els.modalStatusMenu?.addEventListener('click', (e) => {
    const opt = e.target.closest('.status-option');
    if (!opt) return;
    const val = opt.dataset.value;
    if (!val) return;
    if (els.modalStatusBtn) {
      els.modalStatusBtn.dataset.value = val;
      els.modalStatusBtn.className = `status-btn status-${val}`;
    }
    els.modalStatusWrap?.classList.remove('open');
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
  window.addEventListener('resize', () => ui.renderAll());

  window.addEventListener('click', (e) => {
    if (!e.target.closest('.status-wrap')) {
      els.rows.querySelectorAll('.status-wrap.open').forEach((w) => w.classList.remove('open'));
      els.modalStatusWrap?.classList.remove('open');
    }
    if (!e.target.closest('.note-popover') && !e.target.closest('.note-dot')) {
      ui.hideNotePopover?.();
    }
  });

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

  const setView = (start, end) => {
    const s = Math.max(0, Math.min(24 * 60, Math.floor(start)));
    const e = Math.max(0, Math.min(24 * 60, Math.floor(end)));
    state.viewStartMin = Math.min(s, e);
    state.viewEndMin = Math.max(s, e);
    ui.renderAll();
  };

  els.view24?.addEventListener('click', () => setView(0, 24 * 60));
  els.viewDefault?.addEventListener('click', () => setView(6 * 60, 18 * 60));

  // track click: open note popover when appropriate
  els.track.addEventListener('click', (e) => {
    const dot = e.target.closest('.note-dot');
    if (dot) {
      const id = Number(dot.dataset.id);
      if (id) ui.toggleNotePopover?.(id);
      e.stopPropagation();
      return;
    }
    const punch = e.target.closest('.punch');
    if (punch) {
      const id = Number(punch.dataset.id);
      if (!id) return;
      const p = state.punches.find((x) => x.id === id);
      if (p?.note) {
        ui.toggleNotePopover?.(id);
        e.stopPropagation();
      }
    }
  });

  // Modal note field: autosize and preview toggle
  els.noteField?.addEventListener('input', () => {
    try {
      els.noteField.style.height = 'auto';
      const h = Math.max(72, Math.min(320, els.noteField.scrollHeight || 72));
      els.noteField.style.height = h + 'px';
      if (els.notePreview && els.notePreview.style.display !== 'none') {
        els.notePreview.innerHTML = mdToHtml(els.noteField.value);
      }
    } catch {}
  });
  els.notePreviewToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!els.notePreview) return;
    const showing = els.notePreview.style.display !== 'none';
    if (showing) {
      els.notePreview.style.display = 'none';
      els.notePreview.innerHTML = '';
      if (els.notePreviewToggle) els.notePreviewToggle.textContent = 'Preview';
    } else {
      els.notePreview.innerHTML = mdToHtml(els.noteField?.value || '');
      els.notePreview.style.display = '';
      if (els.notePreviewToggle) els.notePreviewToggle.textContent = 'Hide preview';
    }
  });
};

export const actions = {
  attachEvents,
};
