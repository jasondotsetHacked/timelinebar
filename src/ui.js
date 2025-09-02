import { els } from './dom.js';
import { state } from './state.js';
import { time } from './time.js';
// Viewport is now dynamic and sourced from state

const escapeHtml = (s) => (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

function getView() {
  const start = Math.max(0, Math.min(24 * 60, Number(state.viewStartMin)));
  const end = Math.max(0, Math.min(24 * 60, Number(state.viewEndMin)));
  const s = Math.min(start, end);
  const e = Math.max(start, end);
  const minutes = Math.max(1, e - s);
  return { start: s, end: e, minutes, startH: Math.floor(s / 60), endH: Math.ceil(e / 60) };
}

function renderTicks() {
  els.ticks.innerHTML = '';
  if (els.grid) els.grid.innerHTML = '';
  const view = getView();
  // determine hours in view and build visual markers/lines
  const firstHour = Math.ceil(view.start / 60);
  const lastHour = Math.floor(view.end / 60);

  // draw interior hour ticks
  for (let h = firstHour; h <= lastHour; h++) {
    const tick = document.createElement('div');
    tick.className = 'tick';
    const minutes = h * 60;
    const pct = ((minutes - view.start) / view.minutes) * 100;
    tick.style.left = pct + '%';
    tick.textContent = time.hourLabel(h % 24);
    // label alignment on exact edges
    if (view.start % 60 === 0 && h === view.start / 60) tick.dataset.edge = 'start';
    if (view.end % 60 === 0 && h === view.end / 60) tick.dataset.edge = 'end';
    els.ticks.appendChild(tick);

    // full-height grid line aligned with this tick
    if (els.grid) {
      const line = document.createElement('div');
      line.className = 'grid-line';
      line.style.left = pct + '%';
      els.grid.appendChild(line);
    }
  }
}

function renderTimeline() {
  els.track.querySelectorAll('.punch').forEach((n) => n.remove());
  const existingLayer = els.track.querySelector('.label-layer');
  if (existingLayer) existingLayer.remove();

  const labelLayer = document.createElement('div');
  labelLayer.className = 'label-layer';
  const narrowItems = [];
  const rect = els.track.getBoundingClientRect();
  const trackWidth = rect.width || 1;

  const view = getView();
  const sorted = [...state.punches].sort((a, b) => a.start - b.start);
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
    label.textContent = p.caseNumber || '(no case)';
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
    pop.innerHTML = `<div class="label-text">${escapeHtml(it.punch.caseNumber || '(no case)')}</div><div class="controls"><button class="control-btn edit" title="Edit">\u270E</button><button class="control-btn delete" title="Delete">\u2715</button></div>`;
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
  const sorted = [...state.punches].sort((a, b) => a.start - b.start);
  for (const p of sorted) {
    const tr = document.createElement('tr');
    tr.dataset.id = p.id;
    const dur = p.end - p.start;
    const status = p.status || 'default';
    tr.innerHTML = `
      <td class="status-cell"><div class="status-wrap"><button class="status-btn status-${status}" data-id="${p.id}" aria-label="Status"></button>
        <div class="status-menu" data-id="${p.id}">
          <div class="status-option" data-value="default" title="Default"></div>
          <div class="status-option" data-value="green" title="Green"></div>
          <div class="status-option" data-value="yellow" title="Yellow"></div>
          <div class="status-option" data-value="red" title="Red"></div>
        </div></div></td>
      <td class="cell-start">${time.toLabel(p.start)}</td>
      <td class="cell-end">${time.toLabel(p.end)}</td>
      <td>${time.durationLabel(dur)}</td>
      <td>${escapeHtml(p.caseNumber || '')}</td>
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
  const totalMin = state.punches.reduce((s, p) => s + (p.end - p.start), 0);
  els.total.textContent = totalMin ? `Total: ${time.durationLabel(totalMin)}` : '';
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
  els.caseField.value = '';
  els.noteField.value = '';
  if (els.modalTitle) els.modalTitle.textContent = 'New Time Block';
  els.modal.style.display = 'flex';
  els.caseField.focus();
}

function closeModal() {
  els.modal.style.display = 'none';
  state.pendingRange = null;
  state.editingId = null;
}

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.style.display = 'block';
  clearTimeout(els.toast._t);
  els.toast._t = setTimeout(() => (els.toast.style.display = 'none'), 2400);
}

function renderAll() {
  renderTicks();
  renderTimeline();
  renderTable();
  renderTotal();
}

export const ui = {
  renderAll,
  renderTicks,
  renderTimeline,
  renderTable,
  renderTotal,
  showGhost,
  hideGhost,
  showTips,
  hideTips,
  openModal,
  closeModal,
  toast,
};
