import { els } from './dom.js';
import { state } from './state.js';
import { todayStr } from './dates.js';

function getView() {
  const start = Math.max(0, Math.min(24 * 60, Number(state.viewStartMin)));
  const end = Math.max(0, Math.min(24 * 60, Number(state.viewEndMin)));
  const s = Math.min(start, end);
  const e = Math.max(start, end);
  const minutes = Math.max(1, e - s);
  return { start: s, end: e, minutes };
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

function ensureEl() {
  let el = els.track.querySelector('.now-indicator');
  if (!el) {
    el = document.createElement('div');
    el.className = 'now-indicator';
    el.setAttribute('aria-hidden', 'true');
    els.track.appendChild(el);
  }
  return el;
}

function update() {
  const el = ensureEl();
  const view = getView();
  const mins = nowMinutes();
  // Only show within the visible time range
  if (mins < view.start || mins > view.end) {
    el.style.display = 'none';
    return;
  }
  // Toggle active vs. inactive (not-today) appearance
  const isToday = (state.currentDate || todayStr()) === todayStr();
  if (isToday) el.classList.remove('not-today');
  else el.classList.add('not-today');
  const pct = ((mins - view.start) / view.minutes) * 100;
  el.style.left = pct + '%';
  el.style.display = 'block';
}

let _timer = null;
function init() {
  ensureEl();
  update();
  if (_timer) clearInterval(_timer);
  // Update roughly every 30s to keep it fresh without excess work
  _timer = setInterval(update, 30000);
}

export const nowIndicator = { init, update };
