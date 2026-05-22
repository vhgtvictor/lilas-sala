import { Router } from "express";
import { getQueue, getTimeline } from "../controllers/queueController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRoles } from "../middlewares/roles.js";

const router = Router();

router.get("/", authMiddleware, requireRoles("TECNICA", "CIS", "NPJ", "ADMIN"), getQueue);
router.get("/patient/:id/timeline", authMiddleware, getTimeline);

export default router;
