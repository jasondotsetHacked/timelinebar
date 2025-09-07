import { els } from './dom.js';
import { state } from './state.js';
import { time } from './time.js';
import { nowIndicator } from './nowIndicator.js';
import { getPunchDate, todayStr, parseDate } from './dates.js';
import { calendar } from './calendar.js';
import { idb } from './storage.js';
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

function toggleNotePopover(id, anchorEl = null) {
  const anchor = anchorEl || els.track.querySelector(`.punch[data-id="${id}"]`);
  if (!anchor) return;
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
  pop.innerHTML = `
    <div class="note-actions" role="toolbar" aria-label="Note actions">
      <button class="note-edit" title="Edit note" aria-label="Edit note">\u270E</button>
      <button class="note-close" aria-label="Close">\u2715</button>
    </div>
    <div class="note-content"></div>`;
  const content = pop.querySelector('.note-content');
  content.innerHTML = markdownToHtml(p.note);
  document.body.appendChild(pop);
  const elRect = anchor.getBoundingClientRect();
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
  const enterEditMode = () => {
    if (pop.dataset.mode === 'edit') return;
    pop.dataset.mode = 'edit';
    const p2 = state.punches.find((x) => x.id === id);
    const current = (p2 && p2.note) || '';
    content.innerHTML = `
      <textarea class="note-editarea" aria-label="Edit note">${escapeHtml(current)}</textarea>
      <div class="note-edit-actions">
        <button class="btn primary note-save" type="button">Save</button>
        <button class="btn ghost note-cancel" type="button">Cancel</button>
      </div>`;
    try {
      const ta = content.querySelector('.note-editarea');
      if (ta) {
        ta.style.height = 'auto';
        const h = Math.max(96, Math.min(360, ta.scrollHeight || 96));
        ta.style.height = h + 'px';
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    } catch {}
  };
  const exitEditMode = () => {
    delete pop.dataset.mode;
    const p3 = state.punches.find((x) => x.id === id);
    content.innerHTML = markdownToHtml(p3?.note || '');
  };
  pop.addEventListener('click', async (e) => {
    if (e.target.closest('.note-close')) {
      hideNotePopover();
      e.stopPropagation();
      return;
    }
    if (e.target.closest('.note-edit')) {
      enterEditMode();
      e.stopPropagation();
      return;
    }
    if (e.target.closest('.note-cancel')) {
      exitEditMode();
      e.stopPropagation();
      return;
    }
    if (e.target.closest('.note-save')) {
      const ta = pop.querySelector('.note-editarea');
      const newText = String(ta?.value || '').trim();
      const idx = state.punches.findIndex((x) => x.id === id);
      if (idx !== -1) {
        const updated = { ...state.punches[idx], note: newText };
        await idb.put(updated);
        state.punches[idx] = updated;
        // Re-render relevant UI to reflect note presence/absence
        try { 
          // If note was cleared, close popover; else show updated content
          if (!newText) {
            hideNotePopover();
          } else {
            exitEditMode();
          }
          // Refresh UI so dots/table reflect current note state
          renderAll();
        } catch {}
      }
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
  });
}

// Note modal (replaces popover for table/track notes)
let quillInstance = null;
function ensureQuill() {
  try {
    if (!quillInstance && window.Quill && els.noteEditor) {
      quillInstance = new window.Quill(els.noteEditor, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'code-block'],
            [{ header: [2, 3, false] }]
          ],
        },
      });
    }
  } catch {}
  return quillInstance;
}

// Second editor for bucket persistent notes (Note modal)
let quillBucket = null;
function ensureBucketQuill() {
  try {
    if (!quillBucket && window.Quill && els.bucketNoteEditor) {
      quillBucket = new window.Quill(els.bucketNoteEditor, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'code-block'],
            [{ header: [2, 3, false] }]
          ],
        },
      });
    }
  } catch {}
  return quillBucket;
}

