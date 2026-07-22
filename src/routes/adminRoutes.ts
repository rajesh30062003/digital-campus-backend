import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth";
import {
  getAdminStats,
  getStudentGrowth,
  getDepartmentStats,
  getAttendanceTrend,
  getAuditLogs,
} from "../controllers/adminController";

const router = Router();

router.use(protect, restrictTo("admin"));

router.get("/stats", getAdminStats);
router.get("/charts/student-growth", getStudentGrowth);
router.get("/charts/department-stats", getDepartmentStats);
router.get("/charts/attendance-trend", getAttendanceTrend);
router.get("/audit-logs", getAuditLogs);

export default router;
