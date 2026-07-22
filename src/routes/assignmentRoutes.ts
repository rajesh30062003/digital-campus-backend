import { Router } from "express";
import {
  getCourseAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  submitAssignment,
  gradeSubmission,
} from "../controllers/assignmentController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.use(protect);

router.get("/", getCourseAssignments);
router.post("/", restrictTo("faculty", "admin"), createAssignment);
router.get("/:id", getAssignmentById);
router.patch("/:id", restrictTo("faculty", "admin"), updateAssignment);
router.post("/:id/submit", restrictTo("student"), submitAssignment);
router.patch("/:id/grade/:studentId", restrictTo("faculty", "admin"), gradeSubmission);

export default router;
