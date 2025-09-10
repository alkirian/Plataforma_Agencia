// Core utility hooks
export { useAsyncButton } from './useAsyncButton'
export { useAutoSave } from './useAutoSave'
export { usePopoverPosition } from './usePopoverPosition'

// UI and interaction hooks
export {
  useDeviceType,
  useSimpleDeviceType,
  useDeviceFlags,
  useResponsive,
  type DeviceType,
} from './useDeviceType'

export {
  useSwipeGestures,
  useCalendarSwipe,
  usePullToRefresh,
  useSlideGestures,
  useMultiDirectionalSwipe,
  type SwipeDirection,
  type SwipeDelta,
  type SwipeHandler,
  type UseSwipeGesturesOptions,
} from './useSwipeGestures'

export {
  useUIState,
  useFormState,
  useListState,
  type UIError,
  type AsyncOperation,
  type UseUIStateOptions,
  type UseUIStateReturn,
  type UseFormStateOptions,
  type UseFormStateReturn,
  type UseListStateOptions,
  type UseListStateReturn,
  type ValidationErrors,
} from './useUIState'

export {
  useGlobalDragDrop,
  type UploadItem,
  type UploadStatus,
  type ProgressCallback,
  type UploadFunction,
  type FilesUploadedCallback,
  type FileUploadCallback,
} from './useGlobalDragDrop'

// Business logic hooks
export { useNotifications } from './useNotifications'
export { useActivityFeed } from './useActivityFeed'
export { useContextSources } from './useContextSources'

// Task and schedule hooks
export { useTaskDrafts } from './useTaskDrafts'
export { useCalendarEvents } from './useCalendarEvents'

// Shared hooks re-exports
export { useKeyboardShortcuts, useAppKeyboardShortcuts } from '../shared/hooks/useKeyboardShortcuts'
export { useTheme } from '../shared/hooks/useTheme'
export { useClickOutside } from '../shared/hooks/useClickOutside'
