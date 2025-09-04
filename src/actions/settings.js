import { els } from '../dom.js';
import { idb } from '../storage.js';
import { state } from '../state.js';
import { ui } from '../ui.js';
import { todayStr } from '../dates.js';

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
    const payload = {
      app: 'timelinebar',
      kind: 'time-tracker-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      count: punches.length,
      punches,
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
      return;
    }
    let added = 0;
    for (const it of items) {
      const clean = sanitizeItem(it);
      if (!clean) continue;
      // Merge import: ignore incoming id, let DB assign new one
      await idb.add(clean);
      added++;
    }
    state.punches = await idb.all();
    ui.renderAll();
    ui.toast(`Imported ${added} entr${added === 1 ? 'y' : 'ies'}`);
  } catch (err) {
    console.error(err);
    ui.toast('Import failed');
  }
}

async function eraseAll() {
  if (!confirm('Erase ALL tracked data? This cannot be undone.')) return;
  try {
    await idb.clear();
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

  els.btnSettings?.addEventListener('click', openSettings);
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
}

export const settingsActions = { attach };
