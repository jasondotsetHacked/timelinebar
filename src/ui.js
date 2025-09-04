import { els } from './dom.js';
import { state } from './state.js';
import { time } from './time.js';
import { nowIndicator } from './nowIndicator.js';
import { getPunchDate, todayStr, parseDate } from './dates.js';
import { calendar } from './calendar.js';
// Viewport is now dynamic and sourced from state

const escapeHtml = (s) => (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

// Render Markdown to safe HTML (fallback to plain text)
function markdownToHtml(md) {
  const text = String(md || '');
  if (!text.trim()) return '';
  try {
    if (window.marked && typeof window.marked.parse === 'function') {
      const raw = window.marked.parse(text);
      if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') return window.DOMPurify.sanitize(raw);
      return raw;
    }
  } catch {}
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function hideNotePopover() {
  const existing = document.querySelector('.note-popover');
  if (existing) existing.remove();
}

function toggleNotePopover(id) {
  const punchEl = els.track.querySelector(`.punch[data-id="${id}"]`);
  if (!punchEl) return;
  const existing = document.querySelector('.note-popover');
  if (existing && Number(existing.dataset.id) === Number(id)) {
    existing.remove();
    return;
  }
  if (existing) existing.remove();
  const p = state.punches.find((x) => x.id === id);
  if (!p || !p.note) return;
  const pop = document.createElement('div');
  pop.className = 'note-popover';
  pop.dataset.id = String(id);
  pop.innerHTML = `<button class="note-close" aria-label="Close">\u2715</button><div class="note-content"></div>`;
  const content = pop.querySelector('.note-content');
  content.innerHTML = markdownToHtml(p.note);
  document.body.appendChild(pop);
  const elRect = punchEl.getBoundingClientRect();
  // initial position roughly centered (before measuring width)
  const approxW = 280;
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  let left0 = elRect.left + elRect.width / 2 - approxW / 2;
  left0 = Math.max(6, Math.min(left0, vw - approxW - 6));
  pop.style.left = left0 + 'px';
  pop.style.top = '6px';
  requestAnimationFrame(() => {
    const pr = pop.getBoundingClientRect();
    const vw2 = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    let left = elRect.left + elRect.width / 2 - pr.width / 2;
    left = Math.max(6, Math.min(left, vw2 - pr.width - 6));
    let top = elRect.top - pr.height - 10; // above if possible
    if (top < 8) top = elRect.bottom + 10; // below when not enough space
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  });
  pop.addEventListener('click', (e) => {
    if (e.target.closest('.note-close')) hideNotePopover();
    e.stopPropagation();
  });
}

function getView() {
  const start = Math.max(0, Math.min(24 * 60, Number(state.viewStartMin)));
  const end = Math.max(0, Math.min(24 * 60, Number(state.viewEndMin)));
  const s = Math.min(start, end);
  const e = Math.max(start, end);
  const minutes = Math.max(1, e - s);
  return { start: s, end: e, minutes, startH: Math.floor(s / 60), endH: Math.ceil(e / 60) };
}

function renderTicks() {
  // Single source of truth: each tick contains its own full-height line and label
  els.ticks.innerHTML = '';
  const view = getView();
  const firstHour = Math.ceil(view.start / 60);
  const lastHour = Math.floor(view.end / 60);

  for (let h = firstHour; h <= lastHour; h++) {
    const minutes = h * 60;
    const pct = ((minutes - view.start) / view.minutes) * 100;

    const tick = document.createElement('div');
    tick.className = 'tick';
    tick.style.left = pct + '%';

    const line = document.createElement('div');
    line.className = 'tick-line';

    const label = document.createElement('div');
    label.className = 'tick-label';
    label.textContent = time.hourLabel(h % 24);

    // edge alignment on exact viewport edges
    if (view.start % 60 === 0 && h === view.start / 60) tick.dataset.edge = 'start';
    if (view.end % 60 === 0 && h === view.end / 60) tick.dataset.edge = 'end';

    tick.appendChild(line);
    tick.appendChild(label);
    els.ticks.appendChild(tick);
  }
}

function currentDay() {
  return state.currentDate || todayStr();
}

function renderTimeline() {
  hideNotePopover();
  els.track.querySelectorAll('.punch').forEach((n) => n.remove());
  const existingLayer = els.track.querySelector('.label-layer');
  if (existingLayer) existingLayer.remove();

  const labelLayer = document.createElement('div');
  labelLayer.className = 'label-layer';
  const narrowItems = [];
  const rect = els.track.getBoundingClientRect();
  const trackWidth = rect.width || 1;

  const view = getView();
  const day = currentDay();
  const sorted = [...state.punches]
    .filter((p) => getPunchDate(p) === day)
    .sort((a, b) => a.start - b.start);
  for (const p of sorted) {
    const startClamped = Math.max(p.start, view.start);
    const endClamped = Math.min(p.end, view.end);
    if (endClamped <= startClamped) continue;
    const leftPct = ((startClamped - view.start) / view.minutes) * 100;
    const widthPct = ((endClamped - startClamped) / view.minutes) * 100;

    const el = document.createElement('div');
    el.className = 'punch';
    el.style.left = leftPct + '%';
    el.style.width = widthPct + '%';
    el.dataset.id = p.id;
    const status = p.status || 'default';
    el.classList.add(`status-${status}`);

    const leftHandle = document.createElement('div');
    leftHandle.className = 'handle left';
    leftHandle.dataset.edge = 'left';
    leftHandle.tabIndex = 0;
    leftHandle.setAttribute('aria-label', 'Resize left edge');

    const label = document.createElement('div');
    label.className = 'punch-label';
    label.textContent = p.bucket || '(no bucket)';
    label.dataset.id = p.id;

    const rightHandle = document.createElement('div');
    rightHandle.className = 'handle right';
    rightHandle.dataset.edge = 'right';
    rightHandle.tabIndex = 0;
    rightHandle.setAttribute('aria-label', 'Resize right edge');

    const controls = document.createElement('div');
    controls.className = 'controls';
    const editBtn = document.createElement('button');
    editBtn.className = 'control-btn edit';
    editBtn.title = 'Edit';
    editBtn.textContent = '\u270E';
    editBtn.dataset.id = p.id;
    const delBtn = document.createElement('button');
    delBtn.className = 'control-btn delete';
    delBtn.title = 'Delete';
    delBtn.textContent = '\u2715';
    delBtn.dataset.id = p.id;
    controls.append(editBtn, delBtn);
    el.append(label, controls);

    const pxWidth = (widthPct / 100) * trackWidth;
    let edgeW = 8;
    if (pxWidth >= 48) edgeW = 16;
    else if (pxWidth >= 28) edgeW = 14;
    else if (pxWidth >= 18) edgeW = 12;
    else {
      edgeW = Math.max(6, Math.floor(pxWidth / 3));
      const centerMin = 4;
      if (edgeW * 2 > pxWidth - centerMin) edgeW = Math.max(4, Math.floor((pxWidth - centerMin) / 2));
      edgeW = Math.max(4, Math.min(18, edgeW));
    }
    if (!Number.isFinite(edgeW) || edgeW <= 0) edgeW = 6;

    leftHandle.style.width = edgeW + 'px';
    rightHandle.style.width = edgeW + 'px';
    leftHandle.style.left = '0px';
    rightHandle.style.right = '0px';

    const leftBar = document.createElement('div');
    leftBar.className = 'handle-bar';
    const rightBar = document.createElement('div');
    rightBar.className = 'handle-bar';
    leftHandle.appendChild(leftBar);
    rightHandle.appendChild(rightBar);
    try {
      leftBar.style.left = '0px';
      leftBar.style.right = '';
      leftBar.style.borderTopLeftRadius = '8px';
      leftBar.style.borderBottomLeftRadius = '8px';
      rightBar.style.right = '0px';
      rightBar.style.left = '';
      rightBar.style.borderTopRightRadius = '8px';
      rightBar.style.borderBottomRightRadius = '8px';
    } catch {}
    el.append(leftHandle, rightHandle);

    try {
      if (window.DEBUG_HANDLES) {
        leftBar.style.background = 'rgba(255,0,0,0.12)';
        leftBar.style.outline = '1px solid rgba(255,0,0,0.35)';
        rightBar.style.background = 'rgba(0,255,0,0.12)';
        rightBar.style.outline = '1px solid rgba(0,255,0,0.35)';
        leftBar.title = `Left handle (w=${edgeW}px) - anchored left`;
        rightBar.title = `Right handle (w=${edgeW}px) - anchored right`;
        console.log('HANDLE_DEBUG', { id: p.id, pxWidth, edgeW, leftPct, widthPct });
      }
    } catch {}

    // non-intrusive note indicator
    if (p.note && String(p.note).trim()) {
      const noteBtn = document.createElement('button');
      noteBtn.className = 'note-dot';
      noteBtn.title = 'Show note';
      noteBtn.type = 'button';
      noteBtn.dataset.id = p.id;
      el.appendChild(noteBtn);
    }

    els.track.appendChild(el);

    try {
      requestAnimationFrame(() => {
        const elRect = el.getBoundingClientRect();
        const leftBarRect = leftBar.getBoundingClientRect();
        const rightBarRect = rightBar.getBoundingClientRect();
        const centerX = elRect.left + elRect.width / 2;
        if (leftBarRect.left > centerX) {
          leftBar.style.left = '0px';
          leftBar.style.right = '';
          if (window.DEBUG_HANDLES) console.log('HANDLE_AUTOFLIP: corrected left (anchor left) for', p.id);
        }
        if (rightBarRect.right < centerX) {
          rightBar.style.right = '0px';
          rightBar.style.left = '';
          if (window.DEBUG_HANDLES) console.log('HANDLE_AUTOFLIP: corrected right (anchor right) for', p.id);
        }
      });
    } catch {}

    if (widthPct < 6) el.classList.add('narrow');
    else el.classList.remove('narrow');
    if (widthPct < 6) {
      const centerPct = leftPct + widthPct / 2;
      narrowItems.push({ punch: p, leftPct, widthPct, centerPct });
    }
  }

  const placed = [];
  for (const it of narrowItems) {
    const centerPx = (it.centerPct / 100) * trackWidth;
    let row = 0;
    for (;; row++) {
      const conflict = placed[row]?.some((px) => Math.abs(px - centerPx) < 120);
      if (!conflict) break;
    }
    placed[row] = placed[row] || [];
    placed[row].push(centerPx);
    it.row = row;
    it.centerPx = centerPx;
  }

  for (const it of narrowItems) {
    const pop = document.createElement('div');
    pop.className = 'label-popper';
    const pxLeft = Math.max(6, it.centerPx - 55);
    pop.style.left = pxLeft + 'px';
    pop.style.top = 8 + it.row * 40 + 'px';
    pop.dataset.id = it.punch.id;
    pop.innerHTML = `<div class="label-text">${escapeHtml(it.punch.bucket || '(no bucket)')}</div><div class="controls"><button class="control-btn edit" title="Edit">\u270E</button><button class="control-btn delete" title="Delete">\u2715</button></div>`;
    pop.style.display = 'none';

    const conn = document.createElement('div');
    conn.className = 'label-connector';
    conn.style.left = it.centerPx - 1 + 'px';
    conn.style.top = '0px';
    conn.style.height = 16 + it.row * 40 + 'px';
    conn.style.display = 'none';

    labelLayer.appendChild(conn);
    labelLayer.appendChild(pop);
    it._pop = pop;
    it._conn = conn;
  }

  if (narrowItems.length) els.track.appendChild(labelLayer);

  for (const it of narrowItems) {
    const id = it.punch.id;
    const punchEl = els.track.querySelector(`.punch[data-id="${id}"]`);
    if (!punchEl) continue;
    const pop = it._pop;
    const conn = it._conn;
    punchEl.addEventListener('mouseenter', () => {
      pop.style.display = 'grid';
      conn.style.display = 'block';
    });
    punchEl.addEventListener('mouseleave', () => {
      pop.style.display = 'none';
      conn.style.display = 'none';
    });
  }
}

function renderTable() {
  els.rows.innerHTML = '';
  const day = currentDay();
  const sorted = [...state.punches]
    .filter((p) => getPunchDate(p) === day)
    .sort((a, b) => a.start - b.start);
  for (const p of sorted) {
    const tr = document.createElement('tr');
    tr.dataset.id = p.id;
    const dur = p.end - p.start;
    const status = p.status || 'default';
    tr.innerHTML = `
      <td class="status-cell"><div class="status-wrap"><button class="status-btn status-${status}" data-id="${p.id}" aria-label="Status"></button>
        <div class="status-menu" data-id="${p.id}">
          <div class="status-option" data-value="default" title="Default"></div>
          <div class="status-option" data-value="green" title="Green (transparent)"></div>
          <div class="status-option" data-value="green-solid" title="Green"></div>
          <div class="status-option" data-value="yellow" title="Yellow (transparent)"></div>
          <div class="status-option" data-value="yellow-solid" title="Yellow"></div>
          <div class="status-option" data-value="red" title="Red (transparent)"></div>
          <div class="status-option" data-value="red-solid" title="Red"></div>
          <div class="status-option" data-value="blue" title="Blue (transparent)"></div>
          <div class="status-option" data-value="blue-solid" title="Blue"></div>
          <div class="status-option" data-value="purple" title="Purple (transparent)"></div>
          <div class="status-option" data-value="purple-solid" title="Purple"></div>
        </div></div></td>
      <td class="cell-start">${time.toLabel(p.start)}</td>
      <td class="cell-end">${time.toLabel(p.end)}</td>
      <td>${time.durationLabel(dur)}</td>
      <td>${escapeHtml(p.bucket || '')}</td>
      <td class="note">${escapeHtml(p.note || '')}</td>
      <td class="table-actions">
        <button class="row-action edit" title="Edit" data-id="${p.id}">Edit</button>
        <button class="row-action delete" title="Delete" data-id="${p.id}">Delete</button>
      </td>`;
    els.rows.appendChild(tr);
  }
  els.empty.style.display = sorted.length ? 'none' : 'block';
}

function renderTotal() {
  const day = currentDay();
  const totalMin = state.punches
    .filter((p) => getPunchDate(p) === day)
    .reduce((s, p) => s + (p.end - p.start), 0);
  els.total.textContent = totalMin ? `Total: ${time.durationLabel(totalMin)}` : '';
}

function summarizeByBucket(punches) {
  const map = new Map();
  for (const p of punches) {
    const key = String(p.bucket || '').trim();
    const prev = map.get(key) || { totalMin: 0, count: 0 };
    const add = Math.max(0, (p.end || 0) - (p.start || 0));
    map.set(key, { totalMin: prev.totalMin + add, count: prev.count + 1 });
  }
  return map;
}

function renderBucketDay() {
  if (!els.bucketDayBody || !els.bucketDayCard) return;
  const day = currentDay();
  const items = state.punches.filter((p) => getPunchDate(p) === day);
  const sums = summarizeByBucket(items);
  const sorted = Array.from(sums.entries())
    .filter(([_, v]) => v.totalMin > 0)
    .sort((a, b) => b[1].totalMin - a[1].totalMin || a[0].localeCompare(b[0]));
  els.bucketDayBody.innerHTML = '';
  for (const [bucket, info] of sorted) {
    const tr = document.createElement('tr');
    const label = bucket || '(no bucket)';
    tr.innerHTML = `<td>${escapeHtml(label)}</td><td>${time.durationLabel(info.totalMin)}</td>`;
    els.bucketDayBody.appendChild(tr);
  }
  if (els.bucketDayEmpty) els.bucketDayEmpty.style.display = sorted.length ? 'none' : 'block';
  els.bucketDayCard.style.display = state.viewMode === 'calendar' ? 'none' : '';
}

function renderBucketMonth() {
  if (!els.bucketMonthBody || !els.bucketMonthCard) return;
  const y = state.calendarYear;
  const m = state.calendarMonth; // 0-11
  const items = state.punches.filter((p) => {
    const d = (p.date || '').split('-');
    if (d.length !== 3) return false;
    const yy = Number(d[0]);
    const mm = Number(d[1]) - 1;
    return yy === y && mm === m;
  });
  const sums = summarizeByBucket(items);
  const sorted = Array.from(sums.entries())
    .filter(([_, v]) => v.totalMin > 0)
    .sort((a, b) => b[1].totalMin - a[1].totalMin || a[0].localeCompare(b[0]));
  els.bucketMonthBody.innerHTML = '';
  for (const [bucket, info] of sorted) {
    const tr = document.createElement('tr');
    const label = bucket || '(no bucket)';
    tr.innerHTML = `<td>${escapeHtml(label)}</td><td>${time.durationLabel(info.totalMin)}</td>`;
    els.bucketMonthBody.appendChild(tr);
  }
  if (els.bucketMonthEmpty) els.bucketMonthEmpty.style.display = sorted.length ? 'none' : 'block';
  if (els.bucketMonthTitle) {
    try {
      const d = new Date(y, m, 1);
      const monthName = d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
      els.bucketMonthTitle.textContent = `– ${monthName}`;
    } catch {
      els.bucketMonthTitle.textContent = '';
    }
  }
  // Only show in calendar view when looking at days grid
  const show = state.viewMode === 'calendar' && (state.calendarMode || 'days') === 'days';
  els.bucketMonthCard.style.display = show ? '' : 'none';
}

function renderDayLabel() {
  if (!els.dayLabel) return;
  if (state.viewMode === 'calendar') {
    // Hide the day label in calendar view (calendar has its own header)
    els.dayLabel.style.display = 'none';
    try { els.dayLabel.classList.remove('clickable'); } catch {}
    return;
  }
  els.dayLabel.style.display = '';
  try { els.dayLabel.classList.add('clickable'); } catch {}
  const day = currentDay();
  const d = parseDate(day) || new Date();
  const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  els.dayLabel.textContent = `Day: ${label}`;
}

function updateHelpText() {
  if (!els.viewHelp) return;
  if (state.viewMode === 'calendar') {
    const mode = state.calendarMode || 'days';
    if (mode === 'days') {
      els.viewHelp.textContent = 'Calendar: click a day to open · Use Prev/Next to change month · Click month/year to change mode';
    } else if (mode === 'months') {
      els.viewHelp.textContent = 'Months: click a month to view days · Use Prev/Next to change year · Click year to pick year range';
    } else {
      els.viewHelp.textContent = 'Years: click a year to view months · Use Prev/Next to change 12-year range';
    }
    return;
  }
  // Day (timeline) view
  els.viewHelp.textContent = 'Drag to create · Resize with side handles · Snaps to 15m · Scroll to zoom · Shift+Scroll to pan · Click the day title to open calendar';
}

function updateViewMode() {
  const timelineCard = document.querySelector('.timeline');
  const mainTableCard = els.rows ? els.rows.closest('.table-card') : document.querySelector('.table-card');
  if (state.viewMode === 'calendar') {
    // Ensure calendar focuses the selected day month
    const d = parseDate(currentDay());
    if (d) {
      state.calendarYear = d.getFullYear();
      state.calendarMonth = d.getMonth();
    }
    if (timelineCard) timelineCard.style.display = 'none';
    if (mainTableCard) mainTableCard.style.display = 'none';
    if (els.bucketDayCard) els.bucketDayCard.style.display = 'none';
    if (els.calendarCard) els.calendarCard.style.display = 'block';
    if (els.btnCalendar) els.btnCalendar.textContent = 'Back to Day';
    calendar.renderCalendar();
    if (els.bucketMonthCard) {
      const show = (state.calendarMode || 'days') === 'days';
      els.bucketMonthCard.style.display = show ? '' : 'none';
    }
    renderBucketMonth();
  } else {
    if (timelineCard) timelineCard.style.display = '';
    if (mainTableCard) mainTableCard.style.display = '';
    if (els.calendarCard) els.calendarCard.style.display = 'none';
    if (els.btnCalendar) els.btnCalendar.textContent = 'Calendar';
    if (els.bucketDayCard) els.bucketDayCard.style.display = '';
    if (els.bucketMonthCard) els.bucketMonthCard.style.display = 'none';
    renderTicks();
    renderTimeline();
    renderTable();
    renderTotal();
    nowIndicator.update();
    renderBucketDay();
  }
  renderDayLabel();
  updateHelpText();
}

function showGhost(a, b) {
  const [start, end] = a < b ? [a, b] : [b, a];
  const view = getView();
  const leftPct = ((start - view.start) / view.minutes) * 100;
  const widthPct = ((end - view.start) / view.minutes) * 100 - leftPct;
  Object.assign(els.ghost.style, { display: 'block', left: leftPct + '%', width: widthPct + '%' });
  showTips(start, end);
}

function hideGhost() {
  els.ghost.style.display = 'none';
  hideTips();
}

function showTips(start, end) {
  const view = getView();
  const leftPct = ((start - view.start) / view.minutes) * 100;
  const rightPct = ((end - view.start) / view.minutes) * 100;
  const centerPct = (((start + end) / 2 - view.start) / view.minutes) * 100;
  els.tipStart.textContent = time.toLabel(start);
  els.tipEnd.textContent = time.toLabel(end);
  els.tipCenter.textContent = time.durationLabel(Math.max(0, end - start));
  els.tipStart.style.left = leftPct + '%';
  els.tipEnd.style.left = rightPct + '%';
  els.tipCenter.style.left = centerPct + '%';
  els.tipStart.style.display = 'block';
  els.tipEnd.style.display = 'block';
  els.tipCenter.style.display = 'block';
}

function hideTips() {
  els.tipStart.style.display = 'none';
  els.tipEnd.style.display = 'none';
  els.tipCenter.style.display = 'none';
}

function openModal(range) {
  state.editingId = null;
  state.pendingRange = range;
  els.startField.value = time.toLabel(range.startMin);
  els.endField.value = time.toLabel(range.endMin);
  els.bucketField.value = '';
  els.noteField.value = '';
  try {
    if (els.notePreview) {
      els.notePreview.style.display = 'none';
      els.notePreview.innerHTML = '';
    }
    if (els.notePreviewToggle) els.notePreviewToggle.textContent = 'Preview';
    if (els.noteField) {
      els.noteField.style.height = 'auto';
      const h = Math.max(72, Math.min(320, els.noteField.scrollHeight || 72));
      els.noteField.style.height = h + 'px';
    }
  } catch {}
  if (els.modalStatusBtn) {
    els.modalStatusBtn.dataset.value = 'default';
    els.modalStatusBtn.className = 'status-btn status-default';
  }
  if (els.modalStatusWrap) els.modalStatusWrap.classList.remove('open');
  if (els.modalDelete) els.modalDelete.style.display = 'none';
  if (els.modalTitle) els.modalTitle.textContent = 'New Time Block';
  els.modal.style.display = 'flex';
  els.bucketField.focus();
}

function closeModal() {
  els.modal.style.display = 'none';
  state.pendingRange = null;
  state.editingId = null;
  if (els.modalStatusWrap) els.modalStatusWrap.classList.remove('open');
}

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.style.display = 'block';
  clearTimeout(els.toast._t);
  els.toast._t = setTimeout(() => (els.toast.style.display = 'none'), 2400);
}

function renderAll() {
  updateViewMode();
}

export const ui = {
  renderAll,
  renderTicks,
  renderTimeline,
  renderTable,
  renderTotal,
  toggleNotePopover,
  hideNotePopover,
  showGhost,
  hideGhost,
  showTips,
  hideTips,
  openModal,
  closeModal,
  toast,
  renderDayLabel,
  updateViewMode,
  updateHelpText,
  renderBucketDay,
  renderBucketMonth,
};
