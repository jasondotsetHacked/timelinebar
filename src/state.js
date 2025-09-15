export const state = {
  punches: [],
  schedules: [],
  scheduleViews: [],
  currentScheduleId: null, // active schedule for main views
  currentScheduleViewId: null, // active saved view (overrides currentScheduleId when set)
  // (Customizable dashboards removed)
  dragging: null,
  resizing: null,
  moving: null,
  // Set of selected punch IDs for soft-selection/group actions
  selectedIds: new Set(),
  pendingRange: null,
  editingId: null,
  // Timeline viewport (minutes from start of day)
  viewStartMin: 6 * 60, // default 6:00am
  viewEndMin: 18 * 60,  // default 6:00pm
  // Hover flag used to route wheel events when over the track
  overTrack: false,
  // Suppress click-to-open after drag/move
  lastMoveAt: 0,
  // Date/calendar state
  currentDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD selected day
  viewMode: 'calendar', // 'day' | 'calendar' | 'bucket'
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(), // 0-11
  // Calendar sub-view: 'days' | 'months' | 'years'
  calendarMode: 'days',
  // Start year for the visible year grid (in 'years' mode). Initialized to a 12-year block containing today.
  yearGridStart: Math.floor(new Date().getFullYear() / 12) * 12,
  // Bucket view state
  bucketFilter: '', // exact bucket label being viewed ('' = no bucket)
  lastViewMode: 'day', // where to return when leaving bucket view
};
