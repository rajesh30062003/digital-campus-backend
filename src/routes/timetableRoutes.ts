import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth";
import {
  getAllTimetables,
  getMyTimetable,
  getFacultyTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable,
} from "../controllers/timetableController";

const router = Router();

router.use(protect);

router.get("/my", getMyTimetable);
router.get("/faculty", restrictTo("faculty", "admin"), getFacultyTimetable);
router.get("/", restrictTo("admin"), getAllTimetables);
router.post("/", restrictTo("admin"), createTimetable);
router.patch("/:id", restrictTo("admin"), updateTimetable);
router.delete("/:id", restrictTo("admin"), deleteTimetable);

export default router;
