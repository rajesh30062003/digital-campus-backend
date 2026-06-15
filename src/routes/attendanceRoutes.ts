import { Router } from "express";
import {
  markAttendance,
  getCourseAttendance,
  getMyAttendance,
  getAttendanceStats,
} from "../controllers/attendanceController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.use(protect);

router.post("/", restrictTo("faculty", "admin"), markAttendance);
router.get("/", restrictTo("faculty", "admin"), getCourseAttendance);
router.get("/my", restrictTo("student"), getMyAttendance);
router.get("/stats", restrictTo("faculty", "admin"), getAttendanceStats);

export default router;
