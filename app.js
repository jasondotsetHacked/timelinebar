import { actions } from './src/actions/index.js';
import { idb, schedulesDb, scheduleViewsDb } from './src/storage.js';
import { state } from './src/state.js';
import { ui } from './src/ui.js';
import { nowIndicator } from './src/nowIndicator.js';
import { todayStr } from './src/dates.js';

async function init() {
  actions.attachEvents();
  if (typeof window.DEBUG_HANDLES === 'undefined') {
    window.DEBUG_HANDLES = false; // keep off by default to reduce console noise
  }
  state.punches = await idb.all();
  // Load schedules; ensure a Default schedule exists; migrate punches to have scheduleId
  let schedules = await schedulesDb.allSchedules();
  if (!schedules || !schedules.length) {
    const id = await schedulesDb.addSchedule({ name: 'Default' });
    // In some browsers, add returns undefined; reload all to get id
    schedules = await schedulesDb.allSchedules();
  }
  state.schedules = schedules;
  // Load schedule views
  try {
    state.scheduleViews = await (scheduleViewsDb.allScheduleViews?.() || Promise.resolve([]));
  } catch { state.scheduleViews = []; }
  // Runtime diagnostics: detect duplicate schedule names
  try {
    const seen = new Map();
    for (const s of schedules || []) {
      const n = String(s?.name || '');
      if (!seen.has(n)) seen.set(n, []);
      seen.get(n).push(s.id);
    }
    const dups = Array.from(seen.entries()).filter(([, ids]) => (ids || []).length > 1);
    if (dups.length) {
      const details = dups.map(([n, ids]) => `${n}: [${ids.join(', ')}]`).join(' | ');
      console.error(new Error(`SchemaError: Duplicate schedule names found — ${details}`));
    }
  } catch {}
  // Choose current selection: prefer saved view; else saved schedule; else first schedule
  const ls = (typeof localStorage !== 'undefined') ? localStorage : null;
  const rawView = ls ? ls.getItem('currentScheduleViewId') : null;
  const savedViewId = (rawView === null || rawView === '') ? null : Number(rawView);
  const hasSavedView = savedViewId != null && (state.scheduleViews || []).some((v) => Number(v.id) === savedViewId);
  const rawSched = ls ? ls.getItem('currentScheduleId') : null;
  const savedSchedId = (rawSched === null || rawSched === '') ? null : Number(rawSched);
  const hasSaved = savedSchedId != null && schedules.some((s) => s.id === savedSchedId);
  if (hasSavedView) {
    state.currentScheduleViewId = savedViewId;
    state.currentScheduleId = null;
  } else {
    state.currentScheduleViewId = null;
    state.currentScheduleId = hasSaved ? savedSchedId : (schedules[0]?.id || null);
  }
  try {
    if (state.currentScheduleViewId != null) ls?.setItem('currentScheduleViewId', String(state.currentScheduleViewId));
    else ls?.removeItem('currentScheduleViewId');
  } catch {}
  try {
    if (state.currentScheduleId != null) ls?.setItem('currentScheduleId', String(state.currentScheduleId));
  } catch {}

  // Migration: ensure each punch has a date (YYYY-MM-DD) and rename caseNumber -> bucket
  const updates = [];
  for (const p of state.punches) {
    if (!p.date) {
      const d = (p.createdAt && String(p.createdAt).slice(0, 10)) || todayStr();
      updates.push({ ...p, date: d });
    }
    // Rename caseNumber to bucket for existing records
    if (p.caseNumber && !p.bucket) {
      const { caseNumber, ...rest } = p;
      updates.push({ ...rest, bucket: caseNumber });
    }
    // v3: assign default scheduleId if missing
    if (p.scheduleId == null && state.currentScheduleId != null) {
      updates.push({ ...p, scheduleId: state.currentScheduleId });
    }
  }
  if (updates.length) {
    for (const up of updates) await idb.put(up);
    state.punches = await idb.all();
  }
  // (Customizable dashboards removed)
  ui.renderScheduleSelect?.();
  ui.renderAll();
  nowIndicator.init();
}

init();
