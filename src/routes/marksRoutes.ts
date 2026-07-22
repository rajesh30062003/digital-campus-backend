import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth";
import {
  createExam,
  getExams,
  updateExam,
  publishExam,
  enterMarks,
  getMarksByExam,
  getMyMarks,
  getMarksAnalytics,
} from "../controllers/marksController";

const router = Router();

router.use(protect);

// Student
router.get("/my", getMyMarks);

// Faculty + Admin
router.get("/exams", restrictTo("faculty", "admin"), getExams);
router.post("/exams", restrictTo("faculty", "admin"), createExam);
router.patch("/exams/:id", restrictTo("faculty", "admin"), updateExam);
router.patch("/exams/:id/publish", restrictTo("faculty", "admin"), publishExam);
router.post("/exams/:examId/marks", restrictTo("faculty", "admin"), enterMarks);
router.get("/exams/:examId/marks", restrictTo("faculty", "admin"), getMarksByExam);

// Admin
router.get("/analytics", restrictTo("admin"), getMarksAnalytics);

export default router;
