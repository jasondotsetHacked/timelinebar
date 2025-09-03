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
  const y = state.calendarYear;
  const m = state.calendarMonth;
  els.calMonthLabel.textContent = monthLabel(y, m);
  const days = buildMonthGrid(y, m);
  const summaries = summarizeByDate();
  const selected = state.currentDate || todayStr();

  els.calendarGrid.innerHTML = '';
  for (const d of days) {
    const ds = toDateStr(d);
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    cell.tabIndex = 0;
    const inMonth = d.getMonth() === m;
    if (!inMonth) cell.classList.add('other-month');
    if (ds === selected) cell.classList.add('selected');
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

export const calendar = { renderCalendar, nextMonth, prevMonth };
