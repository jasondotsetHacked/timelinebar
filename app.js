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
  ui.renderScheduleSelect?.();
  ui.renderAll();
  nowIndicator.init();
}

init();
