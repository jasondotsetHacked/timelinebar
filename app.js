import { actions } from './src/actions/index.js';
import { idb, schedulesDb } from './src/storage.js';
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
  // Choose current schedule: last used from localStorage or first
  const rawSched = (typeof localStorage !== 'undefined') ? localStorage.getItem('currentScheduleId') : null;
  const savedSchedId = (rawSched === null || rawSched === '') ? null : Number(rawSched);
  const hasSaved = savedSchedId != null && schedules.some((s) => s.id === savedSchedId);
  state.currentScheduleId = hasSaved ? savedSchedId : (schedules[0]?.id || null);
  if (state.currentScheduleId != null) try { localStorage.setItem('currentScheduleId', String(state.currentScheduleId)); } catch {}

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
  // Load dashboard modules from localStorage
  try {
    const raw = localStorage.getItem('dashboard.modules.v1');
    const arr = JSON.parse(raw || '[]');
    if (Array.isArray(arr)) state.dashboardModules = arr;
  } catch {}
  // Load per-view modules (day, month)
  try {
    const rawDay = localStorage.getItem('modules.day.v1');
    const rawMonth = localStorage.getItem('modules.month.v1');
    const arrDay = JSON.parse(rawDay || '[]');
    const arrMonth = JSON.parse(rawMonth || '[]');
    if (Array.isArray(arrDay)) state.dayModules = arrDay;
    if (Array.isArray(arrMonth)) state.monthModules = arrMonth;
  } catch {}
  ui.renderScheduleSelect?.();
  ui.renderAll();
  nowIndicator.init();
}

init();
