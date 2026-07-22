import { Router } from "express";
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
} from "../controllers/eventController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.use(protect);

router.get("/", getEvents);
router.get("/:id", getEventById);
router.post("/", restrictTo("faculty", "admin"), createEvent);
router.patch("/:id", restrictTo("faculty", "admin"), updateEvent);
router.delete("/:id", restrictTo("faculty", "admin"), deleteEvent);
router.post("/:id/register", registerForEvent);
router.delete("/:id/register", unregisterFromEvent);

export default router;
