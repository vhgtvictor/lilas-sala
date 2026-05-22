import { Router } from "express";
import { getKPIs, exportExcel } from "../controllers/reportsController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRoles } from "../middlewares/roles.js";

const router = Router();

router.get("/kpis", authMiddleware, requireRoles("ADMIN"), getKPIs);
router.get("/export/excel", authMiddleware, requireRoles("ADMIN"), exportExcel);

export default router;
