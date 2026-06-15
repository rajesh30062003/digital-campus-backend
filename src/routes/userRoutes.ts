import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateProfile,
  updateUser,
  deleteUser,
  changePassword,
} from "../controllers/userController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.use(protect);

router.get("/", restrictTo("admin"), getAllUsers);
router.patch("/profile", updateProfile);
router.patch("/change-password", changePassword);
router.get("/:id", getUserById);
router.patch("/:id", restrictTo("admin"), updateUser);
router.delete("/:id", restrictTo("admin"), deleteUser);

export default router;
