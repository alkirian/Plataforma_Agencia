import { Router } from "express";
import userRoutes from "./users.routes.js";
import clientRoutes from "./clients.routes.js";
import documentsRoutes from "./documents.routes.js";
import contextSourcesRoutes from "./contextSources.routes.js";
import agenciesRoutes from "./agencies.routes.js";
import aiRoutes from "./ai.routes.js";
import scheduleRoutes from "./schedule.routes.js";
import monitoringRoutes from "./monitoring.routes.js";
import { protect } from "../middleware/auth.middleware.js";
import { handleGetAgencyActivityFeed } from "../controllers/activity.controller.js";
import invitationsRoutes from "./invitations.routes.js";
import contentAttachmentsRoutes from "./contentAttachments.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

// Registra las rutas de los módulos
router.use("/users", userRoutes);
router.use("/clients", clientRoutes);
// Use consolidated documents routes
router.use("/documents", protect, documentsRoutes);
// Keep V2 endpoint for backward compatibility
router.use("/documents-v2", protect, documentsRoutes);
router.use("/context-sources", contextSourcesRoutes);
router.use("/agencies", agenciesRoutes);
router.use("/ai", aiRoutes);
router.use("/schedule", scheduleRoutes);
router.use("/monitoring", monitoringRoutes);
router.use("/invitations", invitationsRoutes);
router.use("/attachments", contentAttachmentsRoutes);

// Feed global de actividad de la agencia
router.get("/activity-feed", protect, handleGetAgencyActivityFeed);

export default router;
