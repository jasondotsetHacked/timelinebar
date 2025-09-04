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
    // Recurrence controls
    repeatEnabled: byId("repeatEnabled"),
    repeatFields: byId("repeatFields"),
    repeatFreq: byId("repeatFreq"),
    repeatUntil: byId("repeatUntil"),
    repeatUntilWrap: byId("repeatUntilWrap"),
    repeatDowWrap: byId("repeatDowWrap"),
    repeatDow: byId("repeatDow"),
    btnDowWeekdays: byId("btnDowWeekdays"),
    btnDowAll: byId("btnDowAll"),
    applyScopeWrap: byId("applyScopeWrap"),
    applyScopeOne: byId("applyScopeOne"),
    applyScopeSeries: byId("applyScopeSeries"),
    extendWrap: byId("extendWrap"),
    extendUntil: byId("extendUntil"),
    btnExtendSeries: byId("btnExtendSeries"),
    total: byId("total"),
    toast: byId("toast"),
    viewHelp: byId("viewHelp"),
    btnBucketBackTop: byId("btnBucketBackTop"),
    view24: byId("view24"),
    viewDefault: byId("viewDefault"),
    btnCopyChart: byId("btnCopyChart"),
    // Calendar / header controls
    btnCalendar: byId("btnCalendar"),
    btnCalendar2: byId("btnCalendar2"),
    btnCalendarFab: byId("btnCalendarFab"),
    btnCopyChartTop: byId("btnCopyChartTop"),
    btnCopyChartTable: byId("btnCopyChartTable"),
    dayLabel: byId("dayLabel"),
    calendarCard: byId("calendarCard"),
    calendarGrid: byId("calendarGrid"),
    calWeekdays: byId("calWeekdays"),
    calMonthLabel: byId("calMonthLabel"),
    calPrev: byId("calPrev"),
    calNext: byId("calNext"),
    // Mobile controls
    mobileControls: byId("mobileControls"),
    mobileScrollbar: byId("mobileScrollbar"),
    mobileWindow: byId("mobileWindow"),
    mobileZoomIn: byId("mobileZoomIn"),
    mobileZoomOut: byId("mobileZoomOut"),
    mobileZoomRange: byId("mobileZoomRange"),
    // Bucket reports
    bucketDayCard: byId("bucketDayCard"),
    bucketDayBody: byId("bucketDayBody"),
    bucketDayEmpty: byId("bucketDayEmpty"),
    bucketMonthCard: byId("bucketMonthCard"),
    bucketMonthBody: byId("bucketMonthBody"),
    bucketMonthEmpty: byId("bucketMonthEmpty"),
    bucketMonthTitle: byId("bucketMonthTitle"),
    // Bucket view
    bucketViewCard: byId("bucketViewCard"),
    bucketViewTitle: byId("bucketViewTitle"),
    bucketViewTotal: byId("bucketViewTotal"),
    bucketViewBody: byId("bucketViewBody"),
    bucketViewEmpty: byId("bucketViewEmpty"),
    btnBucketBack: byId("btnBucketBack"),
    btnBucketDelete: byId("btnBucketDelete"),
    // Settings
    btnSettings: byId("btnSettings"),
    settingsModal: byId("settingsModal"),
    settingsClose: byId("settingsClose"),
    settingsCancel: byId("settingsCancel"),
    btnExport: byId("btnExport"),
    btnImport: byId("btnImport"),
    importFile: byId("importFile"),
    btnEraseAll: byId("btnEraseAll"),
    themeSelect: byId("themeSelect"),
    lblBackup: byId("lblBackup"),
    lblRestore: byId("lblRestore")
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
    // 'day' | 'calendar' | 'bucket'
    calendarYear: (/* @__PURE__ */ new Date()).getFullYear(),
    calendarMonth: (/* @__PURE__ */ new Date()).getMonth(),
    // 0-11
    // Calendar sub-view: 'days' | 'months' | 'years'
    calendarMode: "days",
    // Start year for the visible year grid (in 'years' mode). Initialized to a 12-year block containing today.
    yearGridStart: Math.floor((/* @__PURE__ */ new Date()).getFullYear() / 12) * 12,
    // Bucket view state
    bucketFilter: "",
    // exact bucket label being viewed ('' = no bucket)
    lastViewMode: "day"
    // where to return when leaving bucket view
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
  function ensureElIn(container) {
    if (!container) return null;
    let el = container.querySelector(":scope > .now-indicator");
    if (!el) {
      el = document.createElement("div");
      el.className = "now-indicator";
      el.setAttribute("aria-hidden", "true");
      container.appendChild(el);
    }
    return el;
  }
  function update() {
    var _a, _b, _c;
    const view = getView();
    const mins = nowMinutes();
    const isInView = !(mins < view.start || mins > view.end);
    const isToday = (state.currentDate || todayStr()) === todayStr();
    const pct = (mins - view.start) / view.minutes * 100;
    const trackEl = ensureElIn(els.track);
    if (trackEl) {
      if (isInView) {
        trackEl.style.left = pct + "%";
        trackEl.style.display = "block";
        if (isToday) trackEl.classList.remove("not-today");
        else trackEl.classList.add("not-today");
      } else {
        trackEl.style.display = "none";
      }
    }
    try {
      document.querySelectorAll(".punch.is-active").forEach((n) => n.classList.remove("is-active"));
      (_a = els.rows) == null ? void 0 : _a.querySelectorAll("tr.is-active").forEach((n) => n.classList.remove("is-active"));
    } catch (e) {
    }
    if (isToday) {
      try {
        const day = todayStr();
        const active = state.punches.find((p) => getPunchDate(p) === day && p.start <= mins && mins < p.end);
        if (active) {
          const punchEl = (_b = els.track) == null ? void 0 : _b.querySelector(`.punch[data-id="${active.id}"]`);
          if (punchEl) punchEl.classList.add("is-active");
          const rowEl = (_c = els.rows) == null ? void 0 : _c.querySelector(`tr[data-id="${active.id}"]`);
          if (rowEl) rowEl.classList.add("is-active");
        }
      } catch (e) {
      }
    }
  }
  var _timer = null;
  function init() {
    ensureElIn(els.track);
    update();
    if (_timer) clearInterval(_timer);
    _timer = setInterval(update, 3e4);
    try {
      window.addEventListener("resize", update, { passive: true });
    } catch (e) {
    }
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
  var clear = () => withStore("readwrite", (store) => store.clear());
  var all = () => openDb().then(
    (db) => new Promise((resolve, reject) => {
      const tx = db.transaction("punches", "readonly");
      const store = tx.objectStore("punches");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    })
  );
  var idb = { add, put, remove, clear, all };

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
  function toggleNotePopover(id, anchorEl = null) {
    const anchor = anchorEl || els.track.querySelector(`.punch[data-id="${id}"]`);
    if (!anchor) return;
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
    pop.innerHTML = `
    <div class="note-actions" role="toolbar" aria-label="Note actions">
      <button class="note-edit" title="Edit note" aria-label="Edit note">\u270E</button>
      <button class="note-close" aria-label="Close">\u2715</button>
    </div>
    <div class="note-content"></div>`;
    const content = pop.querySelector(".note-content");
    content.innerHTML = markdownToHtml(p.note);
    document.body.appendChild(pop);
    const elRect = anchor.getBoundingClientRect();
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
    const enterEditMode = () => {
      if (pop.dataset.mode === "edit") return;
      pop.dataset.mode = "edit";
      const p2 = state.punches.find((x) => x.id === id);
      const current = p2 && p2.note || "";
      content.innerHTML = `
      <textarea class="note-editarea" aria-label="Edit note">${escapeHtml(current)}</textarea>
      <div class="note-edit-actions">
        <button class="btn primary note-save" type="button">Save</button>
        <button class="btn ghost note-cancel" type="button">Cancel</button>
      </div>`;
      try {
        const ta = content.querySelector(".note-editarea");
        if (ta) {
          ta.style.height = "auto";
          const h = Math.max(96, Math.min(360, ta.scrollHeight || 96));
          ta.style.height = h + "px";
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        }
      } catch (e) {
      }
    };
    const exitEditMode = () => {
      delete pop.dataset.mode;
      const p3 = state.punches.find((x) => x.id === id);
      content.innerHTML = markdownToHtml((p3 == null ? void 0 : p3.note) || "");
    };
    pop.addEventListener("click", async (e) => {
      if (e.target.closest(".note-close")) {
        hideNotePopover();
        e.stopPropagation();
        return;
      }
      if (e.target.closest(".note-edit")) {
        enterEditMode();
        e.stopPropagation();
        return;
      }
      if (e.target.closest(".note-cancel")) {
        exitEditMode();
        e.stopPropagation();
        return;
      }
      if (e.target.closest(".note-save")) {
        const ta = pop.querySelector(".note-editarea");
        const newText = String((ta == null ? void 0 : ta.value) || "").trim();
        const idx = state.punches.findIndex((x) => x.id === id);
        if (idx !== -1) {
          const updated = { ...state.punches[idx], note: newText };
          await idb.put(updated);
          state.punches[idx] = updated;
          try {
            if (!newText) {
              hideNotePopover();
            } else {
              exitEditMode();
            }
            renderAll();
          } catch (e2) {
          }
        }
        e.stopPropagation();
        return;
      }
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
  function renderMobileControls() {
    if (!els.mobileWindow || !els.mobileScrollbar) return;
    const view = getView2();
    const total = 24 * 60;
    const leftPct = view.start / total * 100;
    const widthPct = view.minutes / total * 100;
    els.mobileWindow.style.left = leftPct + "%";
    els.mobileWindow.style.width = widthPct + "%";
    try {
      els.mobileWindow.setAttribute("aria-valuenow", String(view.start));
    } catch (e) {
    }
    try {
      if (els.mobileZoomRange) {
        els.mobileZoomRange.min = "45";
        els.mobileZoomRange.max = String(total);
        els.mobileZoomRange.step = "15";
        els.mobileZoomRange.value = String(view.minutes);
      }
    } catch (e) {
    }
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
      const status = p.status || "default";
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
      <td class="cell-start">${time.toLabel(p.start)}</td>
      <td class="cell-end">${time.toLabel(p.end)}</td>
      <td>${time.durationLabel(dur)}</td>
      <td>${escapeHtml(p.bucket || "")}</td>
      <td class="note"><div class="note-window" role="region" aria-label="Note preview"><div class="note-html">${markdownToHtml(p.note || "")}</div></div></td>
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
      tr.dataset.bucket = bucket;
      const label = bucket || "(no bucket)";
      tr.innerHTML = `<td><a href="#" class="bucket-link">${escapeHtml(label)}</a></td><td>${time.durationLabel(info.totalMin)}</td>`;
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
      tr.dataset.bucket = bucket;
      const label = bucket || "(no bucket)";
      tr.innerHTML = `<td><a href="#" class="bucket-link">${escapeHtml(label)}</a></td><td>${time.durationLabel(info.totalMin)}</td>`;
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
  function renderBucketView() {
    if (!els.bucketViewCard || !els.bucketViewBody) return;
    const name = String(state.bucketFilter || "");
    const label = name || "(no bucket)";
    if (els.bucketViewTitle) els.bucketViewTitle.textContent = label;
    const items = state.punches.filter((p) => String(p.bucket || "").trim() === name).slice().sort((a, b) => {
      const ad = String(a.date || "").localeCompare(String(b.date || ""));
      if (ad !== 0) return ad;
      return (a.start || 0) - (b.start || 0);
    });
    try {
      const totalMin = items.reduce((s, p) => s + Math.max(0, (p.end || 0) - (p.start || 0)), 0);
      if (els.bucketViewTotal) els.bucketViewTotal.textContent = totalMin ? `\u2014 Total: ${time.durationLabel(totalMin)}` : "";
    } catch (e) {
    }
    els.bucketViewBody.innerHTML = "";
    for (const p of items) {
      const tr = document.createElement("tr");
      const dur = Math.max(0, (p.end || 0) - (p.start || 0));
      tr.innerHTML = `
      <td>${escapeHtml(p.date || "")}</td>
      <td>${time.toLabel(p.start || 0)}</td>
      <td>${time.toLabel(p.end || 0)}</td>
      <td>${time.durationLabel(dur)}</td>
      <td class="note"><div class="note-html">${markdownToHtml(p.note || "")}</div></td>`;
      els.bucketViewBody.appendChild(tr);
    }
    if (els.bucketViewEmpty) els.bucketViewEmpty.style.display = items.length ? "none" : "block";
  }
  function renderDayLabel() {
    if (!els.dayLabel) return;
    if (state.viewMode === "calendar" || state.viewMode === "bucket") {
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
    if (state.viewMode === "bucket") {
      els.viewHelp.textContent = "Bucket: click Back to Calendar to return A\uFFFD Use Delete Bucket to remove all entries";
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
      if (els.bucketViewCard) els.bucketViewCard.style.display = "none";
      renderBucketMonth();
    } else if (state.viewMode === "bucket") {
      if (timelineCard) timelineCard.style.display = "none";
      if (mainTableCard) mainTableCard.style.display = "none";
      if (els.calendarCard) els.calendarCard.style.display = "none";
      if (els.btnCalendar) els.btnCalendar.textContent = "Calendar";
      if (els.bucketDayCard) els.bucketDayCard.style.display = "none";
      if (els.bucketMonthCard) els.bucketMonthCard.style.display = "none";
      if (els.bucketViewCard) els.bucketViewCard.style.display = "";
      try {
        renderBucketView();
      } catch (e) {
      }
    } else {
      if (timelineCard) timelineCard.style.display = "";
      if (mainTableCard) mainTableCard.style.display = "";
      if (els.calendarCard) els.calendarCard.style.display = "none";
      if (els.btnCalendar) els.btnCalendar.textContent = "Calendar";
      if (els.bucketDayCard) els.bucketDayCard.style.display = "";
      if (els.bucketMonthCard) els.bucketMonthCard.style.display = "none";
      if (els.bucketViewCard) els.bucketViewCard.style.display = "none";
      renderTicks();
      renderTimeline();
      renderTable();
      renderTotal();
      nowIndicator.update();
      renderBucketDay();
    }
    try {
      if (els.btnBucketBackTop) els.btnBucketBackTop.style.display = state.viewMode === "bucket" ? "" : "none";
    } catch (e) {
    }
    renderDayLabel();
    updateHelpText();
    try {
      renderMobileControls();
    } catch (e) {
    }
    try {
      fitMobileViewport();
    } catch (e) {
    }
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
      if (els.repeatEnabled) els.repeatEnabled.checked = false;
      if (els.repeatFields) els.repeatFields.style.display = "none";
      if (els.applyScopeWrap) els.applyScopeWrap.style.display = "none";
      if (els.repeatFreq) els.repeatFreq.value = "weekly";
      if (els.repeatUntil) els.repeatUntil.value = "";
      if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "none";
    } catch (e) {
    }
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
    try {
      if (els.repeatEnabled) els.repeatEnabled.disabled = false;
      if (els.repeatFreq) els.repeatFreq.disabled = false;
      if (els.repeatUntil) els.repeatUntil.disabled = false;
      if (els.repeatDowWrap) els.repeatDowWrap.style.display = "none";
      if (els.repeatDow) els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => c.checked = false);
      if (els.extendWrap) els.extendWrap.style.display = "none";
    } catch (e) {
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
  function fitMobileViewport() {
    const isMobile = Math.min(window.innerWidth, document.documentElement.clientWidth || window.innerWidth) <= 720;
    if (!isMobile) {
      if (els.track) els.track.style.height = "";
      return;
    }
    if (!els.track) return;
    const headerEl = document.querySelector(".header");
    const topControls = document.getElementById("topControls");
    const mobileControls = els.mobileControls;
    const vh = Math.max(window.innerHeight, document.documentElement.clientHeight || 0);
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
    const topH = topControls && topControls.offsetParent !== null ? topControls.getBoundingClientRect().height : 0;
    const mobileH = mobileControls && mobileControls.offsetParent !== null ? mobileControls.getBoundingClientRect().height : 0;
    const margins = 24;
    const available = Math.max(120, vh - headerH - topH - mobileH - margins);
    const desired = Math.max(96, Math.min(180, Math.floor(available)));
    els.track.style.height = desired + "px";
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
    renderBucketMonth,
    renderBucketView,
    renderMobileControls
  };

  // src/recur.js
  function addDays(d, days) {
    const nd = new Date(d.getTime());
    nd.setDate(nd.getDate() + days);
    return nd;
  }
  function daysInMonth(y, m) {
    return new Date(y, m + 1, 0).getDate();
  }
  function addMonthsClamped(d, months) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const targetM = m + months;
    const targetY = y + Math.floor(targetM / 12);
    const normM = (targetM % 12 + 12) % 12;
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
  function expandDates(startDateStr, rule) {
    const out = [];
    const start = parseDate(startDateStr);
    if (!start) return out;
    const freq = (rule == null ? void 0 : rule.freq) || "weekly";
    const interval = Math.max(1, Math.floor(Number((rule == null ? void 0 : rule.interval) || 1)));
    const until = (rule == null ? void 0 : rule.until) ? parseDate(rule.until) : null;
    const count = (rule == null ? void 0 : rule.count) ? Math.max(1, Math.floor(Number(rule.count))) : null;
    const byWeekday = Array.isArray(rule == null ? void 0 : rule.byWeekday) ? [...new Set(rule.byWeekday.map((n) => (Number(n) % 7 + 7) % 7))].sort((a, b) => a - b) : null;
    let i = 0;
    let cur = new Date(start.getTime());
    const startStr = toDateStr(start);
    if (freq === "weekly" && byWeekday && byWeekday.length) {
      let guard = 0;
      while (true) {
        const curStr = toDateStr(cur);
        const daysSince = Math.floor((cur - start) / 864e5);
        const weekIndex = Math.floor(daysSince / 7);
        const isSelectedDow = byWeekday.includes(cur.getDay());
        const onIntervalWeek = weekIndex % interval === 0;
        if (isSelectedDow && onIntervalWeek) {
          out.push(curStr);
          i++;
          if (count && i >= count) break;
        }
        if (until && curStr >= toDateStr(until)) break;
        cur = addDays(cur, 1);
        guard++;
        if (guard > 2e4 || out.length > 5e3) break;
      }
    } else {
      while (true) {
        const curStr = toDateStr(cur);
        out.push(curStr);
        i++;
        if (count && i >= count) break;
        if (until && curStr >= toDateStr(until)) break;
        if (freq === "daily") cur = addDays(cur, interval);
        else if (freq === "weekly") cur = addDays(cur, 7 * interval);
        else if (freq === "monthly") cur = addMonthsClamped(cur, interval);
        else if (freq === "yearly") cur = addYearsClamped(cur, interval);
        else cur = addDays(cur, 7 * interval);
        if (out.length > 2e3) break;
      }
    }
    return out;
  }

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

  // src/actions/settings.js
  function applyTheme(theme) {
    const t = theme === "light" ? "light" : "neon";
    try {
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("tt.theme", t);
      if (els.themeSelect) els.themeSelect.value = t;
    } catch (e) {
    }
  }
  async function exportData() {
    try {
      const punches = await idb.all();
      const payload = {
        app: "timelinebar",
        kind: "time-tracker-backup",
        version: 1,
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        count: punches.length,
        punches
      };
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `time-tracker-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5e3);
      ui.toast("Exported data");
    } catch (err) {
      console.error(err);
      ui.toast("Export failed");
    }
  }
  function sanitizeItem(x) {
    if (!x || typeof x !== "object") return null;
    const start = Math.max(0, Math.min(1440, Math.floor(Number(x.start)))) || 0;
    const end = Math.max(0, Math.min(1440, Math.floor(Number(x.end)))) || 0;
    if (end <= start) return null;
    const bucket = (x.bucket || x.caseNumber || "").toString().trim();
    const note = (x.note || "").toString();
    const date = (x.date || x.createdAt && String(x.createdAt).slice(0, 10) || todayStr()).toString();
    const okDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
    const createdAt = (x.createdAt || (/* @__PURE__ */ new Date()).toISOString()).toString();
    const st = x.status || null;
    const allowed = /* @__PURE__ */ new Set([null, "default", "green", "green-solid", "yellow", "yellow-solid", "red", "red-solid", "blue", "blue-solid", "purple", "purple-solid"]);
    const status = allowed.has(st) ? st : null;
    const recurrenceId = x.recurrenceId ? String(x.recurrenceId) : null;
    const seq = Number.isFinite(x.seq) ? Math.max(0, Math.floor(Number(x.seq))) : 0;
    const rec = (() => {
      const r = x.recurrence;
      if (!r || typeof r !== "object") return null;
      const f = ["daily", "weekly", "monthly", "yearly"].includes(r.freq) ? r.freq : "weekly";
      const interval = Math.max(1, Math.floor(Number(r.interval || 1)));
      const until = r.until && /^\d{4}-\d{2}-\d{2}$/.test(String(r.until)) ? String(r.until) : null;
      const count = r.count ? Math.max(1, Math.floor(Number(r.count))) : null;
      const out = { freq: f, interval };
      if (until) out.until = until;
      else if (count) out.count = count;
      return out;
    })();
    return {
      start,
      end,
      bucket,
      note,
      date: okDate ? date : todayStr(),
      createdAt,
      status,
      recurrenceId,
      recurrence: rec,
      seq
    };
  }
  async function importDataFromFile(file) {
    try {
      const text = await file.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        ui.toast("Invalid JSON");
        return;
      }
      let items = Array.isArray(data) ? data : Array.isArray(data == null ? void 0 : data.punches) ? data.punches : [];
      if (!Array.isArray(items) || items.length === 0) {
        ui.toast("No punches to import");
        return;
      }
      let added = 0;
      for (const it of items) {
        const clean = sanitizeItem(it);
        if (!clean) continue;
        await idb.add(clean);
        added++;
      }
      state.punches = await idb.all();
      ui.renderAll();
      ui.toast(`Imported ${added} entr${added === 1 ? "y" : "ies"}`);
    } catch (err) {
      console.error(err);
      ui.toast("Import failed");
    }
  }
  async function eraseAll() {
    if (!confirm("Erase ALL tracked data? This cannot be undone.")) return;
    try {
      await idb.clear();
      state.punches = await idb.all();
      ui.renderAll();
      ui.toast("All data erased");
    } catch (err) {
      console.error(err);
      ui.toast("Erase failed");
    }
  }
  function openSettings() {
    if (els.settingsModal) els.settingsModal.style.display = "flex";
  }
  function closeSettings() {
    if (els.settingsModal) els.settingsModal.style.display = "none";
  }
  function attach() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    try {
      const saved = localStorage.getItem("tt.theme") || "neon";
      applyTheme(saved);
    } catch (e) {
    }
    (_a = els.btnSettings) == null ? void 0 : _a.addEventListener("click", openSettings);
    (_b = els.settingsClose) == null ? void 0 : _b.addEventListener("click", closeSettings);
    (_c = els.settingsCancel) == null ? void 0 : _c.addEventListener("click", closeSettings);
    (_d = els.btnExport) == null ? void 0 : _d.addEventListener("click", exportData);
    (_e = els.lblBackup) == null ? void 0 : _e.addEventListener("click", exportData);
    (_f = els.btnImport) == null ? void 0 : _f.addEventListener("click", () => {
      var _a2;
      return (_a2 = els.importFile) == null ? void 0 : _a2.click();
    });
    (_g = els.lblRestore) == null ? void 0 : _g.addEventListener("click", () => {
      var _a2;
      return (_a2 = els.importFile) == null ? void 0 : _a2.click();
    });
    (_h = els.importFile) == null ? void 0 : _h.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) importDataFromFile(file);
      e.target.value = "";
    });
    (_i = els.btnEraseAll) == null ? void 0 : _i.addEventListener("click", eraseAll);
    (_j = els.themeSelect) == null ? void 0 : _j.addEventListener("change", (e) => applyTheme(e.target.value));
  }
  var settingsActions = { attach };

  // src/copy.js
  function currentDay2() {
    return state.currentDate;
  }
  function getDayPunches() {
    const day = currentDay2();
    return [...state.punches].filter((p) => getPunchDate(p) === day).sort((a, b) => a.start - b.start);
  }
  function getView4() {
    const s = Math.max(0, Math.min(24 * 60, Number(state.viewStartMin)));
    const e = Math.max(0, Math.min(24 * 60, Number(state.viewEndMin)));
    const start = Math.min(s, e);
    const end = Math.max(s, e);
    const minutes = Math.max(1, end - start);
    return { start, end, minutes };
  }
  function statusColor(status) {
    const st = status || "default";
    switch (st) {
      case "green":
      case "green-solid":
        return "#00cc66";
      case "yellow":
      case "yellow-solid":
        return "#f5d90a";
      case "red":
      case "red-solid":
        return "#ff4d4f";
      case "blue":
      case "blue-solid":
        return "#0ea5ff";
      case "purple":
      case "purple-solid":
        return "#a259ff";
      default:
        return "#16a34a";
    }
  }
  function drawTimelineCanvas(widthHint = 0, heightHint = 0) {
    var _a;
    const view = getView4();
    const rect = ((_a = els.track) == null ? void 0 : _a.getBoundingClientRect()) || { width: 0, height: 0 };
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
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0b1422";
    ctx.fillRect(0, 0, width, height);
    try {
      const d = parseDate(currentDay2());
      const lab = d ? d.toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "";
      if (lab) {
        ctx.fillStyle = "#c7d2fe";
        ctx.font = "600 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
        ctx.fillText(lab, padLeft, 16);
      }
    } catch (e) {
    }
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "11px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    const firstHour = Math.ceil(view.start / 60);
    const lastHour = Math.floor(view.end / 60);
    for (let h = firstHour; h <= lastHour; h++) {
      const m = h * 60;
      const pct = (m - view.start) / view.minutes;
      const x = chartX + pct * chartW;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, chartY);
      ctx.lineTo(x + 0.5, chartY + chartH);
      ctx.stroke();
      const ampm = h >= 12 ? "pm" : "am";
      const hh = h % 12 === 0 ? 12 : h % 12;
      const label = `${hh}${ampm}`;
      const tw = ctx.measureText(label).width;
      ctx.fillText(label, Math.max(chartX, Math.min(x - tw / 2, chartX + chartW - tw)), chartY + chartH + 14);
    }
    ctx.restore();
    const punches = getDayPunches();
    for (const p of punches) {
      const startClamped = Math.max(p.start, view.start);
      const endClamped = Math.min(p.end, view.end);
      if (endClamped <= startClamped) continue;
      const left = chartX + (startClamped - view.start) / view.minutes * chartW;
      const w = (endClamped - startClamped) / view.minutes * chartW;
      const h = Math.max(10, Math.min(28, Math.floor(chartH * 0.7)));
      const y = chartY + (chartH - h) / 2;
      ctx.fillStyle = statusColor(p.status);
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1;
      const r = 8;
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
      const label = (p.bucket || "").trim();
      if (label) {
        ctx.save();
        ctx.font = "600 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
        ctx.fillStyle = "#0b1422";
        const tw = ctx.measureText(label).width;
        if (tw + 12 < w) ctx.fillText(label, left + 6, y + h / 2 + 4);
        ctx.restore();
      }
    }
    return canvas;
  }
  function generateTsv() {
    const rows = getDayPunches();
    const header = ["Start", "Stop", "Duration", "Bucket", "Note"];
    const lines = [header.join("	")];
    for (const p of rows) {
      const dur = Math.max(0, (p.end || 0) - (p.start || 0));
      const cells = [
        time.toLabel(p.start),
        time.toLabel(p.end),
        time.durationLabel(dur),
        (p.bucket || "").replace(/[\t\n]/g, " "),
        (p.note || "").replace(/[\t\n]/g, " ")
      ];
      lines.push(cells.join("	"));
    }
    return lines.join("\n");
  }
  function generateHtmlTable() {
    const rows = getDayPunches();
    const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
    const th = "<tr><th>Start</th><th>Stop</th><th>Duration</th><th>Bucket</th><th>Note</th></tr>";
    const trs = rows.map((p) => {
      const dur = Math.max(0, (p.end || 0) - (p.start || 0));
      return `<tr><td>${esc(time.toLabel(p.start))}</td><td>${esc(time.toLabel(p.end))}</td><td>${esc(time.durationLabel(dur))}</td><td>${esc(p.bucket || "")}</td><td>${esc(p.note || "")}</td></tr>`;
    });
    return `<table>${th}${trs.join("")}</table>`;
  }
  async function writeClipboard({ includeImage = true } = {}) {
    const tsv = generateTsv();
    const html = generateHtmlTable();
    const types = {};
    try {
      types["text/plain"] = new Blob([tsv], { type: "text/plain" });
    } catch (e) {
    }
    try {
      types["text/html"] = new Blob([html], { type: "text/html" });
    } catch (e) {
    }
    let canvas;
    if (includeImage) {
      try {
        canvas = drawTimelineCanvas();
      } catch (e) {
      }
    }
    if (canvas && navigator.clipboard && window.ClipboardItem) {
      const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (pngBlob) types["image/png"] = pngBlob;
    }
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        const item = new window.ClipboardItem(types);
        await navigator.clipboard.write([item]);
        return "rich";
      } catch (e) {
      }
    }
    try {
      await navigator.clipboard.writeText(tsv);
      return "text";
    } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = tsv;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        ta.style.pointerEvents = "none";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand && document.execCommand("copy");
        document.body.removeChild(ta);
        return ok ? "text" : "fail";
      } catch (e2) {
        return "fail";
      }
    }
  }
  async function copyChart() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const rows = getDayPunches();
    if (!rows.length) {
      (_b = (_a = ui).toast) == null ? void 0 : _b.call(_a, "Nothing to copy");
      return;
    }
    const mode = await writeClipboard({ includeImage: true });
    if (mode === "rich") (_d = (_c = ui).toast) == null ? void 0 : _d.call(_c, "Copied chart + table to clipboard");
    else if (mode === "text") (_f = (_e = ui).toast) == null ? void 0 : _f.call(_e, "Copied table (TSV) to clipboard");
    else (_h = (_g = ui).toast) == null ? void 0 : _h.call(_g, "Copy failed");
  }
  var copyActions = { copyChart };

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
  function genRecurrenceId() {
    return "r" + Math.random().toString(36).slice(2, 10);
  }
  function readRecurrenceFromUI() {
    var _a, _b, _c, _d;
    const enabled = !!((_a = els.repeatEnabled) == null ? void 0 : _a.checked);
    if (!enabled) return null;
    const freq = ((_b = els.repeatFreq) == null ? void 0 : _b.value) || "weekly";
    const until = String(((_c = els.repeatUntil) == null ? void 0 : _c.value) || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return null;
    const base = { freq, interval: 1, until };
    if (freq === "weekly") {
      const days = Array.from(((_d = els.repeatDow) == null ? void 0 : _d.querySelectorAll('input[type="checkbox"]')) || []).filter((c) => c.checked).map((c) => Number(c.value));
      if (days.length) base.byWeekday = days;
    }
    return base;
  }
  function overlapsOnDate(dateStr, start, end, excludeId = null) {
    return state.punches.some(
      (p) => p.id !== excludeId && getPunchDate(p) === dateStr && start < p.end && end > p.start
    );
  }
  async function splitPunchAtClick(e, punchEl) {
    var _a, _b;
    try {
      const id = Number((_a = punchEl == null ? void 0 : punchEl.dataset) == null ? void 0 : _a.id);
      if (!id) return;
      const p = state.punches.find((x) => x.id === id);
      if (!p) return;
      const clientX = e.touches ? (_b = e.touches[0]) == null ? void 0 : _b.clientX : e.clientX;
      const rawMin = pxToMinutes(clientX);
      const lower = Math.floor(rawMin / SNAP_MIN) * SNAP_MIN;
      const upper = Math.ceil(rawMin / SNAP_MIN) * SNAP_MIN;
      const candidates = [];
      if (lower > p.start && lower < p.end) candidates.push(lower);
      if (upper !== lower && upper > p.start && upper < p.end) candidates.push(upper);
      if (!candidates.length) {
        ui.toast("Block too short to split at 15m");
        return;
      }
      const chosen = candidates.length === 1 ? candidates[0] : Math.abs(candidates[0] - rawMin) <= Math.abs(candidates[1] - rawMin) ? candidates[0] : candidates[1];
      const base = { bucket: p.bucket, note: p.note, status: p.status || null, date: p.date || getPunchDate(p) };
      const left = { ...base, start: p.start, end: chosen, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
      const right = { ...base, start: chosen, end: p.end, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
      await idb.remove(p.id);
      await idb.add(left);
      await idb.add(right);
      state.punches = await idb.all();
      ui.renderAll();
      ui.toast(`Split at ${time.toLabel(chosen)}`);
    } catch (err) {
      try {
        console.error("splitPunchAtClick error", err);
      } catch (e2) {
      }
    }
  }
  var saveNewFromModal = async (e) => {
    var _a, _b;
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
        var _a2;
        const val = ((_a2 = els.modalStatusBtn) == null ? void 0 : _a2.dataset.value) || "default";
        return val === "default" ? null : val;
      })()
    };
    const rec = readRecurrenceFromUI();
    if (((_a = els.repeatEnabled) == null ? void 0 : _a.checked) && !rec) {
      ui.toast("Pick an end date for the series");
      return;
    }
    if (state.editingId) {
      const idx = state.punches.findIndex((p) => p.id === state.editingId);
      if (idx === -1) {
        ui.toast("Could not find item to update.");
        ui.closeModal();
        return;
      }
      const prev = state.punches[idx];
      const updated = { ...prev, ...payload };
      const applyToSeries = !!((_b = els.applyScopeSeries) == null ? void 0 : _b.checked) && !!prev.recurrenceId;
      if (applyToSeries) {
        const deltaStart = updated.start - prev.start;
        const deltaEnd = updated.end - prev.end;
        const targetId = prev.recurrenceId;
        const toUpdate = state.punches.filter((p) => p.recurrenceId === targetId);
        for (const p of toUpdate) {
          const newStart = p.start + deltaStart;
          const newEnd = p.end + deltaEnd;
          if (overlapsOnDate(p.date || getPunchDate(p), newStart, newEnd, p.id)) {
            ui.toast("Change would overlap another block in the series.");
            return;
          }
        }
        for (const p of toUpdate) {
          const upd = { ...p, start: p.start + deltaStart, end: p.end + deltaEnd, bucket: updated.bucket, note: updated.note, status: updated.status };
          await idb.put(upd);
        }
      } else {
        if (overlapsOnDate(updated.date, updated.start, updated.end, updated.id)) {
          ui.toast("That range overlaps another block.");
          return;
        }
        if (!prev.recurrenceId && rec) {
          const recurrenceId = genRecurrenceId();
          const dates = expandDates(updated.date, rec);
          let seq = 0;
          for (const d of dates) {
            const start = updated.start;
            const end = updated.end;
            if (overlapsOnDate(d, start, end, prev.id)) continue;
            const base = { start, end, bucket: updated.bucket, note: updated.note, status: updated.status, date: d, recurrenceId, recurrence: rec, seq };
            if (d === prev.date) {
              await idb.put({ ...prev, ...base });
            } else {
              await idb.add({ ...base, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
            }
            seq++;
          }
        } else {
          state.punches[idx] = updated;
          await idb.put(updated);
        }
      }
    } else {
      if (rec) {
        const recurrenceId = genRecurrenceId();
        const dates = expandDates(payload.date, rec);
        let added = 0;
        let skipped = 0;
        let seq = 0;
        for (const d of dates) {
          if (overlapsOnDate(d, payload.start, payload.end)) {
            skipped++;
            continue;
          }
          const item = { ...payload, date: d, recurrenceId, recurrence: rec, seq, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
          await idb.add(item);
          added++;
          seq++;
        }
        if (skipped) ui.toast(`Created ${added}, skipped ${skipped} overlapping`);
      } else {
        if (overlapsOnDate(payload.date, payload.start, payload.end)) {
          ui.toast("That range overlaps another block.");
          return;
        }
        const toAdd = { ...payload, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
        await idb.add(toAdd);
      }
    }
    state.punches = await idb.all();
    state.editingId = null;
    ui.closeModal();
    ui.renderAll();
  };
  var closeModal2 = () => ui.closeModal();
  var attachEvents = () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A;
    dragActions.attach();
    resizeActions.attach();
    calendarActions.attach();
    settingsActions.attach();
    els.rows.addEventListener("click", async (e) => {
      var _a2, _b2;
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
        const force = !!e.shiftKey;
        if (!force && !confirm("Delete this time entry?")) return;
        await idb.remove(id);
        state.punches = await idb.all();
        ui.renderAll();
        ui.toast("Deleted");
        return;
      }
      const noteCell = e.target.closest("td.note");
      if (noteCell) {
        const tr = noteCell.closest("tr[data-id]");
        const id = Number(tr == null ? void 0 : tr.dataset.id);
        if (id) {
          (_b2 = (_a2 = ui).toggleNotePopover) == null ? void 0 : _b2.call(_a2, id, noteCell);
          e.stopPropagation();
          return;
        }
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
          const hasRec = !!p.recurrenceId;
          if (els.repeatEnabled) els.repeatEnabled.checked = hasRec;
          if (els.repeatFields) els.repeatFields.style.display = hasRec ? "" : "none";
          if (hasRec && p.recurrence) {
            if (els.repeatFreq) els.repeatFreq.value = p.recurrence.freq || "weekly";
            if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "";
            if (els.repeatUntil) els.repeatUntil.value = p.recurrence.until || "";
            const showDow = (p.recurrence.freq || "weekly") === "weekly";
            if (els.repeatDowWrap) els.repeatDowWrap.style.display = showDow ? "" : "none";
            if (showDow && els.repeatDow) {
              const set = new Set(Array.isArray(p.recurrence.byWeekday) ? p.recurrence.byWeekday.map(Number) : []);
              const wd = new Date(p.date).getDay();
              els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => {
                c.checked = set.size ? set.has(Number(c.value)) : Number(c.value) === wd;
              });
            }
          } else {
            if (els.repeatUntil) els.repeatUntil.value = "";
            if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "none";
            if (els.repeatDowWrap) els.repeatDowWrap.style.display = "none";
          }
          if (els.applyScopeWrap) els.applyScopeWrap.style.display = hasRec ? "" : "none";
          if (els.repeatEnabled) els.repeatEnabled.disabled = hasRec;
          if (els.repeatFreq) els.repeatFreq.disabled = hasRec;
          if (els.repeatUntil) els.repeatUntil.disabled = hasRec;
          if (els.repeatDow) els.repeatDow.querySelectorAll("input").forEach((c) => c.disabled = hasRec);
          if (els.applyScopeSeries) els.applyScopeSeries.checked = true;
          if (els.applyScopeOne) els.applyScopeOne.checked = !els.applyScopeSeries.checked;
          if (els.extendWrap) els.extendWrap.style.display = hasRec ? "" : "none";
        } catch (e2) {
        }
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
      if (e.shiftKey) {
        const handle = e.target.closest(".handle");
        const ctrl = e.target.closest(".control-btn");
        const punchEl = e.target.closest(".punch");
        if (!handle && !ctrl && punchEl) {
          await splitPunchAtClick(e, punchEl);
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
          e.stopPropagation();
          return;
        }
      }
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
        try {
          const hasRec = !!p.recurrenceId;
          if (els.repeatEnabled) els.repeatEnabled.checked = hasRec;
          if (els.repeatFields) els.repeatFields.style.display = hasRec ? "" : "none";
          if (hasRec && p.recurrence) {
            if (els.repeatFreq) els.repeatFreq.value = p.recurrence.freq || "weekly";
            if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "";
            if (els.repeatUntil) els.repeatUntil.value = p.recurrence.until || "";
            const showDow = (p.recurrence.freq || "weekly") === "weekly";
            if (els.repeatDowWrap) els.repeatDowWrap.style.display = showDow ? "" : "none";
            if (showDow && els.repeatDow) {
              const set = new Set(Array.isArray(p.recurrence.byWeekday) ? p.recurrence.byWeekday.map(Number) : []);
              const wd = new Date(p.date).getDay();
              els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => {
                c.checked = set.size ? set.has(Number(c.value)) : Number(c.value) === wd;
              });
            }
          } else {
            if (els.repeatUntil) els.repeatUntil.value = "";
            if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "none";
            if (els.repeatDowWrap) els.repeatDowWrap.style.display = "none";
          }
          if (els.applyScopeWrap) els.applyScopeWrap.style.display = hasRec ? "" : "none";
          if (els.repeatEnabled) els.repeatEnabled.disabled = hasRec;
          if (els.repeatFreq) els.repeatFreq.disabled = hasRec;
          if (els.repeatUntil) els.repeatUntil.disabled = hasRec;
          if (els.repeatDow) els.repeatDow.querySelectorAll("input").forEach((c) => c.disabled = hasRec);
          if (els.applyScopeSeries) els.applyScopeSeries.checked = true;
          if (els.extendWrap) els.extendWrap.style.display = hasRec ? "" : "none";
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
        try {
          const hasRec = !!p.recurrenceId;
          if (els.repeatEnabled) els.repeatEnabled.checked = hasRec;
          if (els.repeatFields) els.repeatFields.style.display = hasRec ? "" : "none";
          if (hasRec && p.recurrence) {
            if (els.repeatFreq) els.repeatFreq.value = p.recurrence.freq || "weekly";
            if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "";
            if (els.repeatUntil) els.repeatUntil.value = p.recurrence.until || "";
            const showDow = (p.recurrence.freq || "weekly") === "weekly";
            if (els.repeatDowWrap) els.repeatDowWrap.style.display = showDow ? "" : "none";
            if (showDow && els.repeatDow) {
              const set = new Set(Array.isArray(p.recurrence.byWeekday) ? p.recurrence.byWeekday.map(Number) : []);
              const wd = new Date(p.date).getDay();
              els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => {
                c.checked = set.size ? set.has(Number(c.value)) : Number(c.value) === wd;
              });
            }
          } else {
            if (els.repeatUntil) els.repeatUntil.value = "";
            if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "none";
            if (els.repeatDowWrap) els.repeatDowWrap.style.display = "none";
          }
          if (els.applyScopeWrap) els.applyScopeWrap.style.display = hasRec ? "" : "none";
          if (els.repeatEnabled) els.repeatEnabled.disabled = hasRec;
          if (els.repeatFreq) els.repeatFreq.disabled = hasRec;
          if (els.repeatUntil) els.repeatUntil.disabled = hasRec;
          if (els.repeatDow) els.repeatDow.querySelectorAll("input").forEach((c) => c.disabled = hasRec);
          if (els.applyScopeSeries) els.applyScopeSeries.checked = true;
          if (els.extendWrap) els.extendWrap.style.display = hasRec ? "" : "none";
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
      const delBtn = e.target.closest(".control-btn.delete");
      if (delBtn) {
        const id = Number(delBtn.dataset.id);
        const force = !!e.shiftKey;
        if (!force && !confirm("Delete this time entry?")) return;
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
        const force = !!e.shiftKey;
        if (!force && !confirm("Delete this time entry?")) return;
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
    (_a = els.repeatEnabled) == null ? void 0 : _a.addEventListener("change", () => {
      var _a2;
      const on = !!els.repeatEnabled.checked;
      if (els.repeatFields) els.repeatFields.style.display = on ? "" : "none";
      if (!on) return;
      if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "";
      const isWeekly = (((_a2 = els.repeatFreq) == null ? void 0 : _a2.value) || "weekly") === "weekly";
      if (els.repeatDowWrap) els.repeatDowWrap.style.display = isWeekly ? "" : "none";
    });
    (_b = els.repeatFreq) == null ? void 0 : _b.addEventListener("change", () => {
      var _a2;
      const val = els.repeatFreq.value;
      if (els.repeatDowWrap) els.repeatDowWrap.style.display = val === "weekly" && ((_a2 = els.repeatEnabled) == null ? void 0 : _a2.checked) ? "" : "none";
    });
    (_c = els.btnDowWeekdays) == null ? void 0 : _c.addEventListener("click", () => {
      if (!els.repeatDow) return;
      const set = /* @__PURE__ */ new Set([1, 2, 3, 4, 5]);
      els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => c.checked = set.has(Number(c.value)));
    });
    (_d = els.btnDowAll) == null ? void 0 : _d.addEventListener("click", () => {
      if (!els.repeatDow) return;
      els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => c.checked = true);
    });
    (_e = els.modalDelete) == null ? void 0 : _e.addEventListener("click", async (e) => {
      var _a2;
      if (!state.editingId) return;
      const p = state.punches.find((x) => x.id === state.editingId);
      if (!p) return;
      const applySeries = !!((_a2 = els.applyScopeSeries) == null ? void 0 : _a2.checked) && !!p.recurrenceId;
      const force = !!e.shiftKey;
      if (applySeries) {
        if (!force && !confirm("Delete the entire series?")) return;
        const items = state.punches.filter((x) => x.recurrenceId === p.recurrenceId);
        for (const it of items) await idb.remove(it.id);
      } else {
        if (!force && !confirm("Delete this time entry?")) return;
        await idb.remove(state.editingId);
      }
      state.punches = await idb.all();
      state.editingId = null;
      ui.closeModal();
      ui.renderAll();
      ui.toast("Deleted");
    });
    (_f = els.btnExtendSeries) == null ? void 0 : _f.addEventListener("click", async () => {
      var _a2;
      if (!state.editingId) return;
      const p = state.punches.find((x) => x.id === state.editingId);
      if (!(p == null ? void 0 : p.recurrenceId) || !p.recurrence) return;
      const items = state.punches.filter((x) => x.recurrenceId === p.recurrenceId);
      if (!items.length) return;
      const last = items.reduce((a, b) => String(a.date) > String(b.date) ? a : b);
      const startExt = (() => {
        const d = new Date(last.date);
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
      })();
      const untilStr = String(((_a2 = els.extendUntil) == null ? void 0 : _a2.value) || "");
      const rule = { ...p.recurrence };
      if (untilStr) {
        rule.until = untilStr;
        delete rule.count;
      } else {
        ui.toast("Pick an extend-until date");
        return;
      }
      const dates = expandDates(startExt, rule);
      let seq = items.reduce((m, it) => Math.max(m, Number(it.seq) || 0), 0) + 1;
      let added = 0;
      for (const d of dates) {
        if (state.punches.some((x) => x.recurrenceId === p.recurrenceId && x.date === d)) continue;
        if (overlapsOnDate(d, p.start, p.end)) continue;
        await idb.add({ start: p.start, end: p.end, bucket: p.bucket, note: p.note, status: p.status || null, date: d, recurrenceId: p.recurrenceId, recurrence: p.recurrence, seq, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
        seq++;
        added++;
      }
      state.punches = await idb.all();
      ui.renderAll();
      ui.toast(added ? `Added ${added} more` : "No new dates to add");
    });
    (_g = els.modalStatusBtn) == null ? void 0 : _g.addEventListener("click", () => {
      var _a2;
      (_a2 = els.modalStatusWrap) == null ? void 0 : _a2.classList.toggle("open");
    });
    (_h = els.modalStatusMenu) == null ? void 0 : _h.addEventListener("click", (e) => {
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
      if (e.key === "Escape") {
        let modalOpen = false;
        try {
          modalOpen = !!(els.modal && getComputedStyle(els.modal).display !== "none");
        } catch (e2) {
        }
        if (modalOpen) {
          closeModal2();
          return;
        }
        if (state.viewMode === "bucket") {
          state.viewMode = state.lastViewMode || "day";
          ui.renderAll();
          return;
        }
      }
    });
    window.addEventListener("resize", () => ui.renderAll());
    window.addEventListener("click", (e) => {
      var _a2, _b2, _c2;
      if (!e.target.closest(".status-wrap")) {
        els.rows.querySelectorAll(".status-wrap.open").forEach((w) => w.classList.remove("open"));
        (_a2 = els.modalStatusWrap) == null ? void 0 : _a2.classList.remove("open");
      }
      if (!e.target.closest(".note-popover") && !e.target.closest(".note-dot") && !e.target.closest("td.note")) {
        (_c2 = (_b2 = ui).hideNotePopover) == null ? void 0 : _c2.call(_b2);
      }
    });
    (_i = els.bucketDayBody) == null ? void 0 : _i.addEventListener("click", (e) => {
      var _a2, _b2;
      const link = e.target.closest(".bucket-link");
      if (!link) return;
      e.preventDefault();
      const tr = link.closest("tr");
      const name = String((_b2 = (_a2 = tr == null ? void 0 : tr.dataset) == null ? void 0 : _a2.bucket) != null ? _b2 : "");
      state.lastViewMode = state.viewMode;
      state.bucketFilter = name;
      state.viewMode = "bucket";
      ui.renderAll();
    });
    (_j = els.bucketMonthBody) == null ? void 0 : _j.addEventListener("click", (e) => {
      var _a2, _b2;
      const link = e.target.closest(".bucket-link");
      if (!link) return;
      e.preventDefault();
      const tr = link.closest("tr");
      const name = String((_b2 = (_a2 = tr == null ? void 0 : tr.dataset) == null ? void 0 : _a2.bucket) != null ? _b2 : "");
      state.lastViewMode = state.viewMode;
      state.bucketFilter = name;
      state.viewMode = "bucket";
      ui.renderAll();
    });
    (_k = els.btnBucketBack) == null ? void 0 : _k.addEventListener("click", () => {
      state.viewMode = "calendar";
      ui.renderAll();
    });
    (_l = els.btnBucketBackTop) == null ? void 0 : _l.addEventListener("click", () => {
      state.viewMode = "calendar";
      ui.renderAll();
    });
    (_m = els.btnBucketDelete) == null ? void 0 : _m.addEventListener("click", async () => {
      const name = String(state.bucketFilter || "");
      const label = name || "(no bucket)";
      const items = state.punches.filter((p) => String(p.bucket || "").trim() === name);
      if (!items.length) {
        ui.toast("No entries for this bucket.");
        return;
      }
      if (!confirm(`Delete all ${items.length} entries for bucket "${label}"?`)) return;
      for (const p of items) {
        await idb.remove(p.id);
      }
      state.punches = await idb.all();
      state.viewMode = state.lastViewMode || "day";
      ui.renderAll();
      ui.toast("Bucket deleted");
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
    const totalMin = 24 * 60;
    const minSpan = 45;
    const getSpan = () => Math.max(1, Math.abs((state.viewEndMin | 0) - (state.viewStartMin | 0)));
    const getStart = () => Math.min(state.viewStartMin | 0, state.viewEndMin | 0);
    const clampStartForSpan = (start, span) => Math.max(0, Math.min(totalMin - span, start));
    const minutesFromScrollbar = (clientX) => {
      const rect = els.mobileScrollbar.getBoundingClientRect();
      const x = Math.min(Math.max(0, clientX - rect.left), Math.max(1, rect.width));
      return Math.round(x / Math.max(1, rect.width) * totalMin);
    };
    const onScrollbarDown = (e) => {
      if (!els.mobileScrollbar) return;
      if (e.target === els.mobileWindow || e.target.closest("#mobileWindow")) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const span = getSpan();
      const m = minutesFromScrollbar(clientX);
      let start = clampStartForSpan(Math.round(m - span / 2), span);
      setView(start, start + span);
      if (e.cancelable) e.preventDefault();
    };
    let dragWin = null;
    const onWindowDown = (e) => {
      if (!els.mobileScrollbar || !els.mobileWindow) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = els.mobileScrollbar.getBoundingClientRect();
      const span = getSpan();
      const start = getStart();
      const leftPx = start / totalMin * rect.width;
      const x = clientX - rect.left;
      dragWin = { offsetPx: x - leftPx, rectW: Math.max(1, rect.width), span };
      window.addEventListener("mousemove", onWindowMove);
      window.addEventListener("touchmove", onWindowMove, { passive: false });
      window.addEventListener("mouseup", onWindowUp);
      window.addEventListener("touchend", onWindowUp);
      if (e.cancelable) e.preventDefault();
    };
    const onWindowMove = (e) => {
      if (!dragWin || !els.mobileScrollbar) return;
      if (e.cancelable) e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = els.mobileScrollbar.getBoundingClientRect();
      let startPx = clientX - rect.left - dragWin.offsetPx;
      const maxStartPx = rect.width - dragWin.span / totalMin * rect.width;
      startPx = Math.max(0, Math.min(maxStartPx, startPx));
      const startMin = Math.round(startPx / Math.max(1, rect.width) * totalMin);
      setView(startMin, startMin + dragWin.span);
    };
    const onWindowUp = () => {
      dragWin = null;
      window.removeEventListener("mousemove", onWindowMove);
      window.removeEventListener("touchmove", onWindowMove);
      window.removeEventListener("mouseup", onWindowUp);
      window.removeEventListener("touchend", onWindowUp);
    };
    (_n = els.mobileScrollbar) == null ? void 0 : _n.addEventListener("mousedown", onScrollbarDown);
    (_o = els.mobileScrollbar) == null ? void 0 : _o.addEventListener("touchstart", onScrollbarDown, { passive: false });
    (_p = els.mobileWindow) == null ? void 0 : _p.addEventListener("mousedown", onWindowDown);
    (_q = els.mobileWindow) == null ? void 0 : _q.addEventListener("touchstart", onWindowDown, { passive: false });
    const zoomBy = (factor) => {
      const span = getSpan();
      const center = getStart() + span / 2;
      const newSpan = Math.min(totalMin, Math.max(minSpan, Math.round(span * factor)));
      let newStart = Math.round(center - newSpan / 2);
      newStart = clampStartForSpan(newStart, newSpan);
      setView(newStart, newStart + newSpan);
    };
    (_r = els.mobileZoomIn) == null ? void 0 : _r.addEventListener("click", () => zoomBy(0.8));
    (_s = els.mobileZoomOut) == null ? void 0 : _s.addEventListener("click", () => zoomBy(1.25));
    (_t = els.mobileZoomRange) == null ? void 0 : _t.addEventListener("input", (e) => {
      const val = Math.max(minSpan, Math.min(totalMin, Math.round(Number(e.target.value) || getSpan())));
      const center = getStart() + getSpan() / 2;
      let newStart = Math.round(center - val / 2);
      newStart = clampStartForSpan(newStart, val);
      setView(newStart, newStart + val);
    });
    (_u = els.view24) == null ? void 0 : _u.addEventListener("click", () => setView(0, 24 * 60));
    (_v = els.viewDefault) == null ? void 0 : _v.addEventListener("click", () => setView(6 * 60, 18 * 60));
    const doCopy = async () => {
      try {
        await copyActions.copyChart();
      } catch (e) {
      }
    };
    (_w = els.btnCopyChart) == null ? void 0 : _w.addEventListener("click", doCopy);
    (_x = els.btnCopyChartTop) == null ? void 0 : _x.addEventListener("click", doCopy);
    (_y = els.btnCopyChartTable) == null ? void 0 : _y.addEventListener("click", doCopy);
    els.track.addEventListener("click", (e) => {
      var _a2, _b2, _c2, _d2;
      if (e.shiftKey) {
        return;
      }
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
    (_z = els.noteField) == null ? void 0 : _z.addEventListener("input", () => {
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
    (_A = els.notePreviewToggle) == null ? void 0 : _A.addEventListener("click", (e) => {
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
      window.DEBUG_HANDLES = false;
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
