// Comprehensive import test for schedule module
// This file attempts to import every component to verify all imports work

console.log('Testing all schedule module imports...')

try {
  // Test main components
  console.log('Testing ScheduleSection...')
  const ScheduleSection = require('./components/ScheduleSection.jsx')

  // Test calendar components
  console.log('Testing CalendarToolbar...')
  const CalendarToolbar = require('./components/calendar/CalendarToolbar.jsx')

  console.log('Testing FullCalendarWrapper...')
  const FullCalendarWrapper = require('./components/calendar/FullCalendarWrapper.jsx')

  console.log('Testing SearchBar...')
  const SearchBar = require('./components/calendar/SearchBar.jsx')

  console.log('Testing MiniMonth...')
  const MiniMonth = require('./components/calendar/MiniMonth.jsx')

  console.log('Testing MonthAgenda...')
  const MonthAgenda = require('./components/calendar/MonthAgenda.jsx')

  console.log('Testing MobileCalendarView...')
  const MobileCalendarView = require('./components/calendar/MobileCalendarView.jsx')

  // Test modal components
  console.log('Testing ExportModal...')
  const ExportModal = require('./components/modals/ExportModal.jsx')

  console.log('Testing TaskPopover...')
  const TaskPopover = require('./components/modals/TaskPopover.jsx')

  // Test form components
  console.log('Testing TaskForm...')
  const TaskForm = require('./components/forms/TaskForm.jsx')

  // Test AI components
  console.log('Testing AIIdeasPreview...')
  const AIIdeasPreview = require('./components/ai/AIIdeasPreview.jsx')

  console.log('Testing TaskIdeasAI...')
  const TaskIdeasAI = require('./components/ai/TaskIdeasAI.jsx')

  // Test hooks
  console.log('Testing useCalendarEvents...')
  const useCalendarEvents = require('./hooks/useCalendarEvents.js')

  console.log('Testing useTaskDrafts...')
  const useTaskDrafts = require('./hooks/useTaskDrafts.js')

  // Test services
  console.log('Testing schedule service...')
  const scheduleService = require('./services/schedule.js')

  // Test constants
  console.log('Testing taskStates...')
  const taskStates = require('./constants/taskStates.js')

  // Test utils
  console.log('Testing calendarExport...')
  const calendarExport = require('./utils/calendarExport.js')

  console.log('✅ ALL IMPORTS SUCCESSFUL!')
} catch (error) {
  console.error('❌ IMPORT ERROR:', error.message)
  console.error('Stack:', error.stack)
  process.exit(1)
}
