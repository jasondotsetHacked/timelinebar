import { els } from '../dom.js';
import { state } from '../state.js';
import { time } from '../time.js';
import { ui } from '../ui.js';
import { idb, schedulesDb } from '../storage.js';
import { assertSchedule } from '../validate.js';
import { todayStr, parseDate, toDateStr } from '../dates.js';
import { getPunchDate } from '../dates.js';
import { expandDates } from '../recur.js';
import { dragActions } from './drag.js';
import { resizeActions } from './resize.js';
import { calendarActions } from './calendar.js';
import { settingsActions } from './settings.js';
import { overlapsAny, pxToMinutes } from './helpers.js';
import { copyActions } from '../copy.js';
import { copyText } from '../copy.js';
import { SNAP_MIN } from '../config.js';

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

async function loadBucketNoteIntoEditor(name) {
  try {
    const key = String(name || '').trim();
    if (!els.bucketNoteField) return;
    let text = '';
    try {
      const rec = await idb.getBucket(key);
      text = (rec && rec.note) || '';
    } catch {}
    // Prefer edit-modal Quill if present
    try {
      const host = document.getElementById('modalBucketNoteEditor');
      const q = host && host.__quill ? host.__quill : null;
      if (q && q.root) {
        const html = mdToHtml(text || '');
        try { q.setContents([]); } catch {}
        try { q.clipboard.dangerouslyPasteHTML(html || ''); } catch { q.root.innerHTML = html || ''; }
      } else {
        els.bucketNoteField.value = text;
      }
    } catch { els.bucketNoteField.value = text; }
    try {
      els.bucketNoteField.style.height = 'auto';
      const h = Math.max(72, Math.min(320, els.bucketNoteField.scrollHeight || 72));
      els.bucketNoteField.style.height = h + 'px';
      if (els.bucketNotePreview && els.bucketNotePreview.style.display !== 'none') {
        els.bucketNotePreview.innerHTML = mdToHtml(text);
      }
    } catch {}
  } catch {}
}

function genRecurrenceId() {
  return 'r' + Math.random().toString(36).slice(2, 10);
}

