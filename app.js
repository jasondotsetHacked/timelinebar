const DAY_MIN = 24 * 60;
const SNAP_MIN = 15;
// display window: 6:00 (360) -> 18:00 (1080)
const VIEW_START_MIN = 6 * 60; // 360
const VIEW_END_MIN = 18 * 60; // 1080
const VIEW_MINUTES = VIEW_END_MIN - VIEW_START_MIN; // 720
const VIEW_START_H = VIEW_START_MIN / 60;
const VIEW_END_H = VIEW_END_MIN / 60;
 
const state = { punches: [], dragging: null, resizing: null, pendingRange: null, editingId: null };
 
const els = {
  track: document.getElementById('track'),
  ghost: document.getElementById('ghost'),
  tipStart: document.getElementById('tipStart'),
  tipEnd: document.getElementById('tipEnd'),
  tipCenter: document.getElementById('tipCenter'),
  ticks: document.getElementById('ticks'),
  rows: document.getElementById('rows'),
  empty: document.getElementById('empty'),
  modal: document.getElementById('modal'),
  startField: document.getElementById('startField'),
  endField: document.getElementById('endField'),
  caseField: document.getElementById('caseField'),
  noteField: document.getElementById('noteField'),
  modalForm: document.getElementById('modalForm'),
  modalCancel: document.getElementById('modalCancel'),
  modalClose: document.getElementById('modalClose'),
  modalTitle: document.querySelector('.modal-title'),
  modalFooter: document.querySelector('.modal-footer'),
  total: document.getElementById('total'),
  toast: document.getElementById('toast')
};
 
