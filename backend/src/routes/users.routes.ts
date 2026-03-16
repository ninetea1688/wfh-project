import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/users.controller";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/departments", getDepartments);
router.post("/departments", createDepartment);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

router.get("/", getUsers);
router.post("/", createUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/reset-password", resetPassword);

export default router;
