import { els } from './dom.js';
import { state } from './state.js';
import { todayStr, getPunchDate } from './dates.js';

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

function ensureElIn(container) {
  if (!container) return null;
  let el = container.querySelector(':scope > .now-indicator');
  if (!el) {
    el = document.createElement('div');
    el.className = 'now-indicator';
    el.setAttribute('aria-hidden', 'true');
    container.appendChild(el);
  }
  return el;
}

function update() {
  const view = getView();
  const mins = nowMinutes();

  const isInView = !(mins < view.start || mins > view.end);
  const isToday = (state.currentDate || todayStr()) === todayStr();
  const pct = ((mins - view.start) / view.minutes) * 100;

  // Indicator in the main timeline track
  const trackEl = ensureElIn(els.track);
  if (trackEl) {
    if (isInView) {
      trackEl.style.left = pct + '%';
      trackEl.style.display = 'block';
      if (isToday) trackEl.classList.remove('not-today');
      else trackEl.classList.add('not-today');
    } else {
      trackEl.style.display = 'none';
    }
  }

  // Highlight the active punch and its table row (if any)
  try {
    document.querySelectorAll('.punch.is-active').forEach((n) => n.classList.remove('is-active'));
    els.rows?.querySelectorAll('tr.is-active').forEach((n) => n.classList.remove('is-active'));
  } catch {}

  if (isToday) {
    try {
      const day = todayStr();
      const active = state.punches.find((p) => (getPunchDate(p) === day) && (p.start <= mins) && (mins < p.end));
      if (active) {
        const punchEl = els.track?.querySelector(`.punch[data-id="${active.id}"]`);
        if (punchEl) punchEl.classList.add('is-active');
        const rowEl = els.rows?.querySelector(`tr[data-id="${active.id}"]`);
        if (rowEl) rowEl.classList.add('is-active');
      }
    } catch {}
  }
}

let _timer = null;
function init() {
  ensureElIn(els.track);
  update();
  if (_timer) clearInterval(_timer);
  // Update roughly every 30s to keep it fresh without excess work
  _timer = setInterval(update, 30000);
  try { window.addEventListener('resize', update, { passive: true }); } catch {}
}

export const nowIndicator = { init, update };