const idb = (() => {
  const open = () => new Promise((resolve, reject) => {
    const req = indexedDB.open('timeTrackerDB', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('punches', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const withStore = (mode, fn) => open().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('punches', mode);
    const store = tx.objectStore('punches');
    fn(store);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
  const add = (punch) => withStore('readwrite', store => store.add(punch));
  const put = (punch) => withStore('readwrite', store => store.put(punch));
  const remove = (id) => withStore('readwrite', store => store.delete(id));
  const all = () => open().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('punches', 'readonly');
    const store = tx.objectStore('punches');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  }));
  return { add, put, remove, all };
})();
 
const time = {
  clamp: (min) => Math.max(0, Math.min(DAY_MIN, Math.round(min))),
  snap: (min) => Math.max(0, Math.min(DAY_MIN, Math.round(min / SNAP_MIN) * SNAP_MIN)),
  toLabel: (mins) => {
    mins = Math.max(0, Math.min(DAY_MIN, Math.round(mins)));
    const h24 = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const ampm = h24 >= 12 ? 'pm' : 'am';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const mm = m.toString().padStart(2, '0');
    return `${h12}:${mm}${ampm}`;
  },
  durationLabel: (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}h${m}m`;
  }
};
 
const ui = {
  renderAll() { ui.renderTicks(); ui.renderTimeline(); ui.renderTable(); ui.renderTotal(); },
  renderTicks() {
    els.ticks.innerHTML = '';
    for (let h = VIEW_START_H; h <= VIEW_END_H; h++) {
      const el = document.createElement('div');
      el.className = 'tick';
      const minutes = h * 60;
      const pct = ((minutes - VIEW_START_MIN) / VIEW_MINUTES) * 100;
      el.style.left = pct + '%';
      el.textContent = hourLabel(h % 24);
      if (h === VIEW_START_H) el.dataset.edge = 'start';
      if (h === VIEW_END_H) el.dataset.edge = 'end';
      els.ticks.appendChild(el);
    }
  },
  renderTimeline() {
    els.track.querySelectorAll('.punch').forEach(n => n.remove());
    const sorted = [...state.punches].sort((a,b) => a.start - b.start);
  // remove any existing label layer
  const existingLayer = els.track.querySelector('.label-layer');
  if (existingLayer) existingLayer.remove();
 
  const labelLayer = document.createElement('div');
  labelLayer.className = 'label-layer';
  // We'll collect narrow punches to render poppers below
  const narrowItems = [];
  // compute track width up-front so we can size edge columns per-punch
  const rect = els.track.getBoundingClientRect();
  const trackWidth = rect.width || 1;
 
  for (const p of sorted) {
      // clip punches to the visible view window
      const startClamped = Math.max(p.start, VIEW_START_MIN);
      const endClamped = Math.min(p.end, VIEW_END_MIN);
      if (endClamped <= startClamped) continue;
      const leftPct = ((startClamped - VIEW_START_MIN) / VIEW_MINUTES) * 100;
      const widthPct = ((endClamped - startClamped) / VIEW_MINUTES) * 100;
      const el = document.createElement('div');
      el.className = 'punch';
      el.style.left = leftPct + '%';
      el.style.width = widthPct + '%';
      el.dataset.id = p.id;
  const leftHandle = document.createElement('div'); leftHandle.className = 'handle left'; leftHandle.dataset.edge = 'left'; leftHandle.tabIndex = 0; leftHandle.setAttribute('aria-label','Resize left edge');
  const label = document.createElement('div'); label.className = 'punch-label'; label.textContent = p.caseNumber || '(no case)';
  // make label keyboard/click accessible for edit
  label.dataset.id = p.id;
  const rightHandle = document.createElement('div'); rightHandle.className = 'handle right'; rightHandle.dataset.edge = 'right'; rightHandle.tabIndex = 0; rightHandle.setAttribute('aria-label','Resize right edge');
  // controls (edit/delete) shown on hover
  const controls = document.createElement('div'); controls.className = 'controls';
  const editBtn = document.createElement('button'); editBtn.className = 'control-btn edit'; editBtn.title = 'Edit'; editBtn.textContent = '\u270E'; editBtn.dataset.id = p.id;
  const delBtn = document.createElement('button'); delBtn.className = 'control-btn delete'; delBtn.title = 'Delete'; delBtn.textContent = '\u2715'; delBtn.dataset.id = p.id;
  controls.append(editBtn, delBtn);
      el.append(label, controls);
      // size handle widths per-punch to avoid overlap when very narrow
      const pxWidth = (widthPct/100) * trackWidth;
  // default edge width (wider for easier grabbing)
  let edgeW = 8;
  if (pxWidth >= 48) {
    edgeW = 16;
  } else if (pxWidth >= 28) {
    edgeW = 14;
  } else if (pxWidth >= 18) {
    edgeW = 12;
  } else {
    // small blocks: choose an edge size proportional but ensure center gap >= 4px
    edgeW = Math.max(6, Math.floor(pxWidth / 3));
    const centerMin = 4;
    if (edgeW * 2 > pxWidth - centerMin) {
      edgeW = Math.max(4, Math.floor((pxWidth - centerMin) / 2));
    }
    // clamp to sane bounds
    edgeW = Math.max(4, Math.min(18, edgeW));
  }
  // ensure numeric fallback
  if (!Number.isFinite(edgeW) || edgeW <= 0) edgeW = 6;
  // ensure handles are sized and positioned absolutely inside the punch
  leftHandle.style.width = edgeW + 'px';
  rightHandle.style.width = edgeW + 'px';
  leftHandle.style.left = '0px';
  rightHandle.style.right = '0px';
    // create visible inner bar node for deterministic positioning
    const leftBar = document.createElement('div'); leftBar.className = 'handle-bar';
    const rightBar = document.createElement('div'); rightBar.className = 'handle-bar';
    leftHandle.appendChild(leftBar);
    rightHandle.appendChild(rightBar);
    // anchor the visible bar explicitly to avoid CSS flipping issues
    try {
      // flipped orientation: anchor bars to the opposite side
      leftBar.style.left = '0px';
      leftBar.style.right = '';
      leftBar.style.borderTopLeftRadius = '8px';
      leftBar.style.borderBottomLeftRadius = '8px';
      rightBar.style.right = '0px';
      rightBar.style.left = '';
      rightBar.style.borderTopRightRadius = '8px';
      rightBar.style.borderBottomRightRadius = '8px';
    } catch (err) { /* ignore */ }
    el.append(leftHandle, rightHandle);
  // optional debug visualization
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
  } catch (err) { /* ignore in old browsers */ }
  els.track.appendChild(el);
  // after insertion, verify the visible bars are on the correct sides; if not, auto-correct
  try {
    // run in next frame so layout is updated
    requestAnimationFrame(() => {
      const elRect = el.getBoundingClientRect();
      const leftBarRect = leftBar.getBoundingClientRect();
      const rightBarRect = rightBar.getBoundingClientRect();
      const centerX = elRect.left + elRect.width / 2;
      // if left bar somehow ended up on the right half, anchor it back left
      if (leftBarRect.left > centerX) {
        leftBar.style.left = '0px'; leftBar.style.right = '';
        if (window.DEBUG_HANDLES) console.log('HANDLE_AUTOFLIP: corrected left (anchor left) for', p.id);
      }
      // if right bar somehow ended up on the left half, anchor it back right
      if (rightBarRect.right < centerX) {
        rightBar.style.right = '0px'; rightBar.style.left = '';
        if (window.DEBUG_HANDLES) console.log('HANDLE_AUTOFLIP: corrected right (anchor right) for', p.id);
      }
    });
  } catch (err) { /* ignore */ }
 
  // if width is small, mark narrow to show label outside
  if (widthPct < 6) { el.classList.add('narrow'); } else { el.classList.remove('narrow'); }
      if (widthPct < 6) {
        const centerPct = leftPct + widthPct / 2;
        narrowItems.push({ punch: p, leftPct, widthPct, centerPct });
      }
    }
 
  // compute stacked positions for poppers so they don't overlap
  // convert pct -> px using previously computed trackWidth
    // columns array of arrays; we'll place poppers in rows stacked below
    const placed = [];
    for (const it of narrowItems) {
      const centerPx = (it.centerPct/100) * trackWidth;
      // find a row that doesn't collide (we use 120px popper width + 8px gap)
      let row = 0;
      while (true) {
        const conflict = placed[row]?.some(p => Math.abs(p - centerPx) < 120);
        if (!conflict) break;
        row++;
      }
      placed[row] = placed[row] || [];
      placed[row].push(centerPx);
      it.row = row;
      it.centerPx = centerPx;
    }
 
    // render poppers for each narrow item
    for (const it of narrowItems) {
      const pop = document.createElement('div');
      pop.className = 'label-popper';
      // left anchored so it centers on centerPx
      const pxLeft = Math.max(6, it.centerPx - 55); // keep within bounds a bit
      pop.style.left = pxLeft + 'px';
      pop.style.top = (8 + it.row * 40) + 'px';
      pop.dataset.id = it.punch.id;
  pop.innerHTML = `<div class="label-text">${escapeHtml(it.punch.caseNumber || '(no case)')}</div><div class="controls"><button class="control-btn edit" title="Edit">\u270E</button><button class="control-btn delete" title="Delete">\u2715</button></div>`;
  // hide by default; show on hover of the corresponding punch
  pop.style.display = 'none';
      // connector
      const conn = document.createElement('div');
      conn.className = 'label-connector';
      // connector position relative to track left
      const connLeft = it.centerPx - 1; // 2px width
      conn.style.left = connLeft + 'px';
      conn.style.top = '0px';
      conn.style.height = (16 + it.row * 40) + 'px';
  // hide connector by default
  conn.style.display = 'none';
  labelLayer.appendChild(conn);
  labelLayer.appendChild(pop);
  // keep refs for wiring hover listeners later
  it._pop = pop;
  it._conn = conn;
    }
 
    if (narrowItems.length) {
      els.track.appendChild(labelLayer);
    }
 
    // wire hover listeners to show/hide the poppers and connectors
    for (const it of narrowItems) {
      const id = it.punch.id;
      const punchEl = els.track.querySelector(`.punch[data-id="${id}"]`);
      if (!punchEl) continue;
      const pop = it._pop;
      const conn = it._conn;
      punchEl.addEventListener('mouseenter', () => { pop.style.display = 'grid'; conn.style.display = 'block'; });
      punchEl.addEventListener('mouseleave', () => { pop.style.display = 'none'; conn.style.display = 'none'; });
    }
  },
  renderTable() {
    els.rows.innerHTML = '';
    const sorted = [...state.punches].sort((a,b) => a.start - b.start);
    for (const p of sorted) {
      const tr = document.createElement('tr');
      const dur = p.end - p.start;
      tr.innerHTML = `
        <td>${time.toLabel(p.start)}</td>
        <td>${time.toLabel(p.end)}</td>
        <td>${time.durationLabel(dur)}</td>
        <td>${escapeHtml(p.caseNumber || '')}</td>
        <td class="note">${escapeHtml(p.note || '')}</td>`;
      els.rows.appendChild(tr);
    }
    els.empty.style.display = sorted.length ? 'none' : 'block';
  },
  renderTotal() {
    const totalMin = state.punches.reduce((s,p)=> s + (p.end - p.start), 0);
    els.total.textContent = totalMin ? `Total: ${time.durationLabel(totalMin)}` : '';
  },
  showGhost(a, b) {
    const [start, end] = a < b ? [a,b] : [b,a];
    // map absolute minutes into view percentage
    const leftPct = ((start - VIEW_START_MIN) / VIEW_MINUTES) * 100;
    const rightPct = ((end - VIEW_START_MIN) / VIEW_MINUTES) * 100;
    const widthPct = rightPct - leftPct;
    Object.assign(els.ghost.style, { display: 'block', left: leftPct+'%', width: widthPct+'%' });
    ui.showTips(start, end);
  },
  hideGhost() { els.ghost.style.display = 'none'; ui.hideTips(); },
  showTips(start, end) {
    const leftPct = ((start - VIEW_START_MIN) / VIEW_MINUTES) * 100;
    const rightPct = ((end - VIEW_START_MIN) / VIEW_MINUTES) * 100;
    const centerPct = (((start + end) / 2 - VIEW_START_MIN) / VIEW_MINUTES) * 100;
    els.tipStart.textContent = time.toLabel(start);
    els.tipEnd.textContent = time.toLabel(end);
    els.tipCenter.textContent = time.durationLabel(Math.max(0, end - start));
    els.tipStart.style.left = leftPct + '%';
    els.tipEnd.style.left = rightPct + '%';
    els.tipCenter.style.left = centerPct + '%';
    els.tipStart.style.display = 'block';
    els.tipEnd.style.display = 'block';
    els.tipCenter.style.display = 'block';
  },
  hideTips() { els.tipStart.style.display = els.tipEnd.style.display = els.tipCenter.style.display = 'none'; },
  openModal(range) {
    state.pendingRange = range;
    els.startField.value = time.toLabel(range.startMin);
    els.endField.value = time.toLabel(range.endMin);
    els.caseField.value = '';
    els.noteField.value = '';
    els.modal.style.display = 'flex';
    els.caseField.focus();
  },
  closeModal() { els.modal.style.display = 'none'; state.pendingRange = null; },
  toast(msg) { els.toast.textContent = msg; els.toast.style.display = 'block'; clearTimeout(els.toast._t); els.toast._t = setTimeout(()=> els.toast.style.display = 'none', 2400); }
};
 
function escapeHtml(s) { return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
 
function hourLabel(h) {
  const ampm = h >= 12 ? 'pm' : 'am';
  const display = (h % 12 === 0) ? 12 : (h % 12);
  return `${display}${ampm}`;
}
 
function pxToMinutes(clientX) {
  const rect = els.track.getBoundingClientRect();
  const x = clientX - rect.left;
  const pct = Math.min(1, Math.max(0, x / rect.width));
  // map percentage across the visible view window (6:00-18:00)
  const mins = VIEW_START_MIN + pct * VIEW_MINUTES;
  return Math.max(VIEW_START_MIN, Math.min(VIEW_END_MIN, Math.round(mins)));
}
 
function overlapsAny(start, end, excludeId = null) {
  return state.punches.some(p => p.id !== excludeId && start < p.end && end > p.start);
}
 
function nearestBounds(forId) {
  const sorted = [...state.punches].filter(p=>p.id!==forId).sort((a,b)=>a.start-b.start);
  return {
    leftLimitAt: (start) => { const leftNeighbor = [...sorted].filter(p => p.end <= start).pop(); return leftNeighbor ? leftNeighbor.end : VIEW_START_MIN; },
    rightLimitAt: (end) => { const rightNeighbor = [...sorted].find(p => p.start >= end); return rightNeighbor ? rightNeighbor.start : VIEW_END_MIN; }
  };
}
 
function startDrag(e) {
  if (e.target.closest('.handle')) return;
  const raw = e.touches ? pxToMinutes(e.touches[0].clientX) : pxToMinutes(e.clientX);
  const snapped = time.snap(raw);
  state.dragging = { anchor: snapped, last: snapped };
  ui.showGhost(snapped, snapped);
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('touchmove', onDragMove, {passive:false});
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);
}
 
function onDragMove(e) {
  if (!state.dragging) return;
  if (e.cancelable) e.preventDefault();
  const raw = e.touches ? pxToMinutes(e.touches[0].clientX) : pxToMinutes(e.clientX);
  const snapped = time.snap(raw);
  state.dragging.last = snapped;
  ui.showGhost(state.dragging.anchor, snapped);
}
 
function endDrag() {
  if (!state.dragging) return;
  const a = state.dragging.anchor, b = state.dragging.last;
  state.dragging = null;
  ui.hideGhost();
  const startMin = Math.min(a,b), endMin = Math.max(a,b);
  if (endMin - startMin < 1) return;
  if (overlapsAny(startMin, endMin)) { ui.toast('That range overlaps another block.'); return; }
  ui.openModal({ startMin, endMin });
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('touchmove', onDragMove);
  window.removeEventListener('mouseup', endDrag);
  window.removeEventListener('touchend', endDrag);
}
 
function startResize(e) {
  const handle = e.target.closest('.handle');
  if (!handle) return;
  const punchEl = handle.closest('.punch');
  const id = Number(punchEl.dataset.id);
  const p = state.punches.find(p=>p.id===id);
  state.resizing = { id, edge: handle.dataset.edge, startStart: p.start, startEnd: p.end };
  // add active resizing class to show which edge is being adjusted
  if (handle.dataset.edge === 'left') punchEl.classList.add('resizing-left');
  if (handle.dataset.edge === 'right') punchEl.classList.add('resizing-right');
  window.addEventListener('mousemove', onResizeMove);
  window.addEventListener('touchmove', onResizeMove, {passive:false});
  window.addEventListener('mouseup', endResize);
  window.addEventListener('touchend', endResize);
  e.stopPropagation();
}
 
function onResizeMove(e) {
  if (!state.resizing) return;
  if (e.cancelable) e.preventDefault();
  const { id, edge, startStart, startEnd } = state.resizing;
  const raw = e.touches ? pxToMinutes(e.touches[0].clientX) : pxToMinutes(e.clientX);
  const m = time.snap(raw);
  const bounds = nearestBounds(id);
  let newStart = startStart;
  let newEnd = startEnd;
  if (edge === 'left') {
    const minL = bounds.leftLimitAt(startStart);
    const maxL = startEnd - 1;
    newStart = Math.min(maxL, Math.max(minL, m));
    newStart = time.snap(newStart);
  }
  if (edge === 'right') {
    const minR = startStart + 1;
    const maxR = bounds.rightLimitAt(startEnd);
    newEnd = Math.max(minR, Math.min(maxR, m));
    newEnd = time.snap(newEnd);
  }
  const invalid = overlapsAny(newStart, newEnd, id) || newEnd <= newStart;
  const el = els.track.querySelector(`.punch[data-id="${id}"]`);
  // map newStart/newEnd into the visible view window (same mapping used in renderTimeline)
  const leftPct = ((Math.max(newStart, VIEW_START_MIN) - VIEW_START_MIN) / VIEW_MINUTES) * 100;
  const widthPct = ((Math.min(newEnd, VIEW_END_MIN) - Math.max(newStart, VIEW_START_MIN)) / VIEW_MINUTES) * 100;
  el.style.left = leftPct + '%';
  el.style.width = widthPct + '%';
  el.classList.toggle('invalid', invalid);
  state.resizing.preview = { newStart, newEnd, invalid };
  ui.showTips(newStart, newEnd);
}
 
async function endResize() {
  if (!state.resizing) return;
  const { id, edge } = state.resizing;
  const preview = state.resizing.preview;
  // remove active class from the punch element
  const punchEl = els.track.querySelector(`.punch[data-id="${id}"]`);
  if (punchEl) {
    punchEl.classList.remove('resizing-left', 'resizing-right');
  }
  state.resizing = null;
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('touchmove', onResizeMove);
  window.removeEventListener('mouseup', endResize);
  window.removeEventListener('touchend', endResize);
  ui.hideTips();
  if (!preview || preview.invalid) { ui.renderTimeline(); if (preview?.invalid) ui.toast('Adjust would overlap another block.'); return; }
  const idx = state.punches.findIndex(p=>p.id===id);
  state.punches[idx] = { ...state.punches[idx], start: preview.newStart, end: preview.newEnd };
  await idb.put(state.punches[idx]);
  ui.renderAll();
}
 
async function saveNewFromModal(e) {
  e.preventDefault();
  if (!state.pendingRange) return;
  const { startMin, endMin } = state.pendingRange;
  const s = time.snap(startMin);
  const eMin = time.snap(endMin);
  if (eMin - s < 1) { ui.closeModal(); return; }
  // determine if we're creating new or updating existing
  const payload = { start: s, end: eMin, caseNumber: els.caseField.value.trim(), note: els.noteField.value.trim() };
  if (state.editingId) {
    // update
    const idx = state.punches.findIndex(p=>p.id===state.editingId);
    if (idx === -1) { ui.toast('Could not find item to update.'); ui.closeModal(); return; }
    const updated = { ...state.punches[idx], ...payload };
    if (overlapsAny(updated.start, updated.end, updated.id)) { ui.toast('That range overlaps another block.'); return; }
    state.punches[idx] = updated;
    await idb.put(updated);
  } else {
    // create
    if (overlapsAny(payload.start, payload.end)) { ui.toast('That range overlaps another block.'); return; }
    const toAdd = { ...payload, createdAt: new Date().toISOString() };
    await idb.add(toAdd);
  }
  state.punches = await idb.all();
  state.editingId = null;
  ui.closeModal();
  ui.renderAll();
}
 
function closeModal() { ui.closeModal(); }
 
function attachEvents() {
  els.track.addEventListener('mousedown', startDrag);
  els.track.addEventListener('touchstart', startDrag, {passive:true});
  els.track.addEventListener('mousedown', startResize);
  els.track.addEventListener('touchstart', startResize, {passive:true});
  // delegate clicks on labels / controls inside the track
  els.track.addEventListener('click', async (e) => {
  const lbl = e.target.closest('.punch-label');
    if (lbl) {
      const id = Number(lbl.dataset.id);
      const p = state.punches.find(px => px.id === id);
      if (!p) return;
      // open modal in edit mode
      state.editingId = id;
      state.pendingRange = { startMin: p.start, endMin: p.end };
      els.startField.value = time.toLabel(p.start);
      els.endField.value = time.toLabel(p.end);
      els.caseField.value = p.caseNumber || '';
      els.noteField.value = p.note || '';
      els.modal.style.display = 'flex';
      els.caseField.focus();
      return;
    }
    const editBtn = e.target.closest('.control-btn.edit');
    if (editBtn) {
      const id = Number(editBtn.dataset.id);
      const p = state.punches.find(px => px.id === id);
      if (!p) return;
      state.editingId = id;
      state.pendingRange = { startMin: p.start, endMin: p.end };
      els.startField.value = time.toLabel(p.start);
      els.endField.value = time.toLabel(p.end);
      els.caseField.value = p.caseNumber || '';
      els.noteField.value = p.note || '';
      els.modal.style.display = 'flex';
      els.caseField.focus();
      return;
    }
    const delBtn = e.target.closest('.control-btn.delete');
    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      if (!confirm('Delete this time entry?')) return;
      await idb.remove(id);
      state.punches = await idb.all();
      ui.renderAll();
      ui.toast('Deleted');
      return;
    }
    // popper buttons (when rendered below track) don't have dataset ids on inner buttons
    const popEdit = e.target.closest('.label-popper .control-btn.edit');
    if (popEdit) {
      const pop = e.target.closest('.label-popper');
      const id = Number(pop.dataset.id);
      const p = state.punches.find(px => px.id === id);
      if (!p) return;
      state.editingId = id;
      state.pendingRange = { startMin: p.start, endMin: p.end };
      els.startField.value = time.toLabel(p.start);
      els.endField.value = time.toLabel(p.end);
      els.caseField.value = p.caseNumber || '';
      els.noteField.value = p.note || '';
      els.modal.style.display = 'flex';
      els.caseField.focus();
      return;
    }
    const popDel = e.target.closest('.label-popper .control-btn.delete');
    if (popDel) {
      const pop = e.target.closest('.label-popper');
      const id = Number(pop.dataset.id);
      if (!confirm('Delete this time entry?')) return;
      await idb.remove(id);
      state.punches = await idb.all();
      ui.renderAll();
      ui.toast('Deleted');
      return;
    }
  });
  els.modalForm.addEventListener('submit', saveNewFromModal);
  els.modalCancel.addEventListener('click', closeModal);
  els.modalClose.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e)=> { if(e.key==='Escape') closeModal(); });
  window.addEventListener('resize', () => ui.renderTimeline());
}
 
async function init() {
  attachEvents();
  // developer debug: visual handle overlays; set false to disable
  if (typeof window.DEBUG_HANDLES === 'undefined') {
    window.DEBUG_HANDLES = true;
    console.info('DEBUG_HANDLES enabled — set window.DEBUG_HANDLES = false in console to disable');
  }
  state.punches = await idb.all();
  ui.renderAll();
}
 
init();
