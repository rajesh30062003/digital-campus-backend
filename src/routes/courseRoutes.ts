import { Router } from "express";
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  unenrollFromCourse,
  getMyCourses,
} from "../controllers/courseController";
import { protect, restrictTo } from "../middleware/auth";
import assignmentRoutes from "./assignmentRoutes";
import attendanceRoutes from "./attendanceRoutes";
import discussionRoutes from "./discussionRoutes";

const router = Router();

router.use(protect);

// Nested routes
router.use("/:courseId/assignments", assignmentRoutes);
router.use("/:courseId/attendance", attendanceRoutes);
router.use("/:courseId/discussions", discussionRoutes);

router.get("/my-courses", getMyCourses);
router.get("/", getAllCourses);
router.get("/:id", getCourseById);
router.post("/", restrictTo("admin", "faculty"), createCourse);
router.patch("/:id", restrictTo("admin", "faculty"), updateCourse);
router.delete("/:id", restrictTo("admin"), deleteCourse);
router.post("/:id/enroll", restrictTo("student"), enrollInCourse);
router.delete("/:id/enroll", restrictTo("student"), unenrollFromCourse);

export default router;
