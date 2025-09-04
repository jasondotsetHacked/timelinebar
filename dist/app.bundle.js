(() => {
  // src/dom.js
  var byId = (id) => document.getElementById(id);
  var els = {
    track: byId("track"),
    ghost: byId("ghost"),
    tipStart: byId("tipStart"),
    tipEnd: byId("tipEnd"),
    tipCenter: byId("tipCenter"),
    ticks: byId("ticks"),
    rows: byId("rows"),
    empty: byId("empty"),
    modal: byId("modal"),
    startField: byId("startField"),
    endField: byId("endField"),
    bucketField: byId("bucketField"),
    noteField: byId("noteField"),
    notePreview: byId("notePreview"),
    notePreviewToggle: byId("notePreviewToggle"),
    modalForm: byId("modalForm"),
    modalCancel: byId("modalCancel"),
    modalClose: byId("modalClose"),
    modalTitle: document.querySelector(".modal-title"),
    modalFooter: document.querySelector(".modal-footer"),
    modalDelete: byId("modalDelete"),
    modalStatusWrap: byId("modalStatusWrap"),
    modalStatusBtn: byId("modalStatusBtn"),
    modalStatusMenu: byId("modalStatusMenu"),
    total: byId("total"),
    toast: byId("toast"),
    viewHelp: byId("viewHelp"),
    view24: byId("view24"),
    viewDefault: byId("viewDefault"),
    // Calendar / header controls
    btnCalendar: byId("btnCalendar"),
    btnCalendar2: byId("btnCalendar2"),
    btnCalendarFab: byId("btnCalendarFab"),
    dayLabel: byId("dayLabel"),
    calendarCard: byId("calendarCard"),
    calendarGrid: byId("calendarGrid"),
    calWeekdays: byId("calWeekdays"),
    calMonthLabel: byId("calMonthLabel"),
    calPrev: byId("calPrev"),
    calNext: byId("calNext"),
    // Bucket reports
    bucketDayCard: byId("bucketDayCard"),
    bucketDayBody: byId("bucketDayBody"),
    bucketDayEmpty: byId("bucketDayEmpty"),
    bucketMonthCard: byId("bucketMonthCard"),
    bucketMonthBody: byId("bucketMonthBody"),
    bucketMonthEmpty: byId("bucketMonthEmpty"),
    bucketMonthTitle: byId("bucketMonthTitle")
  };

  // src/state.js
  var state = {
    punches: [],
    dragging: null,
    resizing: null,
    moving: null,
    pendingRange: null,
    editingId: null,
    // Timeline viewport (minutes from start of day)
    viewStartMin: 6 * 60,
    // default 6:00am
    viewEndMin: 18 * 60,
    // default 6:00pm
    // Hover flag used to route wheel events when over the track
    overTrack: false,
    // Date/calendar state
    currentDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    // YYYY-MM-DD selected day
    viewMode: "calendar",
    // 'day' | 'calendar'
    calendarYear: (/* @__PURE__ */ new Date()).getFullYear(),
    calendarMonth: (/* @__PURE__ */ new Date()).getMonth(),
    // 0-11
    // Calendar sub-view: 'days' | 'months' | 'years'
    calendarMode: "days",
    // Start year for the visible year grid (in 'years' mode). Initialized to a 12-year block containing today.
    yearGridStart: Math.floor((/* @__PURE__ */ new Date()).getFullYear() / 12) * 12
  };

  // src/config.js
  var DAY_MIN = 24 * 60;
  var SNAP_MIN = 15;
  var VIEW_START_MIN = 6 * 60;
  var VIEW_END_MIN = 18 * 60;
  var VIEW_MINUTES = VIEW_END_MIN - VIEW_START_MIN;
  var VIEW_START_H = VIEW_START_MIN / 60;
  var VIEW_END_H = VIEW_END_MIN / 60;

  // src/time.js
  var clamp = (min) => Math.max(0, Math.min(DAY_MIN, Math.round(min)));
  var snap = (min) => Math.max(0, Math.min(DAY_MIN, Math.round(min / SNAP_MIN) * SNAP_MIN));
  var toLabel = (mins) => {
    const m = clamp(mins);
    const h24 = Math.floor(m / 60) % 24;
    const mm = (m % 60).toString().padStart(2, "0");
    const ampm = h24 >= 12 ? "pm" : "am";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${mm}${ampm}`;
  };
  var durationLabel = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}h${m}m`;
  };
  var hourLabel = (h) => {
    const ampm = h >= 12 ? "pm" : "am";
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}${ampm}`;
  };
  var time = { clamp, snap, toLabel, durationLabel, hourLabel };

  // src/dates.js
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function todayStr() {
    const d = /* @__PURE__ */ new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function toDateStr(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function parseDate(str) {
    const [y, m, day] = (str || "").split("-").map((x) => Number(x));
    if (!y || !m || !day) return null;
    return new Date(y, m - 1, day);
  }
  function getPunchDate(p) {
    if (p.date) return p.date;
    if (p.createdAt) return (p.createdAt + "").slice(0, 10);
    return todayStr();
  }

  // src/nowIndicator.js
  function getView() {
    const start = Math.max(0, Math.min(24 * 60, Number(state.viewStartMin)));
    const end = Math.max(0, Math.min(24 * 60, Number(state.viewEndMin)));
    const s = Math.min(start, end);
    const e = Math.max(start, end);
    const minutes = Math.max(1, e - s);
    return { start: s, end: e, minutes };
  }
  function nowMinutes() {
    const d = /* @__PURE__ */ new Date();
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  }
  function ensureEl() {
    let el = els.track.querySelector(".now-indicator");
    if (!el) {
      el = document.createElement("div");
      el.className = "now-indicator";
      el.setAttribute("aria-hidden", "true");
      els.track.appendChild(el);
    }
    return el;
  }
  function update() {
    const el = ensureEl();
    const view = getView();
    const mins = nowMinutes();
    if (mins < view.start || mins > view.end) {
      el.style.display = "none";
      return;
    }
    const isToday = (state.currentDate || todayStr()) === todayStr();
    if (isToday) el.classList.remove("not-today");
    else el.classList.add("not-today");
    const pct = (mins - view.start) / view.minutes * 100;
    el.style.left = pct + "%";
    el.style.display = "block";
  }
  var _timer = null;
  function init() {
    ensureEl();
    update();
    if (_timer) clearInterval(_timer);
    _timer = setInterval(update, 3e4);
  }
  var nowIndicator = { init, update };

  // src/calendar.js
  function summarizeByDate() {
    const map = /* @__PURE__ */ new Map();
    for (const p of state.punches) {
      const d = getPunchDate(p);
      const prev = map.get(d) || { count: 0, totalMin: 0 };
      map.set(d, {
        count: prev.count + 1,
        totalMin: prev.totalMin + Math.max(0, (p.end || 0) - (p.start || 0))
      });
    }
    return map;
  }
  function buildMonthGrid(year, monthIndex) {
    const first = new Date(year, monthIndex, 1);
    const start = new Date(first);
    const firstDow = first.getDay();
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
    try {
      els.calendarGrid.style.opacity = "0";
    } catch (e) {
    }
    const y = state.calendarYear;
    const m = state.calendarMonth;
    const mode = state.calendarMode || "days";
    if (mode !== "days") {
      if (els.calWeekdays) els.calWeekdays.style.display = "none";
      els.calendarGrid.innerHTML = "";
      if (mode === "months") {
        els.calMonthLabel.innerHTML = `
        <span class="cal-nav" data-cal-nav="prev" title="Previous year">\u2039</span>
        <span class="cal-link" data-cal-click="year" title="Select year">${y}</span>
        <span class="cal-nav" data-cal-nav="next" title="Next year">\u203A</span>`;
        els.calendarGrid.style.gridTemplateColumns = "repeat(4, 1fr)";
        const today3 = /* @__PURE__ */ new Date();
        const currentMonth = today3.getMonth();
        const currentYear2 = today3.getFullYear();
        for (let i = 0; i < 12; i++) {
          const cell = document.createElement("div");
          cell.className = "cal-day";
          const label = new Date(y, i, 1).toLocaleString(void 0, { month: "short" });
          const num = document.createElement("div");
          num.className = "cal-num";
          num.textContent = label;
          cell.appendChild(num);
          if (y === currentYear2 && i === currentMonth) cell.classList.add("today");
          if (i === state.calendarMonth && y === state.calendarYear) cell.classList.add("selected");
          cell.addEventListener("click", () => {
            state.calendarYear = y;
            state.calendarMonth = i;
            state.calendarMode = "days";
            try {
              window.dispatchEvent(new Event("calendar:modeChanged"));
            } catch (e) {
            }
            renderCalendar();
          });
          els.calendarGrid.appendChild(cell);
        }
        requestAnimationFrame(() => {
          try {
            els.calendarGrid.style.opacity = "1";
          } catch (e) {
          }
        });
        try {
          window.dispatchEvent(new Event("calendar:rendered"));
        } catch (e) {
          window.dispatchEvent(new Event("calendar:rendered"));
        }
        return;
      }
      const start = state.yearGridStart || Math.floor(state.calendarYear / 12) * 12;
      state.yearGridStart = start;
      const end = start + 11;
      els.calMonthLabel.innerHTML = `
      <span class="cal-nav" data-cal-nav="prev" title="Previous 12 years">\u2039</span>
      <span class="cal-range">${start}\u2013${end}</span>
      <span class="cal-nav" data-cal-nav="next" title="Next 12 years">\u203A</span>`;
      els.calendarGrid.style.gridTemplateColumns = "repeat(4, 1fr)";
      const today2 = /* @__PURE__ */ new Date();
      const currentYear = today2.getFullYear();
      for (let i = 0; i < 12; i++) {
        const yy = start + i;
        const cell = document.createElement("div");
        cell.className = "cal-day";
        const num = document.createElement("div");
        num.className = "cal-num";
        num.textContent = String(yy);
        cell.appendChild(num);
        if (yy === currentYear) cell.classList.add("today");
        if (yy === state.calendarYear) cell.classList.add("selected");
        cell.addEventListener("click", () => {
          state.calendarYear = yy;
          state.calendarMode = "months";
          try {
            window.dispatchEvent(new Event("calendar:modeChanged"));
          } catch (e) {
          }
          renderCalendar();
        });
        els.calendarGrid.appendChild(cell);
      }
      requestAnimationFrame(() => {
        try {
          els.calendarGrid.style.opacity = "1";
        } catch (e) {
        }
      });
      try {
        window.dispatchEvent(new Event("calendar:rendered"));
      } catch (e) {
        window.dispatchEvent(new Event("calendar:rendered"));
      }
      return;
    }
    if (els.calWeekdays) els.calWeekdays.style.display = "grid";
    els.calMonthLabel.innerHTML = (() => {
      const d = new Date(y, m, 1);
      const monthName = d.toLocaleString(void 0, { month: "long" });
      return `
      <span class="cal-nav" data-cal-nav="prev" title="Previous month">\u2039</span>
      <span class="cal-link" data-cal-click="month" title="Select month">${monthName}</span>
      <span class="cal-link" data-cal-click="year" title="Select year">${y}</span>
      <span class="cal-nav" data-cal-nav="next" title="Next month">\u203A</span>`;
    })();
    els.calendarGrid.style.gridTemplateColumns = "repeat(7, 1fr)";
    requestAnimationFrame(() => {
      try {
        els.calendarGrid.style.opacity = "1";
      } catch (e) {
      }
    });
    const days = buildMonthGrid(y, m);
    const summaries = summarizeByDate();
    const selected = state.currentDate || todayStr();
    const today = todayStr();
    els.calendarGrid.innerHTML = "";
    for (const d of days) {
      const ds = toDateStr(d);
      const cell = document.createElement("div");
      cell.className = "cal-day";
      cell.tabIndex = 0;
      const inMonth = d.getMonth() === m;
      if (!inMonth) cell.classList.add("other-month");
      if (ds === selected) cell.classList.add("selected");
      if (ds === today && d.getMonth() === m && d.getFullYear() === y) cell.classList.add("today");
      const sum = summaries.get(ds);
      if (sum && sum.count) cell.classList.add("has-items");
      const num = document.createElement("div");
      num.className = "cal-num";
      num.textContent = String(d.getDate());
      cell.appendChild(num);
      try {
        const dayItems = state.punches.filter((p) => getPunchDate(p) === ds).sort((a, b) => (a.start || 0) - (b.start || 0));
        const seen = /* @__PURE__ */ new Set();
        const buckets = [];
        for (const p of dayItems) {
          const label = String(p.bucket || "(no bucket)").trim();
          if (!seen.has(label)) {
            seen.add(label);
            buckets.push(label);
          }
        }
        if (buckets.length) {
          const wrap = document.createElement("div");
          wrap.className = "cal-buckets";
          for (const b of buckets) {
            const row = document.createElement("div");
            row.className = "cal-bucket";
            row.textContent = b;
            wrap.appendChild(row);
          }
          cell.appendChild(wrap);
        }
      } catch (e) {
      }
      cell.addEventListener("click", () => {
        state.currentDate = ds;
        state.viewMode = "day";
        try {
          const ev = new CustomEvent("calendar:daySelected");
          window.dispatchEvent(ev);
        } catch (e) {
          window.dispatchEvent(new Event("calendar:daySelected"));
        }
      });
      els.calendarGrid.appendChild(cell);
    }
    try {
      window.dispatchEvent(new Event("calendar:rendered"));
    } catch (e) {
      window.dispatchEvent(new Event("calendar:rendered"));
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
  var calendar = { renderCalendar, nextMonth, prevMonth, nextYear, prevYear };

  // src/ui.js
  var escapeHtml = (s) => (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
  function markdownToHtml(md) {
    const text = String(md || "");
    if (!text.trim()) return "";
    try {
      if (window.marked && typeof window.marked.parse === "function") {
        const raw = window.marked.parse(text);
        if (window.DOMPurify && typeof window.DOMPurify.sanitize === "function") return window.DOMPurify.sanitize(raw);
        return raw;
      }
    } catch (e) {
    }
    return escapeHtml(text).replace(/\n/g, "<br>");
  }
  function hideNotePopover() {
    const existing = document.querySelector(".note-popover");
    if (existing) existing.remove();
  }
  function toggleNotePopover(id) {
    const punchEl = els.track.querySelector(`.punch[data-id="${id}"]`);
    if (!punchEl) return;
    const existing = document.querySelector(".note-popover");
    if (existing && Number(existing.dataset.id) === Number(id)) {
      existing.remove();
      return;
    }
    if (existing) existing.remove();
    const p = state.punches.find((x) => x.id === id);
    if (!p || !p.note) return;
    const pop = document.createElement("div");
    pop.className = "note-popover";
    pop.dataset.id = String(id);
    pop.innerHTML = `<button class="note-close" aria-label="Close">\u2715</button><div class="note-content"></div>`;
    const content = pop.querySelector(".note-content");
    content.innerHTML = markdownToHtml(p.note);
    document.body.appendChild(pop);
    const elRect = punchEl.getBoundingClientRect();
    const approxW = 280;
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    let left0 = elRect.left + elRect.width / 2 - approxW / 2;
    left0 = Math.max(6, Math.min(left0, vw - approxW - 6));
    pop.style.left = left0 + "px";
    pop.style.top = "6px";
    requestAnimationFrame(() => {
      const pr = pop.getBoundingClientRect();
      const vw2 = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      let left = elRect.left + elRect.width / 2 - pr.width / 2;
      left = Math.max(6, Math.min(left, vw2 - pr.width - 6));
      let top = elRect.top - pr.height - 10;
      if (top < 8) top = elRect.bottom + 10;
      pop.style.left = left + "px";
      pop.style.top = top + "px";
    });
    pop.addEventListener("click", (e) => {
      if (e.target.closest(".note-close")) hideNotePopover();
      e.stopPropagation();
    });
  }
  function getView2() {
    const start = Math.max(0, Math.min(24 * 60, Number(state.viewStartMin)));
    const end = Math.max(0, Math.min(24 * 60, Number(state.viewEndMin)));
    const s = Math.min(start, end);
    const e = Math.max(start, end);
    const minutes = Math.max(1, e - s);
    return { start: s, end: e, minutes, startH: Math.floor(s / 60), endH: Math.ceil(e / 60) };
  }
  function renderTicks() {
    els.ticks.innerHTML = "";
    const view = getView2();
    const firstHour = Math.ceil(view.start / 60);
    const lastHour = Math.floor(view.end / 60);
    for (let h = firstHour; h <= lastHour; h++) {
      const minutes = h * 60;
      const pct = (minutes - view.start) / view.minutes * 100;
      const tick = document.createElement("div");
      tick.className = "tick";
      tick.style.left = pct + "%";
      const line = document.createElement("div");
      line.className = "tick-line";
      const label = document.createElement("div");
      label.className = "tick-label";
      label.textContent = time.hourLabel(h % 24);
      if (view.start % 60 === 0 && h === view.start / 60) tick.dataset.edge = "start";
      if (view.end % 60 === 0 && h === view.end / 60) tick.dataset.edge = "end";
      tick.appendChild(line);
      tick.appendChild(label);
      els.ticks.appendChild(tick);
    }
  }
  function currentDay() {
    return state.currentDate || todayStr();
  }
  function renderTimeline() {
    var _a;
    hideNotePopover();
    els.track.querySelectorAll(".punch").forEach((n) => n.remove());
    const existingLayer = els.track.querySelector(".label-layer");
    if (existingLayer) existingLayer.remove();
    const labelLayer = document.createElement("div");
    labelLayer.className = "label-layer";
    const narrowItems = [];
    const rect = els.track.getBoundingClientRect();
    const trackWidth = rect.width || 1;
    const view = getView2();
    const day = currentDay();
    const sorted = [...state.punches].filter((p) => getPunchDate(p) === day).sort((a, b) => a.start - b.start);
    for (const p of sorted) {
      const startClamped = Math.max(p.start, view.start);
      const endClamped = Math.min(p.end, view.end);
      if (endClamped <= startClamped) continue;
      const leftPct = (startClamped - view.start) / view.minutes * 100;
      const widthPct = (endClamped - startClamped) / view.minutes * 100;
      const el = document.createElement("div");
      el.className = "punch";
      el.style.left = leftPct + "%";
      el.style.width = widthPct + "%";
      el.dataset.id = p.id;
      const status = p.status || "default";
      el.classList.add(`status-${status}`);
      const leftHandle = document.createElement("div");
      leftHandle.className = "handle left";
      leftHandle.dataset.edge = "left";
      leftHandle.tabIndex = 0;
      leftHandle.setAttribute("aria-label", "Resize left edge");
      const label = document.createElement("div");
      label.className = "punch-label";
      label.textContent = p.bucket || "(no bucket)";
      label.dataset.id = p.id;
      const rightHandle = document.createElement("div");
      rightHandle.className = "handle right";
      rightHandle.dataset.edge = "right";
      rightHandle.tabIndex = 0;
      rightHandle.setAttribute("aria-label", "Resize right edge");
      const controls = document.createElement("div");
      controls.className = "controls";
      const editBtn = document.createElement("button");
      editBtn.className = "control-btn edit";
      editBtn.title = "Edit";
      editBtn.textContent = "\u270E";
      editBtn.dataset.id = p.id;
      const delBtn = document.createElement("button");
      delBtn.className = "control-btn delete";
      delBtn.title = "Delete";
      delBtn.textContent = "\u2715";
      delBtn.dataset.id = p.id;
      controls.append(editBtn, delBtn);
      el.append(label, controls);
      const pxWidth = widthPct / 100 * trackWidth;
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
      leftHandle.style.width = edgeW + "px";
      rightHandle.style.width = edgeW + "px";
      leftHandle.style.left = "0px";
      rightHandle.style.right = "0px";
      const leftBar = document.createElement("div");
      leftBar.className = "handle-bar";
      const rightBar = document.createElement("div");
      rightBar.className = "handle-bar";
      leftHandle.appendChild(leftBar);
      rightHandle.appendChild(rightBar);
      try {
        leftBar.style.left = "0px";
        leftBar.style.right = "";
        leftBar.style.borderTopLeftRadius = "8px";
        leftBar.style.borderBottomLeftRadius = "8px";
        rightBar.style.right = "0px";
        rightBar.style.left = "";
        rightBar.style.borderTopRightRadius = "8px";
        rightBar.style.borderBottomRightRadius = "8px";
      } catch (e) {
      }
      el.append(leftHandle, rightHandle);
      try {
        if (window.DEBUG_HANDLES) {
          leftBar.style.background = "rgba(255,0,0,0.12)";
          leftBar.style.outline = "1px solid rgba(255,0,0,0.35)";
          rightBar.style.background = "rgba(0,255,0,0.12)";
          rightBar.style.outline = "1px solid rgba(0,255,0,0.35)";
          leftBar.title = `Left handle (w=${edgeW}px) - anchored left`;
          rightBar.title = `Right handle (w=${edgeW}px) - anchored right`;
          console.log("HANDLE_DEBUG", { id: p.id, pxWidth, edgeW, leftPct, widthPct });
        }
      } catch (e) {
      }
      if (p.note && String(p.note).trim()) {
        const noteBtn = document.createElement("button");
        noteBtn.className = "note-dot";
        noteBtn.title = "Show note";
        noteBtn.type = "button";
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
            leftBar.style.left = "0px";
            leftBar.style.right = "";
            if (window.DEBUG_HANDLES) console.log("HANDLE_AUTOFLIP: corrected left (anchor left) for", p.id);
          }
          if (rightBarRect.right < centerX) {
            rightBar.style.right = "0px";
            rightBar.style.left = "";
            if (window.DEBUG_HANDLES) console.log("HANDLE_AUTOFLIP: corrected right (anchor right) for", p.id);
          }
        });
      } catch (e) {
      }
      if (widthPct < 6) el.classList.add("narrow");
      else el.classList.remove("narrow");
      if (widthPct < 6) {
        const centerPct = leftPct + widthPct / 2;
        narrowItems.push({ punch: p, leftPct, widthPct, centerPct });
      }
    }
    const placed = [];
    for (const it of narrowItems) {
      const centerPx = it.centerPct / 100 * trackWidth;
      let row = 0;
      for (; ; row++) {
        const conflict = (_a = placed[row]) == null ? void 0 : _a.some((px) => Math.abs(px - centerPx) < 120);
        if (!conflict) break;
      }
      placed[row] = placed[row] || [];
      placed[row].push(centerPx);
      it.row = row;
      it.centerPx = centerPx;
    }
    for (const it of narrowItems) {
      const pop = document.createElement("div");
      pop.className = "label-popper";
      const pxLeft = Math.max(6, it.centerPx - 55);
      pop.style.left = pxLeft + "px";
      pop.style.top = 8 + it.row * 40 + "px";
      pop.dataset.id = it.punch.id;
      pop.innerHTML = `<div class="label-text">${escapeHtml(it.punch.bucket || "(no bucket)")}</div><div class="controls"><button class="control-btn edit" title="Edit">\u270E</button><button class="control-btn delete" title="Delete">\u2715</button></div>`;
      pop.style.display = "none";
      const conn = document.createElement("div");
      conn.className = "label-connector";
      conn.style.left = it.centerPx - 1 + "px";
      conn.style.top = "0px";
      conn.style.height = 16 + it.row * 40 + "px";
      conn.style.display = "none";
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
      punchEl.addEventListener("mouseenter", () => {
        pop.style.display = "grid";
        conn.style.display = "block";
      });
      punchEl.addEventListener("mouseleave", () => {
        pop.style.display = "none";
        conn.style.display = "none";
      });
    }
  }
  function renderTable() {
    els.rows.innerHTML = "";
    const day = currentDay();
    const sorted = [...state.punches].filter((p) => getPunchDate(p) === day).sort((a, b) => a.start - b.start);
    for (const p of sorted) {
      const tr = document.createElement("tr");
      tr.dataset.id = p.id;
      const dur = p.end - p.start;
      const status = p.status || "default";
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
      <td>${escapeHtml(p.bucket || "")}</td>
      <td class="note">${escapeHtml(p.note || "")}</td>
      <td class="table-actions">
        <button class="row-action edit" title="Edit" data-id="${p.id}">Edit</button>
        <button class="row-action delete" title="Delete" data-id="${p.id}">Delete</button>
      </td>`;
      els.rows.appendChild(tr);
    }
    els.empty.style.display = sorted.length ? "none" : "block";
  }
  function renderTotal() {
    const day = currentDay();
    const totalMin = state.punches.filter((p) => getPunchDate(p) === day).reduce((s, p) => s + (p.end - p.start), 0);
    els.total.textContent = totalMin ? `Total: ${time.durationLabel(totalMin)}` : "";
  }
  function summarizeByBucket(punches) {
    const map = /* @__PURE__ */ new Map();
    for (const p of punches) {
      const key = String(p.bucket || "").trim();
      const prev = map.get(key) || { totalMin: 0, count: 0 };
      const add2 = Math.max(0, (p.end || 0) - (p.start || 0));
      map.set(key, { totalMin: prev.totalMin + add2, count: prev.count + 1 });
    }
    return map;
  }
  function renderBucketDay() {
    if (!els.bucketDayBody || !els.bucketDayCard) return;
    const day = currentDay();
    const items = state.punches.filter((p) => getPunchDate(p) === day);
    const sums = summarizeByBucket(items);
    const sorted = Array.from(sums.entries()).filter(([_, v]) => v.totalMin > 0).sort((a, b) => b[1].totalMin - a[1].totalMin || a[0].localeCompare(b[0]));
    els.bucketDayBody.innerHTML = "";
    for (const [bucket, info] of sorted) {
      const tr = document.createElement("tr");
      const label = bucket || "(no bucket)";
      tr.innerHTML = `<td>${escapeHtml(label)}</td><td>${time.durationLabel(info.totalMin)}</td>`;
      els.bucketDayBody.appendChild(tr);
    }
    if (els.bucketDayEmpty) els.bucketDayEmpty.style.display = sorted.length ? "none" : "block";
    els.bucketDayCard.style.display = state.viewMode === "calendar" ? "none" : "";
  }
  function renderBucketMonth() {
    if (!els.bucketMonthBody || !els.bucketMonthCard) return;
    const y = state.calendarYear;
    const m = state.calendarMonth;
    const items = state.punches.filter((p) => {
      const d = (p.date || "").split("-");
      if (d.length !== 3) return false;
      const yy = Number(d[0]);
      const mm = Number(d[1]) - 1;
      return yy === y && mm === m;
    });
    const sums = summarizeByBucket(items);
    const sorted = Array.from(sums.entries()).filter(([_, v]) => v.totalMin > 0).sort((a, b) => b[1].totalMin - a[1].totalMin || a[0].localeCompare(b[0]));
    els.bucketMonthBody.innerHTML = "";
    for (const [bucket, info] of sorted) {
      const tr = document.createElement("tr");
      const label = bucket || "(no bucket)";
      tr.innerHTML = `<td>${escapeHtml(label)}</td><td>${time.durationLabel(info.totalMin)}</td>`;
      els.bucketMonthBody.appendChild(tr);
    }
    if (els.bucketMonthEmpty) els.bucketMonthEmpty.style.display = sorted.length ? "none" : "block";
    if (els.bucketMonthTitle) {
      try {
        const d = new Date(y, m, 1);
        const monthName = d.toLocaleString(void 0, { month: "long", year: "numeric" });
        els.bucketMonthTitle.textContent = `\u2013 ${monthName}`;
      } catch (e) {
        els.bucketMonthTitle.textContent = "";
      }
    }
    const show = state.viewMode === "calendar" && (state.calendarMode || "days") === "days";
    els.bucketMonthCard.style.display = show ? "" : "none";
  }
  function renderDayLabel() {
    if (!els.dayLabel) return;
    if (state.viewMode === "calendar") {
      els.dayLabel.style.display = "none";
      try {
        els.dayLabel.classList.remove("clickable");
      } catch (e) {
      }
      return;
    }
    els.dayLabel.style.display = "";
    try {
      els.dayLabel.classList.add("clickable");
    } catch (e) {
    }
    const day = currentDay();
    const d = parseDate(day) || /* @__PURE__ */ new Date();
    const label = d.toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    els.dayLabel.textContent = `Day: ${label}`;
  }
  function updateHelpText() {
    if (!els.viewHelp) return;
    if (state.viewMode === "calendar") {
      const mode = state.calendarMode || "days";
      if (mode === "days") {
        els.viewHelp.textContent = "Calendar: click a day to open \xB7 Use Prev/Next to change month \xB7 Click month/year to change mode";
      } else if (mode === "months") {
        els.viewHelp.textContent = "Months: click a month to view days \xB7 Use Prev/Next to change year \xB7 Click year to pick year range";
      } else {
        els.viewHelp.textContent = "Years: click a year to view months \xB7 Use Prev/Next to change 12-year range";
      }
      return;
    }
    els.viewHelp.textContent = "Drag to create \xB7 Resize with side handles \xB7 Snaps to 15m \xB7 Scroll to zoom \xB7 Shift+Scroll to pan \xB7 Click the day title to open calendar";
  }
  function updateViewMode() {
    const timelineCard = document.querySelector(".timeline");
    const mainTableCard = els.rows ? els.rows.closest(".table-card") : document.querySelector(".table-card");
    if (state.viewMode === "calendar") {
      const d = parseDate(currentDay());
      if (d) {
        state.calendarYear = d.getFullYear();
        state.calendarMonth = d.getMonth();
      }
      if (timelineCard) timelineCard.style.display = "none";
      if (mainTableCard) mainTableCard.style.display = "none";
      if (els.bucketDayCard) els.bucketDayCard.style.display = "none";
      if (els.calendarCard) els.calendarCard.style.display = "block";
      if (els.btnCalendar) els.btnCalendar.textContent = "Back to Day";
      calendar.renderCalendar();
      if (els.bucketMonthCard) {
        const show = (state.calendarMode || "days") === "days";
        els.bucketMonthCard.style.display = show ? "" : "none";
      }
      renderBucketMonth();
    } else {
      if (timelineCard) timelineCard.style.display = "";
      if (mainTableCard) mainTableCard.style.display = "";
      if (els.calendarCard) els.calendarCard.style.display = "none";
      if (els.btnCalendar) els.btnCalendar.textContent = "Calendar";
      if (els.bucketDayCard) els.bucketDayCard.style.display = "";
      if (els.bucketMonthCard) els.bucketMonthCard.style.display = "none";
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
    const view = getView2();
    const leftPct = (start - view.start) / view.minutes * 100;
    const widthPct = (end - view.start) / view.minutes * 100 - leftPct;
    Object.assign(els.ghost.style, { display: "block", left: leftPct + "%", width: widthPct + "%" });
    showTips(start, end);
  }
  function hideGhost() {
    els.ghost.style.display = "none";
    hideTips();
  }
  function showTips(start, end) {
    const view = getView2();
    const leftPct = (start - view.start) / view.minutes * 100;
    const rightPct = (end - view.start) / view.minutes * 100;
    const centerPct = ((start + end) / 2 - view.start) / view.minutes * 100;
    els.tipStart.textContent = time.toLabel(start);
    els.tipEnd.textContent = time.toLabel(end);
    els.tipCenter.textContent = time.durationLabel(Math.max(0, end - start));
    els.tipStart.style.left = leftPct + "%";
    els.tipEnd.style.left = rightPct + "%";
    els.tipCenter.style.left = centerPct + "%";
    els.tipStart.style.display = "block";
    els.tipEnd.style.display = "block";
    els.tipCenter.style.display = "block";
  }
  function hideTips() {
    els.tipStart.style.display = "none";
    els.tipEnd.style.display = "none";
    els.tipCenter.style.display = "none";
  }
  function openModal(range) {
    state.editingId = null;
    state.pendingRange = range;
    els.startField.value = time.toLabel(range.startMin);
    els.endField.value = time.toLabel(range.endMin);
    els.bucketField.value = "";
    els.noteField.value = "";
    try {
      if (els.notePreview) {
        els.notePreview.style.display = "none";
        els.notePreview.innerHTML = "";
      }
      if (els.notePreviewToggle) els.notePreviewToggle.textContent = "Preview";
      if (els.noteField) {
        els.noteField.style.height = "auto";
        const h = Math.max(72, Math.min(320, els.noteField.scrollHeight || 72));
        els.noteField.style.height = h + "px";
      }
    } catch (e) {
    }
    if (els.modalStatusBtn) {
      els.modalStatusBtn.dataset.value = "default";
      els.modalStatusBtn.className = "status-btn status-default";
    }
    if (els.modalStatusWrap) els.modalStatusWrap.classList.remove("open");
    if (els.modalDelete) els.modalDelete.style.display = "none";
    if (els.modalTitle) els.modalTitle.textContent = "New Time Block";
    els.modal.style.display = "flex";
    els.bucketField.focus();
  }
  function closeModal() {
    els.modal.style.display = "none";
    state.pendingRange = null;
    state.editingId = null;
    if (els.modalStatusWrap) els.modalStatusWrap.classList.remove("open");
  }
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.style.display = "block";
    clearTimeout(els.toast._t);
    els.toast._t = setTimeout(() => els.toast.style.display = "none", 2400);
  }
  function renderAll() {
    updateViewMode();
  }
  var ui = {
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
    renderBucketMonth
  };

  // src/storage.js
  var openDb = () => new Promise((resolve, reject) => {
    const req = indexedDB.open("timeTrackerDB", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("punches", { keyPath: "id", autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  var withStore = (mode, fn) => openDb().then(
    (db) => new Promise((resolve, reject) => {
      const tx = db.transaction("punches", mode);
      const store = tx.objectStore("punches");
      fn(store);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    })
  );
  var add = (punch) => withStore("readwrite", (store) => store.add(punch));
  var put = (punch) => withStore("readwrite", (store) => store.put(punch));
  var remove = (id) => withStore("readwrite", (store) => store.delete(id));
  var all = () => openDb().then(
    (db) => new Promise((resolve, reject) => {
      const tx = db.transaction("punches", "readonly");
      const store = tx.objectStore("punches");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    })
  );
  var idb = { add, put, remove, all };

  // src/actions/helpers.js
  var getView3 = () => {
    const start = Math.max(0, Math.min(24 * 60, state.viewStartMin | 0));
    const end = Math.max(0, Math.min(24 * 60, state.viewEndMin | 0));
    const s = Math.min(start, end);
    const e = Math.max(start, end);
    const minutes = Math.max(1, e - s);
    return { start: s, end: e, minutes };
  };
  var pxToMinutes = (clientX) => {
    const rect = els.track.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.min(1, Math.max(0, x / rect.width));
    const view = getView3();
    const mins = view.start + pct * view.minutes;
    return Math.max(view.start, Math.min(view.end, Math.round(mins)));
  };
  var overlapsAny = (start, end, excludeId = null) => {
    const day = state.currentDate || todayStr();
    return state.punches.some(
      (p) => p.id !== excludeId && getPunchDate(p) === day && start < p.end && end > p.start
    );
  };
  var nearestBounds = (forId) => {
    const day = state.currentDate || todayStr();
    const sorted = [...state.punches].filter((p) => p.id !== forId && getPunchDate(p) === day).sort((a, b) => a.start - b.start);
    return {
      leftLimitAt: (start) => {
        const leftNeighbor = [...sorted].filter((p) => p.end <= start).pop();
        return leftNeighbor ? leftNeighbor.end : getView3().start;
      },
      rightLimitAt: (end) => {
        const rightNeighbor = [...sorted].find((p) => p.start >= end);
        return rightNeighbor ? rightNeighbor.start : getView3().end;
      }
    };
  };

  // src/actions/drag.js
  var startDrag = (e) => {
    if (e.target.closest(".handle")) return;
    if (e.target.closest(".punch")) return;
    const raw = e.touches ? pxToMinutes(e.touches[0].clientX) : pxToMinutes(e.clientX);
    const snapped = time.snap(raw);
    state.dragging = { anchor: snapped, last: snapped };
    ui.showGhost(snapped, snapped);
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);
  };
  var onDragMove = (e) => {
    if (!state.dragging) return;
    if (e.cancelable) e.preventDefault();
    const raw = e.touches ? pxToMinutes(e.touches[0].clientX) : pxToMinutes(e.clientX);
    const snapped = time.snap(raw);
    state.dragging.last = snapped;
    ui.showGhost(state.dragging.anchor, snapped);
  };
  var endDrag = () => {
    if (!state.dragging) return;
    const a = state.dragging.anchor;
    const b = state.dragging.last;
    state.dragging = null;
    ui.hideGhost();
    const startMin = Math.min(a, b);
    const endMin = Math.max(a, b);
    if (endMin - startMin < 1) return;
    if (overlapsAny(startMin, endMin)) {
      ui.toast("That range overlaps another block.");
      return;
    }
    ui.openModal({ startMin, endMin });
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("touchmove", onDragMove);
    window.removeEventListener("mouseup", endDrag);
    window.removeEventListener("touchend", endDrag);
  };
  var startMove = (e) => {
    const handle = e.target.closest(".handle");
    if (handle) return;
    const punchEl = e.target.closest(".punch");
    if (!punchEl) return;
    const id = Number(punchEl.dataset.id);
    const p = state.punches.find((x) => x.id === id);
    if (!p) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pointerMin = pxToMinutes(clientX);
    const duration = p.end - p.start;
    const offset = pointerMin - p.start;
    state.moving = {
      id,
      duration,
      offset,
      startStart: p.start,
      startEnd: p.end,
      startClientX: clientX,
      moved: false
    };
    window.addEventListener("mousemove", onMoveMove);
    window.addEventListener("touchmove", onMoveMove, { passive: false });
    window.addEventListener("mouseup", endMove);
    window.addEventListener("touchend", endMove);
  };
  var onMoveMove = (e) => {
    if (!state.moving) return;
    if (e.cancelable) e.preventDefault();
    const { id, duration, offset, startClientX } = state.moving;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    if (Math.abs(clientX - startClientX) > 3) state.moving.moved = true;
    const m = time.snap(pxToMinutes(clientX));
    let desiredStart = m - offset;
    desiredStart = time.snap(desiredStart);
    const desiredEnd = desiredStart + duration;
    const bounds = nearestBounds(id);
    const leftLimit = bounds.leftLimitAt(desiredStart);
    const rightLimit = bounds.rightLimitAt(desiredEnd);
    const minStart = leftLimit;
    const maxStart = rightLimit - duration;
    const clampedStart = Math.max(minStart, Math.min(maxStart, desiredStart));
    const newStart = time.snap(clampedStart);
    const newEnd = newStart + duration;
    const invalid = overlapsAny(newStart, newEnd, id) || newEnd <= newStart;
    const el = els.track.querySelector(`.punch[data-id="${id}"]`);
    const view = getView3();
    const leftPct = (Math.max(newStart, view.start) - view.start) / view.minutes * 100;
    const widthPct = (Math.min(newEnd, view.end) - Math.max(newStart, view.start)) / view.minutes * 100;
    el.style.left = leftPct + "%";
    el.style.width = widthPct + "%";
    el.classList.toggle("invalid", invalid);
    state.moving.preview = { newStart, newEnd, invalid };
    ui.showTips(newStart, newEnd);
  };
  var endMove = async () => {
    if (!state.moving) return;
    const { id, moved } = state.moving;
    const preview = state.moving.preview;
    state.moving = null;
    window.removeEventListener("mousemove", onMoveMove);
    window.removeEventListener("touchmove", onMoveMove);
    window.removeEventListener("mouseup", endMove);
    window.removeEventListener("touchend", endMove);
    ui.hideTips();
    if (!moved) return;
    if (!preview || preview.invalid) {
      ui.renderTimeline();
      if (preview == null ? void 0 : preview.invalid) ui.toast("Move would overlap another block.");
      return;
    }
    const idx = state.punches.findIndex((p) => p.id === id);
    state.punches[idx] = { ...state.punches[idx], start: preview.newStart, end: preview.newEnd };
    await idb.put(state.punches[idx]);
    ui.renderAll();
  };
  var onWheel = (e) => {
    if (!state.overTrack) return;
    e.preventDefault();
    const rect = els.track.getBoundingClientRect();
    const view = getView3();
    const pointerX = e.clientX - rect.left;
    const pct = Math.min(1, Math.max(0, pointerX / Math.max(1, rect.width)));
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const delta2 = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      const panMin = delta2 * 0.03;
      let newStart2 = view.start + panMin;
      let newEnd2 = view.end + panMin;
      const span = view.minutes;
      if (newStart2 < 0) {
        newStart2 = 0;
        newEnd2 = span;
      } else if (newEnd2 > 24 * 60) {
        newEnd2 = 24 * 60;
        newStart2 = newEnd2 - span;
      }
      state.viewStartMin = Math.floor(newStart2);
      state.viewEndMin = Math.floor(newEnd2);
      ui.renderAll();
      return;
    }
    const delta = e.ctrlKey ? e.deltaY : e.deltaY;
    const factor = Math.exp(delta * 7e-4);
    const minSpan = 45;
    const maxSpan = 24 * 60;
    let newSpan = Math.min(maxSpan, Math.max(minSpan, Math.round(view.minutes * factor)));
    const anchorMin = view.start + pct * view.minutes;
    let newStart = Math.round(anchorMin - pct * newSpan);
    let newEnd = newStart + newSpan;
    if (newStart < 0) {
      newStart = 0;
      newEnd = newSpan;
    }
    if (newEnd > 24 * 60) {
      newEnd = 24 * 60;
      newStart = newEnd - newSpan;
    }
    state.viewStartMin = newStart;
    state.viewEndMin = newEnd;
    ui.renderAll();
  };
  var dragActions = {
    attach: () => {
      els.track.addEventListener("mousedown", startDrag);
      els.track.addEventListener("touchstart", startDrag, { passive: true });
      els.track.addEventListener("mousedown", startMove);
      els.track.addEventListener("touchstart", startMove, { passive: true });
      els.track.addEventListener("mouseenter", () => state.overTrack = true);
      els.track.addEventListener("mouseleave", () => state.overTrack = false);
      window.addEventListener("wheel", onWheel, { passive: false });
    }
  };

  // src/actions/resize.js
  var startResize = (e) => {
    const handle = e.target.closest(".handle");
    if (!handle) return;
    const punchEl = handle.closest(".punch");
    const id = Number(punchEl.dataset.id);
    const p = state.punches.find((x) => x.id === id);
    state.resizing = { id, edge: handle.dataset.edge, startStart: p.start, startEnd: p.end };
    if (handle.dataset.edge === "left") punchEl.classList.add("resizing-left");
    if (handle.dataset.edge === "right") punchEl.classList.add("resizing-right");
    window.addEventListener("mousemove", onResizeMove);
    window.addEventListener("touchmove", onResizeMove, { passive: false });
    window.addEventListener("mouseup", endResize);
    window.addEventListener("touchend", endResize);
    e.stopPropagation();
  };
  var onResizeMove = (e) => {
    if (!state.resizing) return;
    if (e.cancelable) e.preventDefault();
    const { id, edge, startStart, startEnd } = state.resizing;
    const raw = e.touches ? pxToMinutes(e.touches[0].clientX) : pxToMinutes(e.clientX);
    const m = time.snap(raw);
    const bounds = nearestBounds(id);
    let newStart = startStart;
    let newEnd = startEnd;
    if (edge === "left") {
      const minL = bounds.leftLimitAt(startStart);
      const maxL = startEnd - 1;
      newStart = Math.min(maxL, Math.max(minL, m));
      newStart = time.snap(newStart);
    }
    if (edge === "right") {
      const minR = startStart + 1;
      const maxR = bounds.rightLimitAt(startEnd);
      newEnd = Math.max(minR, Math.min(maxR, m));
      newEnd = time.snap(newEnd);
    }
    const invalid = overlapsAny(newStart, newEnd, id) || newEnd <= newStart;
    const el = els.track.querySelector(`.punch[data-id="${id}"]`);
    const view = getView3();
    const leftPct = (Math.max(newStart, view.start) - view.start) / view.minutes * 100;
    const widthPctRaw = (Math.min(newEnd, view.end) - Math.max(newStart, view.start)) / view.minutes * 100;
    const widthPct = Math.max(0, widthPctRaw);
    el.style.left = leftPct + "%";
    el.style.width = widthPct + "%";
    el.classList.toggle("invalid", invalid);
    state.resizing.preview = { newStart, newEnd, invalid };
    ui.showTips(newStart, newEnd);
  };
  var endResize = async () => {
    if (!state.resizing) return;
    const { id } = state.resizing;
    const preview = state.resizing.preview;
    const punchEl = els.track.querySelector(`.punch[data-id="${id}"]`);
    if (punchEl) punchEl.classList.remove("resizing-left", "resizing-right");
    state.resizing = null;
    window.removeEventListener("mousemove", onResizeMove);
    window.removeEventListener("touchmove", onResizeMove);
    window.removeEventListener("mouseup", endResize);
    window.removeEventListener("touchend", endResize);
    ui.hideTips();
    if (!preview || preview.invalid) {
      ui.renderTimeline();
      if (preview == null ? void 0 : preview.invalid) ui.toast("Adjust would overlap another block.");
      return;
    }
    const idx = state.punches.findIndex((p) => p.id === id);
    state.punches[idx] = { ...state.punches[idx], start: preview.newStart, end: preview.newEnd };
    await idb.put(state.punches[idx]);
    ui.renderAll();
  };
  var resizeActions = {
    attach: () => {
      els.track.addEventListener("mousedown", startResize);
      els.track.addEventListener("touchstart", startResize, { passive: true });
    }
  };

  // src/actions/calendar.js
  var toggleCalendarView = () => {
    state.viewMode = state.viewMode === "calendar" ? "day" : "calendar";
    ui.updateViewMode();
  };
  var calendarActions = {
    attach: () => {
      if (els.btnCalendar) {
        els.btnCalendar.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleCalendarView();
        });
      }
      if (els.btnCalendar2) {
        els.btnCalendar2.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleCalendarView();
        });
      }
      if (els.dayLabel) {
        els.dayLabel.addEventListener("click", (e) => {
          e.preventDefault();
          if (state.viewMode !== "calendar") toggleCalendarView();
        });
        els.dayLabel.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (state.viewMode !== "calendar") toggleCalendarView();
          }
        });
      }
      if (els.btnCalendarFab) {
        els.btnCalendarFab.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleCalendarView();
        });
      }
      document.addEventListener("click", (e) => {
        var _a;
        const id = (_a = e.target) == null ? void 0 : _a.id;
        if (id === "btnCalendar" || id === "btnCalendar2" || id === "btnCalendarFab") {
          e.preventDefault();
          e.stopPropagation();
          toggleCalendarView();
        }
      });
      if (els.calPrev) {
        els.calPrev.addEventListener("click", () => {
          if (state.calendarMode === "days") {
            calendar.prevMonth();
          } else if (state.calendarMode === "months") {
            state.calendarYear -= 1;
            calendar.renderCalendar();
          } else {
            state.yearGridStart -= 12;
            calendar.renderCalendar();
          }
        });
      }
      if (els.calNext) {
        els.calNext.addEventListener("click", () => {
          if (state.calendarMode === "days") {
            calendar.nextMonth();
          } else if (state.calendarMode === "months") {
            state.calendarYear += 1;
            calendar.renderCalendar();
          } else {
            state.yearGridStart += 12;
            calendar.renderCalendar();
          }
        });
      }
      if (els.calMonthLabel) {
        els.calMonthLabel.addEventListener("click", (e) => {
          const t = e.target.closest("[data-cal-click]");
          if (t) {
            const what = t.dataset.calClick;
            if (what === "year") {
              state.calendarMode = "years";
              state.yearGridStart = Math.floor(state.calendarYear / 12) * 12;
              calendar.renderCalendar();
              ui.updateHelpText();
              return;
            } else if (what === "month") {
              state.calendarMode = "months";
              calendar.renderCalendar();
              ui.updateHelpText();
              return;
            }
          }
          const nav = e.target.closest("[data-cal-nav]");
          if (nav) {
            const dir = nav.dataset.calNav;
            const delta = dir === "prev" ? -1 : 1;
            if (state.calendarMode === "days") {
              if (delta === -1) calendar.prevMonth();
              else calendar.nextMonth();
            } else if (state.calendarMode === "months") {
              state.calendarYear += delta;
              calendar.renderCalendar();
            } else {
              state.yearGridStart += delta * 12;
              calendar.renderCalendar();
            }
          }
        });
      }
      window.addEventListener("calendar:daySelected", () => ui.updateViewMode());
      window.addEventListener("calendar:modeChanged", () => {
        var _a, _b;
        ui.updateHelpText();
        (_b = (_a = ui).renderBucketMonth) == null ? void 0 : _b.call(_a);
      });
      window.addEventListener("calendar:rendered", () => {
        var _a, _b;
        return (_b = (_a = ui).renderBucketMonth) == null ? void 0 : _b.call(_a);
      });
    }
  };

  // src/actions/index.js
  var escapeHtml2 = (s) => (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
  var mdToHtml = (text) => {
    const t = String(text || "");
    if (!t.trim()) return "";
    try {
      if (window.marked && typeof window.marked.parse === "function") {
        const raw = window.marked.parse(t);
        if (window.DOMPurify && typeof window.DOMPurify.sanitize === "function") return window.DOMPurify.sanitize(raw);
        return raw;
      }
    } catch (e) {
    }
    return escapeHtml2(t).replace(/\n/g, "<br>");
  };
  var saveNewFromModal = async (e) => {
    e.preventDefault();
    if (!state.pendingRange) return;
    const { startMin, endMin } = state.pendingRange;
    const s = time.snap(startMin);
    const eMin = time.snap(endMin);
    if (eMin - s < 1) {
      ui.closeModal();
      return;
    }
    const payload = {
      start: s,
      end: eMin,
      bucket: els.bucketField.value.trim(),
      note: els.noteField.value.trim(),
      date: state.currentDate || todayStr(),
      status: (() => {
        var _a;
        const val = ((_a = els.modalStatusBtn) == null ? void 0 : _a.dataset.value) || "default";
        return val === "default" ? null : val;
      })()
    };
    if (state.editingId) {
      const idx = state.punches.findIndex((p) => p.id === state.editingId);
      if (idx === -1) {
        ui.toast("Could not find item to update.");
        ui.closeModal();
        return;
      }
      const updated = { ...state.punches[idx], ...payload };
      if (overlapsAny(updated.start, updated.end, updated.id)) {
        ui.toast("That range overlaps another block.");
        return;
      }
      state.punches[idx] = updated;
      await idb.put(updated);
    } else {
      if (overlapsAny(payload.start, payload.end)) {
        ui.toast("That range overlaps another block.");
        return;
      }
      const toAdd = { ...payload, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
      await idb.add(toAdd);
    }
    state.punches = await idb.all();
    state.editingId = null;
    ui.closeModal();
    ui.renderAll();
  };
  var closeModal2 = () => ui.closeModal();
  var attachEvents = () => {
    var _a, _b, _c, _d, _e, _f, _g;
    dragActions.attach();
    resizeActions.attach();
    calendarActions.attach();
    els.rows.addEventListener("click", async (e) => {
      const btn = e.target.closest(".status-btn");
      if (btn) {
        const wrap = btn.closest(".status-wrap");
        els.rows.querySelectorAll(".status-wrap.open").forEach((w) => {
          if (w !== wrap) w.classList.remove("open");
        });
        const willOpen = !wrap.classList.contains("open");
        wrap.classList.toggle("open");
        wrap.classList.remove("up");
        if (willOpen) {
          const menu = wrap.querySelector(".status-menu");
          if (menu) {
            const prev = menu.style.display;
            if (!wrap.classList.contains("open")) menu.style.display = "grid";
            const menuRect = menu.getBoundingClientRect();
            const wrapRect = wrap.getBoundingClientRect();
            const tableCard = document.querySelector(".table-card");
            const cardRect = tableCard ? tableCard.getBoundingClientRect() : { bottom: window.innerHeight };
            const spaceBelow = cardRect.bottom - wrapRect.bottom;
            const needed = menuRect.height + 12;
            if (spaceBelow < needed) wrap.classList.add("up");
            menu.style.display = prev;
          }
        }
        e.stopPropagation();
        return;
      }
      const opt = e.target.closest(".status-option");
      if (opt) {
        const tr = e.target.closest("tr[data-id]");
        const id = Number(tr == null ? void 0 : tr.dataset.id);
        if (!id) return;
        const value = opt.dataset.value;
        const idx = state.punches.findIndex((p) => p.id === id);
        if (idx !== -1) {
          const updated = { ...state.punches[idx] };
          updated.status = value === "default" ? null : value;
          state.punches[idx] = updated;
          await idb.put(updated);
          ui.renderAll();
        }
        return;
      }
      const delBtn = e.target.closest(".row-action.delete");
      if (delBtn) {
        const id = Number(delBtn.dataset.id);
        if (!confirm("Delete this time entry?")) return;
        await idb.remove(id);
        state.punches = await idb.all();
        ui.renderAll();
        ui.toast("Deleted");
        return;
      }
      const editBtn = e.target.closest(".row-action.edit");
      const row = e.target.closest("tr");
      if (editBtn || row) {
        const id = Number((editBtn == null ? void 0 : editBtn.dataset.id) || (row == null ? void 0 : row.dataset.id));
        if (!id) return;
        const p = state.punches.find((px) => px.id === id);
        if (!p) return;
        state.editingId = id;
        state.pendingRange = { startMin: p.start, endMin: p.end };
        els.startField.value = time.toLabel(p.start);
        els.endField.value = time.toLabel(p.end);
        els.bucketField.value = p.bucket || "";
        els.noteField.value = p.note || "";
        try {
          if (els.notePreview) {
            els.notePreview.style.display = "none";
            els.notePreview.innerHTML = "";
          }
          if (els.notePreviewToggle) els.notePreviewToggle.textContent = "Preview";
          if (els.noteField) {
            els.noteField.style.height = "auto";
            const h = Math.max(72, Math.min(320, els.noteField.scrollHeight || 72));
            els.noteField.style.height = h + "px";
          }
        } catch (e2) {
        }
        if (els.modalStatusBtn) {
          const st = p.status || "default";
          els.modalStatusBtn.dataset.value = st;
          els.modalStatusBtn.className = `status-btn status-${st}`;
        }
        if (els.modalStatusWrap) els.modalStatusWrap.classList.remove("open");
        if (els.modalDelete) els.modalDelete.style.display = "";
        if (els.modalTitle) els.modalTitle.textContent = "Edit Time Block";
        els.modal.style.display = "flex";
        els.bucketField.focus();
        return;
      }
    });
    els.track.addEventListener("click", async (e) => {
      const lbl = e.target.closest(".punch-label");
      if (lbl) {
        const id = Number(lbl.dataset.id);
        const p = state.punches.find((px) => px.id === id);
        if (!p) return;
        state.editingId = id;
        state.pendingRange = { startMin: p.start, endMin: p.end };
        els.startField.value = time.toLabel(p.start);
        els.endField.value = time.toLabel(p.end);
        els.bucketField.value = p.bucket || "";
        els.noteField.value = p.note || "";
        if (els.modalStatusBtn) {
          const st = p.status || "default";
          els.modalStatusBtn.dataset.value = st;
          els.modalStatusBtn.className = `status-btn status-${st}`;
        }
        if (els.modalStatusWrap) els.modalStatusWrap.classList.remove("open");
        if (els.modalDelete) els.modalDelete.style.display = "";
        if (els.modalTitle) els.modalTitle.textContent = "Edit Time Block";
        els.modal.style.display = "flex";
        els.bucketField.focus();
        return;
      }
      const editBtn = e.target.closest(".control-btn.edit");
      if (editBtn) {
        const id = Number(editBtn.dataset.id);
        const p = state.punches.find((px) => px.id === id);
        if (!p) return;
        state.editingId = id;
        state.pendingRange = { startMin: p.start, endMin: p.end };
        els.startField.value = time.toLabel(p.start);
        els.endField.value = time.toLabel(p.end);
        els.bucketField.value = p.bucket || "";
        els.noteField.value = p.note || "";
        if (els.modalStatusBtn) {
          const st = p.status || "default";
          els.modalStatusBtn.dataset.value = st;
          els.modalStatusBtn.className = `status-btn status-${st}`;
        }
        if (els.modalStatusWrap) els.modalStatusWrap.classList.remove("open");
        if (els.modalDelete) els.modalDelete.style.display = "";
        if (els.modalTitle) els.modalTitle.textContent = "Edit Time Block";
        els.modal.style.display = "flex";
        els.bucketField.focus();
        return;
      }
      const delBtn = e.target.closest(".control-btn.delete");
      if (delBtn) {
        const id = Number(delBtn.dataset.id);
        if (!confirm("Delete this time entry?")) return;
        await idb.remove(id);
        state.punches = await idb.all();
        ui.renderAll();
        ui.toast("Deleted");
        return;
      }
      const popEdit = e.target.closest(".label-popper .control-btn.edit");
      if (popEdit) {
        const pop = e.target.closest(".label-popper");
        const id = Number(pop.dataset.id);
        const p = state.punches.find((px) => px.id === id);
        if (!p) return;
        state.editingId = id;
        state.pendingRange = { startMin: p.start, endMin: p.end };
        els.startField.value = time.toLabel(p.start);
        els.endField.value = time.toLabel(p.end);
        els.bucketField.value = p.bucket || "";
        els.noteField.value = p.note || "";
        if (els.modalStatusBtn) {
          const st = p.status || "default";
          els.modalStatusBtn.dataset.value = st;
          els.modalStatusBtn.className = `status-btn status-${st}`;
        }
        if (els.modalStatusWrap) els.modalStatusWrap.classList.remove("open");
        if (els.modalDelete) els.modalDelete.style.display = "";
        if (els.modalTitle) els.modalTitle.textContent = "Edit Time Block";
        els.modal.style.display = "flex";
        els.bucketField.focus();
        return;
      }
      const popDel = e.target.closest(".label-popper .control-btn.delete");
      if (popDel) {
        const pop = e.target.closest(".label-popper");
        const id = Number(pop.dataset.id);
        if (!confirm("Delete this time entry?")) return;
        await idb.remove(id);
        state.punches = await idb.all();
        ui.renderAll();
        ui.toast("Deleted");
        return;
      }
    });
    els.modalForm.addEventListener("submit", saveNewFromModal);
    els.modalCancel.addEventListener("click", closeModal2);
    els.modalClose.addEventListener("click", closeModal2);
    (_a = els.modalDelete) == null ? void 0 : _a.addEventListener("click", async () => {
      if (!state.editingId) return;
      if (!confirm("Delete this time entry?")) return;
      await idb.remove(state.editingId);
      state.punches = await idb.all();
      state.editingId = null;
      ui.closeModal();
      ui.renderAll();
      ui.toast("Deleted");
    });
    (_b = els.modalStatusBtn) == null ? void 0 : _b.addEventListener("click", () => {
      var _a2;
      (_a2 = els.modalStatusWrap) == null ? void 0 : _a2.classList.toggle("open");
    });
    (_c = els.modalStatusMenu) == null ? void 0 : _c.addEventListener("click", (e) => {
      var _a2;
      const opt = e.target.closest(".status-option");
      if (!opt) return;
      const val = opt.dataset.value;
      if (!val) return;
      if (els.modalStatusBtn) {
        els.modalStatusBtn.dataset.value = val;
        els.modalStatusBtn.className = `status-btn status-${val}`;
      }
      (_a2 = els.modalStatusWrap) == null ? void 0 : _a2.classList.remove("open");
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal2();
    });
    window.addEventListener("resize", () => ui.renderAll());
    window.addEventListener("click", (e) => {
      var _a2, _b2, _c2;
      if (!e.target.closest(".status-wrap")) {
        els.rows.querySelectorAll(".status-wrap.open").forEach((w) => w.classList.remove("open"));
        (_a2 = els.modalStatusWrap) == null ? void 0 : _a2.classList.remove("open");
      }
      if (!e.target.closest(".note-popover") && !e.target.closest(".note-dot")) {
        (_c2 = (_b2 = ui).hideNotePopover) == null ? void 0 : _c2.call(_b2);
      }
    });
    els.track.addEventListener("mouseover", (e) => {
      const punch = e.target.closest(".punch");
      if (!punch) return;
      punch.classList.add("is-hovered");
      const id = Number(punch.dataset.id);
      if (!id) return;
      const row = els.rows.querySelector(`tr[data-id="${id}"]`);
      if (row) row.classList.add("is-hovered");
    });
    els.track.addEventListener("mouseout", (e) => {
      const punch = e.target.closest(".punch");
      if (!punch) return;
      punch.classList.remove("is-hovered");
      const id = Number(punch.dataset.id);
      if (!id) return;
      const row = els.rows.querySelector(`tr[data-id="${id}"]`);
      if (row) row.classList.remove("is-hovered");
    });
    els.rows.addEventListener("mouseover", (e) => {
      const row = e.target.closest("tr[data-id]");
      if (!row) return;
      row.classList.add("is-hovered");
      const id = Number(row.dataset.id);
      if (!id) return;
      const punch = els.track.querySelector(`.punch[data-id="${id}"]`);
      if (punch) punch.classList.add("is-hovered");
    });
    els.rows.addEventListener("mouseout", (e) => {
      const row = e.target.closest("tr[data-id]");
      if (!row) return;
      row.classList.remove("is-hovered");
      const id = Number(row.dataset.id);
      if (!id) return;
      const punch = els.track.querySelector(`.punch[data-id="${id}"]`);
      if (punch) punch.classList.remove("is-hovered");
    });
    const setView = (start, end) => {
      const s = Math.max(0, Math.min(24 * 60, Math.floor(start)));
      const e = Math.max(0, Math.min(24 * 60, Math.floor(end)));
      state.viewStartMin = Math.min(s, e);
      state.viewEndMin = Math.max(s, e);
      ui.renderAll();
    };
    (_d = els.view24) == null ? void 0 : _d.addEventListener("click", () => setView(0, 24 * 60));
    (_e = els.viewDefault) == null ? void 0 : _e.addEventListener("click", () => setView(6 * 60, 18 * 60));
    els.track.addEventListener("click", (e) => {
      var _a2, _b2, _c2, _d2;
      const dot = e.target.closest(".note-dot");
      if (dot) {
        const id = Number(dot.dataset.id);
        if (id) (_b2 = (_a2 = ui).toggleNotePopover) == null ? void 0 : _b2.call(_a2, id);
        e.stopPropagation();
        return;
      }
      const punch = e.target.closest(".punch");
      if (punch) {
        const id = Number(punch.dataset.id);
        if (!id) return;
        const p = state.punches.find((x) => x.id === id);
        if (p == null ? void 0 : p.note) {
          (_d2 = (_c2 = ui).toggleNotePopover) == null ? void 0 : _d2.call(_c2, id);
          e.stopPropagation();
        }
      }
    });
    (_f = els.noteField) == null ? void 0 : _f.addEventListener("input", () => {
      try {
        els.noteField.style.height = "auto";
        const h = Math.max(72, Math.min(320, els.noteField.scrollHeight || 72));
        els.noteField.style.height = h + "px";
        if (els.notePreview && els.notePreview.style.display !== "none") {
          els.notePreview.innerHTML = mdToHtml(els.noteField.value);
        }
      } catch (e) {
      }
    });
    (_g = els.notePreviewToggle) == null ? void 0 : _g.addEventListener("click", (e) => {
      var _a2;
      e.preventDefault();
      if (!els.notePreview) return;
      const showing = els.notePreview.style.display !== "none";
      if (showing) {
        els.notePreview.style.display = "none";
        els.notePreview.innerHTML = "";
        if (els.notePreviewToggle) els.notePreviewToggle.textContent = "Preview";
      } else {
        els.notePreview.innerHTML = mdToHtml(((_a2 = els.noteField) == null ? void 0 : _a2.value) || "");
        els.notePreview.style.display = "";
        if (els.notePreviewToggle) els.notePreviewToggle.textContent = "Hide preview";
      }
    });
  };
  var actions = {
    attachEvents
  };

  // app.js
  async function init2() {
    actions.attachEvents();
    if (typeof window.DEBUG_HANDLES === "undefined") {
      window.DEBUG_HANDLES = true;
      console.info("DEBUG_HANDLES enabled \u2014 set window.DEBUG_HANDLES = false in console to disable");
    }
    state.punches = await idb.all();
    const updates = [];
    for (const p of state.punches) {
      if (!p.date) {
        const d = p.createdAt && String(p.createdAt).slice(0, 10) || todayStr();
        updates.push({ ...p, date: d });
      }
      if (p.caseNumber && !p.bucket) {
        const { caseNumber, ...rest } = p;
        updates.push({ ...rest, bucket: caseNumber });
      }
    }
    if (updates.length) {
      for (const up of updates) await idb.put(up);
      state.punches = await idb.all();
    }
    ui.renderAll();
    nowIndicator.init();
  }
  init2();
})();
