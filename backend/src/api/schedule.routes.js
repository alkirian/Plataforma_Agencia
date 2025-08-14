import { Router } from 'express';
import { handleGetSchedule, handleCreateScheduleItem } from '../controllers/schedule.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(handleGetSchedule)
  .post(handleCreateScheduleItem);

export default router;
