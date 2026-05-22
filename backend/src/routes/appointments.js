import { Router } from "express";
import {
  createPublic,
  getAvailableSlots,
  listByDate,
  getTodaySummary,
  checkin,
  transfer,
  finalize,
} from "../controllers/appointmentController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRoles } from "../middlewares/roles.js";

const router = Router();

// Público — sem autenticação
router.post("/public", createPublic);
router.get("/slots", getAvailableSlots);

// Protegido
router.get("/", authMiddleware, listByDate);
router.get("/summary/today", authMiddleware, getTodaySummary);
router.post("/:id/checkin", authMiddleware, requireRoles("ATENDENTE", "ADMIN"), checkin);
router.post("/:id/transfer", authMiddleware, transfer);
router.post("/:id/finalize", authMiddleware, requireRoles("TECNICA", "ADMIN"), finalize);

export default router;
