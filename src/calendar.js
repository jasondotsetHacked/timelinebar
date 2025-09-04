import { els } from './dom.js';
import { state } from './state.js';
import { time } from './time.js';
import { todayStr, toDateStr, getPunchDate } from './dates.js';

// Summarize punches by YYYY-MM-DD -> { count, totalMin }
function summarizeByDate() {
  const map = new Map();
  for (const p of state.punches) {
    const d = getPunchDate(p);
    const prev = map.get(d) || { count: 0, totalMin: 0 };
    map.set(d, {
      count: prev.count + 1,
      totalMin: prev.totalMin + Math.max(0, (p.end || 0) - (p.start || 0)),
    });
  }
  return map;
}

// Build a fixed 6-week (42-day) grid for a given month, starting on Sunday
function buildMonthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const start = new Date(first);
  const firstDow = first.getDay(); // 0=Sun..6=Sat
  start.setDate(first.getDate() - firstDow);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function renderCalendar() {
  if (!els.calendarGrid || !els.calMonthLabel) return;

  // fade out for quick transition
  try {
    els.calendarGrid.style.opacity = '0';
  } catch {}

  const y = state.calendarYear;
  const m = state.calendarMonth;
  const mode = state.calendarMode || 'days';

  if (mode !== 'days') {
    if (els.calWeekdays) els.calWeekdays.style.display = 'none';
    els.calendarGrid.innerHTML = '';

    if (mode === 'months') {
      // Month picker for the selected year with inline prev/next year controls
      els.calMonthLabel.innerHTML = `
        <span class="cal-nav" data-cal-nav="prev" title="Previous year">\u2039</span>
        <span class="cal-link" data-cal-click="year" title="Select year">${y}</span>
        <span class="cal-nav" data-cal-nav="next" title="Next year">\u203A</span>`;
      els.calendarGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      for (let i = 0; i < 12; i++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day';

        const label = new Date(y, i, 1).toLocaleString(undefined, { month: 'short' });
        const num = document.createElement('div');
        num.className = 'cal-num';
        num.textContent = label;
        cell.appendChild(num);

        if (y === currentYear && i === currentMonth) cell.classList.add('today');
        if (i === state.calendarMonth && y === state.calendarYear) cell.classList.add('selected');

        cell.addEventListener('click', () => {
          state.calendarYear = y;
          state.calendarMonth = i;
          state.calendarMode = 'days';
          try { window.dispatchEvent(new Event('calendar:modeChanged')); } catch {}
          renderCalendar();
        });

        els.calendarGrid.appendChild(cell);
      }

      requestAnimationFrame(() => {
        try { els.calendarGrid.style.opacity = '1'; } catch {}
      });
      try { window.dispatchEvent(new Event('calendar:rendered')); } catch { window.dispatchEvent(new Event('calendar:rendered')); }
      return;
    }

    // Years grid (12-year range)
    const start = state.yearGridStart || Math.floor(state.calendarYear / 12) * 12;
    state.yearGridStart = start;
    const end = start + 11;
    // Years range with inline prev/next 12-year controls
    els.calMonthLabel.innerHTML = `
      <span class="cal-nav" data-cal-nav="prev" title="Previous 12 years">\u2039</span>
      <span class="cal-range">${start}\u2013${end}</span>
      <span class="cal-nav" data-cal-nav="next" title="Next 12 years">\u203A</span>`;
    els.calendarGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';

    const today = new Date();
    const currentYear = today.getFullYear();

    for (let i = 0; i < 12; i++) {
      const yy = start + i;
      const cell = document.createElement('div');
      cell.className = 'cal-day';

      const num = document.createElement('div');
      num.className = 'cal-num';
      num.textContent = String(yy);
      cell.appendChild(num);

      if (yy === currentYear) cell.classList.add('today');
      if (yy === state.calendarYear) cell.classList.add('selected');

      cell.addEventListener('click', () => {
        state.calendarYear = yy;
        state.calendarMode = 'months';
        try { window.dispatchEvent(new Event('calendar:modeChanged')); } catch {}
        renderCalendar();
      });

      els.calendarGrid.appendChild(cell);
    }

    requestAnimationFrame(() => {
      try { els.calendarGrid.style.opacity = '1'; } catch {}
    });
    try { window.dispatchEvent(new Event('calendar:rendered')); } catch { window.dispatchEvent(new Event('calendar:rendered')); }
    return;
  }

  // Days mode
  if (els.calWeekdays) els.calWeekdays.style.display = 'grid';
  els.calMonthLabel.innerHTML = (() => {
    const d = new Date(y, m, 1);
    const monthName = d.toLocaleString(undefined, { month: 'long' });
    return `
      <span class="cal-nav" data-cal-nav="prev" title="Previous month">\u2039</span>
      <span class="cal-link" data-cal-click="month" title="Select month">${monthName}</span>
      <span class="cal-link" data-cal-click="year" title="Select year">${y}</span>
      <span class="cal-nav" data-cal-nav="next" title="Next month">\u203A</span>`;
  })();

  els.calendarGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
  requestAnimationFrame(() => {
    try { els.calendarGrid.style.opacity = '1'; } catch {}
  });

  const days = buildMonthGrid(y, m);
  const summaries = summarizeByDate();
  const selected = state.currentDate || todayStr();
  const today = todayStr();
  els.calendarGrid.innerHTML = '';

  for (const d of days) {
    const ds = toDateStr(d);
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    cell.tabIndex = 0;

    const inMonth = d.getMonth() === m;
    if (!inMonth) cell.classList.add('other-month');
    if (ds === selected) cell.classList.add('selected');
    if (ds === today && d.getMonth() === m && d.getFullYear() === y) cell.classList.add('today');

    const sum = summaries.get(ds);
    if (sum && sum.count) cell.classList.add('has-items');

    const num = document.createElement('div');
    num.className = 'cal-num';
    num.textContent = String(d.getDate());
    cell.appendChild(num);

    if (sum && sum.totalMin) {
      const meta = document.createElement('div');
      meta.className = 'cal-meta';
      meta.textContent = `${sum.count} \u2022 ${time.durationLabel(sum.totalMin)}`;
      cell.appendChild(meta);
    }

    cell.addEventListener('click', () => {
      state.currentDate = ds;
      state.viewMode = 'day';
      try {
        const ev = new CustomEvent('calendar:daySelected');
        window.dispatchEvent(ev);
      } catch {
        // fallback for environments without CustomEvent constructor
        window.dispatchEvent(new Event('calendar:daySelected'));
      }
    });

    els.calendarGrid.appendChild(cell);
  }
  try { window.dispatchEvent(new Event('calendar:rendered')); } catch { window.dispatchEvent(new Event('calendar:rendered')); }
}

function nextMonth() {
  let y = state.calendarYear;
  let m = state.calendarMonth + 1;
  if (m > 11) {
    m = 0;
    y += 1;
  }
  state.calendarYear = y;
  state.calendarMonth = m;
  renderCalendar();
}

function prevMonth() {
  let y = state.calendarYear;
  let m = state.calendarMonth - 1;
  if (m < 0) {
    m = 11;
    y -= 1;
  }
  state.calendarYear = y;
  state.calendarMonth = m;
  renderCalendar();
}

function nextYear() {
  state.calendarYear = state.calendarYear + 1;
  renderCalendar();
}

function prevYear() {
  state.calendarYear = state.calendarYear - 1;
  renderCalendar();
}

export const calendar = { renderCalendar, nextMonth, prevMonth, nextYear, prevYear };
