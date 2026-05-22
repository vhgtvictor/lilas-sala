import { Router } from "express";
import { list, create, update, resetPassword, deleteUser } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRoles } from "../middlewares/roles.js";

const router = Router();

router.use(authMiddleware, requireRoles("ADMIN"));

router.get("/", list);
router.post("/", create);
router.put("/:id", update);
router.patch("/:id/password", resetPassword);
router.delete("/:id", deleteUser);

export default router;
