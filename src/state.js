export const state = {
  punches: [],
  dragging: null,
  resizing: null,
  moving: null,
  pendingRange: null,
  editingId: null,
  // Timeline viewport (minutes from start of day)
  viewStartMin: 6 * 60, // default 6:00am
  viewEndMin: 18 * 60,  // default 6:00pm
  // Hover flag used to route wheel events when over the track
  overTrack: false,
  // Date/calendar state
  currentDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD selected day
  viewMode: 'day', // 'day' | 'calendar'
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(), // 0-11
};