function openNoteModal(id) {
  const p = state.punches.find((x) => x.id === id);
  if (!p) return;
  hideNotePopover();
  if (!els.noteModal) return;
  els.noteModal.dataset.id = String(id);
  try { if (els.noteModalTitle) els.noteModalTitle.textContent = `Note — ${p.bucket || '(no bucket)'}`; } catch {}
  const html = markdownToHtml(p.note || '');
  if (els.noteViewer) els.noteViewer.innerHTML = html;
  // Initialize editor with HTML
  const q = ensureQuill();
  if (q) {
    try { q.setContents([]); } catch {}
    try { q.clipboard.dangerouslyPasteHTML(html || ''); } catch { try { q.root.innerHTML = html || ''; } catch {} }
  }
  // Show editor by default for easy editing
  if (els.noteEditorWrap) els.noteEditorWrap.style.display = '';
  if (els.noteViewer) els.noteViewer.style.display = 'none';
  if (els.noteEditToggle) { els.noteEditToggle.style.display = ''; els.noteEditToggle.textContent = 'View'; }
  els.noteModal.style.display = 'flex';
  // Initialize bucket persistent note viewer/editor
  try {
    const bucketName = String(p.bucket || '');
    const bq = ensureBucketQuill();
    if (els.bucketNoteViewer) els.bucketNoteViewer.innerHTML = '';
    // Load bucket note asynchronously
    idb.getBucket(bucketName).then((rec) => {
      const raw = (rec && rec.note) || '';
      const html = markdownToHtml(raw || '');
      try { if (els.bucketNoteViewer) els.bucketNoteViewer.innerHTML = html; } catch {}
      try {
        if (bq) {
          bq.setContents([]);
          bq.clipboard.dangerouslyPasteHTML(html || '');
        }
      } catch { try { if (bq?.root) bq.root.innerHTML = html || ''; } catch {} }
    }).catch(() => {});
    // Default to showing editors for both sections
    if (els.bucketNoteEditorWrap) els.bucketNoteEditorWrap.style.display = '';
    if (els.bucketNoteViewer) els.bucketNoteViewer.style.display = 'none';
  } catch {}
}

function closeNoteModal() {
  if (els.noteModal) {
    els.noteModal.style.display = 'none';
    delete els.noteModal.dataset.id;
  }
}

function getView() {
  const start = Math.max(0, Math.min(24 * 60, Number(state.viewStartMin)));
  const end = Math.max(0, Math.min(24 * 60, Number(state.viewEndMin)));
  const s = Math.min(start, end);
  const e = Math.max(start, end);
  const minutes = Math.max(1, e - s);
  return { start: s, end: e, minutes, startH: Math.floor(s / 60), endH: Math.ceil(e / 60) };
}

