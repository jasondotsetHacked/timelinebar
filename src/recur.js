import { parseDate, toDateStr } from './dates.js';

function addDays(d, days) {
  const nd = new Date(d.getTime());
  nd.setDate(nd.getDate() + days);
  return nd;
}

function daysInMonth(y, m /* 0-11 */) {
  return new Date(y, m + 1, 0).getDate();
}

function addMonthsClamped(d, months) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  const targetM = m + months;
  const targetY = y + Math.floor(targetM / 12);
  const normM = ((targetM % 12) + 12) % 12;
  const dim = daysInMonth(targetY, normM);
  const clampedDay = Math.min(day, dim);
  return new Date(targetY, normM, clampedDay);
}

function addYearsClamped(d, years) {
  const y = d.getFullYear() + years;
  const m = d.getMonth();
  const day = d.getDate();
  const dim = daysInMonth(y, m);
  const clampedDay = Math.min(day, dim);
  return new Date(y, m, clampedDay);
}

// rule: { freq: 'daily'|'weekly'|'monthly'|'yearly', interval: number, until?: 'YYYY-MM-DD', count?: number }
export function expandDates(startDateStr, rule) {
  const out = [];
  const start = parseDate(startDateStr);
  if (!start) return out;
  const freq = rule?.freq || 'weekly';
  const interval = Math.max(1, Math.floor(Number(rule?.interval || 1)));
  const until = rule?.until ? parseDate(rule.until) : null;
  const count = rule?.count ? Math.max(1, Math.floor(Number(rule.count))) : null;
  const byWeekday = Array.isArray(rule?.byWeekday) ? [...new Set(rule.byWeekday.map((n) => (Number(n) % 7 + 7) % 7))].sort((a,b)=>a-b) : null;
  let i = 0;
  let cur = new Date(start.getTime());
  const startStr = toDateStr(start);
  if (freq === 'weekly' && byWeekday && byWeekday.length) {
    // iterate day-by-day, include selected weekdays on weeks matching interval
    let guard = 0;
    while (true) {
      const curStr = toDateStr(cur);
      const daysSince = Math.floor((cur - start) / 86400000);
      const weekIndex = Math.floor(daysSince / 7);
      const isSelectedDow = byWeekday.includes(cur.getDay());
      const onIntervalWeek = weekIndex % interval === 0;
      if (isSelectedDow && onIntervalWeek) {
        out.push(curStr);
        i++;
        if (count && i >= count) break;
      }
      if (until && curStr >= toDateStr(until)) break; // inclusive until
      cur = addDays(cur, 1);
      guard++;
      if (guard > 20000 || out.length > 5000) break;
    }
  } else {
    while (true) {
      const curStr = toDateStr(cur);
      out.push(curStr);
      i++;
      if (count && i >= count) break;
      if (until && curStr >= toDateStr(until)) break; // inclusive until
      // compute next
      if (freq === 'daily') cur = addDays(cur, interval);
      else if (freq === 'weekly') cur = addDays(cur, 7 * interval);
      else if (freq === 'monthly') cur = addMonthsClamped(cur, interval);
      else if (freq === 'yearly') cur = addYearsClamped(cur, interval);
      else cur = addDays(cur, 7 * interval);
      // protect against runaway
      if (out.length > 2000) break;
    }
  }
  return out;
}
