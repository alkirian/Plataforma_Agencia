// Test file to validate schedule module imports work correctly
// This file can be removed after validation

import { useCalendarEvents, useTaskDrafts } from './hooks'
import { getSchedule, createScheduleItem } from './services'
import { TASK_STATES, getStateStyle } from './constants'

console.log('✅ Schedule module imports working correctly:', {
  hooks: { useCalendarEvents, useTaskDrafts },
  services: { getSchedule, createScheduleItem },
  constants: { TASK_STATES, getStateStyle },
})

export default true
