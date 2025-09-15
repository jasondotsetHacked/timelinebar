TimelineBar — Time Tracker (Guide)

Live App: https://jasondotsethacked.github.io/timelinebar/

A fast, local‑first timeline time tracker. Drag to create time blocks on a daily timeline, resize or move them with 15‑minute snapping, add notes and status colors, and see clear day and month summaries. Your data stays in your browser (IndexedDB) — no account or backend.

Highlights
- Drag to create: Click‑drag on the timeline to add a new block.
- Snap + no overlaps: Blocks snap to 15 minutes and won’t overlap.
- Zoom + pan: Scroll to zoom around your pointer; Shift+Scroll to pan.
- Rich notes: Markdown preview and a rich‑text editor for punch and bucket notes.
- Status colors: Quick visual tags (default, green, yellow, red, blue, purple; solid or tinted).
- Calendar views: Month view with day activity hints; months/years pickers for fast jumps.
- Buckets: Day and month bucket reports; drill into a single bucket’s history.
- Schedules: Track separate schedules and switch or group them with saved “Schedule Views.”
- Copy to clipboard: One click copies a chart image + table (or TSV text fallback).
- Privacy by default: Everything is stored locally; import/export JSON for backups.

Using the App
1) Choose a day
- Click “Calendar” to open the month. Click any day to go to its timeline.
- The header shows tips for the current view. Click the “Day:” label to open the calendar, too.

2) Create a time block
- Drag across the timeline to select a range. The New Time Block modal opens.
- Fill Bucket (e.g., task or case number). Optionally add a Note and pick a Status color.
- Pick or type a Schedule name to assign it; typing a new name creates a schedule.
- Optional recurrence: Enable “Repeat” to create a series (daily/weekly/monthly/yearly). For weekly, choose days (Mon–Sun). Set “End on date.”
- Save to add the block (or series). The app prevents overlaps.

3) Edit or adjust
- Edit: Click a block label, the ✎ icon on a block, or an “Edit” button in the table.
- Move: Drag the middle of a block. Dragging a selected range of overlapping blocks moves them together.
- Resize: Drag the left/right handles; the app snaps and avoids overlaps.
- Split: Shift+Click inside a block to split it at the nearest 15‑minute boundary.
- Delete: Use the Delete action in the modal or table. For series, choose “Only this” or “Entire series.”

4) Zoom, pan, and presets
- Scroll to zoom around your cursor. Shift+Scroll (or horizontal wheel) to pan left/right.
- Presets: Use the 6–6 button for 6am–6pm, or 24h for the full day.
- Mobile: Use the zoom buttons and draggable scrollbar under the timeline.

5) Notes, copying, and totals
- Notes: Click a block’s note dot or open the Note modal to view/edit with rich text. Notes support Markdown with safe HTML rendering.
- Copy: Use the ⧉ Copy buttons (top, help row, or table header) to copy a chart image + table to your clipboard. If images aren’t supported, TSV text is copied instead.
- Totals: The day total appears in the help row; tables show durations per entry.

Buckets
- Buckets are your labels (e.g., client, case, project). The app shows:
  - Bucket Report (Day): totals for the current day.
  - Bucket Report (Month): totals for the selected month in the calendar.
- Click a bucket name to open Bucket View: a focused history with date/start/stop/duration and notes. Use “Back to Calendar” to return. “Delete Bucket” removes all entries for that bucket in the current schedule.
- Persistent bucket notes: In the edit modal or note modal, use the “Bucket Note (persistent)” editor to keep a note for a bucket across entries.

Schedules and Views
- Schedules: Use the Schedule selector (top‑left) to organize entries (e.g., Work, Personal). Add, Rename, or Delete schedules.
- Schedule chips: Each block shows its schedule; click the chip to jump to that schedule.
- Saved Views: In Settings → “Schedule Views,” group multiple schedules under a named view, then select it to filter the whole UI by those schedules.

Keyboard and Mouse Tips
- Escape: Closes open modals. When no modal is open, returns to Calendar.
- Shift+Scroll: Pan the timeline horizontally.
- Shift+Click: Split a block at the nearest 15‑minute point.
- Table copy: Click start/stop/duration/bucket cells to copy their value.

Settings and Data
- Theme: Switch between Neon (default) and Light.
- Backup/Restore: Export all data to JSON; import a JSON backup to merge. Schedules and saved views are imported; duplicates are skipped.
- Erase All: Wipes the app’s local database and settings. This is permanent.
- Storage: Data is kept in your browser’s IndexedDB under `timeTrackerDB` (punches, buckets, schedules, scheduleViews).

Privacy
- No sign‑in or server. All data stays on your device unless you export it.
- Clearing site data in your browser will remove your entries and settings.

Run Locally (optional)
- Visit the live app above for quickest start.
- To run locally as a static page:
  - Requirements: Node.js 16+
  - Install/build: `npm install && npm run build`
  - Open `dist/index.html` in your browser (double‑click). No server needed.

Credits
- Built with vanilla JS/CSS and IndexedDB. Markdown via Marked + DOMPurify; rich text via Quill.

License
TBD
