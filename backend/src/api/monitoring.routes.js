// src/api/monitoring.routes.js
import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { logger } from "../utils/logger.js";
import { validate, sanitizeInput } from "../schemas/validation.js";
import { z } from "zod";

const router = Router();

// Schema para datos de monitoreo
const monitoringDataSchema = z.object({
  event_type: z.string().min(1, "Tipo de evento requerido"),
  data: z.record(z.any()).optional(),
  user_agent: z.string().optional(),
  url: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  session_id: z.string().optional(),
  user_id: z.string().uuid().optional(),
});

router.use(protect);
router.use(sanitizeInput());

// Handler para recibir datos de monitoreo
export const handleMonitoringData = async (req, res, next) => {
  try {
    const { event_type, data, user_agent, url, timestamp, session_id } =
      req.body;
    const user_id = req.user?.id;

    // Log datos de monitoreo
    logger.info("Monitoring data received:", {
      event_type,
      user_id,
      session_id,
      url,
      timestamp: timestamp || new Date().toISOString(),
      data,
    });

    // TODO: Aquí podrías enviar a un servicio de analytics como Mixpanel, Amplitude, etc.
    // O guardar en una tabla de events en la base de datos

    return res.status(200).json({
      success: true,
      message: "Datos de monitoreo recibidos correctamente",
    });
  } catch (error) {
    logger.error("Error processing monitoring data:", error);
    next(error);
  }
};

// Endpoint para recibir datos de monitoreo
router.post(
  "/",
  validate(monitoringDataSchema, "body", { logAttempts: true }),
  handleMonitoringData,
);

// Endpoint para obtener métricas (opcional)
router.get("/metrics", async (req, res, next) => {
  try {
    // TODO: Implementar obtención de métricas agregadas
    return res.status(200).json({
      success: true,
      data: {
        message: "Metrics endpoint - to be implemented",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error getting metrics:", error);
    next(error);
  }
});

export default router;
