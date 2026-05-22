import { Router } from "express";
import { saveInicial, saveTecnica, getAnamnese } from "../controllers/anamneseController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.get("/:appointmentId", authMiddleware, getAnamnese);
router.post("/:appointmentId/inicial", authMiddleware, saveInicial);
router.post("/:appointmentId/tecnica", authMiddleware, saveTecnica);

export default router;
