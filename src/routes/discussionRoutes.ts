import { Router } from "express";
import {
  getCourseDiscussions,
  getDiscussionById,
  createDiscussion,
  addReply,
  toggleLike,
  deleteDiscussion,
} from "../controllers/discussionController";
import { protect } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.use(protect);

router.get("/", getCourseDiscussions);
router.post("/", createDiscussion);
router.get("/:id", getDiscussionById);
router.post("/:id/replies", addReply);
router.patch("/:id/like", toggleLike);
router.delete("/:id", deleteDiscussion);

export default router;