function readRecurrenceFromUI() {
  const enabled = !!els.repeatEnabled?.checked;
  if (!enabled) return null;
  const freq = els.repeatFreq?.value || 'weekly';
  const until = String(els.repeatUntil?.value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return null;
  const base = { freq, interval: 1, until };
  if (freq === 'weekly') {
    const days = Array.from(els.repeatDow?.querySelectorAll('input[type="checkbox"]') || [])
      .filter((c) => c.checked)
      .map((c) => Number(c.value));
    if (days.length) base.byWeekday = days;
  }
  return base;
}

function overlapsOnDate(dateStr, start, end, excludeId = null, scheduleId = null) {
  const sched = (scheduleId != null) ? Number(scheduleId) : (state.currentScheduleId == null ? null : Number(state.currentScheduleId));
  return state.punches.some(
    (p) => p.id !== excludeId
      && getPunchDate(p) === dateStr
      && (sched == null || Number(p.scheduleId) === sched)
      && start < (p.end || 0) && end > (p.start || 0)
  );
}

async function splitPunchAtClick(e, punchEl) {
  try {
    const id = Number(punchEl?.dataset?.id);
    if (!id) return;
    const p = state.punches.find((x) => x.id === id);
    if (!p) return;
    const clientX = e.touches ? e.touches[0]?.clientX : e.clientX;
    const rawMin = pxToMinutes(clientX);
    const lower = Math.floor(rawMin / SNAP_MIN) * SNAP_MIN;
    const upper = Math.ceil(rawMin / SNAP_MIN) * SNAP_MIN;
    const candidates = [];
    if (lower > p.start && lower < p.end) candidates.push(lower);
    if (upper !== lower && upper > p.start && upper < p.end) candidates.push(upper);
    if (!candidates.length) {
      ui.toast('Block too short to split at 15m');
      return;
    }
    const chosen = candidates.length === 1
      ? candidates[0]
      : (Math.abs(candidates[0] - rawMin) <= Math.abs(candidates[1] - rawMin) ? candidates[0] : candidates[1]);
    const base = { bucket: p.bucket, note: p.note, status: p.status || null, date: p.date || getPunchDate(p), scheduleId: p.scheduleId };
    const left = { ...base, start: p.start, end: chosen, createdAt: new Date().toISOString() };
    const right = { ...base, start: chosen, end: p.end, createdAt: new Date().toISOString() };
    await idb.remove(p.id);
    await idb.add(left);
    await idb.add(right);
    state.punches = await idb.all();
    ui.renderAll();
    ui.toast(`Split at ${time.toLabel(chosen)}`);
  } catch (err) {
    try { console.error('splitPunchAtClick error', err); } catch {}
  }
}

// Fill schedule datalist options from state.schedules
function fillScheduleDatalist() {
  try {
    if (!els.scheduleList) return;
    const list = els.scheduleList;
    list.innerHTML = '';
    for (const s of state.schedules || []) {
      const opt = document.createElement('option');
      opt.value = String(s.name || `Schedule ${s.id}`);
      list.appendChild(opt);
    }
  } catch {}
}

// Resolve or create a schedule by name; returns the schedule id (number) or null
async function ensureScheduleByName(rawName) {
  const name = String(rawName || '').trim();
  if (!name) return null;
  // Try to find case-insensitively
  const list = state.schedules || [];
  const found = list.find((s) => String(s.name || '').toLowerCase() === name.toLowerCase());
  if (found) return Number(found.id);
  // Create new schedule
  try {
    await schedulesDb.addSchedule({ name });
  } catch {}
  // Reload schedules and try again
  try { state.schedules = await schedulesDb.allSchedules(); } catch {}
  const again = (state.schedules || []).find((s) => String(s.name || '').toLowerCase() === name.toLowerCase());
  return again ? Number(again.id) : null;
}

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
  // Schedule from typed field (optional)
  const typedSched = String(els.scheduleField?.value || '').trim();
  let scheduleId = null;
  if (typedSched) {
    scheduleId = await ensureScheduleByName(typedSched);
  }
  const payload = {
    start: s,
    end: eMin,
    bucket: els.bucketField.value.trim(),
    note: (() => {
      try {
        const host = document.getElementById('modalNoteEditor');
        const q = host && host.__quill ? host.__quill : null;
        if (q && q.root) return String(q.root.innerHTML || '');
      } catch {}
      return (els.noteField?.value || '').trim();
    })(),
    date: state.currentDate || todayStr(),
    scheduleId: (scheduleId != null
      ? scheduleId
      : (state.currentScheduleId != null ? state.currentScheduleId : (state.schedules?.[0]?.id ?? null))),
    status: (() => {
      const val = els.modalStatusBtn?.dataset.value || 'default';
      return val === 'default' ? null : val;
    })(),
  };
  // Upsert bucket persistent note
  try {
    const bname = payload.bucket;
    let bnote = '';
    try {
      const host = document.getElementById('modalBucketNoteEditor');
      const qb = host && host.__quill ? host.__quill : null;
      if (qb && qb.root) bnote = String(qb.root.innerHTML || '');
      else bnote = String(els.bucketNoteField?.value || '').trim();
    } catch { bnote = String(els.bucketNoteField?.value || '').trim(); }
    if (bname != null) await idb.setBucketNote(bname, bnote);
  } catch {}
  const rec = readRecurrenceFromUI();
  if (els.repeatEnabled?.checked && !rec) {
    ui.toast('Pick an end date for the series');
    return;
  }
  if (state.editingId) {
    const idx = state.punches.findIndex((p) => p.id === state.editingId);
    if (idx === -1) {
      ui.toast('Could not find item to update.');
      ui.closeModal();
      return;
    }
    const prev = state.punches[idx];
    // If a schedule was typed, move this punch (or entire series) to that schedule
    const targetScheduleId = payload.scheduleId != null ? payload.scheduleId : prev.scheduleId;
    const updated = { ...prev, ...payload, scheduleId: targetScheduleId };
    const applyToSeries = !!els.applyScopeSeries?.checked && !!prev.recurrenceId;
    if (applyToSeries) {
      const deltaStart = updated.start - prev.start;
      const deltaEnd = updated.end - prev.end;
      const targetId = prev.recurrenceId;
      const toUpdate = state.punches.filter((p) => p.recurrenceId === targetId);
      // validate overlaps per-date
      for (const p of toUpdate) {
        const newStart = p.start + deltaStart;
        const newEnd = p.end + deltaEnd;
        const schedId = targetScheduleId != null ? targetScheduleId : p.scheduleId;
        if (overlapsOnDate(p.date || getPunchDate(p), newStart, newEnd, p.id, schedId)) {
          ui.toast('Change would overlap another block in the series.');
          return;
        }
      }
      for (const p of toUpdate) {
        const upd = { ...p, start: p.start + deltaStart, end: p.end + deltaEnd, bucket: updated.bucket, note: updated.note, status: updated.status, scheduleId: targetScheduleId };
        await idb.put(upd);
      }
    } else {
      if (overlapsOnDate(updated.date, updated.start, updated.end, updated.id, updated.scheduleId)) {
        ui.toast('That range overlaps another block.');
        return;
      }
      // If turning a single into a series during edit
      if (!prev.recurrenceId && rec) {
        const recurrenceId = genRecurrenceId();
        const dates = expandDates(updated.date, rec);
        let seq = 0;
        for (const d of dates) {
          const start = updated.start;
          const end = updated.end;
          if (overlapsOnDate(d, start, end, prev.id, prev.scheduleId)) continue;
        const base = { start, end, bucket: updated.bucket, note: updated.note, status: updated.status, date: d, recurrenceId, recurrence: rec, seq, scheduleId: updated.scheduleId };
          if (d === prev.date) {
            await idb.put({ ...prev, ...base });
          } else {
            await idb.add({ ...base, createdAt: new Date().toISOString() });
          }
          seq++;
        }
      } else {
        state.punches[idx] = updated;
        await idb.put(updated);
      }
    }
  } else {
    if (rec) {
      const recurrenceId = genRecurrenceId();
      const dates = expandDates(payload.date, rec);
      let added = 0;
      let skipped = 0;
      let seq = 0;
      for (const d of dates) {
        if (overlapsOnDate(d, payload.start, payload.end, null, payload.scheduleId)) { skipped++; continue; }
        const item = { ...payload, date: d, recurrenceId, recurrence: rec, seq, createdAt: new Date().toISOString() };
        await idb.add(item);
        added++; seq++;
      }
      if (skipped) ui.toast(`Created ${added}, skipped ${skipped} overlapping`);
    } else {
      if (overlapsOnDate(payload.date, payload.start, payload.end, null, payload.scheduleId)) {
        ui.toast('That range overlaps another block.');
        return;
      }
      const toAdd = { ...payload, createdAt: new Date().toISOString() };
      await idb.add(toAdd);
    }
  }
  state.punches = await idb.all();
  // Refresh schedules (in case a new one was created)
  try { state.schedules = await schedulesDb.allSchedules(); ui.renderScheduleSelect?.(); } catch {}
  state.editingId = null;
  ui.closeModal();
  ui.renderAll();
};

