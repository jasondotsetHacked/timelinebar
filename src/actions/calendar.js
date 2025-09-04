import { els } from '../dom.js';
import { state } from '../state.js';
import { ui } from '../ui.js';
import { calendar } from '../calendar.js';

const toggleCalendarView = () => {
  state.viewMode = state.viewMode === 'calendar' ? 'day' : 'calendar';
  ui.updateViewMode();
};

export const calendarActions = {
  attach: () => {
    if (els.btnCalendar) {
      els.btnCalendar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCalendarView();
      });
    }
    if (els.btnCalendar2) {
      els.btnCalendar2.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCalendarView();
      });
    }
    if (els.dayLabel) {
      els.dayLabel.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.viewMode !== 'calendar') toggleCalendarView();
      });
      els.dayLabel.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (state.viewMode !== 'calendar') toggleCalendarView();
        }
      });
    }
    if (els.btnCalendarFab) {
      els.btnCalendarFab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCalendarView();
      });
    }
    document.addEventListener('click', (e) => {
      const id = e.target?.id;
      if (id === 'btnCalendar' || id === 'btnCalendar2' || id === 'btnCalendarFab') {
        e.preventDefault();
        e.stopPropagation();
        toggleCalendarView();
      }
    });
    if (els.calPrev) {
      els.calPrev.addEventListener('click', () => {
        if (state.calendarMode === 'days') {
          calendar.prevMonth();
        } else if (state.calendarMode === 'months') {
          state.calendarYear -= 1;
          calendar.renderCalendar();
        } else {
          state.yearGridStart -= 12;
          calendar.renderCalendar();
        }
      });
    }
    if (els.calNext) {
      els.calNext.addEventListener('click', () => {
        if (state.calendarMode === 'days') {
          calendar.nextMonth();
        } else if (state.calendarMode === 'months') {
          state.calendarYear += 1;
          calendar.renderCalendar();
        } else {
          state.yearGridStart += 12;
          calendar.renderCalendar();
        }
      });
    }
    if (els.calMonthLabel) {
      els.calMonthLabel.addEventListener('click', (e) => {
        const t = e.target.closest('[data-cal-click]');
        if (t) {
          const what = t.dataset.calClick;
          if (what === 'year') {
            state.calendarMode = 'years';
            state.yearGridStart = Math.floor(state.calendarYear / 12) * 12;
            calendar.renderCalendar();
            ui.updateHelpText();
            return;
          } else if (what === 'month') {
            state.calendarMode = 'months';
            calendar.renderCalendar();
            ui.updateHelpText();
            return;
          }
        }
        const nav = e.target.closest('[data-cal-nav]');
        if (nav) {
          const dir = nav.dataset.calNav; // 'prev' | 'next'
          const delta = dir === 'prev' ? -1 : 1;
          if (state.calendarMode === 'days') {
            if (delta === -1) calendar.prevMonth();
            else calendar.nextMonth();
          } else if (state.calendarMode === 'months') {
            state.calendarYear += delta;
            calendar.renderCalendar();
          } else {
            state.yearGridStart += delta * 12;
            calendar.renderCalendar();
          }
        }
      });
    }
    window.addEventListener('calendar:daySelected', () => ui.updateViewMode());
    window.addEventListener('calendar:modeChanged', () => {
      ui.updateHelpText();
      ui.renderBucketMonth?.();
    });
    window.addEventListener('calendar:rendered', () => ui.renderBucketMonth?.());
  },
};
