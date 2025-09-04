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

  // Mirror indicator inside the entries table card (chart below timeline)
  const entriesCard = els.rows ? els.rows.closest('.table-card') : null;
  const tableEl = ensureElIn(entriesCard);
  if (tableEl) {
    if (isInView) {
      tableEl.style.left = pct + '%';
      try {
        const tr = els.track?.getBoundingClientRect();
        const cr = entriesCard?.getBoundingClientRect();
        const dx = tr && cr ? (tr.left - cr.left) : 0;
        // Align the table indicator with the track's inner content (accounts for timeline padding)
        tableEl.style.transform = `translateX(-50%) translateX(${Math.round(dx)}px)`;
      } catch {}
      tableEl.style.display = 'block';
      if (isToday) tableEl.classList.remove('not-today');
      else tableEl.classList.add('not-today');
    } else {
      tableEl.style.display = 'none';
    }
  }
}

let _timer = null;
function init() {
  ensureElIn(els.track);
  const entriesCard = els.rows ? els.rows.closest('.table-card') : null;
  ensureElIn(entriesCard);
  update();
  if (_timer) clearInterval(_timer);
  // Update roughly every 30s to keep it fresh without excess work
  _timer = setInterval(update, 30000);
  try { window.addEventListener('resize', update, { passive: true }); } catch {}
}

export const nowIndicator = { init, update };
