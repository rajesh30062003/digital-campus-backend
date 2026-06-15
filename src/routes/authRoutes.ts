import { Router } from "express";
import { login, register, getMe, createUser } from "../controllers/authController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.post("/login",    login);
router.post("/register", register);
router.get("/me",        protect, getMe);

// Admin-only: create faculty/admin accounts
router.post("/create-user", protect, restrictTo("admin"), createUser);

export default router;
