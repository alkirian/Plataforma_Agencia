import { Router } from 'express';
import { 
  handleGetSchedule, 
  handleCreateScheduleItem,
  handleGetScheduleItem,
  handleUpdateScheduleItem,
  handleDeleteScheduleItem
} from '../controllers/schedule.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(handleGetSchedule)
  .post(handleCreateScheduleItem);

router.route('/:itemId')
  .get(handleGetScheduleItem)
  .put(handleUpdateScheduleItem)
  .delete(handleDeleteScheduleItem);

export default router;
