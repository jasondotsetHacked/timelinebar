import { els } from './dom.js';
import { state } from './state.js';
import { toDateStr, todayStr, monthLabel, getPunchDate } from './dates.js';
import { time } from './time.js';

function summarizeByDate() {
  const map = new Map();
  for (const p of state.punches) {
    const d = getPunchDate(p);
    const prev = map.get(d) || { count: 0, totalMin: 0 };
    map.set(d, { count: prev.count + 1, totalMin: prev.totalMin + Math.max(0, (p.end || 0) - (p.start || 0)) });
  }
  return map;
}

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
  try { els.calendarGrid.style.opacity = '0'; } catch {}
  const y = state.calendarYear;
  const m = state.calendarMonth;
  const mode = state.calendarMode || 'days';
  // Non-day modes: render and return early
  if (mode !== 'days') {
    if (els.calWeekdays) els.calWeekdays.style.display = 'none';
    els.calendarGrid.innerHTML = '';
    if (mode === 'months') {
      els.calMonthLabel.innerHTML = `<span class="cal-link" data-cal-click="year" title="Select year">${y}</span>`;
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
          renderCalendar();
        });
        els.calendarGrid.appendChild(cell);
      }
      requestAnimationFrame(() => { try { els.calendarGrid.style.opacity = '1'; } catch {} });
      return;
    }
    // years mode
    const start = state.yearGridStart || Math.floor(state.calendarYear / 12) * 12;
    state.yearGridStart = start;
    const end = start + 11;
    els.calMonthLabel.innerHTML = `<span class="cal-range">${start}–${end}</span>`;
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
        renderCalendar();
      });
      els.calendarGrid.appendChild(cell);
    }
    requestAnimationFrame(() => { try { els.calendarGrid.style.opacity = '1'; } catch {} });
    return;
  }
  // days mode header/weekday visibility
  if (els.calWeekdays) els.calWeekdays.style.display = 'grid';
  els.calMonthLabel.innerHTML = (() => {
    const d = new Date(y, m, 1);
    const monthName = d.toLocaleString(undefined, { month: 'long' });
    return `<span class="cal-link" data-cal-click="month" title="Select month">${monthName}</span> <span class="cal-link" data-cal-click="year" title="Select year">${y}</span>`;
  })();
  els.calendarGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
  requestAnimationFrame(() => { try { els.calendarGrid.style.opacity = '1'; } catch {} });
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
      meta.textContent = `${sum.count} • ${time.durationLabel(sum.totalMin)}`;
      cell.appendChild(meta);
    }

    cell.addEventListener('click', () => {
      state.currentDate = ds;
      state.viewMode = 'day';
      const ev = new CustomEvent('calendar:daySelected');
      window.dispatchEvent(ev);
    });

    els.calendarGrid.appendChild(cell);
  }
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