// Update the mobile scrollbar window to reflect current view
function renderMobileControls() {
  if (!els.mobileWindow || !els.mobileScrollbar) return;
  const view = getView();
  const total = 24 * 60;
  const leftPct = (view.start / total) * 100;
  const widthPct = (view.minutes / total) * 100;
  els.mobileWindow.style.left = leftPct + '%';
  els.mobileWindow.style.width = widthPct + '%';
  try { els.mobileWindow.setAttribute('aria-valuenow', String(view.start)); } catch {}
  try {
    if (els.mobileZoomRange) {
      els.mobileZoomRange.min = '45';
      els.mobileZoomRange.max = String(total);
      els.mobileZoomRange.step = '15';
      els.mobileZoomRange.value = String(view.minutes);
    }
  } catch {}
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

// Schedule helpers
function getScheduleFilterIds() {
  const id = state.currentScheduleId;
  return id == null ? null : [Number(id)];
}
function filterBySchedules(items, scheduleIds = null) {
  if (!scheduleIds) return items;
  const set = new Set(scheduleIds.map(Number));
  return items.filter((p) => p && p.scheduleId != null && set.has(Number(p.scheduleId)));
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
  const scheduleIds = getScheduleFilterIds();
  const sorted = filterBySchedules(
    [...state.punches].filter((p) => getPunchDate(p) === day),
    scheduleIds
  )
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
  const scheduleIds = getScheduleFilterIds();
  const sorted = filterBySchedules(
    [...state.punches].filter((p) => getPunchDate(p) === day),
    scheduleIds
  )
    .sort((a, b) => a.start - b.start);
  for (const p of sorted) {
    const tr = document.createElement('tr');
    tr.dataset.id = p.id;
    const status = p.status || 'default';
    // reflect status on the entire row for quick scanning
    tr.classList.add(`status-${status}`);
    const dur = p.end - p.start;
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
      <td class="cell-start copy-cell" title="Click to copy start">${time.toLabel(p.start)}</td>
      <td class="cell-end copy-cell" title="Click to copy stop">${time.toLabel(p.end)}</td>
      <td class="cell-duration copy-cell" title="Click to copy duration">${time.durationLabel(dur)}</td>
      <td class="cell-bucket copy-cell" title="Click to copy bucket">${escapeHtml(p.bucket || '')}</td>
      <td class="note"><div class="note-window" role="region" aria-label="Note preview"><div class="note-html">${markdownToHtml(p.note || '')}</div></div></td>
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
  const scheduleIds = getScheduleFilterIds();
  const totalMin = filterBySchedules(state.punches
    .filter((p) => getPunchDate(p) === day), scheduleIds)
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
  const scheduleIds = getScheduleFilterIds();
  const items = filterBySchedules(state.punches.filter((p) => getPunchDate(p) === day), scheduleIds);
  const sums = summarizeByBucket(items);
  const sorted = Array.from(sums.entries())
    .filter(([_, v]) => v.totalMin > 0)
    .sort((a, b) => b[1].totalMin - a[1].totalMin || a[0].localeCompare(b[0]));
  els.bucketDayBody.innerHTML = '';
  for (const [bucket, info] of sorted) {
    const tr = document.createElement('tr');
    tr.dataset.bucket = bucket;
    const label = bucket || '(no bucket)';
    tr.innerHTML = `<td><a href="#" class="bucket-link">${escapeHtml(label)}</a></td><td>${time.durationLabel(info.totalMin)}</td>`;
    els.bucketDayBody.appendChild(tr);
  }
  if (els.bucketDayEmpty) els.bucketDayEmpty.style.display = sorted.length ? 'none' : 'block';
  els.bucketDayCard.style.display = state.viewMode === 'calendar' ? 'none' : '';
}

function renderBucketMonth() {
  if (!els.bucketMonthBody || !els.bucketMonthCard) return;
  const y = state.calendarYear;
  const m = state.calendarMonth; // 0-11
  const scheduleIds = getScheduleFilterIds();
  const items = filterBySchedules(state.punches.filter((p) => {
    const d = (p.date || '').split('-');
    if (d.length !== 3) return false;
    const yy = Number(d[0]);
    const mm = Number(d[1]) - 1;
    return yy === y && mm === m;
  }), scheduleIds);
  const sums = summarizeByBucket(items);
  const sorted = Array.from(sums.entries())
    .filter(([_, v]) => v.totalMin > 0)
    .sort((a, b) => b[1].totalMin - a[1].totalMin || a[0].localeCompare(b[0]));
  els.bucketMonthBody.innerHTML = '';
  for (const [bucket, info] of sorted) {
    const tr = document.createElement('tr');
    tr.dataset.bucket = bucket;
    const label = bucket || '(no bucket)';
    tr.innerHTML = `<td><a href="#" class="bucket-link">${escapeHtml(label)}</a></td><td>${time.durationLabel(info.totalMin)}</td>`;
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

function renderBucketView() {
  if (!els.bucketViewCard || !els.bucketViewBody) return;
  const name = String(state.bucketFilter || '');
  const label = name || '(no bucket)';
  if (els.bucketViewTitle) els.bucketViewTitle.textContent = label;
  const scheduleIds = getScheduleFilterIds();
  const items = filterBySchedules(
    state.punches.filter((p) => String(p.bucket || '').trim() === name),
    scheduleIds
  )
    .slice()
    .sort((a, b) => {
      const ad = String(a.date || '').localeCompare(String(b.date || ''));
      if (ad !== 0) return ad;
      return (a.start || 0) - (b.start || 0);
    });
  // Total duration for this bucket
  try {
    const totalMin = items.reduce((s, p) => s + Math.max(0, (p.end || 0) - (p.start || 0)), 0);
    if (els.bucketViewTotal) els.bucketViewTotal.textContent = totalMin ? `— Total: ${time.durationLabel(totalMin)}` : '';
  } catch {}
  els.bucketViewBody.innerHTML = '';
  for (const p of items) {
    const tr = document.createElement('tr');
    tr.dataset.id = p.id;
    const dur = Math.max(0, (p.end || 0) - (p.start || 0));
    tr.innerHTML = `
      <td>${escapeHtml(p.date || '')}</td>
      <td>${time.toLabel(p.start || 0)}</td>
      <td>${time.toLabel(p.end || 0)}</td>
      <td>${time.durationLabel(dur)}</td>
      <td class="note"><div class="note-html">${markdownToHtml(p.note || '')}</div></td>`;
    els.bucketViewBody.appendChild(tr);
  }
  if (els.bucketViewEmpty) els.bucketViewEmpty.style.display = items.length ? 'none' : 'block';
}

function renderDayLabel() {
  if (!els.dayLabel) return;
  if (state.viewMode === 'calendar' || state.viewMode === 'bucket') {
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
  if (state.viewMode === 'bucket') {
    els.viewHelp.textContent = 'Bucket: click Back to Calendar to return A� Use Delete Bucket to remove all entries';
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
    // Month dashboard override (only in days-mode)
    const showMonthModules = Array.isArray(state.monthModules) && state.monthModules.length && (state.calendarMode || 'days') === 'days';
    if (els.monthDashboardCard) els.monthDashboardCard.style.display = showMonthModules ? '' : 'none';
    if (els.calendarCard) els.calendarCard.style.display = showMonthModules ? 'none' : 'block';
    if (els.btnCalendar) els.btnCalendar.textContent = 'Back to Day';
    calendar.renderCalendar();
    if (els.bucketMonthCard) {
      const show = (state.calendarMode || 'days') === 'days' && !showMonthModules;
      els.bucketMonthCard.style.display = show ? '' : 'none';
    }
    if (els.bucketViewCard) els.bucketViewCard.style.display = 'none';
    if (showMonthModules) { try { renderMonthDashboard(); } catch {} }
    else { renderBucketMonth(); }
  } else if (state.viewMode === 'bucket') {
    if (timelineCard) timelineCard.style.display = 'none';
    if (mainTableCard) mainTableCard.style.display = 'none';
    if (els.calendarCard) els.calendarCard.style.display = 'none';
    if (els.btnCalendar) els.btnCalendar.textContent = 'Calendar';
    if (els.bucketDayCard) els.bucketDayCard.style.display = 'none';
    if (els.bucketMonthCard) els.bucketMonthCard.style.display = 'none';
    if (els.bucketViewCard) els.bucketViewCard.style.display = '';
    try { renderBucketView(); } catch {}
  } else if (state.viewMode === 'dashboard') {
    if (timelineCard) timelineCard.style.display = 'none';
    if (mainTableCard) mainTableCard.style.display = 'none';
    if (els.calendarCard) els.calendarCard.style.display = 'none';
    if (els.btnCalendar) els.btnCalendar.textContent = 'Calendar';
    if (els.bucketDayCard) els.bucketDayCard.style.display = 'none';
    if (els.bucketMonthCard) els.bucketMonthCard.style.display = 'none';
    if (els.bucketViewCard) els.bucketViewCard.style.display = 'none';
    if (els.dashboardCard) els.dashboardCard.style.display = '';
    try { renderDashboard(); } catch {}
  } else {
    if (timelineCard) timelineCard.style.display = '';
    if (mainTableCard) mainTableCard.style.display = '';
    if (els.calendarCard) els.calendarCard.style.display = 'none';
    if (els.btnCalendar) els.btnCalendar.textContent = 'Calendar';
    const showDayModules = Array.isArray(state.dayModules) && state.dayModules.length > 0;
    if (els.dayDashboardCard) els.dayDashboardCard.style.display = showDayModules ? '' : 'none';
    if (els.bucketDayCard) els.bucketDayCard.style.display = showDayModules ? 'none' : '';
    if (timelineCard) timelineCard.style.display = showDayModules ? 'none' : '';
    if (mainTableCard) mainTableCard.style.display = showDayModules ? 'none' : '';
    if (els.bucketMonthCard) els.bucketMonthCard.style.display = 'none';
    if (els.bucketViewCard) els.bucketViewCard.style.display = 'none';
    if (els.dashboardCard) els.dashboardCard.style.display = 'none';
    if (showDayModules) {
      try { renderDayDashboard(); } catch {}
    } else {
      renderTicks();
      renderTimeline();
      renderTable();
      renderTotal();
      nowIndicator.update();
      renderBucketDay();
    }
  }
  try { if (els.btnBucketBackTop) els.btnBucketBackTop.style.display = state.viewMode === 'bucket' ? '' : 'none'; } catch {}
  renderDayLabel();
  updateHelpText();
  // Ensure clear instructions on bucket view
  try {
    if (state.viewMode === 'bucket' && els.viewHelp) {
      els.viewHelp.textContent = "Bucket: Click 'Back to Calendar' to return; click 'Delete Bucket' to remove all entries.";
    }
  } catch {}
  try { renderMobileControls(); } catch {}
  try { fitMobileViewport(); } catch {}
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
  // Default schedule for new block
  try {
    const curId = (state.currentScheduleId != null) ? Number(state.currentScheduleId) : (state.schedules?.[0]?.id ?? null);
    const cur = (state.schedules || []).find((s) => Number(s.id) === Number(curId));
    if (els.scheduleField) els.scheduleField.value = cur?.name || '';
  } catch {}
  // Populate schedule datalist
  try {
    const list = els.scheduleList;
    if (list) {
      list.innerHTML = '';
      for (const s of state.schedules || []) {
        const opt = document.createElement('option');
        opt.value = String(s.name || `Schedule ${s.id}`);
        list.appendChild(opt);
      }
    }
  } catch {}
  try {
    if (els.bucketNoteField) els.bucketNoteField.value = '';
    if (els.bucketNotePreview) { els.bucketNotePreview.style.display = 'none'; els.bucketNotePreview.innerHTML = ''; }
    if (els.bucketNotePreviewToggle) els.bucketNotePreviewToggle.textContent = 'Preview';
  } catch {}
  // Reset recurrence controls for new item
  try {
    if (els.repeatEnabled) els.repeatEnabled.checked = false;
    if (els.repeatFields) els.repeatFields.style.display = 'none';
    if (els.applyScopeWrap) els.applyScopeWrap.style.display = 'none';
    if (els.repeatFreq) els.repeatFreq.value = 'weekly';
    if (els.repeatUntil) els.repeatUntil.value = '';
    if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = 'none';
  } catch {}
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
  try {
    if (els.repeatEnabled) els.repeatEnabled.disabled = false;
    if (els.repeatFreq) els.repeatFreq.disabled = false;
    if (els.repeatUntil) els.repeatUntil.disabled = false;
    if (els.repeatDowWrap) els.repeatDowWrap.style.display = 'none';
    if (els.repeatDow) els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => (c.checked = false));
    if (els.extendWrap) els.extendWrap.style.display = 'none';
  } catch {}
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
  try { renderScheduleSelect(); } catch {}
  updateViewMode();
}

function fitMobileViewport() {
  const isMobile = Math.min(window.innerWidth, document.documentElement.clientWidth || window.innerWidth) <= 720;
  if (!isMobile) {
    if (els.track) els.track.style.height = '';
    return;
  }
  if (!els.track) return;
  const headerEl = document.querySelector('.header');
  const topControls = document.getElementById('topControls');
  const mobileControls = els.mobileControls;
  const vh = Math.max(window.innerHeight, document.documentElement.clientHeight || 0);
  const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
  const topH = topControls && topControls.offsetParent !== null ? topControls.getBoundingClientRect().height : 0;
  const mobileH = mobileControls && mobileControls.offsetParent !== null ? mobileControls.getBoundingClientRect().height : 0;
  const margins = 24; // combined margins/padding around sections
  const available = Math.max(120, vh - headerH - topH - mobileH - margins);
  const desired = Math.max(96, Math.min(180, Math.floor(available)));
  els.track.style.height = desired + 'px';
}

// --- Schedules / Dashboard helpers ---
function renderScheduleSelect() {
  const sel = els.scheduleSelect;
  if (!sel) return;
  const cur = Number(state.currentScheduleId);
  sel.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = '';
  optAll.textContent = 'All Schedules';
  if (state.currentScheduleId == null) optAll.selected = true;
  sel.appendChild(optAll);
  for (const s of state.schedules || []) {
    const opt = document.createElement('option');
    opt.value = String(s.id);
    opt.textContent = s.name || `Schedule ${s.id}`;
    if (Number(s.id) === cur) opt.selected = true;
    sel.appendChild(opt);
  }
}

function renderModuleTimeline(container, scheduleIds) {
  const view = getView();
  const day = currentDay();
  const items = filterBySchedules((state.punches || []).filter((p) => getPunchDate(p) === day), scheduleIds)
    .sort((a, b) => a.start - b.start);
  const track = document.createElement('div');
  track.className = 'module-track';
  for (const p of items) {
    const startClamped = Math.max(p.start, view.start);
    const endClamped = Math.min(p.end, view.end);
    if (endClamped <= startClamped) continue;
    const leftPct = ((startClamped - view.start) / view.minutes) * 100;
    const widthPct = ((endClamped - startClamped) / view.minutes) * 100;
    const el = document.createElement('div');
    el.className = 'module-punch';
    const st = p.status || 'default';
    el.classList.add(`status-${st}`);
    el.style.left = leftPct + '%';
    el.style.width = widthPct + '%';
    el.title = `${p.bucket || '(no bucket)'} — ${time.toLabel(p.start)}–${time.toLabel(p.end)}`;
    track.appendChild(el);
  }
  container.appendChild(track);
}

function renderModuleEntries(container, scheduleIds) {
  const day = currentDay();
  const items = filterBySchedules((state.punches || []).filter((p) => getPunchDate(p) === day), scheduleIds)
    .sort((a, b) => a.start - b.start);
  const table = document.createElement('table');
  table.className = 'mini-table';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th style="width:120px">Start</th><th style="width:120px">Stop</th><th style="width:140px">Duration</th><th>Bucket</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  for (const p of items) {
    const tr = document.createElement('tr');
    const dur = (p.end || 0) - (p.start || 0);
    tr.innerHTML = `<td>${time.toLabel(p.start || 0)}</td><td>${time.toLabel(p.end || 0)}</td><td>${time.durationLabel(dur)}</td><td>${escapeHtml(p.bucket || '')}</td>`;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);
}

function renderModuleBucket(container, scheduleIds) {
  const day = currentDay();
  const items = filterBySchedules((state.punches || []).filter((p) => getPunchDate(p) === day), scheduleIds);
  const sums = new Map();
  for (const p of items) {
    const key = String(p.bucket || '');
    const prev = sums.get(key) || { totalMin: 0, count: 0 };
    sums.set(key, { totalMin: prev.totalMin + Math.max(0, (p.end || 0) - (p.start || 0)), count: prev.count + 1 });
  }
  const sorted = Array.from(sums.entries()).filter(([_, v]) => v.totalMin > 0).sort((a, b) => b[1].totalMin - a[1].totalMin || a[0].localeCompare(b[0]));
  const table = document.createElement('table');
  table.className = 'mini-table';
  table.innerHTML = '<thead><tr><th>Bucket</th><th style="width:140px">Total</th></tr></thead>';
  const tbody = document.createElement('tbody');
  for (const [bucket, info] of sorted) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(bucket || '(no bucket)')}</td><td>${time.durationLabel(info.totalMin)}</td>`;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);
}

function renderDashboard() {
  const grid = els.dashboardGrid;
  if (!grid) return;
  grid.innerHTML = '';
  const mods = Array.isArray(state.dashboardModules) ? state.dashboardModules : [];
  for (const m of mods) {
    const card = document.createElement('div');
    card.className = 'card';
    const head = document.createElement('div'); head.className = 'card-head';
    const title = document.createElement('div'); title.className = 'card-title';
    const schedNames = (state.schedules || []).filter((s) => (m.scheduleIds||[]).some((id) => Number(id)===Number(s.id))).map((s) => s.name).join(', ');
    title.textContent = m.title || `${m.type[0].toUpperCase()+m.type.slice(1)} — ${schedNames || 'No schedules'}`;
    const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.gap = '8px'; actions.style.alignItems = 'center';
    const btnRemove = document.createElement('button'); btnRemove.className = 'btn danger'; btnRemove.textContent = 'Remove';
    btnRemove.addEventListener('click', () => {
      state.dashboardModules = (state.dashboardModules||[]).filter((x) => x.id !== m.id);
      try { localStorage.setItem('dashboard.modules.v1', JSON.stringify(state.dashboardModules)); } catch {}
      renderDashboard();
    });
    const btnOpen = document.createElement('button'); btnOpen.className = 'btn ghost'; btnOpen.textContent = 'Open';
    btnOpen.addEventListener('click', () => {
      if (Array.isArray(m.scheduleIds) && m.scheduleIds.length) {
        state.currentScheduleId = Number(m.scheduleIds[0]);
        try { if (els.scheduleSelect) els.scheduleSelect.value = String(state.currentScheduleId); } catch {}
        try { localStorage.setItem('currentScheduleId', String(state.currentScheduleId)); } catch {}
      }
      state.viewMode = 'day';
      updateViewMode();
    });
    actions.appendChild(btnOpen); actions.appendChild(btnRemove);
    head.append(title, actions);
    const body = document.createElement('div'); body.className = 'card-body';
    if (m.type === 'timeline') renderModuleTimeline(body, m.scheduleIds || null);
    else if (m.type === 'entries') renderModuleEntries(body, m.scheduleIds || null);
    else if (m.type === 'bucket') renderModuleBucket(body, m.scheduleIds || null);
    card.append(head, body);
    grid.appendChild(card);
  }
}

function renderDayDashboard() {
  const grid = els.dayDashboardGrid;
  if (!grid) return;
  grid.innerHTML = '';
  const mods = Array.isArray(state.dayModules) ? state.dayModules : [];
  for (const m of mods) {
    const card = document.createElement('div');
    card.className = 'card';
    const head = document.createElement('div'); head.className = 'card-head';
    const title = document.createElement('div'); title.className = 'card-title';
    const schedNames = (state.schedules || []).filter((s) => (m.scheduleIds||[]).some((id) => Number(id)===Number(s.id))).map((s) => s.name).join(', ');
    title.textContent = m.title || `${m.type[0].toUpperCase()+m.type.slice(1)} – ${schedNames || 'No schedules'}`;
    const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.gap = '8px'; actions.style.alignItems = 'center';
    const btnRemove = document.createElement('button'); btnRemove.className = 'btn danger'; btnRemove.textContent = 'Remove';
    btnRemove.addEventListener('click', () => {
      state.dayModules = (state.dayModules||[]).filter((x) => x.id !== m.id);
      try { localStorage.setItem('modules.day.v1', JSON.stringify(state.dayModules)); } catch {}
      renderDayDashboard();
    });
    const btnOpen = document.createElement('button'); btnOpen.className = 'btn ghost'; btnOpen.textContent = 'Open';
    btnOpen.addEventListener('click', () => {
      if (Array.isArray(m.scheduleIds) && m.scheduleIds.length) {
        state.currentScheduleId = Number(m.scheduleIds[0]);
        try { if (els.scheduleSelect) els.scheduleSelect.value = String(state.currentScheduleId); } catch {}
        try { localStorage.setItem('currentScheduleId', String(state.currentScheduleId)); } catch {}
      }
      state.viewMode = 'day';
      updateViewMode();
    });
    actions.appendChild(btnOpen); actions.appendChild(btnRemove);
    head.append(title, actions);
    const body = document.createElement('div'); body.className = 'card-body';
    if (m.type === 'timeline') renderModuleTimeline(body, m.scheduleIds || null);
    else if (m.type === 'entries') renderModuleEntries(body, m.scheduleIds || null);
    else if (m.type === 'bucket') renderModuleBucket(body, m.scheduleIds || null);
    card.append(head, body);
    grid.appendChild(card);
  }
}

function renderModuleCalendar(container) {
  // Render compact month calendar into container
  const wrap = document.createElement('div');
  wrap.style.padding = '8px 4px';
  // temporarily create an element and ask calendar module to render into it
  const tempGrid = document.createElement('div');
  tempGrid.className = 'calendar-grid';
  wrap.appendChild(tempGrid);
  // Mirror state for month/year and let calendar.js render into the real grid, then copy
  try {
    // Render calendar into the main grid invisibly and clone
    const prev = els.calendarGrid?.innerHTML;
    calendar.renderCalendar();
    if (els.calendarGrid) {
      tempGrid.innerHTML = els.calendarGrid.innerHTML;
    }
    // do not disturb
    if (els.calendarGrid) els.calendarGrid.innerHTML = prev;
  } catch {}
  container.appendChild(wrap);
}

function renderModuleBucketMonth(container, scheduleIds) {
  const y = state.calendarYear;
  const m = state.calendarMonth;
  const items = filterBySchedules(state.punches.filter((p) => {
    const d = String(p.date || '').split('-');
    if (d.length !== 3) return false;
    const yy = Number(d[0]);
    const mm = Number(d[1]) - 1;
    return yy === y && mm === m;
  }), scheduleIds || getScheduleFilterIds());
  const sums = new Map();
  for (const p of items) {
    const key = String(p.bucket || '');
    const prev = sums.get(key) || { totalMin: 0, count: 0 };
    const dur = Math.max(0, (p.end || 0) - (p.start || 0));
    sums.set(key, { totalMin: prev.totalMin + dur, count: prev.count + 1 });
  }
  const sorted = Array.from(sums.entries())
    .filter(([_, v]) => v.totalMin > 0)
    .sort((a, b) => b[1].totalMin - a[1].totalMin || a[0].localeCompare(b[0]));
  const table = document.createElement('table');
  table.className = 'mini-table';
  table.innerHTML = '<thead><tr><th>Bucket</th><th style="width:140px">Total</th></tr></thead>';
  const tbody = document.createElement('tbody');
  for (const [bucket, info] of sorted) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(bucket || '(no bucket)')}</td><td>${time.durationLabel(info.totalMin)}</td>`;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);
}

function renderMonthDashboard() {
  const grid = els.monthDashboardGrid;
  if (!grid) return;
  grid.innerHTML = '';
  const mods = Array.isArray(state.monthModules) ? state.monthModules : [];
  for (const m of mods) {
    const card = document.createElement('div');
    card.className = 'card';
    const head = document.createElement('div'); head.className = 'card-head';
    const title = document.createElement('div'); title.className = 'card-title';
    title.textContent = m.title || (m.type === 'calendar' ? 'Calendar' : 'Bucket Report');
    const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.gap = '8px'; actions.style.alignItems = 'center';
    const btnRemove = document.createElement('button'); btnRemove.className = 'btn danger'; btnRemove.textContent = 'Remove';
    btnRemove.addEventListener('click', () => {
      state.monthModules = (state.monthModules||[]).filter((x) => x.id !== m.id);
      try { localStorage.setItem('modules.month.v1', JSON.stringify(state.monthModules)); } catch {}
      renderMonthDashboard();
    });
    actions.appendChild(btnRemove);
    head.append(title, actions);
    const body = document.createElement('div'); body.className = 'card-body';
    if (m.type === 'calendar') renderModuleCalendar(body);
    else if (m.type === 'bucket-month') renderModuleBucketMonth(body, m.scheduleIds || null);
    card.append(head, body);
    grid.appendChild(card);
  }
}

export const ui = {
  renderAll,
  renderTicks,
  renderTimeline,
  renderTable,
  renderTotal,
  toggleNotePopover,
  hideNotePopover,
  openNoteModal,
  closeNoteModal,
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
  renderBucketView,
  renderMobileControls,
  renderScheduleSelect,
  renderDashboard,
};


