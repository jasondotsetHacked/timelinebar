import { actions } from './src/actions.js';
import { idb } from './src/storage.js';
import { state } from './src/state.js';
import { ui } from './src/ui.js';

async function init() {
  actions.attachEvents();
  if (typeof window.DEBUG_HANDLES === 'undefined') {
    window.DEBUG_HANDLES = true;
    console.info('DEBUG_HANDLES enabled — set window.DEBUG_HANDLES = false in console to disable');
  }
  state.punches = await idb.all();
  ui.renderAll();
}

init();

