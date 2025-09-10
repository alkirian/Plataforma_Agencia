/**
 * Domain mapping for Schedule feature
 *
 * - Internal values: English kebab-case (canonical)
 * - External/backend: Spanish ASCII codes (for API/Supabase)
 * - UI labels: Spanish human-readable
 */
export {
  TASK_STATE_INFO as TASK_STATE_MAP,
  TASK_STATE_ORDER,
  toExternalTaskState,
  fromExternalTaskState,
  PRIORITY_INFO,
} from './taskStates'
