import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth";
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController";

const router = Router();

router.use(protect);

router.get("/", getAllDepartments);
router.get("/:id", getDepartmentById);
router.post("/", restrictTo("admin"), createDepartment);
router.patch("/:id", restrictTo("admin"), updateDepartment);
router.delete("/:id", restrictTo("admin"), deleteDepartment);

export default router;
