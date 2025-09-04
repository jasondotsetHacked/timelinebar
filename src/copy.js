import { els } from './dom.js';
import { state } from './state.js';
import { time } from './time.js';
import { getPunchDate, parseDate } from './dates.js';
import { ui } from './ui.js';

function currentDay() {
  return state.currentDate;
}

function getDayPunches() {
  const day = currentDay();
  return [...state.punches]
    .filter((p) => getPunchDate(p) === day)
    .sort((a, b) => a.start - b.start);
}

function getView() {
  const s = Math.max(0, Math.min(24 * 60, Number(state.viewStartMin)));
  const e = Math.max(0, Math.min(24 * 60, Number(state.viewEndMin)));
  const start = Math.min(s, e);
  const end = Math.max(s, e);
  const minutes = Math.max(1, end - start);
  return { start, end, minutes };
}

function statusColor(status) {
  const st = status || 'default';
  switch (st) {
    case 'green':
    case 'green-solid': return '#00cc66';
    case 'yellow':
    case 'yellow-solid': return '#f5d90a';
    case 'red':
    case 'red-solid': return '#ff4d4f';
    case 'blue':
    case 'blue-solid': return '#0ea5ff';
    case 'purple':
    case 'purple-solid': return '#a259ff';
    default: return '#16a34a';
  }
}

