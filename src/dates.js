function pad(n) {
  return String(n).padStart(2, '0');
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function monthLabel(year, monthIndex) {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

export function weekdayLabel(d) {
  return d.toLocaleString(undefined, { weekday: 'short' });
}

export function parseDate(str) {
  const [y, m, day] = (str || '').split('-').map((x) => Number(x));
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
}

export function getPunchDate(p) {
  if (p.date) return p.date;
  if (p.createdAt) return (p.createdAt + '').slice(0, 10);
  return todayStr();
}

