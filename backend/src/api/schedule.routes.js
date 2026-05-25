import { Router } from 'express';
import { 
  handleGetSchedule, 
  handleCreateScheduleItem,
  handleGetScheduleItem,
  handleUpdateScheduleItem,
  handleDeleteScheduleItem,
  handleGetScheduleItemAssets,
  handleCreateScheduleItemAsset,
  handleClearSchedule,
} from '../controllers/schedule.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(handleGetSchedule)
  .post(handleCreateScheduleItem)
  .delete(handleClearSchedule);

router.route('/:itemId')
  .get(handleGetScheduleItem)
  .put(handleUpdateScheduleItem)
  .delete(handleDeleteScheduleItem);

router.route('/:itemId/assets')
  .get(handleGetScheduleItemAssets)
  .post(handleCreateScheduleItemAsset);

export default router;
