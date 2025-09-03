import { actions } from './src/actions.js';
import { idb } from './src/storage.js';
import { state } from './src/state.js';
import { ui } from './src/ui.js';
import { nowIndicator } from './src/nowIndicator.js';
import { todayStr } from './src/dates.js';

async function init() {
  actions.attachEvents();
  if (typeof window.DEBUG_HANDLES === 'undefined') {
    window.DEBUG_HANDLES = true;
    console.info('DEBUG_HANDLES enabled — set window.DEBUG_HANDLES = false in console to disable');
  }
  state.punches = await idb.all();
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
  }
  if (updates.length) {
    for (const up of updates) await idb.put(up);
    state.punches = await idb.all();
  }
  ui.renderAll();
  nowIndicator.init();
}

init();
