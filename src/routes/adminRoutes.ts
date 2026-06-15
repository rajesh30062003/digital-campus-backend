import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth";
import {
  getAdminStats,
  getStudentGrowth,
  getDepartmentStats,
  getAttendanceTrend,
} from "../controllers/adminController";

const router = Router();

router.use(protect, restrictTo("admin"));

router.get("/stats", getAdminStats);
router.get("/charts/student-growth", getStudentGrowth);
router.get("/charts/department-stats", getDepartmentStats);
router.get("/charts/attendance-trend", getAttendanceTrend);

export default router;