// Mini date picker popover
let datePopover = null;
function hideDatePicker() {
  try { if (datePopover) datePopover.remove(); } catch {}
  datePopover = null;
  window.removeEventListener('resize', hideDatePicker);
  window.removeEventListener('scroll', hideDatePicker, true);
  document.removeEventListener('keydown', onDateKey);
}
function onDateKey(e) { if (e.key === 'Escape') hideDatePicker(); }
function buildMonthGridLocal(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // start on Sunday
  const days = [];
  for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
  return days;
}
function showDatePicker(anchor, inputEl) {
  if (!anchor || !inputEl) return;
  const existing = datePopover;
  if (existing && existing._for === inputEl) { hideDatePicker(); return; }
  hideDatePicker();
  const today = todayStr();
  const selStr = String(inputEl.value || '').trim();
  const sel = parseDate(selStr) || new Date();
  let y = sel.getFullYear();
  let m = sel.getMonth();
  const pop = document.createElement('div');
  pop.className = 'date-popover';
  pop._for = inputEl;
  const render = () => {
    pop.innerHTML = '';
    const header = document.createElement('div'); header.className = 'date-header';
    const title = document.createElement('div'); title.className = 'date-title';
    title.textContent = new Date(y, m, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
    const nav = document.createElement('div'); nav.className = 'date-nav';
    const prev = document.createElement('button'); prev.className = 'date-btn'; prev.textContent = '\u2039'; prev.title = 'Previous month';
    const next = document.createElement('button'); next.className = 'date-btn'; next.textContent = '\u203A'; next.title = 'Next month';
    prev.addEventListener('click', (e) => { e.preventDefault(); m -= 1; if (m < 0) { m = 11; y -= 1; } render(); });
    next.addEventListener('click', (e) => { e.preventDefault(); m += 1; if (m > 11) { m = 0; y += 1; } render(); });
    nav.append(prev, next); header.append(title, nav); pop.appendChild(header);
    const grid = document.createElement('div'); grid.className = 'date-grid';
    const wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    for (const w of wd) { const el = document.createElement('div'); el.className = 'date-wd'; el.textContent = w; grid.appendChild(el); }
    const days = buildMonthGridLocal(y, m);
    for (const d of days) {
      const ds = toDateStr(d);
      const cell = document.createElement('div'); cell.className = 'date-day';
      if (d.getMonth() !== m) cell.classList.add('other');
      if (ds === today) cell.classList.add('today');
      if (selStr && ds === selStr) cell.classList.add('selected');
      cell.textContent = String(d.getDate());
      cell.addEventListener('click', () => {
        inputEl.value = ds;
        try { inputEl.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
        try { inputEl.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
        hideDatePicker();
      });
      grid.appendChild(cell);
    }
    pop.appendChild(grid);
  };
  document.body.appendChild(pop);
  render();
  const rect = anchor.getBoundingClientRect();
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  const pr = pop.getBoundingClientRect();
  let left = Math.min(rect.left, vw - pr.width - 6);
  let top = rect.bottom + 6;
  if (top + pr.height + 6 > vh) top = Math.max(6, rect.top - pr.height - 6);
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
  datePopover = pop;
  window.addEventListener('resize', hideDatePicker);
  window.addEventListener('scroll', hideDatePicker, true);
  document.addEventListener('keydown', onDateKey);
}

const closeModal = () => { hideDatePicker(); ui.closeModal(); };

const attachEvents = () => {
  dragActions.attach();
  resizeActions.attach();
  calendarActions.attach();
  settingsActions.attach();

  // Schedules: select / add / rename / delete
  try {
    els.scheduleSelect?.addEventListener('change', (e) => {
      const raw = String(e.target.value || '');
      if (raw.startsWith('view:')) {
        const id = Number(raw.slice(5));
        if (!Number.isNaN(id)) {
          state.currentScheduleViewId = id;
          state.currentScheduleId = null;
          try { localStorage.setItem('currentScheduleViewId', String(id)); } catch {}
          try { localStorage.removeItem('currentScheduleId'); } catch {}
          ui.renderAll();
          return;
        }
      }
      if (raw === '') {
        state.currentScheduleViewId = null;
        state.currentScheduleId = null;
        try { localStorage.removeItem('currentScheduleViewId'); } catch {}
        try { localStorage.setItem('currentScheduleId', ''); } catch {}
        ui.renderAll();
        return;
      }
      const val = Number(raw);
      if (!Number.isNaN(val)) {
        state.currentScheduleViewId = null;
        state.currentScheduleId = val;
        try { localStorage.removeItem('currentScheduleViewId'); } catch {}
        try { localStorage.setItem('currentScheduleId', String(val)); } catch {}
        ui.renderAll();
      }
    });
    // Header quick actions
    els.btnAddSchedule?.addEventListener('click', async () => {
      try {
        const raw = prompt('New schedule name');
        const name = String(raw || '').trim();
        if (!name) return;
        try { assertSchedule({ name }); } catch (err) { ui.toast('Invalid name (1–200 chars)'); return; }
        const exists = (state.schedules || []).some((s) => String(s?.name || '') === name);
        if (exists) { ui.toast('Name already exists'); return; }
        await schedulesDb.addSchedule({ name });
        state.schedules = await schedulesDb.allSchedules();
        state.currentScheduleId = state.schedules[state.schedules.length - 1]?.id ?? state.currentScheduleId;
        try { localStorage.setItem('currentScheduleId', String(state.currentScheduleId ?? '')); } catch {}
        ui.renderScheduleSelect?.();
        ui.renderAll();
        ui.toast('Added schedule');
      } catch {}
    });
    els.btnRenameSchedule?.addEventListener('click', () => {
      try { els.btnSettings?.click(); } catch {}
      try {
        const curId = state.currentScheduleId;
        const cur = (state.schedules || []).find((s) => Number(s.id) === Number(curId));
        if (cur && els.settingsSchedList) els.settingsSchedList.value = String(cur.id);
        // Input is shown by pressing Rename inside Settings (two-step flow)
      } catch {}
    });
    els.btnDeleteSchedule?.addEventListener('click', () => {
      try { els.btnSettings?.click(); } catch {}
      try {
        const curId = state.currentScheduleId;
        const cur = (state.schedules || []).find((s) => Number(s.id) === Number(curId));
        if (cur && els.settingsSchedList) els.settingsSchedList.value = String(cur.id);
        if (cur && els.settingsDeleteConfirm) { els.settingsDeleteConfirm.style.display = ''; }
        if (cur && els.settingsDeleteConfirmText) els.settingsDeleteConfirmText.textContent = `Delete schedule "${cur.name || cur.id}"?`;
      } catch {}
    });
  } catch {}

  // (Customizable dashboards removed)

  // Collapsible: Time Entries
  try {
    const card = els.entriesCard;
    const btn = els.entriesToggle;
    if (card && btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const collapsed = card.classList.toggle('collapsed');
        try { btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true'); } catch {}
      });
    }
  } catch {}

  // Collapsible: Bucket Report (Day)
  try {
    const card = els.bucketDayCard;
    const btn = els.bucketDayToggle;
    if (card && btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const collapsed = card.classList.toggle('collapsed');
        try { btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true'); } catch {}
      });
    }
  } catch {}

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
      const force = !!e.shiftKey;
      if (!force && !confirm('Delete this time entry?')) return;
      await idb.remove(id);
      state.punches = await idb.all();
      ui.renderAll();
      ui.toast('Deleted');
      return;
    }
    // Copy on click for Start/Stop/Duration/Bucket cells
    const copyCell = e.target.closest('td.copy-cell');
    if (copyCell) {
      const text = (copyCell.textContent || '').trim();
      try { await copyText(text); ui.toast?.('Copied to clipboard'); } catch {}
      e.stopPropagation();
      return;
    }
    // Open Note modal when clicking the note cell
    const noteCell = e.target.closest('td.note');
    if (noteCell) {
      const tr = noteCell.closest('tr[data-id]');
      const id = Number(tr?.dataset.id);
      if (id) {
        ui.openNoteModal?.(id);
        e.stopPropagation();
        return;
      }
    }
    const editBtn = e.target.closest('.row-action.edit');
    // Only open edit modal when clicking the edit button or empty areas (non-copyable, non-note, non-status, non-actions cells)
    const row = e.target.closest('tr');
    const td = e.target.closest('td');
    const allowRowOpen = !!row && td && !td.classList.contains('copy-cell') && !td.classList.contains('note') && !td.classList.contains('status-cell') && !td.classList.contains('table-actions');
    if (editBtn || allowRowOpen) {
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
      // Initialize Quill editors in Edit modal and populate from existing note
      try { ui.ensureEditQuills?.(); } catch {}
      try {
        const host = document.getElementById('modalNoteEditor');
        const q = host && host.__quill ? host.__quill : null;
        if (q && q.root) {
          const html = mdToHtml(String(p.note || ''));
          try { q.setContents([]); } catch {}
          try { q.clipboard.dangerouslyPasteHTML(html || ''); } catch { q.root.innerHTML = html || ''; }
        }
      } catch {}
      // Schedule field + datalist
      try { fillScheduleDatalist(); } catch {}
      try {
        const cur = (state.schedules || []).find((s) => Number(s.id) === Number(p.scheduleId));
        if (els.scheduleField) els.scheduleField.value = cur?.name || '';
      } catch {}
      // Load bucket persistent note
      try { await loadBucketNoteIntoEditor(els.bucketField.value); } catch {}
      // Recurrence UI state
      try {
        const hasRec = !!p.recurrenceId;
        if (els.repeatEnabled) els.repeatEnabled.checked = hasRec;
        if (els.repeatFields) els.repeatFields.style.display = hasRec ? '' : 'none';
        if (hasRec && p.recurrence) {
          if (els.repeatFreq) els.repeatFreq.value = p.recurrence.freq || 'weekly';
          if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = '';
          if (els.repeatUntil) els.repeatUntil.value = p.recurrence.until || '';
          const showDow = (p.recurrence.freq || 'weekly') === 'weekly';
          if (els.repeatDowWrap) els.repeatDowWrap.style.display = showDow ? '' : 'none';
          if (showDow && els.repeatDow) {
            const set = new Set(Array.isArray(p.recurrence.byWeekday) ? p.recurrence.byWeekday.map(Number) : []);
            const wd = new Date(p.date).getDay();
            els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => {
              c.checked = set.size ? set.has(Number(c.value)) : Number(c.value) === wd;
            });
          }
        } else {
          if (els.repeatUntil) els.repeatUntil.value = '';
          if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = 'none';
          if (els.repeatDowWrap) els.repeatDowWrap.style.display = 'none';
        }
        if (els.applyScopeWrap) els.applyScopeWrap.style.display = hasRec ? '' : 'none';
        // For now, recurrence rules are not editable for existing series
        if (els.repeatEnabled) els.repeatEnabled.disabled = hasRec;
        if (els.repeatFreq) els.repeatFreq.disabled = hasRec;
        // interval / ends / count controls removed
        if (els.repeatUntil) els.repeatUntil.disabled = hasRec;
        if (els.repeatDow) els.repeatDow.querySelectorAll('input').forEach((c) => (c.disabled = hasRec));
        if (els.applyScopeSeries) els.applyScopeSeries.checked = true;
        if (els.applyScopeOne) els.applyScopeOne.checked = !els.applyScopeSeries.checked;
        if (els.extendWrap) els.extendWrap.style.display = hasRec ? '' : 'none';
      } catch {}
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
    // Shift+Click on a punch: split at nearest 15m boundary inside the block
    if (e.shiftKey) {
      const handle = e.target.closest('.handle');
      const ctrl = e.target.closest('.control-btn');
      const punchEl = e.target.closest('.punch');
      if (!handle && !ctrl && punchEl) {
        await splitPunchAtClick(e, punchEl);
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        e.stopPropagation();
        return;
      }
    }
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
      // Initialize Quill editors in Edit modal and populate from existing note
      try { ui.ensureEditQuills?.(); } catch {}
      try {
        const host = document.getElementById('modalNoteEditor');
        const q = host && host.__quill ? host.__quill : null;
        if (q && q.root) {
          const html = mdToHtml(String(p.note || ''));
          try { q.setContents([]); } catch {}
          try { q.clipboard.dangerouslyPasteHTML(html || ''); } catch { q.root.innerHTML = html || ''; }
        }
      } catch {}
      try { fillScheduleDatalist(); } catch {}
      try {
        const cur = (state.schedules || []).find((s) => Number(s.id) === Number(p.scheduleId));
        if (els.scheduleField) els.scheduleField.value = cur?.name || '';
      } catch {}
      try { await loadBucketNoteIntoEditor(els.bucketField.value); } catch {}
      try {
        const hasRec = !!p.recurrenceId;
        if (els.repeatEnabled) els.repeatEnabled.checked = hasRec;
        if (els.repeatFields) els.repeatFields.style.display = hasRec ? '' : 'none';
        if (hasRec && p.recurrence) {
          if (els.repeatFreq) els.repeatFreq.value = p.recurrence.freq || 'weekly';
          if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = '';
          if (els.repeatUntil) els.repeatUntil.value = p.recurrence.until || '';
          const showDow = (p.recurrence.freq || 'weekly') === 'weekly';
          if (els.repeatDowWrap) els.repeatDowWrap.style.display = showDow ? '' : 'none';
          if (showDow && els.repeatDow) {
            const set = new Set(Array.isArray(p.recurrence.byWeekday) ? p.recurrence.byWeekday.map(Number) : []);
            const wd = new Date(p.date).getDay();
            els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => {
              c.checked = set.size ? set.has(Number(c.value)) : Number(c.value) === wd;
            });
          }
        } else {
          if (els.repeatUntil) els.repeatUntil.value = '';
          if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = 'none';
          if (els.repeatDowWrap) els.repeatDowWrap.style.display = 'none';
        }
        if (els.applyScopeWrap) els.applyScopeWrap.style.display = hasRec ? '' : 'none';
        if (els.repeatEnabled) els.repeatEnabled.disabled = hasRec;
        if (els.repeatFreq) els.repeatFreq.disabled = hasRec;
        // interval / ends / count controls removed
        if (els.repeatUntil) els.repeatUntil.disabled = hasRec;
        if (els.repeatDow) els.repeatDow.querySelectorAll('input').forEach((c) => (c.disabled = hasRec));
        if (els.applyScopeSeries) els.applyScopeSeries.checked = true;
        if (els.extendWrap) els.extendWrap.style.display = hasRec ? '' : 'none';
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
      // Prevent the track's other click handlers (e.g., note preview) from firing
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      e.stopPropagation();
      if (e.preventDefault) e.preventDefault();
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
      // Initialize Quill editors in Edit modal and populate from existing note
      try { ui.ensureEditQuills?.(); } catch {}
      try {
        const host = document.getElementById('modalNoteEditor');
        const q = host && host.__quill ? host.__quill : null;
        if (q && q.root) {
          const html = mdToHtml(String(p.note || ''));
          try { q.setContents([]); } catch {}
          try { q.clipboard.dangerouslyPasteHTML(html || ''); } catch { q.root.innerHTML = html || ''; }
        }
      } catch {}
      try { await loadBucketNoteIntoEditor(els.bucketField.value); } catch {}
      try {
        const hasRec = !!p.recurrenceId;
        if (els.repeatEnabled) els.repeatEnabled.checked = hasRec;
        if (els.repeatFields) els.repeatFields.style.display = hasRec ? '' : 'none';
        if (hasRec && p.recurrence) {
          if (els.repeatFreq) els.repeatFreq.value = p.recurrence.freq || 'weekly';
          if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = '';
          if (els.repeatUntil) els.repeatUntil.value = p.recurrence.until || '';
          const showDow = (p.recurrence.freq || 'weekly') === 'weekly';
          if (els.repeatDowWrap) els.repeatDowWrap.style.display = showDow ? '' : 'none';
          if (showDow && els.repeatDow) {
            const set = new Set(Array.isArray(p.recurrence.byWeekday) ? p.recurrence.byWeekday.map(Number) : []);
            const wd = new Date(p.date).getDay();
            els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => {
              c.checked = set.size ? set.has(Number(c.value)) : Number(c.value) === wd;
            });
          }
        } else {
          if (els.repeatUntil) els.repeatUntil.value = '';
          if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = 'none';
          if (els.repeatDowWrap) els.repeatDowWrap.style.display = 'none';
        }
        if (els.applyScopeWrap) els.applyScopeWrap.style.display = hasRec ? '' : 'none';
        if (els.repeatEnabled) els.repeatEnabled.disabled = hasRec;
        if (els.repeatFreq) els.repeatFreq.disabled = hasRec;
        // interval / ends / count controls removed
        if (els.repeatUntil) els.repeatUntil.disabled = hasRec;
        if (els.repeatDow) els.repeatDow.querySelectorAll('input').forEach((c) => (c.disabled = hasRec));
        if (els.applyScopeSeries) els.applyScopeSeries.checked = true;
        if (els.extendWrap) els.extendWrap.style.display = hasRec ? '' : 'none';
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
    const delBtn = e.target.closest('.control-btn.delete');
    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      const force = !!e.shiftKey;
      if (!force && !confirm('Delete this time entry?')) return;
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
      // Initialize Quill editors in Edit modal and populate from existing note
      try { ui.ensureEditQuills?.(); } catch {}
      try {
        const host = document.getElementById('modalNoteEditor');
        const q = host && host.__quill ? host.__quill : null;
        if (q && q.root) {
          const html = mdToHtml(String(p.note || ''));
          try { q.setContents([]); } catch {}
          try { q.clipboard.dangerouslyPasteHTML(html || ''); } catch { q.root.innerHTML = html || ''; }
        }
      } catch {}
      try { await loadBucketNoteIntoEditor(els.bucketField.value); } catch {}
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
      const force = !!e.shiftKey;
      if (!force && !confirm('Delete this time entry?')) return;
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
  // Schedule combobox interactions
  try {
    const combo = els.scheduleCombo;
    const input = els.scheduleField;
    const toggle = els.scheduleToggle;
    const menu = els.scheduleMenu;
    const closeMenu = () => { try { combo?.classList.remove('open'); } catch {}; };
    const openMenu = () => {
      try {
        // refresh items from state.schedules
        if (menu) {
          menu.innerHTML = '';
          for (const s of state.schedules || []) {
            const name = String(s.name || `Schedule ${s.id}`);
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = name;
            item.dataset.value = name;
            menu.appendChild(item);
          }
        }
        combo?.classList.add('open');
      } catch {}
    };
    toggle?.addEventListener('click', (e) => { e.preventDefault(); combo?.classList.toggle('open'); if (combo?.classList.contains('open')) openMenu(); });
    input?.addEventListener('focus', () => openMenu());
    input?.addEventListener('input', () => {
      const q = String(input.value || '').toLowerCase();
      try {
        menu?.querySelectorAll('.dropdown-item')?.forEach((it) => {
          const visible = !q || String(it.dataset.value || '').toLowerCase().includes(q);
          it.style.display = visible ? '' : 'none';
        });
        combo?.classList.add('open');
      } catch {}
    });
    menu?.addEventListener('click', (e) => {
      const it = e.target.closest('.dropdown-item');
      if (!it) return;
      try { input.value = String(it.dataset.value || ''); } catch {}
      closeMenu();
      try { input.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
    });
    document.addEventListener('click', (e) => {
      if (!combo) return;
      if (e.target === input || e.target === toggle || e.target.closest('#scheduleCombo')) return;
      closeMenu();
    });
  } catch {}
  // Time fields: allow typing and parse on change/blur
  const coerceRange = () => {
    try {
      const sText = String(els.startField?.value || '');
      const eText = String(els.endField?.value || '');
      const sMin = time.parse(sText);
      const eMin = time.parse(eText);
      if (sMin == null || eMin == null) return; // ignore until valid
      let a = time.snap(sMin);
      let b = time.snap(eMin);
      if (b <= a) b = Math.min(24 * 60, a + Math.max(1, SNAP_MIN));
      state.pendingRange = { startMin: a, endMin: b };
      try { els.startField.value = time.toLabel(a); } catch {}
      try { els.endField.value = time.toLabel(b); } catch {}
    } catch {}
  };
  els.startField?.addEventListener('change', coerceRange);
  els.endField?.addEventListener('change', coerceRange);
  els.startField?.addEventListener('blur', coerceRange);
  els.endField?.addEventListener('blur', coerceRange);
  // Recurrence UI wiring
  els.repeatEnabled?.addEventListener('change', () => {
    const on = !!els.repeatEnabled.checked;
    if (els.repeatFields) els.repeatFields.style.display = on ? '' : 'none';
    if (!on) return;
    if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = '';
    const isWeekly = (els.repeatFreq?.value || 'weekly') === 'weekly';
    if (els.repeatDowWrap) els.repeatDowWrap.style.display = isWeekly ? '' : 'none';
  });
  els.repeatFreq?.addEventListener('change', () => {
    const val = els.repeatFreq.value;
    if (els.repeatDowWrap) els.repeatDowWrap.style.display = val === 'weekly' && els.repeatEnabled?.checked ? '' : 'none';
  });
  els.btnDowWeekdays?.addEventListener('click', () => {
    if (!els.repeatDow) return;
    const set = new Set([1,2,3,4,5]);
    els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => c.checked = set.has(Number(c.value)));
  });
  els.btnDowAll?.addEventListener('click', () => {
    if (!els.repeatDow) return;
    els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => c.checked = true);
  });
  els.modalDelete?.addEventListener('click', async (e) => {
    if (!state.editingId) return;
    const p = state.punches.find((x) => x.id === state.editingId);
    if (!p) return;
    const applySeries = !!els.applyScopeSeries?.checked && !!p.recurrenceId;
    const force = !!e.shiftKey;
    if (applySeries) {
      if (!force && !confirm('Delete the entire series?')) return;
      const items = state.punches.filter((x) => x.recurrenceId === p.recurrenceId);
      for (const it of items) await idb.remove(it.id);
    } else {
      if (!force && !confirm('Delete this time entry?')) return;
      await idb.remove(state.editingId);
    }
    state.punches = await idb.all();
    state.editingId = null;
    ui.closeModal();
    ui.renderAll();
    ui.toast('Deleted');
  });
  els.btnExtendSeries?.addEventListener('click', async () => {
    if (!state.editingId) return;
    const p = state.punches.find((x) => x.id === state.editingId);
    if (!p?.recurrenceId || !p.recurrence) return;
    const items = state.punches.filter((x) => x.recurrenceId === p.recurrenceId);
    if (!items.length) return;
    const last = items.reduce((a,b) => (String(a.date) > String(b.date) ? a : b));
    const startExt = (() => { const d = new Date(last.date); d.setDate(d.getDate() + 1); return d.toISOString().slice(0,10); })();
    const untilStr = String(els.extendUntil?.value || '');
    const rule = { ...p.recurrence };
    if (untilStr) { rule.until = untilStr; delete rule.count; }
    else { ui.toast('Pick an extend-until date'); return; }
    const dates = expandDates(startExt, rule);
    let seq = items.reduce((m, it) => Math.max(m, Number(it.seq) || 0), 0) + 1;
    let added = 0;
    for (const d of dates) {
      if (state.punches.some((x) => x.recurrenceId === p.recurrenceId && x.date === d)) continue; // don't duplicate
      if (overlapsOnDate(d, p.start, p.end)) continue;
      await idb.add({ start: p.start, end: p.end, bucket: p.bucket, note: p.note, status: p.status || null, date: d, recurrenceId: p.recurrenceId, recurrence: p.recurrence, seq, createdAt: new Date().toISOString(), scheduleId: p.scheduleId });
      seq++; added++;
    }
    state.punches = await idb.all();
    ui.renderAll();
    ui.toast(added ? `Added ${added} more` : 'No new dates to add');
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
    if (e.key !== 'Escape') return;

    // 1) If any app modal is open, close it (always allow ESC to close modals)
    let mainModalOpen = false;
    try { mainModalOpen = !!(els.modal && getComputedStyle(els.modal).display !== 'none'); } catch {}
    if (mainModalOpen) { closeModal(); try { e.preventDefault(); e.stopPropagation(); } catch {} return; }

    let noteModalOpen = false;
    try { noteModalOpen = !!(els.noteModal && getComputedStyle(els.noteModal).display !== 'none'); } catch {}
    if (noteModalOpen) { ui.closeNoteModal?.(); try { e.preventDefault(); e.stopPropagation(); } catch {} return; }

    let settingsOpen = false;
    try { settingsOpen = !!(els.settingsModal && getComputedStyle(els.settingsModal).display !== 'none'); } catch {}
    if (settingsOpen) { try { els.settingsModal.style.display = 'none'; e.preventDefault(); e.stopPropagation(); } catch {} return; }

    // 2) If focus is in an editable control and no modal is open, do nothing
    try {
      const ae = document.activeElement;
      const tn = (ae && ae.tagName ? ae.tagName : '').toLowerCase();
      const isEditable = !!(ae && (ae.isContentEditable || tn === 'input' || tn === 'textarea' || tn === 'select'));
      if (isEditable) return;
    } catch {}

    // 3) Close transient popups/menus (date picker, status menu, note popover)
    try { hideDatePicker(); } catch {}
    try {
      els.rows?.querySelectorAll('.status-wrap.open')?.forEach((w) => w.classList.remove('open'));
      els.modalStatusWrap?.classList.remove('open');
    } catch {}
    ui.hideNotePopover?.();

    // 4) Navigate to Calendar from any main view on Escape
    if (state.viewMode !== 'calendar') {
      state.viewMode = 'calendar';
      ui.updateViewMode();
      try { e.preventDefault(); e.stopPropagation(); } catch {}
    }
  });
  window.addEventListener('resize', () => ui.renderAll());

  window.addEventListener('click', (e) => {
    if (!e.target.closest('.status-wrap')) {
      els.rows.querySelectorAll('.status-wrap.open').forEach((w) => w.classList.remove('open'));
      els.modalStatusWrap?.classList.remove('open');
    }
    if (!e.target.closest('.note-popover') && !e.target.closest('.note-dot') && !e.target.closest('td.note')) {
      ui.hideNotePopover?.();
    }
  });

  // Bucket report links → open Bucket View
  els.bucketDayBody?.addEventListener('click', (e) => {
    const link = e.target.closest('.bucket-link');
    if (!link) return;
    e.preventDefault();
    const tr = link.closest('tr');
    const name = String(tr?.dataset?.bucket ?? '');
    state.lastViewMode = state.viewMode;
    state.bucketFilter = name;
    state.viewMode = 'bucket';
    ui.renderAll();
  });
  els.bucketMonthBody?.addEventListener('click', (e) => {
    const link = e.target.closest('.bucket-link');
    if (!link) return;
    e.preventDefault();
    const tr = link.closest('tr');
    const name = String(tr?.dataset?.bucket ?? '');
    state.lastViewMode = state.viewMode;
    state.bucketFilter = name;
    state.viewMode = 'bucket';
    ui.renderAll();
  });

  // Bucket View controls
  els.btnBucketBack?.addEventListener('click', () => {
        state.viewMode = 'calendar';
            ui.renderAll();
           });
  els.btnBucketBackTop?.addEventListener('click', () => {
        state.viewMode = 'calendar';
            ui.renderAll();
            });
  els.btnBucketDelete?.addEventListener('click', async () => {
    const name = String(state.bucketFilter || '');
    const label = name || '(no bucket)';
    const sched = state.currentScheduleId == null ? null : Number(state.currentScheduleId);
    if (sched == null) { alert('Select a specific schedule to delete a bucket.'); return; }
    const items = state.punches.filter((p) => String(p.bucket || '').trim() === name && Number(p.scheduleId) === sched);
    if (!items.length) { ui.toast('No entries for this bucket.'); return; }
    if (!confirm(`Delete all ${items.length} entries for bucket "${label}"?`)) return;
    for (const p of items) {
      await idb.remove(p.id);
    }
    state.punches = await idb.all();
    state.viewMode = state.lastViewMode || 'day';
    ui.renderAll();
    ui.toast('Bucket deleted');
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

  // Mobile timeline controls: zoom and pan via scrollbar
  const totalMin = 24 * 60;
  const minSpan = 45;
  const getSpan = () => Math.max(1, Math.abs((state.viewEndMin | 0) - (state.viewStartMin | 0)));
  const getStart = () => Math.min(state.viewStartMin | 0, state.viewEndMin | 0);
  const clampStartForSpan = (start, span) => Math.max(0, Math.min(totalMin - span, start));

  const minutesFromScrollbar = (clientX) => {
    const rect = els.mobileScrollbar.getBoundingClientRect();
    const x = Math.min(Math.max(0, clientX - rect.left), Math.max(1, rect.width));
    return Math.round((x / Math.max(1, rect.width)) * totalMin);
  };

  // Click on scrollbar background to center view
  const onScrollbarDown = (e) => {
    if (!els.mobileScrollbar) return;
    if (e.target === els.mobileWindow || e.target.closest('#mobileWindow')) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const span = getSpan();
    const m = minutesFromScrollbar(clientX);
    let start = clampStartForSpan(Math.round(m - span / 2), span);
    setView(start, start + span);
    if (e.cancelable) e.preventDefault();
  };

  let dragWin = null;
  const onWindowDown = (e) => {
    if (!els.mobileScrollbar || !els.mobileWindow) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = els.mobileScrollbar.getBoundingClientRect();
    const span = getSpan();
    const start = getStart();
    const leftPx = (start / totalMin) * rect.width;
    const x = clientX - rect.left;
    dragWin = { offsetPx: x - leftPx, rectW: Math.max(1, rect.width), span };
    window.addEventListener('mousemove', onWindowMove);
    window.addEventListener('touchmove', onWindowMove, { passive: false });
    window.addEventListener('mouseup', onWindowUp);
    window.addEventListener('touchend', onWindowUp);
    if (e.cancelable) e.preventDefault();
  };
  const onWindowMove = (e) => {
    if (!dragWin || !els.mobileScrollbar) return;
    if (e.cancelable) e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = els.mobileScrollbar.getBoundingClientRect();
    let startPx = (clientX - rect.left) - dragWin.offsetPx;
    const maxStartPx = rect.width - (dragWin.span / totalMin) * rect.width;
    startPx = Math.max(0, Math.min(maxStartPx, startPx));
    const startMin = Math.round((startPx / Math.max(1, rect.width)) * totalMin);
    setView(startMin, startMin + dragWin.span);
  };
  const onWindowUp = () => {
    dragWin = null;
    window.removeEventListener('mousemove', onWindowMove);
    window.removeEventListener('touchmove', onWindowMove);
    window.removeEventListener('mouseup', onWindowUp);
    window.removeEventListener('touchend', onWindowUp);
  };

  els.mobileScrollbar?.addEventListener('mousedown', onScrollbarDown);
  els.mobileScrollbar?.addEventListener('touchstart', onScrollbarDown, { passive: false });
  els.mobileWindow?.addEventListener('mousedown', onWindowDown);
  els.mobileWindow?.addEventListener('touchstart', onWindowDown, { passive: false });

  const zoomBy = (factor) => {
    const span = getSpan();
    const center = getStart() + span / 2;
    const newSpan = Math.min(totalMin, Math.max(minSpan, Math.round(span * factor)));
    let newStart = Math.round(center - newSpan / 2);
    newStart = clampStartForSpan(newStart, newSpan);
    setView(newStart, newStart + newSpan);
  };
  els.mobileZoomIn?.addEventListener('click', () => zoomBy(0.8));
  els.mobileZoomOut?.addEventListener('click', () => zoomBy(1.25));
  els.mobileZoomRange?.addEventListener('input', (e) => {
    const val = Math.max(minSpan, Math.min(totalMin, Math.round(Number(e.target.value) || getSpan())));
    const center = getStart() + getSpan() / 2;
    let newStart = Math.round(center - val / 2);
    newStart = clampStartForSpan(newStart, val);
    setView(newStart, newStart + val);
  });

  els.view24?.addEventListener('click', () => setView(0, 24 * 60));
  els.viewDefault?.addEventListener('click', () => setView(6 * 60, 18 * 60));
  const doCopy = async () => {
    try { await copyActions.copyChart(); } catch {}
  };
  els.btnCopyChart?.addEventListener('click', doCopy);
  els.btnCopyChartTop?.addEventListener('click', doCopy);
  els.btnCopyChartTable?.addEventListener('click', doCopy);

  // track click: open note modal when appropriate
  els.track.addEventListener('click', (e) => {
    if (e.shiftKey) {
      // Already handled by earlier listener
      return;
    }
    // Ignore clicks on handles or inline controls used for resize/edit/delete
    if (e.target.closest('.handle') || e.target.closest('.control-btn')) {
      return;
    }
    // Ignore clicks on the label area; label opens the edit modal only
    if (e.target.closest('.punch-label')) {
      return;
    }
    const dot = e.target.closest('.note-dot');
    if (dot) {
      const id = Number(dot.dataset.id);
      if (id) ui.openNoteModal?.(id);
      e.stopPropagation();
      return;
    }
    const punch = e.target.closest('.punch');
    if (punch) {
      const id = Number(punch.dataset.id);
      if (!id) return;
      const p = state.punches.find((x) => x.id === id);
      if (p?.note) {
        ui.openNoteModal?.(id);
        e.stopPropagation();
      }
    }
  });

  // Bucket View: open note modal on note cell click
  els.bucketViewBody?.addEventListener('click', (e) => {
    const noteCell = e.target.closest('td.note');
    if (!noteCell) return;
    const tr = noteCell.closest('tr');
    const id = Number(tr?.dataset?.id);
    if (id) {
      ui.openNoteModal?.(id);
      e.stopPropagation();
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

  // Bucket persistent note autosize + preview
  els.bucketNoteField?.addEventListener('input', () => {
    try {
      els.bucketNoteField.style.height = 'auto';
      const h = Math.max(72, Math.min(320, els.bucketNoteField.scrollHeight || 72));
      els.bucketNoteField.style.height = h + 'px';
      if (els.bucketNotePreview && els.bucketNotePreview.style.display !== 'none') {
        els.bucketNotePreview.innerHTML = mdToHtml(els.bucketNoteField.value);
      }
    } catch {}
  });
  els.bucketNotePreviewToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!els.bucketNotePreview) return;
    const showing = els.bucketNotePreview.style.display !== 'none';
    if (showing) {
      els.bucketNotePreview.style.display = 'none';
      els.bucketNotePreview.innerHTML = '';
      if (els.bucketNotePreviewToggle) els.bucketNotePreviewToggle.textContent = 'Preview';
    } else {
      els.bucketNotePreview.innerHTML = mdToHtml(els.bucketNoteField?.value || '');
      els.bucketNotePreview.style.display = '';
      if (els.bucketNotePreviewToggle) els.bucketNotePreviewToggle.textContent = 'Hide preview';
    }
  });

  // Update bucket note when bucket name changes
  els.bucketField?.addEventListener('input', () => {
    try { loadBucketNoteIntoEditor(els.bucketField.value); } catch {}
  });

  // Note modal controls
  els.noteModalClose?.addEventListener('click', () => ui.closeNoteModal?.());
  els.noteCancel?.addEventListener('click', () => ui.closeNoteModal?.());
  els.noteEditToggle?.addEventListener('click', () => {
    if (!els.noteModal) return;
    const editing = els.noteEditorWrap?.style.display !== 'none';
    if (editing) {
      // switch to viewer for both sections
      if (els.noteEditorWrap) els.noteEditorWrap.style.display = 'none';
      if (els.noteViewer) els.noteViewer.style.display = '';
      if (els.bucketNoteEditorWrap) els.bucketNoteEditorWrap.style.display = 'none';
      if (els.bucketNoteViewer) els.bucketNoteViewer.style.display = '';
      if (els.noteEditToggle) els.noteEditToggle.textContent = 'Edit';
    } else {
      if (els.noteEditorWrap) els.noteEditorWrap.style.display = '';
      if (els.noteViewer) els.noteViewer.style.display = 'none';
      if (els.bucketNoteEditorWrap) els.bucketNoteEditorWrap.style.display = '';
      if (els.bucketNoteViewer) els.bucketNoteViewer.style.display = 'none';
      if (els.noteEditToggle) els.noteEditToggle.textContent = 'View';
    }
  });
  els.noteSave?.addEventListener('click', async () => {
    if (!els.noteModal) return;
    const id = Number(els.noteModal.dataset.id);
    if (!id) return;
    // Read HTML from Quill if available; fallback to viewer text
    let html = '';
    try {
      const q = window.Quill && els.noteEditor && els.noteEditor.__quill ? els.noteEditor.__quill : null;
      if (q && q.root) html = q.root.innerHTML || '';
    } catch {}
    // Read bucket note HTML
    let bhtml = '';
    try {
      const qb = window.Quill && els.bucketNoteEditor && els.bucketNoteEditor.__quill ? els.bucketNoteEditor.__quill : null;
      if (qb && qb.root) bhtml = qb.root.innerHTML || '';
    } catch {}
    // Store as plain string (HTML is allowed; rendering uses DOMPurify)
    const idx = state.punches.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const updated = { ...state.punches[idx], note: String(html || '') };
      await idb.put(updated);
      state.punches[idx] = updated;
      // Save bucket note
      try { await idb.setBucketNote(updated.bucket || '', String(bhtml || '')); } catch {}
      ui.renderAll();
      ui.toast?.('Saved');
      // Close the note modal after saving
      ui.closeNoteModal?.();
    }
  });

  // Date picker: open mini calendar when clicking anywhere on the End on date field/wrap
  const endWrap = els.repeatUntilWrap;
  const endInput = els.repeatUntil;
  const openPicker = (e) => {
    if (!endInput) return;
    // Allow typing as well; just show picker
    showDatePicker(endInput, endInput);
    e.stopPropagation();
  };
  endWrap?.addEventListener('click', (e) => {
    const clickedInput = e.target === endInput || e.target.closest('#repeatUntil');
    // If the native picker icon was clicked, let browser handle too
    openPicker(e);
  });
  endInput?.addEventListener('focus', openPicker);
  // Close picker on outside click (handled by global scroll/resize/Escape); clicking elsewhere in modal should close it
  document.addEventListener('click', (e) => {
    if (!datePopover) return;
    const inside = e.target === datePopover || (datePopover && datePopover.contains(e.target));
    const isEndField = e.target === endInput || (endWrap && endWrap.contains(e.target));
    if (!inside && !isEndField) hideDatePicker();
  }, true);
};

export const actions = {
  attachEvents,
};

