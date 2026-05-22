import { Router } from "express";
import { save, saveObsJuridica, listAll, generatePDF, generatePatientPDF } from "../controllers/prontuarioController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRoles } from "../middlewares/roles.js";

const router = Router();

const techRoles = ["TECNICA", "CIS", "NPJ", "ADMIN"];

router.get("/", authMiddleware, requireRoles(...techRoles), listAll);
router.get("/patient/:patientId/pdf", authMiddleware, requireRoles(...techRoles), generatePatientPDF);
router.post("/:appointmentId", authMiddleware, requireRoles("CIS", "ADMIN"), save);
router.post("/:appointmentId/juridica", authMiddleware, requireRoles("NPJ", "ADMIN"), saveObsJuridica);
router.get("/:appointmentId/pdf", authMiddleware, requireRoles(...techRoles), generatePDF);

export default router;
