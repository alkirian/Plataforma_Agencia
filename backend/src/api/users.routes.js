import { Router } from 'express';
import { registerUser, handleCompleteProfile, handleCheckEmail } from '../controllers/users.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { 
  validate, 
  sanitizeInput,
  userRegistrationSchema, 
  emailCheckSchema, 
  completeProfileSchema 
} from '../schemas/validation.js';

const router = Router();

// Apply input sanitization to all routes for security
router.use(sanitizeInput());

// User registration with comprehensive validation
router.post('/register', 
  validate(userRegistrationSchema, 'body', { 
    logAttempts: true, 
    logSuccess: true 
  }),
  registerUser
);

// Email check with validation - public route but needs security
router.post('/check-email', 
  validate(emailCheckSchema, 'body', { 
    logFailures: true 
  }),
  handleCheckEmail
);

// Complete profile - protected route with validation
router.post('/complete-profile', 
  protect,
  validate(completeProfileSchema, 'body', { 
    logSuccess: true 
  }),
  handleCompleteProfile
);

export default router;
