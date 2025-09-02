TimelineBar — Time Tracker (Single‑File App)

A fast, local‑first timeline time tracker. Drag to create time blocks on a daily timeline, resize or move them with snapping, color‑code status, and see a table summary with totals. Everything saves in your browser via IndexedDB—no server required.

**Quick Start**
- Clone the repo:
  - `git clone https://github.com/jasondotsetHacked/timelinebar.git && cd timelinebar`
- Open `dist/index.html` directly in your browser (double-click).
- No server or Node.js required to try the app.

**No-Server Build (open file://)**
- Prerequisites: Node.js 16+.
- Build a static bundle: `npm install && npm run build`.
- Open `dist/index.html` directly in your browser (double-click). No `http-server` needed.

Notes:
- The build bundles ES modules into `dist/app.bundle.js` (IIFE), so browsers load it over `file://`.
- `styles.css` is copied to `dist/`. Everything else is self-contained.
- If you want a single self-contained HTML (inline JS/CSS), I can add that option.

**Core Concepts**
- Single-day timeline from 12:00am–11:59pm (adjustable viewport).
- Time blocks snap to 15-minute increments and cannot overlap.
- Local persistence in the browser (IndexedDB). Data is private to your machine.

**How To Use**
- Create: Click–drag anywhere on the timeline to select a range, then fill in Case # and Note.
- Edit: Click the block label or the Edit button in the block or table row.
- Resize: Drag a block’s left/right edge handles. Snaps to 15 minutes and respects neighbors.
- Move: Drag the middle of a block to shift it; it will not overlap other blocks.
- Delete: Use the Delete action on the block or its table row.
- Status colors: In the table, click the small swatch to choose: default, green, yellow, red.
- Zoom: Scroll over the timeline to zoom around the pointer.
- Pan: Shift+Scroll (or horizontal wheel) to pan the view left/right.
- View presets: Use `6–6` for 6am–6pm, or `24h` for the full day.
- Totals: The running total of all blocks shows at the right of the help row.

Keyboard tips:
- Escape: Closes the modal.
- Resize handles are focusable for accessibility, but resizing itself is mouse/touch driven.

**Data & Privacy**
- Storage: IndexedDB database `timeTrackerDB`, store `punches`.
- Fields: start (min), end (min), caseNumber, note, optional status, createdAt.
- Clear data: Clear site data in your browser (Application/Storage tools) to reset.

**Tech Stack**
- Vanilla ES Modules (`app.js` + `src/*`), no build step needed.
- CSS only, no external UI frameworks.
- IndexedDB for persistence.

**File Map**
- `index.html`: Markup, timeline/table structure, modal, and script entry.
- `styles.css`: Visual styling for the app, timeline, table, modal, and popovers.
- `app.js`: App bootstrap; loads data and renders UI.
- `src/actions.js`: User interactions: create/resize/move blocks, edit/delete, zoom/pan, status menu.
- `src/ui.js`: Rendering timeline blocks, tick labels, ghost selection, tips, popover labels, totals, table.
- `src/state.js`: In‑memory state (punches, interactions, viewport).
- `src/storage.js`: IndexedDB CRUD for `punches`.
- `src/time.js`: Time utilities (formatting, snapping, clamping).
- `src/dom.js`: Element references.

**Notes & Limits**
- Overlap prevention: Blocks cannot overlap; adjustments show a toast when invalid.
- Minimum zoom span: ~45 minutes; maximum is 24 hours.
- Single‑day scope: There’s no multi‑day navigation; entries live on a single daily timeline.
- Debug handles: A console flag `window.DEBUG_HANDLES` is true by default for handle visuals; set to `false` in DevTools to disable.

**License**
TBD.
