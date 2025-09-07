import { els } from '../dom.js';
import { idb, schedulesDb } from '../storage.js';
import { state } from '../state.js';
import { ui } from '../ui.js';
import { todayStr } from '../dates.js';
import { assertSchedule } from '../validate.js';

function applyTheme(theme) {
  const t = theme === 'light' ? 'light' : 'neon';
  try {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('tt.theme', t);
    if (els.themeSelect) els.themeSelect.value = t;
  } catch {}
}

async function exportData() {
  try {
    const punches = await idb.all();
    const buckets = await (idb.allBuckets?.() || Promise.resolve([]));
    const payload = {
      app: 'timelinebar',
      kind: 'time-tracker-backup',
      version: 2,
      exportedAt: new Date().toISOString(),
      count: punches.length,
      punches,
      buckets,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `time-tracker-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    ui.toast('Exported data');
  } catch (err) {
    console.error(err);
    ui.toast('Export failed');
  }
}

function sanitizeItem(x) {
  if (!x || typeof x !== 'object') return null;
  const start = Math.max(0, Math.min(1440, Math.floor(Number(x.start)))) || 0;
  const end = Math.max(0, Math.min(1440, Math.floor(Number(x.end)))) || 0;
  if (end <= start) return null;
  const bucket = (x.bucket || x.caseNumber || '').toString().trim();
  const note = (x.note || '').toString();
  const date = (x.date || (x.createdAt && String(x.createdAt).slice(0, 10)) || todayStr()).toString();
  const okDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const createdAt = (x.createdAt || new Date().toISOString()).toString();
  const st = (x.status || null);
  const allowed = new Set([null, 'default', 'green', 'green-solid', 'yellow', 'yellow-solid', 'red', 'red-solid', 'blue', 'blue-solid', 'purple', 'purple-solid']);
  const status = allowed.has(st) ? st : null;
  const recurrenceId = x.recurrenceId ? String(x.recurrenceId) : null;
  const seq = Number.isFinite(x.seq) ? Math.max(0, Math.floor(Number(x.seq))) : 0;
  const rec = (() => {
    const r = x.recurrence;
    if (!r || typeof r !== 'object') return null;
    const f = ['daily', 'weekly', 'monthly', 'yearly'].includes(r.freq) ? r.freq : 'weekly';
    const interval = Math.max(1, Math.floor(Number(r.interval || 1)));
    const until = r.until && /^\d{4}-\d{2}-\d{2}$/.test(String(r.until)) ? String(r.until) : null;
    const count = r.count ? Math.max(1, Math.floor(Number(r.count))) : null;
    const out = { freq: f, interval };
    if (until) out.until = until; else if (count) out.count = count;
    return out;
  })();
  return {
    start,
    end,
    bucket,
    note,
    date: okDate ? date : todayStr(),
    createdAt,
    status,
    recurrenceId,
    recurrence: rec,
    seq,
  };
}

async function importDataFromFile(file) {
  try {
    const text = await file.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      ui.toast('Invalid JSON');
      return;
    }
    let items = Array.isArray(data) ? data : (Array.isArray(data?.punches) ? data.punches : []);
    if (!Array.isArray(items) || items.length === 0) {
      ui.toast('No punches to import');
      // still try buckets, if present
    }
    let added = 0;
    if (Array.isArray(items) && items.length) {
      for (const it of items) {
        const clean = sanitizeItem(it);
        if (!clean) continue;
        await idb.add(clean);
        added++;
      }
    }
    // Buckets
    const bks = Array.isArray(data?.buckets) ? data.buckets : [];
    let bAdded = 0;
    for (const b of bks) {
      const name = (b?.name ?? '').toString();
      const note = (b?.note ?? '').toString();
      if (name != null) { try { await idb.setBucketNote(name, note); bAdded++; } catch {} }
    }
    state.punches = await idb.all();
    ui.renderAll();
    const msg = `Imported ${added} entr${added === 1 ? 'y' : 'ies'}${bAdded ? `, ${bAdded} bucket note${bAdded===1?'':'s'}` : ''}`;
    ui.toast(msg);
  } catch (err) {
    console.error(err);
    ui.toast('Import failed');
  }
}

async function eraseAll() {
  if (!confirm('Erase ALL tracked data? This cannot be undone.')) return;
  try {
    await idb.clear();
    try { await idb.clearBuckets?.(); } catch {}
    state.punches = await idb.all();
    ui.renderAll();
    ui.toast('All data erased');
  } catch (err) {
    console.error(err);
    ui.toast('Erase failed');
  }
}

function openSettings() {
  if (els.settingsModal) els.settingsModal.style.display = 'flex';
}
function closeSettings() {
  if (els.settingsModal) els.settingsModal.style.display = 'none';
}

function attach() {
  // Initialize theme from storage
  try {
    const saved = localStorage.getItem('tt.theme') || 'neon';
    applyTheme(saved);
  } catch {}

  els.btnSettings?.addEventListener('click', () => { try { renderSettingsSchedules(); } catch {}; openSettings(); });
  els.settingsClose?.addEventListener('click', closeSettings);
  els.settingsCancel?.addEventListener('click', closeSettings);

  els.btnExport?.addEventListener('click', exportData);
  els.lblBackup?.addEventListener('click', exportData);
  els.btnImport?.addEventListener('click', () => els.importFile?.click());
  els.lblRestore?.addEventListener('click', () => els.importFile?.click());
  els.importFile?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) importDataFromFile(file);
    e.target.value = '';
  });
  els.btnEraseAll?.addEventListener('click', eraseAll);

  els.themeSelect?.addEventListener('change', (e) => applyTheme(e.target.value));

  // --- Schedules UI in Settings ---
  function populateScheduleSelect(el, allowAll = false) {
    if (!el) return;
    el.innerHTML = '';
    const list = state.schedules || [];
    if (allowAll) {
      const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'All Schedules'; el.appendChild(opt);
    }
    for (const s of list) {
      const opt = document.createElement('option'); opt.value = String(s.id); opt.textContent = s.name || `Schedule ${s.id}`; el.appendChild(opt);
    }
  }
  function renderSettingsSchedules() {
    try {
      populateScheduleSelect(els.settingsSchedList, false);
      if (els.settingsSchedList && state.currentScheduleId != null) {
        els.settingsSchedList.value = String(state.currentScheduleId);
      }
    } catch {}
  }
  renderSettingsSchedules();

  function showMsg(text) { try { if (els.settingsSchedMsg) { els.settingsSchedMsg.textContent = text || ''; } } catch {} }
  function hideDeleteConfirm() { try { if (els.settingsDeleteConfirm) els.settingsDeleteConfirm.style.display = 'none'; } catch {} }
  function showDeleteConfirm(text) { try { if (els.settingsDeleteConfirm) els.settingsDeleteConfirm.style.display = ''; if (els.settingsDeleteConfirmText) els.settingsDeleteConfirmText.textContent = text || 'Confirm delete?'; } catch {} }

  function nameExists(raw, excludeId = null) {
    const name = String(raw || '').trim();
    return (state.schedules || []).some((s) => s && String(s.name) === name && (excludeId == null || Number(s.id) !== Number(excludeId)));
  }

  els.settingsAddSched?.addEventListener('click', async () => {
    hideDeleteConfirm();
    const raw = String(els.settingsSchedName?.value || '').trim();
    if (!raw) { showMsg('Enter a name to add a schedule.'); return; }
    try {
      assertSchedule({ name: raw });
    } catch (err) {
      console.error(err);
      showMsg('Invalid name. Please enter 1–200 characters.');
      return;
    }
    if (nameExists(raw)) {
      const err = new Error('ConstraintError: schedule name must be unique');
      err.name = 'ConstraintError';
      console.error(err);
      showMsg('Name already exists. Choose a different name.');
      return;
    }
    try {
      await schedulesDb.addSchedule({ name: raw });
    } catch (err) {
      // Surface DB-like errors (e.g., if a unique constraint is added later)
      console.error(err);
      showMsg('Could not add schedule: ' + (err?.message || 'Database error'));
      return;
    }
    state.schedules = await schedulesDb.allSchedules();
    state.currentScheduleId = state.schedules[state.schedules.length - 1]?.id ?? state.currentScheduleId;
    try { localStorage.setItem('currentScheduleId', String(state.currentScheduleId ?? '')); } catch {}
    ui.renderScheduleSelect?.();
    renderSettingsSchedules();
    ui.renderAll();
    try { if (els.settingsSchedName) els.settingsSchedName.value = ''; } catch {}
    showMsg('Added schedule.');
  });
  els.settingsRenameSched?.addEventListener('click', async () => {
    hideDeleteConfirm();
    const id = Number(els.settingsSchedList?.value || '');
    const cur = (state.schedules || []).find((s) => Number(s.id) === id);
    if (!cur) { showMsg('Select a schedule to rename.'); return; }
    const raw = String(els.settingsSchedName?.value || '').trim();
    if (!raw) { showMsg('Enter a new name to rename.'); return; }
    try {
      assertSchedule({ name: raw });
    } catch (err) {
      console.error(err);
      showMsg('Invalid name. Please enter 1–200 characters.');
      return;
    }
    if (nameExists(raw, id)) {
      const err = new Error('ConstraintError: schedule name must be unique');
      err.name = 'ConstraintError';
      console.error(err);
      showMsg('Name already exists. Choose a different name.');
      return;
    }
    try {
      await schedulesDb.putSchedule({ ...cur, name: raw });
    } catch (err) {
      console.error(err);
      showMsg('Could not rename: ' + (err?.message || 'Database error'));
      return;
    }
    state.schedules = await schedulesDb.allSchedules();
    ui.renderScheduleSelect?.();
    renderSettingsSchedules();
    showMsg('Renamed schedule.');
  });
  els.settingsDeleteSched?.addEventListener('click', async () => {
    hideDeleteConfirm();
    const id = Number(els.settingsSchedList?.value || '');
    const list = state.schedules || [];
    const cur = list.find((s) => Number(s.id) === id);
    if (!cur) { showMsg('Select a schedule to delete.'); return; }
    if (list.length <= 1) { showMsg('Cannot delete the only schedule.'); return; }
    const used = state.punches.some((p) => Number(p.scheduleId) === id);
    if (used) { showMsg('Schedule has entries. Move or delete entries first.'); return; }
    showDeleteConfirm(`Delete schedule "${cur?.name || id}"?`);
    const onYes = async () => {
      try {
        await schedulesDb.removeSchedule(id);
        state.schedules = await schedulesDb.allSchedules();
        if (Number(state.currentScheduleId) === id) {
          state.currentScheduleId = state.schedules[0]?.id ?? null;
          try { localStorage.setItem('currentScheduleId', String(state.currentScheduleId ?? '')); } catch {}
        }
        ui.renderScheduleSelect?.();
        renderSettingsSchedules();
        ui.renderAll();
        showMsg('Deleted schedule.');
      } finally {
        hideDeleteConfirm();
        try { els.settingsDeleteYes?.removeEventListener('click', onYes); } catch {}
        try { els.settingsDeleteNo?.removeEventListener('click', onNo); } catch {}
      }
    };
    const onNo = () => {
      hideDeleteConfirm();
      try { els.settingsDeleteYes?.removeEventListener('click', onYes); } catch {}
      try { els.settingsDeleteNo?.removeEventListener('click', onNo); } catch {}
    };
    els.settingsDeleteYes?.addEventListener('click', onYes);
    els.settingsDeleteNo?.addEventListener('click', onNo);
  });

  // Removed: move-between-schedules and customize-dashboard actions
}

export const settingsActions = { attach };