function drawTimelineCanvas(widthHint = 0, heightHint = 0) {
  const view = getView();
  const rect = els.track?.getBoundingClientRect() || { width: 0, height: 0 };
  const width = Math.max(600, Math.floor(widthHint || rect.width || 1024));
  const height = Math.max(140, Math.floor(heightHint || rect.height || 160));
  const padTop = 24;
  const padBottom = 24;
  const padLeft = 8;
  const padRight = 8;
  const chartX = padLeft;
  const chartY = padTop;
  const chartW = Math.max(1, width - padLeft - padRight);
  const chartH = Math.max(1, height - padTop - padBottom);
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // background
  ctx.fillStyle = '#0b1422';
  ctx.fillRect(0, 0, width, height);

  // day label
  try {
    const d = parseDate(currentDay());
    const lab = d ? d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';
    if (lab) {
      ctx.fillStyle = '#c7d2fe';
      ctx.font = '600 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.fillText(lab, padLeft, 16);
    }
  } catch {}

  // grid and hour ticks
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '11px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  const firstHour = Math.ceil(view.start / 60);
  const lastHour = Math.floor(view.end / 60);
  for (let h = firstHour; h <= lastHour; h++) {
    const m = h * 60;
    const pct = (m - view.start) / view.minutes;
    const x = chartX + pct * chartW;
    // vertical tick line
    ctx.beginPath();
    ctx.moveTo(x + 0.5, chartY);
    ctx.lineTo(x + 0.5, chartY + chartH);
    ctx.stroke();
    // label
    const ampm = h >= 12 ? 'pm' : 'am';
    const hh = h % 12 === 0 ? 12 : h % 12;
    const label = `${hh}${ampm}`;
    const tw = ctx.measureText(label).width;
    ctx.fillText(label, Math.max(chartX, Math.min(x - tw / 2, chartX + chartW - tw)), chartY + chartH + 14);
  }
  ctx.restore();

  // bars
  const punches = getDayPunches();
  for (const p of punches) {
    const startClamped = Math.max(p.start, view.start);
    const endClamped = Math.min(p.end, view.end);
    if (endClamped <= startClamped) continue;
    const left = chartX + ((startClamped - view.start) / view.minutes) * chartW;
    const w = ((endClamped - startClamped) / view.minutes) * chartW;
    const h = Math.max(10, Math.min(28, Math.floor(chartH * 0.7)));
    const y = chartY + (chartH - h) / 2;
    ctx.fillStyle = statusColor(p.status);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1;
    const r = 8;
    // rounded rect
    ctx.beginPath();
    ctx.moveTo(left + r, y);
    ctx.lineTo(left + w - r, y);
    ctx.quadraticCurveTo(left + w, y, left + w, y + r);
    ctx.lineTo(left + w, y + h - r);
    ctx.quadraticCurveTo(left + w, y + h, left + w - r, y + h);
    ctx.lineTo(left + r, y + h);
    ctx.quadraticCurveTo(left, y + h, left, y + h - r);
    ctx.lineTo(left, y + r);
    ctx.quadraticCurveTo(left, y, left + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // label (bucket)
    const label = (p.bucket || '').trim();
    if (label) {
      ctx.save();
      ctx.font = '600 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.fillStyle = '#0b1422';
      const tw = ctx.measureText(label).width;
      if (tw + 12 < w) ctx.fillText(label, left + 6, y + h / 2 + 4);
      ctx.restore();
    }
  }

  return canvas;
}

function generateTsv() {
  const rows = getDayPunches();
  const header = ['Start', 'Stop', 'Duration', 'Bucket', 'Note'];
  const lines = [header.join('\t')];
  for (const p of rows) {
    const dur = Math.max(0, (p.end || 0) - (p.start || 0));
    const cells = [
      time.toLabel(p.start),
      time.toLabel(p.end),
      time.durationLabel(dur),
      (p.bucket || '').replace(/[\t\n]/g, ' '),
      (p.note || '').replace(/[\t\n]/g, ' '),
    ];
    lines.push(cells.join('\t'));
  }
  return lines.join('\n');
}

function generateHtmlTable() {
  const rows = getDayPunches();
  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const th = '<tr><th>Start</th><th>Stop</th><th>Duration</th><th>Bucket</th><th>Note</th></tr>';
  const trs = rows.map((p) => {
    const dur = Math.max(0, (p.end || 0) - (p.start || 0));
    return `<tr><td>${esc(time.toLabel(p.start))}</td><td>${esc(time.toLabel(p.end))}</td><td>${esc(time.durationLabel(dur))}</td><td>${esc(p.bucket || '')}</td><td>${esc(p.note || '')}</td></tr>`;
  });
  return `<table>${th}${trs.join('')}</table>`;
}

async function writeClipboard({ includeImage = true } = {}) {
  const tsv = generateTsv();
  const html = generateHtmlTable();

  const types = {};
  try { types['text/plain'] = new Blob([tsv], { type: 'text/plain' }); } catch {}
  try { types['text/html'] = new Blob([html], { type: 'text/html' }); } catch {}

  let canvas;
  if (includeImage) {
    try { canvas = drawTimelineCanvas(); } catch {}
  }

  if (canvas && navigator.clipboard && window.ClipboardItem) {
    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (pngBlob) types['image/png'] = pngBlob;
  }

  // Try write with multiple representations
  if (navigator.clipboard && window.ClipboardItem) {
    try {
      const item = new window.ClipboardItem(types);
      await navigator.clipboard.write([item]);
      return 'rich';
    } catch {}
  }

  // Fallback to text only
  try {
    await navigator.clipboard.writeText(tsv);
    return 'text';
  } catch {
    // Legacy fallback using a temporary textarea
    try {
      const ta = document.createElement('textarea');
      ta.value = tsv;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      ta.style.pointerEvents = 'none';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand && document.execCommand('copy');
      document.body.removeChild(ta);
      return ok ? 'text' : 'fail';
    } catch {
      return 'fail';
    }
  }
}

async function copyChart() {
  const rows = getDayPunches();
  if (!rows.length) { ui.toast?.('Nothing to copy'); return; }
  const mode = await writeClipboard({ includeImage: true });
  if (mode === 'rich') ui.toast?.('Copied chart + table to clipboard');
  else if (mode === 'text') ui.toast?.('Copied table (TSV) to clipboard');
  else ui.toast?.('Copy failed');
}

export const copyActions = { copyChart };
