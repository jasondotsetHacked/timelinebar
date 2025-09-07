import { els } from '../dom.js';
import { idb, schedulesDb, scheduleViewsDb, destroy as wipeDb } from '../storage.js';
import { state } from '../state.js';
import { ui } from '../ui.js';
import { todayStr } from '../dates.js';
import { assertSchedule, assertScheduleView, validateBackup } from '../validate.js';

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
    const schedules = await (schedulesDb.allSchedules?.() || Promise.resolve([]));
    const scheduleViews = await (scheduleViewsDb.allScheduleViews?.() || Promise.resolve([]));
    const payload = {
      app: 'timelinebar',
      kind: 'time-tracker-backup',
      version: 3,
      exportedAt: new Date().toISOString(),
      count: punches.length,
      punches,
      buckets,
      schedules,
      scheduleViews,
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

function sanitizeItem(x, map = null, defaultScheduleId = null) {
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
  // schedule mapping
  let scheduleId = null;
  if (x.scheduleId != null && Number.isFinite(Number(x.scheduleId))) {
    const sid = Number(x.scheduleId);
    scheduleId = map && map.has(sid) ? Number(map.get(sid)) : (defaultScheduleId != null ? Number(defaultScheduleId) : null);
  } else if (defaultScheduleId != null) {
    scheduleId = Number(defaultScheduleId);
  }
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
    scheduleId,
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
    // Validate (non-fatal)
    try {
      const { valid, errors } = validateBackup(Array.isArray(data) ? { punches: data, version: 2 } : data);
      if (!valid) console.warn('Backup validation warnings:', errors);
    } catch {}

    let items = Array.isArray(data) ? data : (Array.isArray(data?.punches) ? data.punches : []);
    if (!Array.isArray(items) || items.length === 0) {
      ui.toast('No punches to import');
      // still try buckets, if present
    }
    // Prepare schedules mapping
    const existing = await (schedulesDb.allSchedules?.() || Promise.resolve([]));
    const existingByName = new Map((existing || []).map((s) => [String(s.name || '').toLowerCase(), Number(s.id)]));
    const map = new Map(); // oldId -> newId
    let schedCreated = 0;
    const importedSchedules = Array.isArray(data?.schedules) ? data.schedules : [];
    if (importedSchedules.length) {
      // v3: merge schedules by name
      for (const s of importedSchedules) {
        const rawName = String(s?.name || '').trim();
        if (!rawName) continue;
        try { assertSchedule({ name: rawName }); } catch { continue; }
        const key = rawName.toLowerCase();
        let newId = existingByName.get(key);
        if (newId == null) {
          try {
            await schedulesDb.addSchedule({ name: rawName });
            const latest = await schedulesDb.allSchedules();
            newId = Number(latest[latest.length - 1]?.id);
            existingByName.set(key, newId);
            schedCreated++;
          } catch {}
        }
        if (s?.id != null && newId != null) map.set(Number(s.id), Number(newId));
      }
    } else {
      // v2: no schedules array; create placeholder schedules for distinct scheduleId values
      const uniqueOldIds = new Set(
        (items || []).map((p) => p && p.scheduleId).filter((v) => v != null && Number.isFinite(Number(v))).map((v) => Number(v))
      );
      for (const oldId of uniqueOldIds) {
        const placeholder = `Imported #${oldId}`;
        const key = placeholder.toLowerCase();
        let newId = existingByName.get(key);
        if (newId == null) {
          try {
            await schedulesDb.addSchedule({ name: placeholder });
            const latest = await schedulesDb.allSchedules();
            newId = Number(latest[latest.length - 1]?.id);
            existingByName.set(key, newId);
            schedCreated++;
          } catch {}
        }
        if (newId != null) map.set(Number(oldId), Number(newId));
      }
    }

    // Import schedule views (map scheduleIds to new IDs)
    try {
      const importedViews = Array.isArray(data?.scheduleViews) ? data.scheduleViews : [];
      if (importedViews.length) {
        for (const v of importedViews) {
          const name = String(v?.name || '').trim();
          const ids = Array.isArray(v?.scheduleIds) ? v.scheduleIds.map(Number) : [];
          // Map using known old->new id map; drop unknowns
          const mapped = ids
            .map((oldId) => (map.has(oldId) ? Number(map.get(oldId)) : null))
            .filter((x) => Number.isFinite(x));
          if (!name || !mapped.length) continue;
          try { await scheduleViewsDb.addScheduleView({ name, scheduleIds: mapped }); } catch {}
        }
      }
    } catch {}

    // Default schedule if nothing maps
    const allSchedules = await schedulesDb.allSchedules();
    const defaultScheduleId = allSchedules?.[0]?.id ?? null;

    // Build duplicate detection set from existing punches
    const existingPunches = await idb.all();
    const makeKey = (p) => [p.date, p.start, p.end, p.bucket || '', p.note || '', p.scheduleId == null ? '' : p.scheduleId].join('|');
    const seen = new Set((existingPunches || []).map(makeKey));

    let added = 0;
    if (Array.isArray(items) && items.length) {
      for (const it of items) {
        const clean = sanitizeItem(it, map, defaultScheduleId);
        if (!clean) continue;
        const key = makeKey(clean);
        if (seen.has(key)) continue; // skip duplicates
        await idb.add(clean);
        seen.add(key);
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
    try { state.schedules = await schedulesDb.allSchedules(); } catch {}
    ui.renderScheduleSelect?.();
    ui.renderAll();
    const parts = [];
    parts.push(`Imported ${added} entr${added === 1 ? 'y' : 'ies'}`);
    if (bAdded) parts.push(`${bAdded} bucket note${bAdded===1?'':'s'}`);
    if (schedCreated) parts.push(`${schedCreated} schedule${schedCreated===1?'':'s'} created`);
    ui.toast(parts.join(', '));
  } catch (err) {
    console.error(err);
    ui.toast('Import failed');
  }
}

async function eraseAll() {
  if (!confirm('Erase ALL data and settings? This cannot be undone.')) return;
  try {
    // Delete the entire DB
    await wipeDb();
    // Clear app-local storage keys
    try { localStorage.removeItem('currentScheduleId'); } catch {}
    try { localStorage.removeItem('currentScheduleViewId'); } catch {}
    try { localStorage.removeItem('tt.theme'); } catch {}
    // Reset in-memory state
    state.punches = [];
    state.schedules = [];
    state.scheduleViews = [];
    state.currentScheduleId = null;
    state.currentScheduleViewId = null;
    ui.renderScheduleSelect?.();
    ui.renderAll();
    ui.toast('All data erased (database wiped)');
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
  try { if (els.settingsSchedNameWrap) els.settingsSchedNameWrap.style.display = 'none'; } catch {}
  try { if (els.settingsViewNameWrap) els.settingsViewNameWrap.style.display = 'none'; } catch {}
}

function attach() {
  // Initialize theme from storage
  try {
    const saved = localStorage.getItem('tt.theme') || 'neon';
    applyTheme(saved);
  } catch {}

  els.btnSettings?.addEventListener('click', () => { try { renderSettingsSchedules(); } catch {}; openSettings(); });
  // Also render views section when opening
  els.btnSettings?.addEventListener('click', () => { try { renderSettingsViews(); } catch {} });
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
  let schedRenameMode = false;
  function toggleSchedRename(on = false) {
    try {
      schedRenameMode = !!on;
      if (els.settingsSchedNameWrap) els.settingsSchedNameWrap.style.display = on ? '' : 'none';
      if (on) {
        const id = Number(els.settingsSchedList?.value || '');
        const cur = (state.schedules || []).find((s) => Number(s.id) === id);
        if (cur && els.settingsSchedName) { els.settingsSchedName.value = cur.name || ''; els.settingsSchedName.focus(); }
      } else {
        if (els.settingsSchedName) els.settingsSchedName.value = '';
      }
    } catch {}
  }
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

  // --- Schedule Views UI in Settings ---
  function renderViewSchedChecks(selectedIds = []) {
    try {
      const wrap = els.settingsViewSchedChecks;
      if (!wrap) return;
      wrap.innerHTML = '';
      const list = state.schedules || [];
      const set = new Set((selectedIds || []).map(Number));
      for (const s of list) {
        const id = String(s.id);
        const label = document.createElement('label');
        label.style.display = 'inline-flex';
        label.style.alignItems = 'center';
        label.style.gap = '6px';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = id;
        cb.checked = set.has(Number(id));
        const span = document.createElement('span');
        span.textContent = s.name || `Schedule ${s.id}`;
        label.append(cb, span);
        wrap.appendChild(label);
      }
    } catch {}
  }
  function populateViewSelect() {
    if (!els.settingsViewList) return;
    els.settingsViewList.innerHTML = '';
    const views = (state.scheduleViews || []).slice().sort((a, b) => String(a.name||'').localeCompare(String(b.name||'')));
    for (const v of views) {
      const opt = document.createElement('option');
      opt.value = String(v.id);
      opt.textContent = v.name || `View ${v.id}`;
      els.settingsViewList.appendChild(opt);
    }
  }
  function renderSettingsViews() {
    try {
      populateViewSelect();
      const selId = Number(els.settingsViewList?.value || '');
      const cur = (state.scheduleViews || []).find((v) => Number(v.id) === selId) || null;
      if (els.settingsViewName) els.settingsViewName.value = cur?.name || '';
      renderViewSchedChecks(cur?.scheduleIds || []);
    } catch {}
  }
  renderSettingsViews();

  function setViewMsg(text) { try { if (els.settingsViewMsg) els.settingsViewMsg.textContent = text || ''; } catch {} }
  function readCheckedScheduleIds() {
    const wrap = els.settingsViewSchedChecks;
    if (!wrap) return [];
    return Array.from(wrap.querySelectorAll('input[type="checkbox"]'))
      .filter((c) => c.checked)
      .map((c) => Number(c.value));
  }
  function viewNameExists(raw, excludeId = null) {
    const name = String(raw || '').trim();
    return (state.scheduleViews || []).some((v) => v && String(v.name) === name && (excludeId == null || Number(v.id) !== Number(excludeId)));
  }
  els.settingsViewList?.addEventListener('change', () => renderSettingsViews());
  let viewAddMode = false;
  let viewRenameMode = false;
  function toggleViewName(on = false, initial = '') {
    try {
      if (els.settingsViewNameWrap) els.settingsViewNameWrap.style.display = on ? '' : 'none';
      if (on) {
        if (els.settingsViewName) { els.settingsViewName.value = initial || ''; els.settingsViewName.focus(); }
      } else {
        if (els.settingsViewName) els.settingsViewName.value = '';
      }
    } catch {}
  }
  els.settingsAddView?.addEventListener('click', async () => {
    setViewMsg('');
    if (!viewAddMode) {
      viewAddMode = true; viewRenameMode = false;
      toggleViewName(true, '');
      setViewMsg('Enter a view name, then press Add again.');
      return;
    }
    const name = String(els.settingsViewName?.value || '').trim();
    const ids = readCheckedScheduleIds();
    if (!name) { setViewMsg('Enter a view name.'); return; }
    if (!ids.length) { setViewMsg('Select one or more schedules.'); return; }
    if (viewNameExists(name)) { setViewMsg('Name already exists.'); return; }
    try { assertScheduleView({ name, scheduleIds: ids }); } catch (err) { console.error(err); setViewMsg('Invalid view.'); return; }
    try {
      await scheduleViewsDb.addScheduleView({ name, scheduleIds: ids });
      state.scheduleViews = await (scheduleViewsDb.allScheduleViews?.() || Promise.resolve([]));
      populateViewSelect();
      setViewMsg('Added view.');
      ui.renderScheduleSelect?.();
      viewAddMode = false; toggleViewName(false);
    } catch (err) {
      console.error(err); setViewMsg('Could not add view.');
    }
  });
  els.settingsRenameView?.addEventListener('click', async () => {
    setViewMsg('');
    const id = Number(els.settingsViewList?.value || '');
    const cur = (state.scheduleViews || []).find((v) => Number(v.id) === id);
    if (!cur) { setViewMsg('Select a view to rename.'); return; }
    if (!viewRenameMode) {
      viewRenameMode = true; viewAddMode = false;
      toggleViewName(true, cur.name || '');
      setViewMsg('Enter a new name, then press Rename again.');
      return;
    }
    const name = String(els.settingsViewName?.value || '').trim();
    if (!name) { setViewMsg('Enter a new name.'); return; }
    if (viewNameExists(name, id)) { setViewMsg('Name already exists.'); return; }
    try { assertScheduleView({ name, scheduleIds: cur.scheduleIds || [] }); } catch (err) { console.error(err); setViewMsg('Invalid view.'); return; }
    try {
      await scheduleViewsDb.putScheduleView({ ...cur, name });
      state.scheduleViews = await (scheduleViewsDb.allScheduleViews?.() || Promise.resolve([]));
      populateViewSelect();
      if (els.settingsViewList) els.settingsViewList.value = String(id);
      setViewMsg('Renamed view.');
      ui.renderScheduleSelect?.();
      viewRenameMode = false; toggleViewName(false);
    } catch (err) {
      console.error(err); setViewMsg('Could not rename view.');
    }
  });
  els.settingsDeleteView?.addEventListener('click', async () => {
    setViewMsg('');
    const id = Number(els.settingsViewList?.value || '');
    const cur = (state.scheduleViews || []).find((v) => Number(v.id) === id);
    if (!cur) { setViewMsg('Select a view to delete.'); return; }
    if (!confirm(`Delete view "${cur.name || id}"?`)) return;
    try {
      await scheduleViewsDb.removeScheduleView(id);
      state.scheduleViews = await (scheduleViewsDb.allScheduleViews?.() || Promise.resolve([]));
      populateViewSelect();
      renderSettingsViews();
      // If deleting the active view, reset selection
      if (Number(state.currentScheduleViewId) === id) {
        state.currentScheduleViewId = null;
        try { localStorage.removeItem('currentScheduleViewId'); } catch {}
        ui.renderAll();
      }
      setViewMsg('Deleted view.');
      ui.renderScheduleSelect?.();
    } catch (err) {
      console.error(err); setViewMsg('Could not delete view.');
    }
  });
  els.settingsSaveView?.addEventListener('click', async () => {
    setViewMsg('');
    const id = Number(els.settingsViewList?.value || '');
    const cur = (state.scheduleViews || []).find((v) => Number(v.id) === id);
    if (!cur) { setViewMsg('Select a view to save.'); return; }
    const ids = readCheckedScheduleIds();
    if (!ids.length) { setViewMsg('Select one or more schedules.'); return; }
    try { assertScheduleView({ name: cur.name || '', scheduleIds: ids }); } catch (err) { console.error(err); setViewMsg('Invalid view.'); return; }
    try {
      await scheduleViewsDb.putScheduleView({ ...cur, scheduleIds: ids });
      state.scheduleViews = await (scheduleViewsDb.allScheduleViews?.() || Promise.resolve([]));
      setViewMsg('Saved view.');
      ui.renderScheduleSelect?.();
      ui.renderAll?.();
    } catch (err) {
      console.error(err); setViewMsg('Could not save view.');
    }
  });
  try { renderSettingsViews(); } catch {}

  function showMsg(text) { try { if (els.settingsSchedMsg) { els.settingsSchedMsg.textContent = text || ''; } } catch {} }
  function hideDeleteConfirm() { try { if (els.settingsDeleteConfirm) els.settingsDeleteConfirm.style.display = 'none'; } catch {} }
  function showDeleteConfirm(text) { try { if (els.settingsDeleteConfirm) els.settingsDeleteConfirm.style.display = ''; if (els.settingsDeleteConfirmText) els.settingsDeleteConfirmText.textContent = text || 'Confirm delete?'; } catch {} }

  function nameExists(raw, excludeId = null) {
    const name = String(raw || '').trim();
    return (state.schedules || []).some((s) => s && String(s.name) === name && (excludeId == null || Number(s.id) !== Number(excludeId)));
  }

  els.settingsRenameSched?.addEventListener('click', async () => {
    hideDeleteConfirm();
    const id = Number(els.settingsSchedList?.value || '');
    const cur = (state.schedules || []).find((s) => Number(s.id) === id);
    if (!cur) { showMsg('Select a schedule to rename.'); return; }
    if (!schedRenameMode) {
      toggleSchedRename(true);
      showMsg('Enter a new name, then press Rename again.');
      return;
    }
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
    toggleSchedRename(false);
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
