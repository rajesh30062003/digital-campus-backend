import { Router } from "express";
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.use(protect);

router.get("/", getAnnouncements);
router.get("/:id", getAnnouncementById);
router.post("/", restrictTo("faculty", "admin"), createAnnouncement);
router.patch("/:id", restrictTo("faculty", "admin"), updateAnnouncement);
router.delete("/:id", restrictTo("faculty", "admin"), deleteAnnouncement);

export default router;
