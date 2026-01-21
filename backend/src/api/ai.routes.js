import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { handleGenerateIdeas } from "../controllers/ai.controller.js";
import {
  validate,
  validateMultiple,
  sanitizeInput,
  generateIdeasSchema,
  clientIdParamSchema,
} from "../schemas/validation.js";

const router = Router();

router.use(protect);
router.use(sanitizeInput());

// POST /api/v1/clients/:clientId/generate-ideas
router.post(
  "/:clientId/generate-ideas",
  validateMultiple(
    {
      schema: clientIdParamSchema,
      source: "params",
      options: { logFailures: true },
    },
    {
      schema: generateIdeasSchema,
      source: "body",
      options: { logAttempts: true },
    },
  ),
  handleGenerateIdeas,
);

export default router;
